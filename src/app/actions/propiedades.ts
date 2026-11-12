// Purpose: Acciones de servidor para Valida y crea inmuebles, publicaciones, fotografias y caracteristicas.
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export interface PublicarState {
  error?: string
  success?: boolean
}

export async function publicarPropiedadAction(
  prevState: PublicarState,
  formData: FormData
): Promise<PublicarState> {
  const usuario = await getCurrentUser()
  if (!usuario) return { error: 'Debes iniciar sesión para publicar' }

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
  const mantenimientoIncluido = formData.get('mantenimiento_incluido') === 'on'
  const plazoMinimo = parseInt(formData.get('plazo_minimo_meses') as string) || 12
  const caracteristicasNombres = formData.getAll('caracteristicas') as string[]
  
  // Múltiples imágenes
  const imagenesValidas = formData
    .getAll('imagenes')
    .filter((url): url is string => typeof url === 'string' && url.trim() !== '')
    .map((url) => url.trim())

  if (!tipo_inmueble || !direccion || !descripcion) {
    return { error: 'Completa el tipo de inmueble, la dirección y la descripción.' }
  }

  if (
    !Number.isInteger(numero_habitaciones) ||
    numero_habitaciones < 1 ||
    !Number.isInteger(numero_banos) ||
    numero_banos < 1 ||
    !Number.isFinite(metros_cuadrados) ||
    metros_cuadrados <= 0
  ) {
    return { error: 'Revisa el número de habitaciones, baños y metros cuadrados.' }
  }

  if (
    (latitud === null) !== (longitud === null) ||
    (latitud !== null && (!Number.isFinite(latitud) || latitud < -90 || latitud > 90)) ||
    (longitud !== null && (!Number.isFinite(longitud) || longitud < -180 || longitud > 180))
  ) {
    return { error: 'Captura latitud y longitud válidas para mostrar el mapa.' }
  }

  if (!Number.isFinite(precio_renta) || precio_renta <= 0 || !Number.isFinite(deposito) || deposito < 0) {
    return { error: 'La renta debe ser mayor a 0 y el depósito no puede ser negativo.' }
  }

  if (imagenesValidas.length === 0) {
    return { error: 'Agrega al menos una imagen antes de publicar.' }
  }

  try {
    let propietarioId: number

    if (usuario.propietario) {
      propietarioId = usuario.propietario.usuario_id
    } else {
      const nuevoPropietario = await prisma.propietario.create({
        data: {
          usuario_id: usuario.id,
          estado_verificacion: 'pendiente',
        },
      })
      propietarioId = nuevoPropietario.usuario_id
    }

    // El inmueble, sus amenidades, la publicación y las fotos forman una sola operación lógica.
    await prisma.$transaction(async (tx) => {
      const inmueble = await tx.inmueble.create({
        data: {
          propietario_id: propietarioId,
          tipo_inmueble,
          direccion,
          numero_habitaciones,
          numero_banos,
          metros_cuadrados,
          latitud,
          longitud,
          mantenimiento_incluido: mantenimientoIncluido,
          plazo_minimo_meses: plazoMinimo,
        },
      })

      // Reutilizar amenidades existentes evita duplicados en el catálogo compartido.
      for (const nombre of caracteristicasNombres) {
        let caracteristica = await tx.caracteristica.findFirst({
          where: { nombre },
        })

        if (!caracteristica) {
          caracteristica = await tx.caracteristica.create({
            data: { nombre },
          })
        }

        await tx.inmuebleCaracteristica.create({
          data: {
            inmueble_id: inmueble.id,
            caracteristica_id: caracteristica.id,
          },
        })
      }

      const publicacion = await tx.publicacion.create({
        data: {
          inmueble_id: inmueble.id,
          precio_renta,
          deposito,
          descripcion,
          reglas: reglas || null,
          permite_mascotas,
          permite_ninos,
          estado: 'pendiente_revision',
        },
      })

      // Crear todas las fotos
      for (let i = 0; i < imagenesValidas.length; i++) {
        await tx.foto.create({
          data: {
            publicacion_id: publicacion.id,
            ruta_archivo: imagenesValidas[i],
            orden: i + 1,
          },
        })
      }

      const administradores = await tx.administrador.findMany({
        select: { usuario_id: true },
      })
      if (administradores.length > 0) {
        await tx.notificacion.createMany({
          data: administradores.map(({ usuario_id }) => ({
            usuario_id,
            tipo: 'publicacion_pendiente_revision',
            mensaje: `Hay una nueva publicación pendiente de revisión: "${tipo_inmueble}".`,
          })),
        })
      }
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/admin')
  } catch (error) {
    console.error('Error al publicar propiedad:', error)
    return { error: 'Error al publicar la propiedad. Intenta de nuevo.' }
  }

  redirect('/dashboard')
}