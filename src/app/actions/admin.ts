// Purpose: Acciones de servidor para Modera publicaciones, revisa documentos, resuelve reportes y administra cuentas.
'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { registrarNotificacion } from '@/lib/notificaciones'

// Todas las mutaciones del panel vuelven a verificar el rol en el servidor.
async function verificarAdmin() {
  const usuario = await getCurrentUser()
  if (!usuario || !usuario.administrador) {
    throw new Error('No autorizado. Solo administradores pueden realizar esta acción.')
  }
  return usuario
}

function obtenerId(formData: FormData, campo: string): number {
  const valor = formData.get(campo)
  if (typeof valor !== 'string' || !/^\d+$/.test(valor)) {
    throw new Error(`El campo ${campo} no es válido`)
  }

  const id = Number(valor)
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new Error(`El campo ${campo} no es válido`)
  }

  return id
}

function obtenerTexto(formData: FormData, campo: string): string {
  const valor = formData.get(campo)
  return typeof valor === 'string' ? valor.trim() : ''
}

function revalidarModeracion() {
  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard')
  revalidatePath('/propiedades')
  revalidatePath('/')
}

export async function aprobarPublicacionAction(formData: FormData) {
  await verificarAdmin()
  const publicacionId = obtenerId(formData, 'publicacion_id')
  await prisma.$transaction(async (tx) => {
    const resultado = await tx.publicacion.updateMany({
      where: { id: publicacionId, estado: 'pendiente_revision' },
      data: { estado: 'activa', motivo_rechazo: null },
    })
    if (resultado.count !== 1) {
      throw new Error('La publicación no existe o ya fue revisada')
    }

    const publicacion = await tx.publicacion.findUniqueOrThrow({
      where: { id: publicacionId },
      include: { inmueble: true },
    })
    await tx.notificacion.create({
      data: {
        usuario_id: publicacion.inmueble.propietario_id,
        tipo: 'publicacion_aprobada',
        mensaje: `La publicación "${publicacion.inmueble.tipo_inmueble}" fue aprobada y ya aparece en el catálogo.`,
      },
    })
  })
  revalidarModeracion()
  revalidatePath(`/propiedad/${publicacionId}`)
}

export async function rechazarPublicacionAction(formData: FormData) {
  await verificarAdmin()
  const publicacionId = obtenerId(formData, 'publicacion_id')
  const motivo = obtenerTexto(formData, 'motivo')
  if (!motivo) throw new Error('Indica el motivo del rechazo')

  await prisma.$transaction(async (tx) => {
    const resultado = await tx.publicacion.updateMany({
      where: { id: publicacionId, estado: 'pendiente_revision' },
      data: { estado: 'rechazada', motivo_rechazo: motivo },
    })
    if (resultado.count !== 1) {
      throw new Error('La publicación no existe o ya fue revisada')
    }

    const publicacion = await tx.publicacion.findUniqueOrThrow({
      where: { id: publicacionId },
      include: { inmueble: true },
    })
    await tx.notificacion.create({
      data: {
        usuario_id: publicacion.inmueble.propietario_id,
        tipo: 'publicacion_rechazada',
        mensaje: `La publicación "${publicacion.inmueble.tipo_inmueble}" requiere cambios. Motivo: ${motivo}`,
      },
    })
  })
  revalidarModeracion()
  revalidatePath(`/propiedad/${publicacionId}`)
}

export async function suspenderPublicacionAction(formData: FormData) {
  const admin = await verificarAdmin()
  const publicacionId = obtenerId(formData, 'publicacion_id')
  const motivo = obtenerTexto(formData, 'motivo')

  if (!motivo) {
    throw new Error('Indica el motivo de la suspensión')
  }

  await prisma.$transaction(async (tx) => {
    // Condicionar el cambio al estado actual evita suspensiones repetidas o carreras.
    const resultado = await tx.publicacion.updateMany({
      where: { id: publicacionId, estado: 'activa' },
      data: {
        estado: 'suspendida',
        motivo_suspension: motivo,
        suspendida_por: admin.id,
        fecha_suspension: new Date(),
      },
    })
    if (resultado.count !== 1) {
      throw new Error('La publicación no existe o ya no está activa')
    }

  })

  const publicacion = await prisma.publicacion.findUniqueOrThrow({
    where: { id: publicacionId },
    include: { inmueble: true },
  })
  await registrarNotificacion({
    usuarioId: publicacion.inmueble.propietario_id,
    tipo: 'publicacion_suspendida',
    mensaje: `La publicación "${publicacion.inmueble.tipo_inmueble}" fue suspendida. Motivo: ${motivo}`,
  })
  revalidarModeracion()
}

export async function reactivarPublicacionAction(formData: FormData) {
  await verificarAdmin()
  const publicacionId = obtenerId(formData, 'publicacion_id')
  const resultado = await prisma.publicacion.updateMany({
    where: { id: publicacionId, estado: 'suspendida' },
    data: {
      estado: 'activa',
      motivo_suspension: null,
      suspendida_por: null,
      fecha_suspension: null,
    },
  })
  if (resultado.count !== 1) {
    throw new Error('La publicación no existe o no está suspendida')
  }

  const publicacion = await prisma.publicacion.findUniqueOrThrow({
    where: { id: publicacionId },
    include: { inmueble: true },
  })
  await registrarNotificacion({
    usuarioId: publicacion.inmueble.propietario_id,
    tipo: 'publicacion_reactivada',
    mensaje: `La publicación "${publicacion.inmueble.tipo_inmueble}" ya está activa nuevamente.`,
  })
  revalidarModeracion()
}

export async function eliminarPublicacionAction(formData: FormData) {
  await verificarAdmin()
  const publicacionId = obtenerId(formData, 'publicacion_id')
  const resultado = await prisma.publicacion.updateMany({
    where: {
      id: publicacionId,
      estado: { in: ['activa', 'suspendida', 'pendiente_revision', 'rechazada'] },
    },
    data: { estado: 'eliminada' },
  })
  if (resultado.count !== 1) {
    throw new Error('La publicación no existe o ya fue eliminada')
  }

  revalidarModeracion()
}

export async function aprobarDocumentoAction(formData: FormData) {
  const admin = await verificarAdmin()
  const documentoId = obtenerId(formData, 'documento_id')
  const documentoAnterior = await prisma.documento.findUnique({
    where: { id: documentoId },
    select: { usuario_id: true, inmueble_id: true, tipo_documento: true },
  })
  if (!documentoAnterior) throw new Error('El documento no existe')

  await prisma.$transaction(async (tx) => {
    const resultado = await tx.documento.updateMany({
      where: { id: documentoId, estado: 'pendiente' },
      data: {
        estado: 'aprobado',
        verificado_por_admin: true,
        revisado_por: admin.id,
        fecha_revision: new Date(),
        motivo_rechazo: null,
      },
    })
    if (resultado.count !== 1) {
      throw new Error('El documento no existe o ya fue revisado')
    }

    const documento = await tx.documento.findUniqueOrThrow({
      where: { id: documentoId },
      include: {
        usuario: { include: { propietario: true, inquilino: true } },
      },
    })
    const tipoDocumento = documento.tipo_documento.toLocaleLowerCase('es-MX')
    const esIdentificacion =
      tipoDocumento.includes('ine') ||
      tipoDocumento.includes('identificación') ||
      tipoDocumento.includes('identificacion')
    const esEscritura =
      tipoDocumento.includes('escritura') || tipoDocumento.includes('propiedad')

    await tx.verificacion.create({
      data: {
        documento_id: documentoId,
        administrador_id: admin.administrador!.usuario_id,
        estado: 'aprobado',
        observaciones: 'Documento aprobado por administrador',
      },
    })

    // Solo una identificación aprobada confirma los perfiles personales.
    if (esIdentificacion && documento.usuario_id && documento.usuario) {
      if (documento.usuario.propietario) {
        await tx.propietario.update({
          where: { usuario_id: documento.usuario_id },
          data: { estado_verificacion: 'verificado' },
        })
      }
      if (documento.usuario.inquilino) {
        await tx.inquilino.update({
          where: { usuario_id: documento.usuario_id },
          data: { estado_verificacion: 'verificado' },
        })
      }
    }

    // La escritura solo verifica un inmueble cuando el documento está asociado a él.
    if (esEscritura && documento.inmueble_id) {
      await tx.inmueble.update({
        where: { id: documento.inmueble_id },
        data: { documento_verificado: true },
      })
    }

  })

  const propietarioId = documentoAnterior.inmueble_id
    ? (await prisma.inmueble.findUnique({
        where: { id: documentoAnterior.inmueble_id },
        select: { propietario_id: true },
      }))?.propietario_id
    : null
  const destinatarioId = documentoAnterior.usuario_id ?? propietarioId
  if (destinatarioId) {
    await registrarNotificacion({
      usuarioId: destinatarioId,
      tipo: 'documento_aprobado',
      mensaje: `Tu documento "${documentoAnterior.tipo_documento}" fue aprobado.`,
    })
  }

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard')
  revalidatePath('/perfil')
}

export async function rechazarDocumentoAction(formData: FormData) {
  const admin = await verificarAdmin()
  const documentoId = obtenerId(formData, 'documento_id')
  const motivo = obtenerTexto(formData, 'motivo')
  if (!motivo) throw new Error('Indica el motivo del rechazo')
  const documentoAnterior = await prisma.documento.findUnique({
    where: { id: documentoId },
    select: { usuario_id: true, inmueble_id: true, tipo_documento: true },
  })
  if (!documentoAnterior) throw new Error('El documento no existe')

  await prisma.$transaction(async (tx) => {
    const resultado = await tx.documento.updateMany({
      where: { id: documentoId, estado: 'pendiente' },
      data: {
        estado: 'rechazado',
        motivo_rechazo: motivo,
        revisado_por: admin.id,
        fecha_revision: new Date(),
      },
    })
    if (resultado.count !== 1) {
      throw new Error('El documento no existe o ya fue revisado')
    }

    await tx.verificacion.create({
      data: {
        documento_id: documentoId,
        administrador_id: admin.administrador!.usuario_id,
        estado: 'rechazado',
        observaciones: motivo,
      },
    })

  })

  const propietarioId = documentoAnterior.inmueble_id
    ? (await prisma.inmueble.findUnique({
        where: { id: documentoAnterior.inmueble_id },
        select: { propietario_id: true },
      }))?.propietario_id
    : null
  const destinatarioId = documentoAnterior.usuario_id ?? propietarioId
  if (destinatarioId) {
    await registrarNotificacion({
      usuarioId: destinatarioId,
      tipo: 'documento_rechazado',
      mensaje: `Tu documento "${documentoAnterior.tipo_documento}" fue rechazado. Motivo: ${motivo}`,
    })
  }

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard')
  revalidatePath('/perfil')
}

export async function resolverReporteAction(formData: FormData) {
  const admin = await verificarAdmin()
  const reporteId = obtenerId(formData, 'reporte_id')
  const accion = obtenerTexto(formData, 'accion')
  const observaciones = obtenerTexto(formData, 'observaciones')
  if (
    accion !== 'suspender_publicacion' &&
    accion !== 'bloquear_usuario' &&
    accion !== 'solo_resolver'
  ) {
    throw new Error('La acción de resolución no es válida')
  }

  await prisma.$transaction(async (tx) => {
    const resultado = await tx.reporte.updateMany({
      where: { id: reporteId, estado: 'pendiente' },
      data: { estado: 'resuelto' },
    })
    if (resultado.count !== 1) {
      throw new Error('El reporte no existe o ya fue atendido')
    }

    const reporte = await tx.reporte.findUniqueOrThrow({
      where: { id: reporteId },
      include: {
        publicacion: {
          include: {
            inmueble: {
              include: {
                propietario: { include: { usuario: { include: { administrador: true } } } },
              },
            },
          },
        },
      },
    })
    const propietario = reporte.publicacion.inmueble.propietario.usuario

    if (accion === 'suspender_publicacion') {
      await tx.publicacion.update({
        where: { id: reporte.publicacion_id },
        data: {
          estado: 'suspendida',
          motivo_suspension: `Suspendida por reporte: ${reporte.motivo}`,
          suspendida_por: admin.id,
          fecha_suspension: new Date(),
        },
      })
    } else if (accion === 'bloquear_usuario') {
      if (propietario.administrador || propietario.id === admin.id) {
        throw new Error('No se puede bloquear una cuenta de administrador')
      }
      await tx.usuario.update({
        where: { id: propietario.id },
        data: {
          bloqueado: true,
          motivo_bloqueo: `Bloqueado por reporte: ${reporte.motivo}`,
          fecha_bloqueo: new Date(),
        },
      })
    }

    await tx.moderacion.create({
      data: {
        reporte_id: reporteId,
        administrador_id: admin.administrador!.usuario_id,
        accion,
        observaciones: observaciones || null,
      },
    })
  })

  if (accion !== 'solo_resolver') {
    const reporte = await prisma.reporte.findUniqueOrThrow({
      where: { id: reporteId },
      include: {
        publicacion: {
          include: {
            inmueble: {
              include: { propietario: { select: { usuario_id: true } } },
            },
          },
        },
      },
    })
    const propietarioId = reporte.publicacion.inmueble.propietario.usuario_id
    await registrarNotificacion({
      usuarioId: propietarioId,
      tipo: accion === 'bloquear_usuario' ? 'usuario_bloqueado' : 'publicacion_suspendida',
      mensaje: accion === 'bloquear_usuario'
        ? `Tu cuenta fue bloqueada por un reporte. Motivo: ${reporte.motivo}`
        : `Tu publicación fue suspendida por un reporte. Motivo: ${reporte.motivo}`,
    })
  }

  revalidarModeracion()
}

export async function descartarReporteAction(formData: FormData) {
  const admin = await verificarAdmin()
  const reporteId = obtenerId(formData, 'reporte_id')
  const observaciones = obtenerTexto(formData, 'observaciones')

  await prisma.$transaction(async (tx) => {
    const resultado = await tx.reporte.updateMany({
      where: { id: reporteId, estado: 'pendiente' },
      data: { estado: 'descartado' },
    })
    if (resultado.count !== 1) {
      throw new Error('El reporte no existe o ya fue atendido')
    }

    await tx.moderacion.create({
      data: {
        reporte_id: reporteId,
        administrador_id: admin.administrador!.usuario_id,
        accion: 'descartar_reporte',
        observaciones: observaciones || null,
      },
    })
  })

  revalidatePath('/dashboard/admin')
}

export async function bloquearUsuarioAction(formData: FormData) {
  const admin = await verificarAdmin()
  const usuarioId = obtenerId(formData, 'usuario_id')
  const motivo = obtenerTexto(formData, 'motivo')
  if (!motivo) throw new Error('Indica el motivo del bloqueo')
  if (usuarioId === admin.id) {
    throw new Error('No puedes bloquear tu propia cuenta')
  }

  const resultado = await prisma.usuario.updateMany({
    where: { id: usuarioId, administrador: null },
    data: {
      bloqueado: true,
      motivo_bloqueo: motivo,
      fecha_bloqueo: new Date(),
    },
  })
  if (resultado.count !== 1) {
    throw new Error('El usuario no existe o no se puede bloquear')
  }

  await registrarNotificacion({
    usuarioId,
    tipo: 'usuario_bloqueado',
    mensaje: `Tu cuenta fue bloqueada por el equipo de Rentify. Motivo: ${motivo}`,
  })
  revalidatePath('/dashboard/admin')
}

export async function desbloquearUsuarioAction(formData: FormData) {
  await verificarAdmin()
  const usuarioId = obtenerId(formData, 'usuario_id')
  const resultado = await prisma.usuario.updateMany({
    where: { id: usuarioId, bloqueado: true, administrador: null },
    data: {
      bloqueado: false,
      motivo_bloqueo: null,
      fecha_bloqueo: null,
    },
  })
  if (resultado.count !== 1) {
    throw new Error('El usuario no existe o no está bloqueado')
  }

  await registrarNotificacion({
    usuarioId,
    tipo: 'usuario_desbloqueado',
    mensaje: 'Tu cuenta vuelve a estar activa en Rentify.',
  })
  revalidatePath('/dashboard/admin')
}