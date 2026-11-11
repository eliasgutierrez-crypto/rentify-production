// Purpose: Acciones de servidor para Gestiona registro, sesiones, recuperacion y vinculacion de identidades Supabase.
'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword } from '@/lib/password'
import { obtenerUrlAplicacion } from '@/lib/app-url'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { ESTADOS_MEXICO } from '@/lib/estados-mexico'

export interface FormState {
  error?: string
  success?: boolean
  mensaje?: string
}

function valor(formData: FormData, campo: string, recortar = true): string {
  const value = formData.get(campo)
  return typeof value === 'string' ? (recortar ? value.trim() : value) : ''
}

function validarContrasena(contrasena: string): string | null {
  if (contrasena.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  if (!/[A-Za-z]/.test(contrasena) || !/\d/.test(contrasena)) {
    return 'La contraseña debe incluir al menos una letra y un número.'
  }
  return null
}

function mensajeErrorRegistro(codigo: string | undefined, status: number | undefined): string {
  if (status === 401 || codigo === 'invalid_credentials') {
    return 'Supabase rechazó la clave pública (401). Copia la clave anon/publicable vigente del mismo proyecto, verifica que no hayas puesto la service_role y reinicia el servidor de desarrollo.'
  }

  switch (codigo) {
    case 'signup_disabled':
    case 'email_provider_disabled':
      return 'El registro por correo está desactivado en Supabase. Habilita Email en Authentication → Providers.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Supabase limitó temporalmente los correos de registro. Espera un momento y vuelve a intentarlo.'
    case 'unexpected_failure':
      return 'Supabase no pudo enviar el correo de confirmación. Revisa Authentication → Logs y la configuración de correo del proyecto.'
    case 'email_address_invalid':
      return 'Supabase rechazó ese correo. Verifica que esté escrito correctamente.'
    case 'user_already_exists':
    case 'email_exists':
      return 'Este correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.'
    case 'weak_password':
      return 'Supabase rechazó la contraseña. Usa una más segura y vuelve a intentarlo.'
    default:
      return 'Supabase no pudo completar el registro. Revisa la configuración del proveedor Email y los registros de Auth en el panel de Supabase.'
  }
}

function mensajeErrorRecuperacion(codigo: string | undefined, status: number | undefined): string {
  switch (codigo) {
    case 'redirect_to_not_allowed':
      return 'Supabase rechazó la URL de retorno. En Authentication → URL Configuration → Redirect URLs, agrega https://rentify-production.vercel.app/auth/callback.'
    case 'email_provider_disabled':
    case 'signup_disabled':
      return 'El proveedor de correo está desactivado en Supabase. Habilita Email en Authentication → Providers.'
    case 'smtp_setup_required':
      return 'Supabase no tiene un proveedor de correo configurado para enviar a esta dirección. Configura SMTP en Authentication → SMTP Settings.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Supabase limitó temporalmente los correos. Espera un momento o revisa los límites de envío y la configuración SMTP.'
    case 'email_address_invalid':
      return 'Supabase rechazó el correo. Verifica que esté escrito correctamente.'
    case 'unexpected_failure':
      return 'Supabase no pudo enviar el correo. Revisa Authentication → Logs y la configuración SMTP del proyecto.'
    default:
      return status === 401
        ? 'Supabase rechazó la clave pública. Verifica que NEXT_PUBLIC_SUPABASE_ANON_KEY pertenezca al proyecto y que no sea la service_role.'
        : 'No se pudo enviar el enlace. Revisa Authentication → Logs en Supabase para ver el motivo.'
  }
}

async function eliminarPerfilRegistro(usuarioId: number): Promise<void> {
  try {
    await prisma.usuario.delete({ where: { id: usuarioId } })
  } catch (error) {
    console.error('No se pudo limpiar el perfil después del fallo de registro:', error)
  }
}

export async function registroAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const nombre = valor(formData, 'nombre')
  const apellido = valor(formData, 'apellido')
  const correo = valor(formData, 'correo').toLowerCase()
  const contrasena = valor(formData, 'contrasena', false)
  const fechaNacimiento = valor(formData, 'fecha_nacimiento')
  const telefono = valor(formData, 'telefono')
  const estadoResidencia = valor(formData, 'estado_residencia')
  const fotoPerfil = valor(formData, 'foto_perfil')

  if (!nombre || !apellido || !correo || !contrasena || !fechaNacimiento || !telefono || !estadoResidencia) {
    return { error: 'Todos los campos son obligatorios.' }
  }

  if (!/^[+\d\s().-]{7,25}$/.test(telefono)) {
    return { error: 'Escribe un número de teléfono válido.' }
  }
  if (!ESTADOS_MEXICO.includes(estadoResidencia as (typeof ESTADOS_MEXICO)[number])) {
    return { error: 'Selecciona un estado válido.' }
  }
  if (fotoPerfil) {
    try {
      const fotoUrl = new URL(fotoPerfil)
      if (fotoUrl.protocol !== 'https:' && fotoUrl.protocol !== 'http:') {
        return { error: 'La foto debe tener una URL http o https válida.' }
      }
    } catch {
      return { error: 'La URL de la foto de perfil no es válida.' }
    }
  }

  const errorContrasena = validarContrasena(contrasena)
  if (errorContrasena) return { error: errorContrasena }

  const fecha = new Date(`${fechaNacimiento}T00:00:00`)
  if (Number.isNaN(fecha.getTime()) || fecha.getTime() > Date.now()) {
    return { error: 'La fecha de nacimiento no es válida.' }
  }

  const existe = await prisma.usuario.findFirst({
    where: { correo: { equals: correo, mode: 'insensitive' } },
  })
  if (existe) return { error: 'Este correo ya está registrado.' }

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
  try {
    supabase = await createSupabaseServerClient()
  } catch (error) {
    console.error('Falta la configuración de Supabase Auth para el registro:', error)
    return {
      error: 'Supabase no está configurado en el servidor. Verifica NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    }
  }

  const contrasenaHash = await hashPassword(contrasena)
  let usuario

  try {
    usuario = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        correo,
        contrasena: contrasenaHash,
        fecha_nacimiento: fecha,
        telefono,
        estado_residencia: estadoResidencia,
        foto_perfil: fotoPerfil || null,
        estado: 'activo',
        verificado_email: false,
        preferencias_email: {
          solicitudes: true,
          visitas: true,
          evaluaciones: true,
          cuenta: true,
          marketing: false,
        },
      },
    })
  } catch (error) {
    console.error('Error al crear el perfil de registro:', error)
    return { error: 'No se pudo crear la cuenta. Verifica los datos e intenta de nuevo.' }
  }

  let resultado: Awaited<ReturnType<typeof supabase.auth.signUp>>
  try {
    resultado = await supabase.auth.signUp({
      email: correo,
      password: contrasena,
      options: {
        emailRedirectTo: `${obtenerUrlAplicacion()}/auth/callback?next=/dashboard`,
        data: {
          nombre,
          apellido,
          fecha_nacimiento: fechaNacimiento,
          telefono,
          estado_residencia: estadoResidencia,
          foto_perfil: fotoPerfil || null,
        },
      },
    })
  } catch (signupError) {
    console.error('No se pudo conectar con Supabase Auth durante el registro:', signupError)
    await eliminarPerfilRegistro(usuario.id)
    return {
      error: 'No se pudo conectar con Supabase Auth. Verifica la URL y la clave pública de Supabase e intenta de nuevo.',
    }
  }

  const { data, error } = resultado

  if (error || !data.user) {
    console.error('Supabase Auth rechazó el registro:', {
      name: error?.name,
      code: error?.code,
      status: error?.status,
      message: error?.message,
    })
    await eliminarPerfilRegistro(usuario.id)
    return { error: mensajeErrorRegistro(error?.code, error?.status) }
  }

  if (data.user.identities?.length === 0) {
    await eliminarPerfilRegistro(usuario.id)
    return { error: 'Este correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.' }
  }

  try {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        auth_user_id: data.user.id,
        verificado_email: Boolean(data.user.email_confirmed_at),
      },
    })
  } catch (updateError) {
    console.error('No se pudo vincular la cuenta de Supabase con Rentify:', updateError)
    return {
      error:
        'La identidad de correo se creó, pero no se pudo terminar de vincular con Rentify. Contacta al administrador.',
    }
  }

  if (data.session) redirect('/dashboard')

  return {
    success: true,
    mensaje:
      'Te enviamos un correo para confirmar tu cuenta. Confirma tu dirección antes de iniciar sesión.',
  }
}

export async function loginAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const correo = valor(formData, 'correo').toLowerCase()
  const contrasena = valor(formData, 'contrasena', false)

  if (!correo || !contrasena) {
    return { error: 'Correo y contraseña son obligatorios.' }
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: correo,
    password: contrasena,
  })
  let usuarioAutenticado = data.user

  if (error || !usuarioAutenticado) {
    const usuarioAnterior = await prisma.usuario.findFirst({
      where: { correo: { equals: correo, mode: 'insensitive' } },
    })

    if (
      usuarioAnterior &&
      !usuarioAnterior.auth_user_id &&
      (await verifyPassword(contrasena, usuarioAnterior.contrasena))
    ) {
      const { data: registro, error: errorRegistro } = await supabase.auth.signUp({
        email: correo,
        password: contrasena,
        options: {
          emailRedirectTo: `${obtenerUrlAplicacion()}/auth/callback?next=/dashboard`,
          data: {
            nombre: usuarioAnterior.nombre,
            apellido: usuarioAnterior.apellido,
            fecha_nacimiento: usuarioAnterior.fecha_nacimiento.toISOString().slice(0, 10),
          },
        },
      })

      if (errorRegistro || !registro.user) {
        console.error('No se pudo migrar la cuenta heredada a Supabase Auth:', errorRegistro)
        return {
          error:
            'No se pudo vincular tu cuenta existente. Si ya tienes una cuenta en Supabase, restablece tu contraseña.',
        }
      }

      if (registro.user.identities?.length === 0) {
        return {
          error:
            'Ya existe una identidad para este correo en Supabase. Usa “¿Olvidaste tu contraseña?” para vincularla.',
        }
      }

      await prisma.usuario.update({
        where: { id: usuarioAnterior.id },
        data: {
          auth_user_id: registro.user.id,
          verificado_email: Boolean(registro.user.email_confirmed_at),
        },
      })

      if (!registro.session) {
        return {
          success: true,
          mensaje:
            'Tu cuenta existente se vinculó. Revisa tu correo y confirma la dirección antes de iniciar sesión.',
        }
      }
      usuarioAutenticado = registro.user
    } else {
      if (error?.code === 'email_not_confirmed') {
        return { error: 'Confirma tu correo desde el enlace que te enviamos antes de iniciar sesión.' }
      }
      return { error: 'Correo o contraseña incorrectos.' }
    }
  }

  const usuario = await prisma.usuario.findFirst({
    where: { correo: { equals: correo, mode: 'insensitive' } },
    include: {
      propietario: true,
      inquilino: true,
      administrador: true,
    },
  })

  if (!usuario) {
    await supabase.auth.signOut()
    return {
      error: 'Tu cuenta de Supabase no tiene un perfil de Rentify asociado. Contacta al administrador.',
    }
  }

  if (usuario.bloqueado) {
    await supabase.auth.signOut()
    return {
      error: usuario.motivo_bloqueo
        ? `Tu cuenta está bloqueada. Motivo: ${usuario.motivo_bloqueo}`
        : 'Tu cuenta está bloqueada. Contacta al equipo de Rentify.',
    }
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      auth_user_id: usuarioAutenticado.id,
      verificado_email: Boolean(usuarioAutenticado.email_confirmed_at),
      ultimo_acceso: new Date(),
    },
  })

  redirect(usuario.administrador ? '/dashboard/admin' : '/dashboard')
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error al cerrar sesión de Supabase:', error)
    throw new Error('No se pudo cerrar la sesión. Intenta de nuevo.')
  }
  redirect('/')
}

export async function solicitarRecuperacionAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const correo = valor(formData, 'correo').toLowerCase()
  if (!correo) return { error: 'El correo es obligatorio.' }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.resetPasswordForEmail(correo, {
    redirectTo: `${obtenerUrlAplicacion()}/auth/callback?next=/restablecer`,
  })

  if (error) {
    console.error('Error al solicitar recuperación en Supabase Auth:', {
      code: error.code,
      status: error.status,
      message: error.message,
    })
    return { error: mensajeErrorRecuperacion(error.code, error.status) }
  }

  return {
    success: true,
    mensaje:
      'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
  }
}

export async function restablecerContrasenaAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const contrasena = valor(formData, 'contrasena', false)
  const confirmar = valor(formData, 'confirmar', false)
  const errorContrasena = validarContrasena(contrasena)

  if (!contrasena || !confirmar) return { error: 'Todos los campos son obligatorios.' }
  if (errorContrasena) return { error: errorContrasena }
  if (contrasena !== confirmar) return { error: 'Las contraseñas no coinciden.' }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser()

  if (sessionError || !user?.email) {
    return { error: 'El enlace de recuperación no es válido o ya expiró. Solicita uno nuevo.' }
  }

  const { error } = await supabase.auth.updateUser({ password: contrasena })
  if (error) {
    console.error('Error al restablecer contraseña con Supabase Auth:', error)
    return { error: 'No se pudo actualizar la contraseña. Solicita un enlace nuevo.' }
  }

  const contrasenaHash = await hashPassword(contrasena)
  await prisma.usuario.updateMany({
    where: { OR: [{ auth_user_id: user.id }, { correo: user.email.toLowerCase() }] },
    data: { contrasena: contrasenaHash },
  })

  redirect('/dashboard')
}
