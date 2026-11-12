// Purpose: Acciones de servidor para Gestiona solicitudes de renta, decisiones y cierre de experiencias.
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { registrarNotificacion } from '@/lib/notificaciones'

export interface SolicitudState {
  error?: string
  success?: boolean
}

export async function crearSolicitudAction(
  prevState: SolicitudState,
  formData: FormData
): Promise<SolicitudState> {
  const usuario = await getCurrentUser()

  if (!usuario) {
    return { error: 'Debes iniciar sesión para solicitar una renta' }
  }

  const publicacion_id = parseInt(formData.get('publicacion_id') as string)
  const mensaje = (formData.get('mensaje') as string) || ''

  if (!publicacion_id || isNaN(publicacion_id)) {
    return { error: 'Publicación inválida' }
  }

  const publicacion = await prisma.publicacion.findUnique({
    where: { id: publicacion_id },
    include: {
      inmueble: {
        include: { propietario: true },
      },
    },
  })

  if (!publicacion) {
    return { error: 'La publicación no existe' }
  }

  if (
    publicacion.estado !== 'activa' ||
    publicacion.inmueble.estado_inventario !== 'disponible'
  ) {
    return { error: 'Esta propiedad ya no está disponible para solicitudes' }
  }

  if (publicacion.inmueble.propietario_id === usuario.id) {
    return { error: 'No puedes solicitar tu propia propiedad' }
  }

  // Antes de crear otra solicitud, se comprueba si ya hay una pendiente o aprobada para esta publicación.
  const existente = await prisma.solicitudRenta.findFirst({
    where: {
      publicacion_id,
      inquilino: { usuario_id: usuario.id },
      estado: { in: ['pendiente', 'aprobada'] },
    },
  })

  if (existente) {
    return { error: 'Ya tienes una solicitud activa para esta propiedad' }
  }

  try {
    let inquilinoId: number

    if (usuario.inquilino) {
      inquilinoId = usuario.inquilino.usuario_id
    } else {
      const nuevoInquilino = await prisma.inquilino.create({
        data: {
          usuario_id: usuario.id,
          estado_verificacion: 'pendiente',
        },
      })
      inquilinoId = nuevoInquilino.usuario_id
    }

    await prisma.solicitudRenta.create({
      data: {
        inquilino_id: inquilinoId,
        publicacion_id,
        estado: 'pendiente',
        mensaje: mensaje || 'Me interesa esta propiedad',
      },
    })

    await registrarNotificacion({
      usuarioId: publicacion.inmueble.propietario_id,
      tipo: 'solicitud_renta',
      mensaje: `${usuario.nombre} ${usuario.apellido} solicitó rentar "${publicacion.inmueble.tipo_inmueble}" en ${publicacion.inmueble.direccion}.`,
    })

    revalidatePath('/dashboard')
    revalidatePath(`/propiedad/${publicacion_id}`)
  } catch (error) {
    console.error('Error al crear solicitud:', error)
    return { error: 'Error al crear la solicitud. Intenta de nuevo.' }
  }

  redirect('/dashboard')
}

export async function aprobarSolicitudAction(formData: FormData) {
  const solicitudId = parseInt(formData.get('solicitud_id') as string)
  if (!solicitudId) return

  const usuario = await getCurrentUser()
  if (!usuario) return

  const solicitud = await prisma.solicitudRenta.findUnique({
    where: { id: solicitudId },
    include: { publicacion: { include: { inmueble: true } } },
  })

  if (!solicitud) return
  // La propiedad de la publicación, no el identificador del formulario, determina quién puede decidir.
  if (solicitud.publicacion.inmueble.propietario_id !== usuario.id) return

  await prisma.$transaction(async (tx) => {
    const resultado = await tx.solicitudRenta.updateMany({
      where: { id: solicitudId, estado: 'pendiente' },
      data: { estado: 'aprobada' },
    })
    if (resultado.count !== 1) {
      throw new Error('La solicitud ya fue atendida.')
    }

    await tx.experienciaRenta.upsert({
      where: { solicitud_id: solicitudId },
      create: {
        solicitud_id: solicitudId,
        fecha_inicio: new Date(),
        estado: 'activa',
      },
      update: {
        estado: 'activa',
        fecha_fin: null,
      },
    })
  })

  await registrarNotificacion({
    usuarioId: solicitud.inquilino_id,
    tipo: 'solicitud_aprobada',
    mensaje: `Tu solicitud para "${solicitud.publicacion.inmueble.tipo_inmueble}" fue aprobada.`,
  })

  revalidatePath('/dashboard')
  revalidatePath(`/propiedad/${solicitud.publicacion_id}`)
}

export async function finalizarRentaAction(formData: FormData) {
  const experienciaId = Number(formData.get('experiencia_id'))
  if (!Number.isInteger(experienciaId) || experienciaId <= 0) {
    throw new Error('La renta seleccionada no es válida.')
  }

  const usuario = await getCurrentUser()
  if (!usuario?.propietario) throw new Error('No autorizado.')

  const experiencia = await prisma.experienciaRenta.findUnique({
    where: { id: experienciaId },
    include: {
      solicitud: {
        include: {
          inquilino: { include: { usuario: true } },
          publicacion: { include: { inmueble: true } },
        },
      },
    },
  })

  if (!experiencia || experiencia.solicitud.publicacion.inmueble.propietario_id !== usuario.id) {
    throw new Error('No tienes permiso para finalizar esta renta.')
  }
  if (experiencia.estado !== 'activa') throw new Error('Esta renta ya fue finalizada.')

  await prisma.experienciaRenta.update({
    where: { id: experienciaId },
    data: { estado: 'finalizada', fecha_fin: new Date() },
  })
  await registrarNotificacion({
    usuarioId: experiencia.solicitud.inquilino_id,
    tipo: 'renta_finalizada',
    mensaje: `La renta de "${experiencia.solicitud.publicacion.inmueble.tipo_inmueble}" fue finalizada. Ya puedes evaluar la vivienda y al propietario.`,
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/evaluaciones')
}

export async function rechazarSolicitudAction(formData: FormData) {
  const solicitudId = parseInt(formData.get('solicitud_id') as string)
  if (!solicitudId) return

  const usuario = await getCurrentUser()
  if (!usuario) return

  const solicitud = await prisma.solicitudRenta.findUnique({
    where: { id: solicitudId },
    include: { publicacion: { include: { inmueble: true } } },
  })

  if (!solicitud) return
  if (solicitud.publicacion.inmueble.propietario_id !== usuario.id) return

  await prisma.solicitudRenta.update({
    where: { id: solicitudId },
    data: { estado: 'rechazada' },
  })

  await registrarNotificacion({
    usuarioId: solicitud.inquilino_id,
    tipo: 'solicitud_rechazada',
    mensaje: `Tu solicitud para "${solicitud.publicacion.inmueble.tipo_inmueble}" fue rechazada.`,
  })

  revalidatePath('/dashboard')
}