// Purpose: Acciones de servidor para Edita, cambia el estado y elimina inmuebles del propietario autenticado.
'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { registrarNotificacion } from '@/lib/notificaciones'

export interface EditarInmuebleState {
  error?: string
  success?: boolean
  mensaje?: string
}

export interface CambiarEstadoInmuebleState {
  estado: string
  error?: string
}

// ==================== VERIFICAR PROPIETARIO ====================
async function verificarPropietario(inmueble_id: number) {
  const usuario = await getCurrentUser()
  if (!usuario || !usuario.propietario) {
    throw new Error('No autorizado')
  }

  const inmueble = await prisma.inmueble.findUnique({
    where: { id: inmueble_id },
    include: {
      publicaciones: { take: 1, orderBy: { fecha_publicacion: 'desc' } },
    },
  })

  if (!inmueble) throw new Error('Inmueble no encontrado')
  if (inmueble.propietario_id !== usuario.propietario.usuario_id) {
    throw new Error('No tienes permiso para modificar este inmueble')
  }

  return { usuario, inmueble }
}

// ==================== EDITAR PROPIEDAD ====================
export async function editarInmuebleAction(
  prevState: EditarInmuebleState,
  formData: FormData
): Promise<EditarInmuebleState> {
  const inmueble_id = Number(formData.get('inmueble_id'))

  if (!Number.isInteger(inmueble_id) || inmueble_id <= 0) {
    return { error: 'ID inválido' }
  }

  try {
    const { inmueble } = await verificarPropietario(inmueble_id)

    const tipo_inmueble = String(formData.get('tipo_inmueble') ?? '').trim()
    const direccion = String(formData.get('direccion') ?? '').trim()
    const numero_habitaciones = Number(formData.get('numero_habitaciones'))
    const numero_banos = Number(formData.get('numero_banos'))
    const metros_cuadrados = Number(formData.get('metros_cuadrados'))
    const latitudTexto = String(formData.get('latitud') ?? '').trim()
    const longitudTexto = String(formData.get('longitud') ?? '').trim()
    const latitud = latitudTexto ? Number(latitudTexto) : null
    const longitud = longitudTexto ? Number(longitudTexto) : null
    const precio_renta = Number(formData.get('precio_renta'))
    const deposito = Number(formData.get('deposito'))
    const descripcion = String(formData.get('descripcion') ?? '').trim()
    const reglas = String(formData.get('reglas') ?? '').trim()
    const permite_mascotas = formData.get('permite_mascotas') === 'on'
    const permite_ninos = formData.get('permite_ninos') === 'on'
    const servicios_incluidos = String(formData.get('servicios_incluidos') ?? '').trim()
    const plazo_minimo_meses = Number(formData.get('plazo_minimo_meses'))
    const mantenimiento_incluido = formData.get('mantenimiento_incluido') === 'on'
    const imagenes = formData
      .getAll('imagenes')
      .filter((url): url is string => typeof url === 'string' && url.trim() !== '')
      .map((url) => url.trim())

    if (!tipo_inmueble || !direccion || !descripcion) {
      return { error: 'Todos los campos obligatorios deben estar completos' }
    }

    if (
      !Number.isInteger(numero_habitaciones) ||
      numero_habitaciones < 1 ||
      !Number.isInteger(numero_banos) ||
      numero_banos < 1 ||
      !Number.isFinite(metros_cuadrados) ||
      metros_cuadrados <= 0
    ) {
      return { error: 'Revisa el número de habitaciones, baños y metros cuadrados' }
    }

    if (
      (latitud === null) !== (longitud === null) ||
      (latitud !== null && (!Number.isFinite(latitud) || latitud < -90 || latitud > 90)) ||
      (longitud !== null && (!Number.isFinite(longitud) || longitud < -180 || longitud > 180))
    ) {
      return { error: 'Captura latitud y longitud válidas para mostrar el mapa' }
    }

    if (
      !Number.isFinite(precio_renta) ||
      precio_renta <= 0 ||
      !Number.isFinite(deposito) ||
      deposito < 0
    ) {
      return { error: 'La renta debe ser mayor a 0 y el depósito no puede ser negativo' }
    }

    if (![6, 12].includes(plazo_minimo_meses)) {
      return { error: 'Selecciona un plazo mínimo válido' }
    }

    if (imagenes.length > 6) {
      return { error: 'Puedes agregar un máximo de 6 imágenes' }
    }

    const imagenesInvalidas = imagenes.some((url) => {
      try {
        const parsedUrl = new URL(url)
        return parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:'
      } catch {
        return true
      }
    })

    if (imagenesInvalidas) {
      return { error: 'Revisa que las URLs de las imágenes sean válidas' }
    }

    await prisma.$transaction(async (tx) => {
      await tx.inmueble.update({
        where: { id: inmueble_id },
        data: {
          tipo_inmueble,
          direccion,
          numero_habitaciones,
          numero_banos,
          metros_cuadrados,
          latitud,
          longitud,
          servicios_incluidos: servicios_incluidos || null,
          plazo_minimo_meses,
          mantenimiento_incluido,
        },
      })

      const publicacion = inmueble.publicaciones[0]
        ? await tx.publicacion.update({
          where: { id: inmueble.publicaciones[0].id },
          data: {
            precio_renta,
            deposito,
            descripcion,
            reglas: reglas || null,
            permite_mascotas,
            permite_ninos,
            ...(inmueble.publicaciones[0].estado === 'rechazada'
              ? { estado: 'pendiente_revision', motivo_rechazo: null }
              : {}),
          },
        })
        : await tx.publicacion.create({
          data: {
            inmueble_id,
            precio_renta,
            deposito,
            descripcion,
            reglas: reglas || null,
            estado: 'pendiente_revision',
          },
        })

      await tx.foto.deleteMany({
        where: { publicacion_id: publicacion.id },
      })

      if (imagenes.length > 0) {
        await tx.foto.createMany({
          data: imagenes.map((ruta_archivo, index) => ({
            publicacion_id: publicacion.id,
            ruta_archivo,
            orden: index + 1,
          })),
        })
      }

      if (
        !inmueble.publicaciones[0] ||
        inmueble.publicaciones[0].estado === 'rechazada'
      ) {
        const administradores = await tx.administrador.findMany({
          select: { usuario_id: true },
        })
        if (administradores.length > 0) {
          await tx.notificacion.createMany({
            data: administradores.map(({ usuario_id }) => ({
              usuario_id,
              tipo: 'publicacion_pendiente_revision',
              mensaje: `Hay una publicación pendiente de revisión: "${tipo_inmueble}".`,
            })),
          })
        }
      }
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/admin')
    if (inmueble.publicaciones[0]) {
      revalidatePath(`/propiedad/${inmueble.publicaciones[0].id}`)
    }
    revalidatePath('/propiedades')
    revalidatePath('/')

    return { success: true, mensaje: 'Propiedad actualizada correctamente' }
  } catch (error) {
    console.error('Error al editar inmueble:', error)
    return {
      error: error instanceof Error ? error.message : 'Error al actualizar la propiedad',
    }
  }
}

// ==================== CAMBIAR ESTADO DE INVENTARIO ====================
export async function cambiarEstadoInmuebleAction(
  previousState: CambiarEstadoInmuebleState,
  formData: FormData
): Promise<CambiarEstadoInmuebleState> {
  const inmueble_id = Number(formData.get('inmueble_id'))
  const nuevo_estado = String(formData.get('estado') ?? '')

  if (!Number.isInteger(inmueble_id) || inmueble_id <= 0) {
    return { estado: previousState.estado, error: 'ID de inmueble inválido' }
  }

  const estadosValidos = ['disponible', 'en_negociacion', 'rentado', 'pausado']
  if (!estadosValidos.includes(nuevo_estado)) {
    return { estado: previousState.estado, error: 'Estado de inmueble inválido' }
  }

  let estadoGuardado = false

  try {
    const { inmueble } = await verificarPropietario(inmueble_id)
    if (inmueble.estado_inventario === nuevo_estado) {
      return { estado: nuevo_estado }
    }

    await prisma.inmueble.update({
      where: { id: inmueble_id },
      data: { estado_inventario: nuevo_estado },
    })
    estadoGuardado = true

    const solicitudes = await prisma.solicitudRenta.findMany({
      where: {
        publicacion: { inmueble_id },
        estado: { in: ['pendiente', 'aprobada'] },
      },
      select: { inquilino_id: true },
    })
    const etiquetasEstado: Record<string, string> = {
      disponible: 'disponible',
      en_negociacion: 'en negociación',
      rentado: 'rentado',
      pausado: 'pausado',
    }
    await Promise.all(
      [...new Set(solicitudes.map(({ inquilino_id }) => inquilino_id))].map((inquilinoId) =>
        registrarNotificacion({
          usuarioId: inquilinoId,
          tipo: 'estado_inmueble_actualizado',
          mensaje: `El inmueble "${inmueble.tipo_inmueble}" cambió al estado ${etiquetasEstado[nuevo_estado]}.`,
        })
      )
    )

    revalidatePath('/dashboard')
    revalidatePath('/propiedades')
    revalidatePath('/')
    if (inmueble.publicaciones[0]) {
      revalidatePath(`/propiedad/${inmueble.publicaciones[0].id}`)
    }
    return { estado: nuevo_estado }
  } catch (error) {
    console.error('Error al cambiar estado:', error)
    return {
      estado: estadoGuardado ? nuevo_estado : previousState.estado,
      error: estadoGuardado
        ? 'El estado se guardó, pero ocurrió un error al completar el proceso.'
        : error instanceof Error
          ? error.message
          : 'No se pudo cambiar el estado del inmueble.',
    }
  }
}

// ==================== ELIMINAR PROPIEDAD (SOFT DELETE) ====================
export async function eliminarInmuebleAction(formData: FormData) {
  const inmueble_id = Number(formData.get('inmueble_id'))

  if (!Number.isInteger(inmueble_id) || inmueble_id <= 0) {
    throw new Error('ID de inmueble inválido')
  }

  try {
    const { inmueble } = await verificarPropietario(inmueble_id)

    await prisma.$transaction(async (tx) => {
      const solicitudesActivas = await tx.solicitudRenta.count({
        where: {
          publicacion: { inmueble_id },
          estado: { in: ['pendiente', 'aprobada'] },
        },
      })

      if (solicitudesActivas > 0) {
        throw new Error(
          'No puedes eliminar un inmueble con solicitudes pendientes o aprobadas. Resuélvelas antes de eliminarlo.'
        )
      }

      await tx.publicacion.updateMany({
        where: { inmueble_id },
        data: { estado: 'eliminada' },
      })

      await tx.inmueble.update({
        where: { id: inmueble_id },
        data: { estado_inventario: 'pausado' },
      })
    })

    revalidatePath('/dashboard')
    revalidatePath('/propiedades')
    revalidatePath('/')
    if (inmueble.publicaciones[0]) {
      revalidatePath(`/propiedad/${inmueble.publicaciones[0].id}`)
    }
  } catch (error) {
    console.error('Error al eliminar inmueble:', error)
    throw error
  }
}