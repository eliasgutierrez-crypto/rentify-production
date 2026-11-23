// Purpose: Presenta reportes y controles para resolverlos.
'use client'

import { useState } from 'react'
import type { Prisma } from '@prisma/client'
import {
  AlertTriangle,
  CheckCircle2,
  Ban,
  Eye,
  User,
  Calendar,
  FileText,
} from 'lucide-react'
import {
  resolverReporteAction,
  descartarReporteAction,
} from '@/app/actions/admin'
import { formatearFecha } from '@/lib/formato'

export type ReporteAdmin = Prisma.ReporteGetPayload<{
  include: {
    usuario: true
    publicacion: {
      include: {
        inmueble: { include: { propietario: { include: { usuario: true } } } }
      }
    }
  }
}>

export default function TabReportes({ reportes }: { reportes: ReporteAdmin[] }) {
  const [modalResolver, setModalResolver] = useState<number | null>(null)
  const [accion, setAccion] = useState<'suspender_publicacion' | 'bloquear_usuario' | 'solo_resolver'>('solo_resolver')
  const [observaciones, setObservaciones] = useState('')

  // El contador distingue los casos pendientes aunque el historial siga visible.
  const pendientes = reportes.filter((r) => r.estado === 'pendiente')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-primary flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-600" />
          Reportes de usuarios
        </h3>
        <span className="text-xs text-on-surface-variant">
          {pendientes.length} pendientes de {reportes.length} totales
        </span>
      </div>

      {reportes.length === 0 ? (
        <div className="text-center py-12 text-on-surface-variant">
          No hay reportes
        </div>
      ) : (
        <div className="space-y-3">
          {reportes.map((rep) => (
            <div
              key={rep.id}
              className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-primary">
                    {rep.motivo}
                  </h4>
                  {rep.descripcion && (
                    <p className="text-sm text-on-surface-variant mt-1">
                      &quot;{rep.descripcion}&quot;
                    </p>
                  )}
                  <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-2">
                    <User size={12} /> Reportado por: {rep.usuario.nombre}{' '}
                    {rep.usuario.apellido} · {rep.usuario.correo}
                  </p>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                    <FileText size={12} /> Publicación: {rep.publicacion.inmueble.tipo_inmueble} ·{' '}
                    {rep.publicacion.inmueble.direccion}
                  </p>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                    <Calendar size={12} />{' '}
                    {formatearFecha(rep.fecha_reporte)}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${
                    rep.estado === 'pendiente'
                      ? 'bg-yellow-100 text-yellow-700'
                      : rep.estado === 'resuelto'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {rep.estado}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <a
                  href={`/propiedad/${rep.publicacion.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-canvas hover:bg-surface-container text-xs font-semibold text-primary transition"
                >
                  <Eye size={12} /> Ver publicación
                </a>

                {rep.estado === 'pendiente' && (
                  <>
                    <button
                      onClick={() => setModalResolver(rep.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition"
                    >
                      <CheckCircle2 size={12} /> Resolver
                    </button>
                    <form action={descartarReporteAction}>
                      <input type="hidden" name="reporte_id" value={rep.id} />
                      <button
                        type="submit"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold transition"
                      >
                        <Ban size={12} /> Descartar
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de resolver */}
      {modalResolver && (
        <div
          className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setModalResolver(null)
            setObservaciones('')
            setAccion('solo_resolver')
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-primary mb-2">
              Resolver reporte
            </h3>
            <p className="text-sm text-on-surface-variant mb-4">
              Selecciona la acción a tomar con respecto a este reporte.
            </p>
            <form
              action={async (formData) => {
                await resolverReporteAction(formData)
                setModalResolver(null)
                setObservaciones('')
                setAccion('solo_resolver')
              }}
              className="space-y-4"
            >
              <input type="hidden" name="reporte_id" value={modalResolver} />
              <input type="hidden" name="accion" value={accion} />
              <input type="hidden" name="observaciones" value={observaciones} />

              <div className="space-y-2">
                <label className="flex items-start gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    checked={accion === 'solo_resolver'}
                    onChange={() => setAccion('solo_resolver')}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-semibold text-primary">Solo resolver</p>
                    <p className="text-xs text-on-surface-variant">
                      Marcar como resuelto sin tomar acción adicional
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    checked={accion === 'suspender_publicacion'}
                    onChange={() => setAccion('suspender_publicacion')}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-semibold text-primary">Suspender publicación</p>
                    <p className="text-xs text-on-surface-variant">
                      La publicación se oculta y el propietario es notificado
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    checked={accion === 'bloquear_usuario'}
                    onChange={() => setAccion('bloquear_usuario')}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-semibold text-primary">Bloquear usuario</p>
                    <p className="text-xs text-on-surface-variant">
                      El propietario no podrá iniciar sesión después de cerrar su sesión actual
                    </p>
                  </div>
                </label>
              </div>

              <textarea
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Observaciones (opcional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary outline-none text-sm resize-none"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalResolver(null)
                    setObservaciones('')
                    setAccion('solo_resolver')
                  }}
                  className="flex-1 border-2 border-gray-200 text-on-surface-variant py-2 rounded-lg hover:bg-gray-50 font-semibold text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold text-sm"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}