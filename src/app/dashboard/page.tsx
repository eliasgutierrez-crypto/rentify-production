// Purpose: Pagina de Next.js para la ruta /dashboard.
import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Home,
  FileText,
  Plus,
  Eye,
  ShieldCheck,
  Calendar,
  Star,
  Bell,
  Pencil,
  Trash2,
} from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SolicitudRecibidaCard from './SolicitudRecibidaCard'
import { eliminarInmuebleAction } from '@/app/actions/inmuebles'
import { finalizarRentaAction } from '@/app/actions/solicitudes'
import { cancelarVisitaAction, completarVisitaAction } from '@/app/actions/visitas'
import CambiarEstadoInmuebleForm from './CambiarEstadoInmuebleForm'
import DisponibilidadVisitasForm from './DisponibilidadVisitasForm'

async function DashboardContent() {
  const usuario = await getCurrentUser()
  if (!usuario) return null

  const misNotificaciones = await prisma.notificacion.findMany({
    where: { usuario_id: usuario.id },
    select: { id: true, tipo: true, mensaje: true, fecha_creacion: true, estado: true },
    orderBy: { fecha_creacion: 'desc' },
    take: 5,
  })

  const misSolicitudes = usuario.inquilino
    ? await prisma.solicitudRenta.findMany({
        where: { inquilino_id: usuario.inquilino.usuario_id },
        include: {
          publicacion: {
            include: {
              inmueble: true,
              fotos: { take: 1, orderBy: { orden: 'asc' } },
            },
          },
          visitas: { orderBy: { fecha_hora: 'asc' } },
        },
        orderBy: { fecha_solicitud: 'desc' },
        take: 5,
      })
    : []

  const rentasActivas = usuario.propietario || usuario.inquilino
    ? await prisma.experienciaRenta.findMany({
        where: {
          estado: 'activa',
          OR: [
            ...(usuario.inquilino ? [{ solicitud: { inquilino_id: usuario.id } }] : []),
            ...(usuario.propietario
              ? [{
                  solicitud: {
                    publicacion: {
                      inmueble: { propietario_id: usuario.propietario.usuario_id },
                    },
                  },
                }]
              : []),
          ],
        },
        include: {
          solicitud: {
            include: {
              inquilino: { include: { usuario: true } },
              publicacion: {
                include: {
                  inmueble: {
                    include: { propietario: { include: { usuario: true } } },
                  },
                },
              },
            },
          },
        },
        orderBy: { fecha_inicio: 'desc' },
      })
    : []

  const misInmuebles = usuario.propietario
    ? await prisma.inmueble.findMany({
        where: {
          propietario_id: usuario.propietario.usuario_id,
          publicaciones: { none: { estado: 'eliminada' } },
        },
        include: {
          publicaciones: {
            include: {
              fotos: { take: 1, orderBy: { orden: 'asc' } },
              _count: { select: { solicitudes: true } },
            },
          },
        },
        orderBy: { id: 'desc' },
      })
    : []

  const solicitudesRecibidas = usuario.propietario
    ? await prisma.solicitudRenta.findMany({
        where: {
          publicacion: {
            inmueble: {
              propietario_id: usuario.propietario.usuario_id,
            },
          },
        },
        include: {
          inquilino: {
            include: {
              usuario: true,
              referencias: { orderBy: { fecha_creacion: 'desc' } },
            },
          },
          publicacion: {
            include: {
              inmueble: true,
              fotos: { take: 1, orderBy: { orden: 'asc' } },
            },
          },
        },
        orderBy: { fecha_solicitud: 'desc' },
      })
    : []

  const inquilinoIds = [...new Set(solicitudesRecibidas.map((solicitud) => solicitud.inquilino_id))]
  const experienciasPrevias = inquilinoIds.length
    ? await prisma.experienciaRenta.findMany({
        where: {
          solicitud: { inquilino_id: { in: inquilinoIds } },
        },
        include: {
          solicitud: {
            include: {
              publicacion: { include: { inmueble: true } },
            },
          },
          evaluaciones: true,
        },
        orderBy: { fecha_inicio: 'desc' },
      })
    : []

  const experienciasPorInquilino = new Map<
    number,
    { id: number; inmueble_tipo: string; calificacion: number; estado: string }[]
  >()
  for (const experiencia of experienciasPrevias) {
    const inquilinoId = experiencia.solicitud.inquilino_id
    const evaluacionesInquilino = experiencia.evaluaciones.filter(
      (evaluacion) => evaluacion.tipo_evaluacion === 'inquilino'
    )
    const calificacion =
      evaluacionesInquilino.length > 0
        ? Math.round(
            (evaluacionesInquilino.reduce(
              (total, evaluacion) => total + evaluacion.calificacion,
              0
            ) /
              evaluacionesInquilino.length) *
              10
          ) / 10
        : 0
    const historial = experienciasPorInquilino.get(inquilinoId) ?? []

    historial.push({
      id: experiencia.id,
      inmueble_tipo: experiencia.solicitud.publicacion.inmueble.tipo_inmueble,
      calificacion,
      estado: experiencia.estado,
    })
    experienciasPorInquilino.set(inquilinoId, historial)
  }

  const visitasRecibidas = usuario.propietario
    ? await prisma.visita.findMany({
        where: {
          solicitud: {
            publicacion: {
              inmueble: {
                propietario_id: usuario.propietario.usuario_id,
              },
            },
          },
        },
        include: {
          solicitud: {
            include: {
              inquilino: { include: { usuario: true } },
              publicacion: { include: { inmueble: true } },
            },
          },
        },
        orderBy: { fecha_hora: 'asc' },
      })
    : []

  let statsAdmin = { usuarios: 0, inmuebles: 0, verificaciones: 0, reportes: 0 }
  if (usuario.administrador) {
    const [usuarios, inmuebles, verificaciones, reportes] = await Promise.all([
      prisma.usuario.count(),
      prisma.inmueble.count(),
      prisma.documento.count({ where: { estado: 'pendiente' } }),
      prisma.reporte.count({ where: { estado: 'pendiente' } }),
    ])
    statsAdmin = { usuarios, inmuebles, verificaciones, reportes }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">
          Hola, {usuario.nombre} 👋
        </h1>
        <p className="text-on-surface-variant mt-2">
          {usuario.administrador
            ? 'Panel de administración'
            : usuario.propietario
            ? 'Administra tus propiedades y solicitudes'
            : 'Explora propiedades y gestiona tus rentas'}
        </p>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/propiedades"
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Eye size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="font-bold text-primary">Buscar propiedades</p>
            <p className="text-sm text-on-surface-variant">Explora rentas disponibles</p>
          </div>
        </Link>

        <Link
          href="/dashboard/publicar"
          className="bg-primary text-white rounded-xl p-6 shadow-sm hover:shadow-md hover:bg-secondary transition flex items-center gap-4 text-left"
        >
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Plus size={24} className="text-white" />
          </div>
          <div>
            <p className="font-bold">Publicar propiedad</p>
            <p className="text-sm text-white/80">Sube tu primer inmueble</p>
          </div>
        </Link>

        <Link
          href="/dashboard/evaluaciones"
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <Star size={24} className="text-rating-gold fill-rating-gold" />
          </div>
          <div>
            <p className="font-bold text-primary">Mis evaluaciones</p>
            <p className="text-sm text-on-surface-variant">Califica tus rentas</p>
          </div>
        </Link>
      </div>

      <section aria-labelledby="notificaciones-heading" className="rounded-xl bg-white p-5 shadow-sm">
        <h2 id="notificaciones-heading" className="mb-3 flex items-center gap-2 text-lg font-bold text-primary">
          <Bell size={20} /> Notificaciones recientes
        </h2>
        {misNotificaciones.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Aún no tienes notificaciones.</p>
        ) : (
          <ul className="space-y-3">
            {misNotificaciones.map((notificacion) => (
              <li key={notificacion.id} className="border-b border-surface-container pb-3 last:border-0 last:pb-0">
                <p className="text-sm text-on-surface">{notificacion.mensaje}</p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {new Date(notificacion.fecha_creacion).toLocaleString('es-MX')} · {notificacion.estado === 'no_leida' ? 'No leída' : notificacion.estado}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Panel Admin */}
      {usuario.administrador && (
        <div>
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <ShieldCheck size={22} /> Panel de administración
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-on-surface-variant">Usuarios</p>
              <p className="text-2xl font-bold text-primary">{statsAdmin.usuarios}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-on-surface-variant">Inmuebles</p>
              <p className="text-2xl font-bold text-primary">{statsAdmin.inmuebles}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-on-surface-variant">Verificaciones</p>
              <p className="text-2xl font-bold text-yellow-600">{statsAdmin.verificaciones}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-on-surface-variant">Reportes</p>
              <p className="text-2xl font-bold text-red-600">{statsAdmin.reportes}</p>
            </div>
          </div>
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-secondary transition font-semibold text-sm"
          >
            <ShieldCheck size={18} /> Ir al panel de administración
          </Link>
        </div>
      )}

      {/* Mis inmuebles */}
      {usuario.propietario && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <Home size={22} /> Mis inmuebles
            </h2>
            <span className="text-sm text-on-surface-variant">
              {misInmuebles.length} inmueble{misInmuebles.length !== 1 && 's'}
            </span>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ['Disponibles', misInmuebles.filter((inmueble) => inmueble.estado_inventario === 'disponible').length],
              ['En negociación', misInmuebles.filter((inmueble) => inmueble.estado_inventario === 'en_negociacion').length],
              ['Rentados', misInmuebles.filter((inmueble) => inmueble.estado_inventario === 'rentado').length],
              ['Visitas recibidas', visitasRecibidas.length],
            ].map(([label, total]) => (
              <div key={label} className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs text-on-surface-variant">{label}</p>
                <p className="mt-1 text-2xl font-bold text-primary">{total}</p>
              </div>
            ))}
          </div>

          {misInmuebles.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <Home size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-on-surface-variant">Aún no has publicado inmuebles</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {misInmuebles.map((inm) => (
                <div key={inm.id} className="bg-white rounded-xl overflow-hidden shadow-sm flex flex-col">
                  {inm.publicaciones[0]?.fotos[0] && (
                    <Image
                      src={inm.publicaciones[0].fotos[0].ruta_archivo}
                      alt={inm.tipo_inmueble}
                      width={480}
                      height={144}
                      unoptimized
                      className="w-full h-36 object-cover"
                    />
                  )}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-primary text-sm">
                        {inm.tipo_inmueble}
                      </h3>
                    </div>
                    <p className="text-xs text-on-surface-variant truncate">{inm.direccion}</p>
                    {inm.publicaciones[0] && (
                      <>
                        <p className="text-sm font-semibold text-secondary mt-2">
                          ${inm.publicaciones[0].precio_renta.toLocaleString('en-US')} MXN
                        </p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          Publicación:{' '}
                          {inm.publicaciones[0].estado === 'pendiente_revision'
                            ? 'Pendiente de revisión'
                            : inm.publicaciones[0].estado === 'rechazada'
                              ? 'Rechazada'
                              : inm.publicaciones[0].estado === 'suspendida'
                                ? 'Suspendida'
                                : inm.publicaciones[0].estado === 'eliminada'
                                  ? 'Retirada'
                                  : 'Activa'}
                        </p>
                        {inm.publicaciones[0].motivo_rechazo && (
                          <p className="mt-1 text-xs text-red-700">
                            Motivo: {inm.publicaciones[0].motivo_rechazo}
                          </p>
                        )}
                      </>
                    )}

                    <CambiarEstadoInmuebleForm
                      inmuebleId={inm.id}
                      estadoActual={inm.estado_inventario}
                    />
                    <DisponibilidadVisitasForm
                      inmuebleId={inm.id}
                      disponibilidadGuardada={inm.disponibilidad_visitas}
                    />

                    {/* Acciones */}
                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/dashboard/editar-propiedad/${inm.id}`}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-surface-canvas hover:bg-surface-container text-xs font-semibold text-primary transition"
                      >
                        <Pencil size={12} /> Editar
                      </Link>
                      <form action={eliminarInmuebleAction}>
                        <input type="hidden" name="inmueble_id" value={inm.id} />
                        <button
                          type="submit"
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Solicitudes recibidas */}
      {usuario.propietario && solicitudesRecibidas.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <FileText size={22} /> Solicitudes recibidas
            <span className="text-sm font-normal text-on-surface-variant">
              ({solicitudesRecibidas.filter((s) => s.estado === 'pendiente').length} pendientes)
            </span>
          </h2>
          <div className="space-y-3">
            {solicitudesRecibidas.map((sol) => (
              <SolicitudRecibidaCard
                key={sol.id}
                solicitud={{
                  id: sol.id,
                  estado: sol.estado,
                  mensaje: sol.mensaje,
                  fecha_solicitud: sol.fecha_solicitud,
                  inquilino_nombre: sol.inquilino.usuario.nombre,
                  inquilino_apellido: sol.inquilino.usuario.apellido,
                  inmueble_tipo: sol.publicacion.inmueble.tipo_inmueble,
                  inmueble_direccion: sol.publicacion.inmueble.direccion,
                  imagen:
                    sol.publicacion.fotos[0]?.ruta_archivo ||
                    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
                  historial: {
                    verificado: sol.inquilino.estado_verificacion === 'verificado',
                    calificacion_promedio: sol.inquilino.usuario.calificacion_promedio_como_inquilino,
                    total_evaluaciones: sol.inquilino.usuario.total_evaluaciones_como_inquilino,
                    referencias: sol.inquilino.referencias.map((referencia) => ({
                      id: referencia.id,
                      nombre_contacto: referencia.nombre_contacto,
                      telefono: referencia.telefono,
                      relacion: referencia.relacion,
                      comentario: referencia.comentario,
                    })),
                    experiencias:
                      experienciasPorInquilino.get(sol.inquilino_id) ?? [],
                  },
                  ...(sol.estado === 'aprobada'
                    ? {
                        inquilino_correo: sol.inquilino.usuario.correo,
                        inquilino_telefono: sol.inquilino.usuario.telefono,
                      }
                    : {}),
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Visitas agendadas */}
      {usuario.propietario && visitasRecibidas.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <Calendar size={22} /> Visitas agendadas
            <span className="text-sm font-normal text-on-surface-variant">
              ({visitasRecibidas.filter((v) => v.estado === 'agendada').length} pendientes)
            </span>
          </h2>
          <div className="space-y-3">
            {visitasRecibidas.map((visita) => (
              <div
                key={visita.id}
                className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-lg bg-surface-container flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xs text-on-surface-variant">
                    {new Date(visita.fecha_hora).toLocaleDateString('es-MX', { month: 'short' })}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {new Date(visita.fecha_hora).getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-primary text-sm truncate">
                    {visita.solicitud.publicacion.inmueble.tipo_inmueble}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {visita.solicitud.inquilino.usuario.nombre}{' '}
                    {visita.solicitud.inquilino.usuario.apellido} ·{' '}
                    {new Date(visita.fecha_hora).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Modalidad: <span className="capitalize">{visita.modalidad}</span>
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    visita.estado === 'agendada'
                      ? 'bg-yellow-100 text-yellow-700'
                      : visita.estado === 'completada'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {visita.estado}
                </span>
                {visita.estado === 'agendada' && (
                  <div className="flex flex-col gap-1">
                    {visita.fecha_hora <= new Date() && (
                      <form action={completarVisitaAction}>
                        <input type="hidden" name="visita_id" value={visita.id} />
                        <button className="rounded bg-green-700 px-2 py-1 text-xs text-white">
                          Completar
                        </button>
                      </form>
                    )}
                    {visita.fecha_hora > new Date() && (
                      <form action={cancelarVisitaAction}>
                        <input type="hidden" name="visita_id" value={visita.id} />
                        <input type="hidden" name="motivo" value="Cancelada por el propietario" />
                        <button className="rounded bg-red-50 px-2 py-1 text-xs text-red-700">
                          Cancelar
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mis solicitudes */}
      {usuario.inquilino && (
        <div>
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <FileText size={22} /> Mis solicitudes
          </h2>

          {misSolicitudes.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <FileText size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-on-surface-variant mb-3">
                Aún no has solicitado ninguna propiedad
              </p>
              <Link
                href="/propiedades"
                className="inline-block bg-primary text-white px-4 py-2 rounded-lg text-sm"
              >
                Explorar propiedades
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {misSolicitudes.map((sol) => (
                <div key={sol.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                  {sol.publicacion.fotos[0] && (
                    <Image
                      src={sol.publicacion.fotos[0].ruta_archivo}
                      alt=""
                      width={64}
                      height={64}
                      unoptimized
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-primary text-sm truncate">
                      {sol.publicacion.inmueble.tipo_inmueble}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {sol.publicacion.inmueble.direccion}
                    </p>
                    {sol.visitas.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {sol.visitas.map((visita) => (
                          <div key={visita.id} className="flex flex-wrap items-center gap-2 text-xs">
                            <span>
                              Visita {visita.estado} · {new Date(visita.fecha_hora).toLocaleString('es-MX')}
                            </span>
                            {visita.estado === 'agendada' && visita.fecha_hora > new Date() && (
                              <form action={cancelarVisitaAction}>
                                <input type="hidden" name="visita_id" value={visita.id} />
                                <input type="hidden" name="motivo" value="Cancelada por el inquilino" />
                                <button className="text-red-700 underline">Cancelar</button>
                              </form>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      sol.estado === 'pendiente'
                        ? 'bg-yellow-100 text-yellow-700'
                        : sol.estado === 'aprobada'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {sol.estado}
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {rentasActivas.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-primary">Rentas activas</h2>
          <div className="space-y-3">
            {rentasActivas.map((renta) => {
              const esPropietario = renta.solicitud.publicacion.inmueble.propietario_id === usuario.id
              const contraparte = esPropietario
                ? `${renta.solicitud.inquilino.usuario.nombre} ${renta.solicitud.inquilino.usuario.apellido}`
                : `${renta.solicitud.publicacion.inmueble.propietario.usuario.nombre} ${renta.solicitud.publicacion.inmueble.propietario.usuario.apellido}`

              return (
                <div key={renta.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm">
                  <div>
                    <p className="font-semibold text-primary">
                      {renta.solicitud.publicacion.inmueble.tipo_inmueble} · {contraparte}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Inicio: {new Date(renta.fecha_inicio).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  {esPropietario && (
                    <form action={finalizarRentaAction}>
                      <input type="hidden" name="experiencia_id" value={renta.id} />
                      <button className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white">
                        Finalizar renta
                      </button>
                    </form>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {!usuario.propietario && !usuario.inquilino && !usuario.administrador && (
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <p className="text-on-surface-variant mb-2">Aún no tienes actividad en Rentify</p>
          <p className="text-sm text-on-surface-variant">
            Explora propiedades o publica tu primer inmueble para comenzar
          </p>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded w-64 animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}