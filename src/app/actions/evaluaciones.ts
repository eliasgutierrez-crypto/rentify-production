// Purpose: Acciones de servidor para Valida evaluaciones de rentas finalizadas y recalcula promedios.
'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { registrarNotificacion } from '@/lib/notificaciones'

export interface EvaluacionState {
  error?: string
  success?: boolean
  mensaje?: string
}

export async function crearEvaluacionAction(
  prevState: EvaluacionState,
  formData: FormData
): Promise<EvaluacionState> {
  const usuario = await getCurrentUser()
  if (!usuario) return { error: 'Debes iniciar sesión' }

  const experiencia_renta_id = parseInt(formData.get('experiencia_renta_id') as string)
  const tipo_evaluacion = formData.get('tipo_evaluacion') as string
  const comentario = formData.get('comentario') as string

  if (
    !Number.isInteger(experiencia_renta_id) ||
    experiencia_renta_id <= 0 ||
    !['inmueble', 'propietario', 'inquilino'].includes(tipo_evaluacion)
  ) {
    return { error: 'Todos los campos obligatorios deben estar completos' }
  }

  const criterioCampos =
    tipo_evaluacion === 'propietario'
      ? ['calificacion_atencion', 'calificacion_mantenimiento', 'calificacion_cumplimiento']
      : tipo_evaluacion === 'inquilino'
        ? ['calificacion_puntualidad', 'calificacion_cuidado', 'calificacion_higiene']
        : []
  const criterios = criterioCampos.map((campo) => Number(formData.get(campo)))
  const calificacion =
    tipo_evaluacion === 'inmueble'
      ? Number(formData.get('calificacion'))
      : criterios.reduce((total, criterio) => total + criterio, 0) / criterios.length

  if (
    !Number.isFinite(calificacion) ||
    calificacion < 1 ||
    calificacion > 5 ||
    criterios.some((criterio) => !Number.isInteger(criterio) || criterio < 1 || criterio > 5)
  ) {
    return { error: 'Las calificaciones deben estar entre 1 y 5 estrellas' }
  }

  const experiencia = await prisma.experienciaRenta.findUnique({
    where: { id: experiencia_renta_id },
    include: {
      solicitud: {
        include: {
          publicacion: { include: { inmueble: true } },
          inquilino: { include: { usuario: true } },
        },
      },
    },
  })

  if (!experiencia) {
    return { error: 'La experiencia de renta no existe' }
  }
  if (experiencia.estado !== 'finalizada') {
    return { error: 'Las evaluaciones se habilitan al finalizar la renta.' }
  }

  const propietario_id = experiencia.solicitud.publicacion.inmueble.propietario_id
  const inquilino_id = experiencia.solicitud.inquilino_id

  // Verificar que el usuario tenga permiso para evaluar
  let esValido = false

  if (tipo_evaluacion === 'inmueble') {
    // Solo el inquilino puede calificar el inmueble
    if (usuario.id === inquilino_id) esValido = true
  } else if (tipo_evaluacion === 'propietario') {
    // Solo el inquilino puede calificar al propietario
    if (usuario.id === inquilino_id) esValido = true
  } else if (tipo_evaluacion === 'inquilino') {
    // Solo el propietario puede calificar al inquilino
    if (usuario.id === propietario_id) esValido = true
  }

  if (!esValido) {
    return { error: 'No tienes permiso para hacer esta evaluación' }
  }

  // Verificar que no haya evaluado ya este tipo para esta experiencia
  const yaEvalua = await prisma.evaluacion.findFirst({
    where: {
      experiencia_renta_id,
      usuario_evaluador_id: usuario.id,
      tipo_evaluacion,
    },
  })

  if (yaEvalua) {
    return { error: 'Ya calificaste este aspecto de esta renta' }
  }

  try {
    await prisma.evaluacion.create({
      data: {
        experiencia_renta_id,
        usuario_evaluador_id: usuario.id,
        tipo_evaluacion,
        calificacion,
        comentario: comentario || null,
        ...(tipo_evaluacion === 'propietario'
          ? {
              calificacion_atencion: criterios[0],
              calificacion_mantenimiento: criterios[1],
              calificacion_cumplimiento: criterios[2],
            }
          : {}),
        ...(tipo_evaluacion === 'inquilino'
          ? {
              calificacion_puntualidad: criterios[0],
              calificacion_cuidado: criterios[1],
              calificacion_higiene: criterios[2],
            }
          : {}),
      },
    })

    const destinatarioId = tipo_evaluacion === 'inquilino' ? inquilino_id : propietario_id
    await registrarNotificacion({
      usuarioId: destinatarioId,
      tipo: 'evaluacion_recibida',
      mensaje: `Recibiste una evaluación de ${calificacion} estrellas sobre tu experiencia de renta.`,
    })

    // Recalcular promedios
    if (tipo_evaluacion === 'inmueble') {
      const evaluaciones = await prisma.evaluacion.findMany({
        where: {
          experiencia_renta_id: {
            in: await prisma.experienciaRenta.findMany({
              where: {
                solicitud: {
                  publicacion: {
                    inmueble_id: experiencia.solicitud.publicacion.inmueble_id,
                  },
                },
              },
              select: { id: true },
            }).then((experiencias) => experiencias.map(({ id }) => id)),
          },
          tipo_evaluacion: 'inmueble',
        },
      })

      const promedio =
        evaluaciones.reduce((acc, evaluacion) => acc + evaluacion.calificacion, 0) /
        evaluaciones.length

      await prisma.inmueble.update({
        where: { id: experiencia.solicitud.publicacion.inmueble_id },
        data: {
          calificacion_promedio: promedio,
          total_evaluaciones: evaluaciones.length,
        },
      })
    }

    if (tipo_evaluacion === 'propietario') {
      const evaluaciones = await prisma.evaluacion.findMany({
        where: {
          experiencia_renta_id: { in: await prisma.experienciaRenta.findMany({
            where: { solicitud: { publicacion: { inmueble: { propietario_id } } } },
            select: { id: true },
          }).then(r => r.map(e => e.id)) },
          tipo_evaluacion: 'propietario',
        },
      })

      const promedio = evaluaciones.reduce((acc, e) => acc + e.calificacion, 0) / evaluaciones.length

      await prisma.usuario.update({
        where: { id: propietario_id },
        data: {
          calificacion_promedio_como_propietario: promedio,
          total_evaluaciones_como_propietario: evaluaciones.length,
        },
      })
    }

    if (tipo_evaluacion === 'inquilino') {
      const evaluaciones = await prisma.evaluacion.findMany({
        where: {
          experiencia_renta_id: { in: await prisma.experienciaRenta.findMany({
            where: { solicitud: { inquilino_id } },
            select: { id: true },
          }).then(r => r.map(e => e.id)) },
          tipo_evaluacion: 'inquilino',
        },
      })

      const promedio = evaluaciones.reduce((acc, e) => acc + e.calificacion, 0) / evaluaciones.length

      await prisma.usuario.update({
        where: { id: inquilino_id },
        data: {
          calificacion_promedio_como_inquilino: promedio,
          total_evaluaciones_como_inquilino: evaluaciones.length,
        },
      })
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/evaluaciones')

    return { success: true, mensaje: 'Evaluación registrada correctamente' }
  } catch (error) {
    console.error('Error al crear evaluación:', error)
    return { error: 'Error al guardar la evaluación' }
  }
}