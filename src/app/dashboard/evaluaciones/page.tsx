// Purpose: Pagina de Next.js para la ruta /dashboard/evaluaciones.
import Image from 'next/image'
import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Star } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import EvaluacionForm from './EvaluacionForm'

async function EvaluacionesContent() {
  const usuario = await getCurrentUser()
  if (!usuario) return null

  // Experiencias donde participa el usuario (como inquilino o propietario)
  const experiencias = await prisma.experienciaRenta.findMany({
    where: {
      OR: [
        { solicitud: { inquilino_id: usuario.id } },
        { solicitud: { publicacion: { inmueble: { propietario_id: usuario.id } } } },
      ],
    },
    include: {
      solicitud: {
        include: {
          publicacion: {
            include: {
              inmueble: true,
              fotos: { take: 1, orderBy: { orden: 'asc' } },
            },
          },
          inquilino: { include: { usuario: true } },
        },
      },
      evaluaciones: true,
    },
    orderBy: { fecha_inicio: 'desc' },
  })

  // Evaluaciones hechas por el usuario
  const evaluacionesHechas = await prisma.evaluacion.findMany({
    where: { usuario_evaluador_id: usuario.id },
    include: {
      experiencia: {
        include: {
          solicitud: {
            include: {
              publicacion: { include: { inmueble: true } },
            },
          },
        },
      },
    },
    orderBy: { fecha_evaluacion: 'desc' },
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-secondary font-medium hover:opacity-80 text-sm"
      >
        <ArrowLeft size={16} /> Volver al dashboard
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Star size={28} className="fill-rating-gold text-rating-gold" />
          Mis evaluaciones
        </h1>
        <p className="text-on-surface-variant mt-1">
          Califica tus rentas y consulta las evaluaciones que has hecho.
        </p>
      </div>

      {/* Rentas pendientes de calificar */}
      <div>
        <h2 className="text-xl font-bold text-primary mb-3">Rentas para calificar</h2>
        {experiencias.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <Star size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-on-surface-variant">
              Aún no tienes rentas concretadas para calificar
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {experiencias.map((exp) => {
              const esInquilino = exp.solicitud.inquilino_id === usuario.id
              const esPropietario = exp.solicitud.publicacion.inmueble.propietario_id === usuario.id
              const evaluacionesDeEsta = exp.evaluaciones.filter((e) => e.usuario_evaluador_id === usuario.id)

              return (
                <div key={exp.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={exp.solicitud.publicacion.fotos[0]?.ruta_archivo || ''}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-primary truncate">
                        {exp.solicitud.publicacion.inmueble.tipo_inmueble}
                      </h3>
                      <p className="text-xs text-on-surface-variant">
                        {exp.solicitud.publicacion.inmueble.direccion}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        {new Date(exp.fecha_inicio).toLocaleDateString('es-MX')} —{' '}
                        {exp.fecha_fin ? new Date(exp.fecha_fin).toLocaleDateString('es-MX') : 'activa'}
                      </p>

                      {esInquilino && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          <EvaluacionForm
                            experienciaId={exp.id}
                            tipo="inmueble"
                            titulo="Calificar inmueble"
                            yaEvaluado={evaluacionesDeEsta.some((e) => e.tipo_evaluacion === 'inmueble')}
                          />
                          <EvaluacionForm
                            experienciaId={exp.id}
                            tipo="propietario"
                            titulo={`Calificar a ${exp.solicitud.publicacion.inmueble.propietario_id === usuario.id ? 'ti' : 'propietario'}`}
                            yaEvaluado={evaluacionesDeEsta.some((e) => e.tipo_evaluacion === 'propietario')}
                          />
                        </div>
                      )}

                      {esPropietario && !esInquilino && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          <EvaluacionForm
                            experienciaId={exp.id}
                            tipo="inquilino"
                            titulo="Calificar inquilino"
                            yaEvaluado={evaluacionesDeEsta.some((e) => e.tipo_evaluacion === 'inquilino')}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Evaluaciones hechas */}
      <div>
        <h2 className="text-xl font-bold text-primary mb-3">Evaluaciones que he hecho</h2>
        {evaluacionesHechas.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <p className="text-on-surface-variant text-sm">
              Aún no has hecho ninguna evaluación
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {evaluacionesHechas.map((ev) => (
              <div key={ev.id} className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-on-surface-variant uppercase tracking-wider">
                  {ev.tipo_evaluacion === 'inmueble' ? 'Inmueble' : ev.tipo_evaluacion === 'propietario' ? 'Propietario' : 'Inquilino'}
                </p>
                <p className="font-semibold text-primary text-sm truncate">
                  {ev.experiencia.solicitud.publicacion.inmueble.tipo_inmueble}
                </p>
                <div className="flex text-rating-gold mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={i < Math.round(ev.calificacion) ? 'fill-rating-gold' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Promedio: {ev.calificacion.toFixed(2)} de 5
                </p>
                {ev.calificacion_atencion !== null && (
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Atención: {ev.calificacion_atencion}/5 · Mantenimiento: {ev.calificacion_mantenimiento}/5 · Cumplimiento: {ev.calificacion_cumplimiento}/5
                  </p>
                )}
                {ev.calificacion_puntualidad !== null && (
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Puntualidad: {ev.calificacion_puntualidad}/5 · Cuidado: {ev.calificacion_cuidado}/5 · Higiene: {ev.calificacion_higiene}/5
                  </p>
                )}
                {ev.comentario && (
                  <p className="text-xs text-on-surface-variant mt-2 italic">
                    &ldquo;{ev.comentario}&rdquo;
                  </p>
                )}
                <p className="text-[10px] text-on-surface-variant mt-2">
                  {new Date(ev.fecha_evaluacion).toLocaleDateString('es-MX')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function EvaluacionesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded w-64 animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
        </div>
      }
    >
      <EvaluacionesContent />
    </Suspense>
  )
}