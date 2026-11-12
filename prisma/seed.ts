// Purpose: Puebla una base de desarrollo con fixtures y elimina antes los datos existentes.
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import { hashPassword } from '../src/lib/password'

const prisma = new PrismaClient()
const contrasenaDemo = 'test123'

type CriteriosDemo = [number, number, number]

async function crearRentaFinalizadaDemo({
  publicacionId,
  inquilinoId,
  propietarioId,
  fechaInicio,
  fechaFin,
  calificacionInmueble,
  criteriosPropietario,
  criteriosInquilino,
}: {
  publicacionId: number
  inquilinoId: number
  propietarioId: number
  fechaInicio: string
  fechaFin: string
  calificacionInmueble: number
  criteriosPropietario: CriteriosDemo
  criteriosInquilino: CriteriosDemo
}) {
  const solicitud = await prisma.solicitudRenta.create({
    data: {
      inquilino_id: inquilinoId,
      publicacion_id: publicacionId,
      estado: 'aprobada',
      mensaje: 'Solicitud de demostración con renta finalizada.',
    },
  })

  const experiencia = await prisma.experienciaRenta.create({
    data: {
      solicitud_id: solicitud.id,
      fecha_inicio: new Date(fechaInicio),
      fecha_fin: new Date(fechaFin),
      estado: 'finalizada',
    },
  })

  const promedioPropietario = criteriosPropietario.reduce((total, valor) => total + valor, 0) / 3
  const promedioInquilino = criteriosInquilino.reduce((total, valor) => total + valor, 0) / 3

  await prisma.evaluacion.createMany({
    data: [
      {
        experiencia_renta_id: experiencia.id,
        usuario_evaluador_id: inquilinoId,
        tipo_evaluacion: 'inmueble',
        calificacion: calificacionInmueble,
        comentario: 'La vivienda coincidió con las condiciones acordadas para la estancia.',
      },
      {
        experiencia_renta_id: experiencia.id,
        usuario_evaluador_id: inquilinoId,
        tipo_evaluacion: 'propietario',
        calificacion: promedioPropietario,
        comentario: 'La comunicación y la atención durante la renta fueron adecuadas.',
        calificacion_atencion: criteriosPropietario[0],
        calificacion_mantenimiento: criteriosPropietario[1],
        calificacion_cumplimiento: criteriosPropietario[2],
      },
      {
        experiencia_renta_id: experiencia.id,
        usuario_evaluador_id: propietarioId,
        tipo_evaluacion: 'inquilino',
        calificacion: promedioInquilino,
        comentario: 'La persona inquilina cuidó la vivienda y cumplió lo acordado.',
        calificacion_puntualidad: criteriosInquilino[0],
        calificacion_cuidado: criteriosInquilino[1],
        calificacion_higiene: criteriosInquilino[2],
      },
    ],
  })
}

async function recalcularPromediosDemo() {
  const inmuebles = await prisma.inmueble.findMany({ select: { id: true } })
  for (const inmueble of inmuebles) {
    const evaluaciones = await prisma.evaluacion.findMany({
      where: {
        tipo_evaluacion: 'inmueble',
        experiencia: { solicitud: { publicacion: { inmueble_id: inmueble.id } } },
      },
      select: { calificacion: true },
    })
    await prisma.inmueble.update({
      where: { id: inmueble.id },
      data: {
        calificacion_promedio: evaluaciones.length
          ? evaluaciones.reduce((total, evaluacion) => total + evaluacion.calificacion, 0) / evaluaciones.length
          : 0,
        total_evaluaciones: evaluaciones.length,
      },
    })
  }

  const usuarios = await prisma.usuario.findMany({ select: { id: true } })
  for (const usuario of usuarios) {
    const evaluacionesPropietario = await prisma.evaluacion.findMany({
      where: {
        tipo_evaluacion: 'propietario',
        experiencia: {
          solicitud: {
            publicacion: { inmueble: { propietario_id: usuario.id } },
          },
        },
      },
      select: { calificacion: true },
    })
    const evaluacionesInquilino = await prisma.evaluacion.findMany({
      where: {
        tipo_evaluacion: 'inquilino',
        experiencia: { solicitud: { inquilino_id: usuario.id } },
      },
      select: { calificacion: true },
    })

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        calificacion_promedio_como_propietario: evaluacionesPropietario.length
          ? evaluacionesPropietario.reduce((total, evaluacion) => total + evaluacion.calificacion, 0) / evaluacionesPropietario.length
          : 0,
        total_evaluaciones_como_propietario: evaluacionesPropietario.length,
        calificacion_promedio_como_inquilino: evaluacionesInquilino.length
          ? evaluacionesInquilino.reduce((total, evaluacion) => total + evaluacion.calificacion, 0) / evaluacionesInquilino.length
          : 0,
        total_evaluaciones_como_inquilino: evaluacionesInquilino.length,
      },
    })
  }
}

async function main() {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    throw new Error('El seed de demostración no se puede ejecutar en producción.')
  }
  if (process.env.RENTIFY_ALLOW_DEMO_SEED !== 'true') {
    throw new Error('Confirma el uso de una base local/de prueba con RENTIFY_ALLOW_DEMO_SEED=true.')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Configura NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para crear las cuentas de prueba.')
  }
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error: authAdminError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  })
  if (authAdminError) {
    throw new Error(`No se pudo validar el acceso administrativo de Supabase: ${authAdminError.message}`)
  }

  console.log('🌱 Iniciando seed...')

  // El seed reconstruye los datos y sus relaciones; no debe ejecutarse sobre una base con información real.
  // Se eliminan primero los registros dependientes para respetar las claves foráneas.
  await prisma.moderacion.deleteMany()
  await prisma.reporte.deleteMany()
  await prisma.verificacion.deleteMany()
  await prisma.documento.deleteMany()
  await prisma.resena.deleteMany()
  await prisma.evaluacion.deleteMany()
  await prisma.experienciaRenta.deleteMany()
  await prisma.visita.deleteMany()
  await prisma.solicitudRenta.deleteMany()
  await prisma.foto.deleteMany()
  await prisma.publicacion.deleteMany()
  await prisma.inmuebleCaracteristica.deleteMany()
  await prisma.caracteristica.deleteMany()
  await prisma.inmueble.deleteMany()
  await prisma.propietario.deleteMany()
  await prisma.inquilino.deleteMany()
  await prisma.administrador.deleteMany()
  await prisma.notificacion.deleteMany()
  await prisma.usuario.deleteMany()

  console.log('✅ Datos previos eliminados')

  const contrasenaHash = await hashPassword(contrasenaDemo)

  const preferenciasDefault = {
    solicitudes: true,
    visitas: true,
    evaluaciones: true,
    marketing: false,
  }

  // ==================== USUARIOS ====================

  const propietarioUsuario = await prisma.usuario.create({
    data: {
      nombre: 'Carlos',
      apellido: 'Mendoza',
      correo: 'carlos@rentify.com',
      fecha_nacimiento: new Date('1985-03-15'),
      contrasena: contrasenaHash,
      estado: 'activo',
      telefono: '+52 33 1234 5678',
      verificado_email: true,
      preferencias_email: preferenciasDefault,
      inquilino: {
        create: { estado_verificacion: 'verificado' },
      },
      propietario: {
        create: { estado_verificacion: 'verificado' },
      },
    },
    include: { inquilino: true, propietario: true },
  })

  const propietarioUsuario2 = await prisma.usuario.create({
    data: {
      nombre: 'María',
      apellido: 'Ramírez',
      correo: 'maria@rentify.com',
      fecha_nacimiento: new Date('1990-07-22'),
      contrasena: contrasenaHash,
      estado: 'activo',
      telefono: '+52 33 8765 4321',
      verificado_email: true,
      preferencias_email: preferenciasDefault,
      inquilino: {
        create: { estado_verificacion: 'verificado' },
      },
      propietario: {
        create: { estado_verificacion: 'verificado' },
      },
    },
    include: { inquilino: true, propietario: true },
  })

  const inquilinoUsuario = await prisma.usuario.create({
    data: {
      nombre: 'Ana',
      apellido: 'López',
      correo: 'ana@rentify.com',
      fecha_nacimiento: new Date('1995-11-08'),
      contrasena: contrasenaHash,
      estado: 'activo',
      telefono: '+52 33 5555 1234',
      verificado_email: true,
      preferencias_email: preferenciasDefault,
      inquilino: {
        create: { estado_verificacion: 'pendiente' },
      },
      propietario: {
        create: { estado_verificacion: 'verificado' },
      },
    },
    include: { inquilino: true, propietario: true },
  })

  const usuarioResena1 = await prisma.usuario.create({
    data: {
      nombre: 'Mariana',
      apellido: 'De La Torre',
      correo: 'mariana@test.com',
      fecha_nacimiento: new Date('1992-05-10'),
      contrasena: contrasenaHash,
      estado: 'activo',
      verificado_email: true,
      inquilino: {
        create: { estado_verificacion: 'verificado' },
      },
    },
  })

  const usuarioResena2 = await prisma.usuario.create({
    data: {
      nombre: 'Rodrigo',
      apellido: 'Valencia',
      correo: 'rodrigo@test.com',
      fecha_nacimiento: new Date('1988-09-20'),
      contrasena: contrasenaHash,
      estado: 'activo',
      verificado_email: true,
      inquilino: {
        create: { estado_verificacion: 'verificado' },
      },
    },
  })

  const administradorUsuario = await prisma.usuario.create({
    data: {
      nombre: 'Admin',
      apellido: 'Rentify',
      correo: 'admin@rentify.com',
      fecha_nacimiento: new Date('1980-01-01'),
      contrasena: contrasenaHash,
      estado: 'activo',
      telefono: '+52 33 0000 0000',
      verificado_email: true,
      preferencias_email: preferenciasDefault,
      inquilino: {
        create: { estado_verificacion: 'verificado' },
      },
      administrador: {
        create: { nivel_acceso: 'superadmin' },
      },
      propietario: {
        create: { estado_verificacion: 'verificado' },
      },
    },
    include: { administrador: true, inquilino: true, propietario: true },
  })

  const cuentasPrueba = [
    propietarioUsuario,
    propietarioUsuario2,
    inquilinoUsuario,
    usuarioResena1,
    usuarioResena2,
    administradorUsuario,
  ]
  const correosPrueba = new Set(cuentasPrueba.map((cuenta) => cuenta.correo.toLowerCase()))
  const identidadesExistentes = new Map<string, { id: string }>()
  let paginaUsuarios = 1

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: paginaUsuarios,
      perPage: 1000,
    })
    if (error) throw new Error(`No se pudieron consultar las cuentas de prueba de Supabase: ${error.message}`)

    for (const authUser of data.users) {
      const correo = authUser.email?.toLowerCase()
      if (correo && correosPrueba.has(correo)) {
        identidadesExistentes.set(correo, { id: authUser.id })
      }
    }

    if (identidadesExistentes.size === correosPrueba.size || data.users.length < 1000) break
    paginaUsuarios += 1
  }

  for (const cuenta of cuentasPrueba) {
    const correo = cuenta.correo.toLowerCase()
    const existente = identidadesExistentes.get(correo)
    const atributos = {
      password: contrasenaDemo,
      email_confirm: true,
      user_metadata: { nombre: cuenta.nombre, apellido: cuenta.apellido },
    }
    const resultado = existente
      ? await supabaseAdmin.auth.admin.updateUserById(existente.id, atributos)
      : await supabaseAdmin.auth.admin.createUser({
          email: correo,
          ...atributos,
        })

    if (resultado.error) {
      throw new Error(`No se pudo confirmar la cuenta de demostración ${correo}: ${resultado.error.message}`)
    }

    await prisma.usuario.update({
      where: { id: cuenta.id },
      data: { auth_user_id: resultado.data.user.id, verificado_email: true },
    })
  }

  console.log('✅ Usuarios creados')
  console.log('✅ Cuentas de Supabase creadas o actualizadas con correo confirmado')

  // ==================== CARACTERÍSTICAS ====================

  const caracteristicas = await Promise.all([
    prisma.caracteristica.create({ data: { nombre: 'Internet de Alta Velocidad' } }),
    prisma.caracteristica.create({ data: { nombre: 'Cocina Integral Equipada' } }),
    prisma.caracteristica.create({ data: { nombre: 'A/C Inverter' } }),
    prisma.caracteristica.create({ data: { nombre: 'Centro de Lavado' } }),
    prisma.caracteristica.create({ data: { nombre: 'Pet-Friendly' } }),
    prisma.caracteristica.create({ data: { nombre: 'Seguridad 24/7' } }),
    prisma.caracteristica.create({ data: { nombre: 'Gimnasio' } }),
    prisma.caracteristica.create({ data: { nombre: 'Espacio Home Office' } }),
    prisma.caracteristica.create({ data: { nombre: 'Alberca' } }),
    prisma.caracteristica.create({ data: { nombre: 'Balcón' } }),
    prisma.caracteristica.create({ data: { nombre: 'Amueblado' } }),
    prisma.caracteristica.create({ data: { nombre: 'Cerradura Biométrica' } }),
  ])

  console.log('✅ Características creadas')

  // ==================== INMUEBLES ====================

  const inmueblesData = [
    {
      propietario_id: propietarioUsuario.propietario!.usuario_id,
      tipo_inmueble: 'Loft Contemporáneo con Terraza',
      direccion: 'Calle Libertad 1420, Colonia Americana, Guadalajara, Jalisco',
      numero_habitaciones: 1,
      numero_banos: 1,
      metros_cuadrados: 82,
      precio_renta: 18500,
      deposito: 18500,
      descripcion: 'Ubicado en el epicentro arquitectónico y cultural de la Colonia Americana, este departamento combina el carácter del concreto aparente pulido con la calidez de acabados artesanales en cantera jalisciense y madera de roble. El departamento goza de una orientación sur-poniente protegida por follaje maduro, generando un flujo de ventilación cruzada natural. Su sala principal con ventanales de piso a techo se abre directamente a una amplia terraza privada con vista despejada hacia la copa de las jacarandas.',
      reglas: 'No fumar en interiores. Máximo 2 mascotas medianas con depósito accesorio de $2,000 MXN. Horario de silencio a partir de las 22:00 hrs en áreas comunes.',
      imagen: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      imagenes_extra: [
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
        'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80',
        'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80',
      ],
      caracteristicas: ['Internet de Alta Velocidad', 'Cocina Integral Equipada', 'A/C Inverter', 'Centro de Lavado', 'Pet-Friendly', 'Seguridad 24/7', 'Gimnasio', 'Espacio Home Office'],
      latitud: 20.6712,
      longitud: -103.3685,
      piso: 4,
      servicios_incluidos: 'Agua y mantenimiento incluidos',
      resenas: [
        { usuario_id: usuarioResena1.id, calificacion: 5, comentario: 'El departamento es exactamente como en las fotos. La terraza es espectacular y la ubicación inmejorable. Carlos fue un anfitrión excepcional.', duracion_meses: 12 },
        { usuario_id: usuarioResena2.id, calificacion: 5, comentario: 'Viví aquí 6 meses y fue la mejor decisión. El loft tiene una vibra increíble, mucha luz natural y el barrio es perfecto para caminar.', duracion_meses: 6 },
      ],
    },
    {
      propietario_id: propietarioUsuario2.propietario!.usuario_id,
      tipo_inmueble: 'Departamento Familiar frente a Parque',
      direccion: 'Av. San Dionisio 245, Chapalita, Guadalajara, Jalisco',
      numero_habitaciones: 3,
      numero_banos: 2,
      metros_cuadrados: 140,
      precio_renta: 26000,
      deposito: 26000,
      descripcion: 'Departamento familiar en una de las zonas más tranquilas de Chapalita, con vista directa al parque. Amplio balcón, cocina integral, tres recámaras con clósets empotrados y dos baños completos. Edificio con seguridad 24/7, estacionamiento techado para 2 autos y áreas comunes con jardín.',
      reglas: 'No fumar. Mascotas pequeñas permitidas. Contrato mínimo 12 meses.',
      imagen: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      imagenes_extra: [
        'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800&q=80',
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
        'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      ],
      caracteristicas: ['Cocina Integral Equipada', 'Pet-Friendly', 'Seguridad 24/7', 'Balcón', 'Centro de Lavado'],
      latitud: 20.6394,
      longitud: -103.4002,
      piso: 2,
      servicios_incluidos: 'Mantenimiento incluido',
      resenas: [
        { usuario_id: usuarioResena1.id, calificacion: 5, comentario: 'Perfecto para familias. El parque enfrente es ideal para los niños y la zona es muy segura.', duracion_meses: 18 },
      ],
    },
    {
      propietario_id: propietarioUsuario.propietario!.usuario_id,
      tipo_inmueble: 'Penthouse con Vista Panorámica',
      direccion: 'Av. Rubén Darío 1520, Providencia, Guadalajara, Jalisco',
      numero_habitaciones: 2,
      numero_banos: 2,
      metros_cuadrados: 110,
      precio_renta: 34500,
      deposito: 34500,
      descripcion: 'Espectacular penthouse en el corazón de Providencia con vistas panorámicas a la ciudad. Terraza privada, alberca, gimnasio y seguridad 24/7. Acabados de lujo en mármol y maderas finas. Ideal para ejecutivos o parejas que buscan lo mejor de Guadalajara.',
      reglas: 'No fumar. No mascotas. Contrato mínimo 12 meses.',
      imagen: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
      imagenes_extra: [
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
        'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80',
      ],
      caracteristicas: ['Alberca', 'Gimnasio', 'Seguridad 24/7', 'A/C Inverter', 'Cocina Integral Equipada', 'Cerradura Biométrica'],
      latitud: 20.6985,
      longitud: -103.3851,
      piso: 12,
      servicios_incluidos: 'Mantenimiento y agua incluidos',
      resenas: [
        { usuario_id: usuarioResena2.id, calificacion: 5, comentario: 'Las vistas son impresionantes. El edificio tiene amenidades de primera y la atención de Carlos fue impecable.', duracion_meses: 12 },
        { usuario_id: usuarioResena1.id, calificacion: 4, comentario: 'Excelente ubicación y acabados. Solo le faltaría más espacio de estacionamiento, pero por lo demás perfecto.', duracion_meses: 8 },
      ],
    },
    {
      propietario_id: propietarioUsuario2.propietario!.usuario_id,
      tipo_inmueble: 'Casa Colonial en Tlaquepaque',
      direccion: 'Calle Independencia 88, Tlaquepaque, Jalisco',
      numero_habitaciones: 3,
      numero_banos: 3,
      metros_cuadrados: 210,
      precio_renta: 31000,
      deposito: 31000,
      descripcion: 'Hermosa casa estilo colonial completamente renovada en el pintoresco barrio de Tlaquepaque. Amplio jardín interior con árboles frutales, fuente de cantera y cocina equipada. A 5 minutos caminando del centro histórico, galerías y restaurantes típicos. Perfecta para familias o para quienes buscan un espacio con carácter.',
      reglas: 'No fumar. Mascotas bienvenidas. Jardinería incluida.',
      imagen: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
      imagenes_extra: [
        'https://images.unsplash.com/photo-1600596542815-e32870110004?w=800&q=80',
        'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80',
        'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=800&q=80',
        'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80',
      ],
      caracteristicas: ['Pet-Friendly', 'Cocina Integral Equipada', 'Seguridad 24/7', 'Centro de Lavado', 'Espacio Home Office'],
      latitud: 20.6394,
      longitud: -103.3124,
      piso: 1,
      servicios_incluidos: 'Jardinería incluida',
      resenas: [
        { usuario_id: usuarioResena2.id, calificacion: 5, comentario: 'La casa es aún más bonita que en las fotos. El jardín es un oasis y la ubicación es perfecta para disfrutar Tlaquepaque.', duracion_meses: 24 },
      ],
    },
    {
      propietario_id: propietarioUsuario.propietario!.usuario_id,
      tipo_inmueble: 'Casa Renovada en Santa Tere',
      direccion: 'Calle Garibaldi 820, Santa Teresita, Guadalajara, Jalisco',
      numero_habitaciones: 2,
      numero_banos: 2,
      metros_cuadrados: 118,
      precio_renta: 19800,
      deposito: 19800,
      descripcion: 'Casa renovada con patio interior, cocina equipada y espacio flexible para trabajar desde casa. A pocas cuadras del mercado y de rutas de transporte.',
      reglas: 'No fumar en interiores. Se acepta una mascota pequeña. Contrato mínimo de 12 meses.',
      imagen: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
      imagenes_extra: [
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
        'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
      ],
      caracteristicas: ['Cocina Integral Equipada', 'Centro de Lavado', 'Espacio Home Office', 'Balcón'],
      latitud: 20.6923,
      longitud: -103.3597,
      piso: 1,
      servicios_incluidos: 'Agua incluida',
      resenas: [
        { usuario_id: propietarioUsuario2.id, calificacion: 4, comentario: 'La distribución y el patio fueron muy prácticos durante mi estancia.', duracion_meses: 12 },
      ],
    },
    {
      propietario_id: propietarioUsuario2.propietario!.usuario_id,
      tipo_inmueble: 'Estudio Amueblado en Arcos Vallarta',
      direccion: 'Av. Vallarta 1780, Arcos Vallarta, Guadalajara, Jalisco',
      numero_habitaciones: 1,
      numero_banos: 1,
      metros_cuadrados: 52,
      precio_renta: 14200,
      deposito: 14200,
      descripcion: 'Estudio amueblado con cocina integral, área de trabajo y buena conexión con avenidas principales. Ideal para una persona o pareja.',
      reglas: 'No fumar. No se permiten mascotas. Contrato mínimo de 6 meses.',
      imagen: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80',
      imagenes_extra: [
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      ],
      caracteristicas: ['Amueblado', 'Cocina Integral Equipada', 'Internet de Alta Velocidad', 'Espacio Home Office'],
      latitud: 20.6752,
      longitud: -103.3755,
      piso: 3,
      servicios_incluidos: 'Internet y mantenimiento incluidos',
      resenas: [
        { usuario_id: usuarioResena1.id, calificacion: 5, comentario: 'Un espacio cómodo, bien equipado y cerca de transporte y servicios.', duracion_meses: 8 },
      ],
    },
    {
      propietario_id: inquilinoUsuario.propietario!.usuario_id,
      tipo_inmueble: 'Departamento con Terraza en Jardines del Bosque',
      direccion: 'Av. de los Arcos 2450, Jardines del Bosque, Guadalajara, Jalisco',
      numero_habitaciones: 2,
      numero_banos: 2,
      metros_cuadrados: 96,
      precio_renta: 21700,
      deposito: 21700,
      descripcion: 'Departamento con terraza, dos recámaras y área común luminosa. Cerca de parques, comercios y vías de acceso a la zona centro.',
      reglas: 'No fumar. Mascotas pequeñas permitidas con autorización.',
      imagen: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80',
      imagenes_extra: [
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
        'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80',
      ],
      caracteristicas: ['Balcón', 'Cocina Integral Equipada', 'Centro de Lavado', 'Seguridad 24/7'],
      latitud: 20.6617,
      longitud: -103.3858,
      piso: 5,
      servicios_incluidos: 'Mantenimiento incluido',
      resenas: [
        { usuario_id: usuarioResena2.id, calificacion: 4, comentario: 'La terraza y la distribución hacen que el departamento se sienta amplio.', duracion_meses: 10 },
      ],
    },
    {
      propietario_id: propietarioUsuario2.propietario!.usuario_id,
      tipo_inmueble: 'Casa Familiar en Ciudad Granja',
      direccion: 'Calle Calandrias 510, Ciudad Granja, Zapopan, Jalisco',
      numero_habitaciones: 3,
      numero_banos: 2,
      metros_cuadrados: 155,
      precio_renta: 23500,
      deposito: 23500,
      descripcion: 'Casa de tres recámaras con patio, cocina integral y espacio para home office. Ubicada en una zona residencial con acceso a servicios y transporte.',
      reglas: 'No fumar en interiores. Se aceptan mascotas. Contrato mínimo de 12 meses.',
      imagen: 'https://images.unsplash.com/photo-1600596542815-e32870110004?w=1200&q=80',
      imagenes_extra: [
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
        'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80',
      ],
      caracteristicas: ['Cocina Integral Equipada', 'Pet-Friendly', 'Espacio Home Office', 'Seguridad 24/7'],
      latitud: 20.6746,
      longitud: -103.4341,
      piso: 1,
      servicios_incluidos: 'Mantenimiento incluido',
      resenas: [
        { usuario_id: administradorUsuario.id, calificacion: 5, comentario: 'La casa es funcional y la distribución funciona bien para una estancia larga.', duracion_meses: 10 },
      ],
    },
  ]

  for (const data of inmueblesData) {
    const inmueble = await prisma.inmueble.create({
      data: {
        propietario_id: data.propietario_id,
        tipo_inmueble: data.tipo_inmueble,
        direccion: data.direccion,
        numero_habitaciones: data.numero_habitaciones,
        numero_banos: data.numero_banos,
        metros_cuadrados: data.metros_cuadrados,
        latitud: data.latitud,
        longitud: data.longitud,
        estado_inventario: 'disponible',
        documento_verificado: true,
        piso: data.piso,
        servicios_incluidos: data.servicios_incluidos,
      },
    })

    for (const nombreCar of data.caracteristicas) {
      const car = caracteristicas.find((c) => c.nombre === nombreCar)
      if (car) {
        await prisma.inmuebleCaracteristica.create({
          data: { inmueble_id: inmueble.id, caracteristica_id: car.id },
        })
      }
    }

    const publicacion = await prisma.publicacion.create({
      data: {
        inmueble_id: inmueble.id,
        precio_renta: data.precio_renta,
        deposito: data.deposito,
        descripcion: data.descripcion,
        reglas: data.reglas,
        estado: 'activa',
        calificacion_promedio: data.resenas.reduce((a, r) => a + r.calificacion, 0) / data.resenas.length,
        total_resenas: data.resenas.length,
      },
    })

    await prisma.foto.create({
      data: {
        publicacion_id: publicacion.id,
        ruta_archivo: data.imagen,
        orden: 1,
      },
    })

    for (let i = 0; i < data.imagenes_extra.length; i++) {
      await prisma.foto.create({
        data: {
          publicacion_id: publicacion.id,
          ruta_archivo: data.imagenes_extra[i],
          orden: i + 2,
        },
      })
    }

    for (const resena of data.resenas) {
      await prisma.resena.create({
        data: {
          publicacion_id: publicacion.id,
          usuario_id: resena.usuario_id,
          calificacion: resena.calificacion,
          comentario: resena.comentario,
          duracion_meses: resena.duracion_meses,
        },
      })
    }
  }

  console.log('✅ Inmuebles con fotos y reseñas creados')

  // Inmueble extra para Ana
  await prisma.inmueble.create({
    data: {
      propietario_id: inquilinoUsuario.propietario!.usuario_id,
      tipo_inmueble: 'Departamento Moderno en Zapopan',
      direccion: 'Av. Patria 1200, Zapopan, Jalisco',
      numero_habitaciones: 2,
      numero_banos: 1,
      metros_cuadrados: 80,
      latitud: 20.7214,
      longitud: -103.3918,
      estado_inventario: 'disponible',
      documento_verificado: true,
      piso: 3,
      servicios_incluidos: 'Mantenimiento incluido',
      publicaciones: {
        create: {
          precio_renta: 11000,
          deposito: 11000,
          descripcion: 'Bonito departamento en Zapopan, ideal para parejas. Cerca de plazas comerciales y transporte público. Cocina equipada, balcón con vista al jardín y estacionamiento techado.',
          reglas: 'No fumar. Mascotas pequeñas bienvenidas.',
          estado: 'activa',
          calificacion_promedio: 5,
          total_resenas: 0,
          fotos: {
            create: {
              ruta_archivo: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
              orden: 1,
            },
          },
        },
      },
    },
  })

  // ==================== SOLICITUDES Y VISITAS ====================

  const publicacionCasa = await prisma.publicacion.findFirst({
    where: { inmueble: { direccion: { contains: 'Chapalita' } } },
  })

  if (publicacionCasa && inquilinoUsuario.inquilino) {
    const solicitud = await prisma.solicitudRenta.create({
      data: {
        inquilino_id: inquilinoUsuario.inquilino.usuario_id,
        publicacion_id: publicacionCasa.id,
        estado: 'pendiente',
        mensaje: 'Hola, me interesa mucho esta propiedad. ¿Podríamos agendar una visita?',
      },
    })

    await prisma.visita.create({
      data: {
        solicitud_id: solicitud.id,
        fecha_hora: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        tipo: 'visita',
        modalidad: 'presencial',
        estado: 'agendada',
        notas: 'Me gustaría revisar la iluminación para home office.',
      },
    })

    console.log('✅ Solicitud y visita de prueba creadas')
  }

  // ==================== REPORTES DE PRUEBA ====================

  const publicacionReportada = await prisma.publicacion.findFirst({
    where: { inmueble: { direccion: { contains: 'Chapalita' } } },
  })

  if (publicacionReportada && usuarioResena1) {
    await prisma.reporte.create({
      data: {
        usuario_id: usuarioResena1.id,
        publicacion_id: publicacionReportada.id,
        motivo: 'Información falsa',
        descripcion: 'Las fotos no coinciden con la propiedad real. El precio publicado es diferente al que me comentaron al llamar.',
        estado: 'pendiente',
      },
    })
    console.log('✅ Reporte de prueba creado')
  }

  // ==================== DOCUMENTOS PENDIENTES ====================

  await prisma.documento.create({
    data: {
      usuario_id: inquilinoUsuario.id,
      tipo_documento: 'INE',
      ruta_archivo: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
      estado: 'pendiente',
    },
  })

  await prisma.documento.create({
    data: {
      usuario_id: propietarioUsuario.id,
      tipo_documento: 'Escritura',
      ruta_archivo: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
      estado: 'pendiente',
    },
  })

  console.log('✅ Documentos pendientes de verificación creados')

  // ==================== NOTIFICACIONES DE PRUEBA ====================

  await prisma.notificacion.create({
    data: {
      usuario_id: propietarioUsuario.id,
      tipo: 'solicitud_renta',
      mensaje: 'Ana López solicitó rentar "Departamento Familiar frente a Parque"',
      estado: 'no_leida',
    },
  })

  await prisma.notificacion.create({
    data: {
      usuario_id: propietarioUsuario.id,
      tipo: 'visita_agendada',
      mensaje: 'Ana López agendó una visita presencial para el Departamento Familiar',
      estado: 'no_leida',
    },
  })

  console.log('✅ Notificaciones de prueba creadas')

  console.log('')
  // ==================== HISTORIAL DE RENTAS Y EVALUACIONES ====================

  const rentasDemo = [
    {
      inmueble: 'Loft Contemporáneo',
      inquilinoId: inquilinoUsuario.id,
      fechaInicio: '2023-02-01',
      fechaFin: '2024-01-31',
      calificacionInmueble: 5,
      criteriosPropietario: [5, 4, 5] as CriteriosDemo,
      criteriosInquilino: [5, 5, 4] as CriteriosDemo,
    },
    {
      inmueble: 'Casa Colonial en Tlaquepaque',
      inquilinoId: usuarioResena1.id,
      fechaInicio: '2023-04-01',
      fechaFin: '2024-03-31',
      calificacionInmueble: 4,
      criteriosPropietario: [5, 5, 4] as CriteriosDemo,
      criteriosInquilino: [4, 5, 5] as CriteriosDemo,
    },
    {
      inmueble: 'Departamento Moderno en Zapopan',
      inquilinoId: usuarioResena2.id,
      fechaInicio: '2024-01-01',
      fechaFin: '2024-10-31',
      calificacionInmueble: 4,
      criteriosPropietario: [4, 5, 4] as CriteriosDemo,
      criteriosInquilino: [5, 4, 4] as CriteriosDemo,
    },
    {
      inmueble: 'Departamento Familiar frente a Parque',
      inquilinoId: propietarioUsuario.id,
      fechaInicio: '2024-06-01',
      fechaFin: '2025-05-31',
      calificacionInmueble: 5,
      criteriosPropietario: [5, 4, 5] as CriteriosDemo,
      criteriosInquilino: [5, 5, 5] as CriteriosDemo,
    },
    {
      inmueble: 'Casa Renovada en Santa Tere',
      inquilinoId: propietarioUsuario2.id,
      fechaInicio: '2025-01-01',
      fechaFin: '2025-10-31',
      calificacionInmueble: 4,
      criteriosPropietario: [4, 4, 5] as CriteriosDemo,
      criteriosInquilino: [4, 5, 4] as CriteriosDemo,
    },
    {
      inmueble: 'Casa Familiar en Ciudad Granja',
      inquilinoId: administradorUsuario.id,
      fechaInicio: '2025-02-01',
      fechaFin: '2025-10-31',
      calificacionInmueble: 5,
      criteriosPropietario: [5, 5, 5] as CriteriosDemo,
      criteriosInquilino: [4, 4, 5] as CriteriosDemo,
    },
  ]

  for (const renta of rentasDemo) {
    const publicacion = await prisma.publicacion.findFirst({
      where: { inmueble: { tipo_inmueble: { contains: renta.inmueble } } },
      include: { inmueble: true },
    })
    if (!publicacion) throw new Error(`No se encontró la propiedad de demostración: ${renta.inmueble}`)

    await crearRentaFinalizadaDemo({
      publicacionId: publicacion.id,
      inquilinoId: renta.inquilinoId,
      propietarioId: publicacion.inmueble.propietario_id,
      fechaInicio: renta.fechaInicio,
      fechaFin: renta.fechaFin,
      calificacionInmueble: renta.calificacionInmueble,
      criteriosPropietario: renta.criteriosPropietario,
      criteriosInquilino: renta.criteriosInquilino,
    })
  }

  await recalcularPromediosDemo()
  console.log('✅ 6 rentas finalizadas con evaluaciones de inmueble, propietario e inquilino')

  console.log('🎉 Seed completado exitosamente!')
  console.log('')
  console.log('📊 Resumen:')
  console.log('   - 6 usuarios de prueba confirmados con perfiles de inquilino y propietario/admin según corresponda')
  console.log('   - 9 inmuebles con fotos y reseñas')
  console.log('   - 1 solicitud + 1 visita agendada')
  console.log('   - 6 rentas finalizadas con 18 evaluaciones relacionadas')
  console.log('   - 1 reporte pendiente')
  console.log('   - 2 documentos pendientes de verificación')
  console.log('   - 2 notificaciones no leídas')
  console.log('   - 12 características')
  console.log('')
  console.log('🔑 Cuentas confirmadas en Supabase (contraseña: test123):')
  for (const cuenta of cuentasPrueba) {
    console.log(`   ${cuenta.correo}`)
  }
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })