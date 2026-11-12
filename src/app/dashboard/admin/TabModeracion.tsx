// Purpose: Lista publicaciones para las acciones de moderacion administrativa.
'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Eye, Ban, CheckCircle2, XCircle, MapPin, User, Calendar } from 'lucide-react'
import {
  aprobarPublicacionAction,
  suspenderPublicacionAction,
  reactivarPublicacionAction,
  eliminarPublicacionAction,
  rechazarPublicacionAction,
} from '@/app/actions/admin'

export interface PublicacionAdmin {
  id: number
  precio_renta: number
  descripcion: string
  estado: string
  fecha_publicacion: Date
  motivo_suspension: string | null
  motivo_rechazo: string | null
  total_resenas: number
  inmueble: {
    tipo_inmueble: string
    direccion: string
    propietario: {
      usuario: {
        nombre: string
        apellido: string
        correo: string
      }
    }
  }
  fotos: { ruta_archivo: string }[]
  _count: { reportes: number }
}

const filtros = [
  { value: 'todas', label: 'Todas' },
  { value: 'pendiente_revision', label: 'Pendientes' },
  { value: 'rechazada', label: 'Rechazadas' },
  { value: 'activa', label: 'Activas' },
  { value: 'suspendida', label: 'Suspendidas' },
  { value: 'eliminada', label: 'Eliminadas' },
] as const

type Filtro = (typeof filtros)[number]['value']

export default function TabModeracion({ publicaciones }: { publicaciones: PublicacionAdmin[] }) {
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [modalSuspender, setModalSuspender] = useState<number | null>(null)
  const [modalRechazar, setModalRechazar] = useState<number | null>(null)
  const [motivo, setMotivo] = useState('')

  const filtradas = publicaciones.filter((p) =>
    filtro === 'todas' ? true : p.estado === filtro
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {filtros.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filtro === f.value
                ? 'bg-primary text-white'
                : 'bg-surface-canvas text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="text-xs text-on-surface-variant ml-auto">
          {filtradas.length} publicaciones
        </span>
      </div>

      {filtradas.length === 0 ? (
        <div className="text-center py-12 text-on-surface-variant">
          No hay publicaciones con este filtro
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((pub) => (
            <div
              key={pub.id}
              className="border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row gap-4 hover:shadow-sm transition"
            >
              <div className="w-full sm:w-32 h-24 rounded-lg overflow-hidden bg-surface-canvas flex-shrink-0 relative">
                {pub.fotos[0] ? (
                  <Image
                    src={pub.fotos[0].ruta_archivo}
                    alt={pub.inmueble.tipo_inmueble}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 128px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    Sin foto
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-primary truncate">
                      {pub.inmueble.tipo_inmueble}
                    </h3>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                      <MapPin size={12} /> {pub.inmueble.direccion}
                    </p>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                      <User size={12} /> {pub.inmueble.propietario.usuario.nombre}{' '}
                      {pub.inmueble.propietario.usuario.apellido}
                    </p>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                      <Calendar size={12} />{' '}
                      {new Date(pub.fecha_publicacion).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
<p className="text-sm font-bold text-primary">
  ${pub.precio_renta.toLocaleString('en-US')}
</p>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${
                        pub.estado === 'activa'
                          ? 'bg-green-100 text-green-700'
                          : pub.estado === 'pendiente_revision'
                          ? 'bg-yellow-100 text-yellow-700'
                          : pub.estado === 'rechazada' || pub.estado === 'suspendida'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {pub.estado}
                    </span>
                    {pub._count.reportes > 0 && (
                      <p className="text-[10px] text-red-600 mt-1">
                        {pub._count.reportes} reporte(s)
                      </p>
                    )}
                  </div>
                </div>

                {pub.motivo_suspension && (
                  <p className="text-xs text-red-600 mt-2 bg-red-50 px-2 py-1 rounded">
                    Suspensión: {pub.motivo_suspension}
                  </p>
                )}
                {pub.motivo_rechazo && (
                  <p className="text-xs text-red-600 mt-2 bg-red-50 px-2 py-1 rounded">
                    Motivo del rechazo: {pub.motivo_rechazo}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  <a
                    href={`/propiedad/${pub.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-canvas hover:bg-surface-container text-xs font-semibold text-primary transition"
                  >
                    <Eye size={12} /> Ver
                  </a>

                  {pub.estado === 'pendiente_revision' && (
                    <>
                      <form action={aprobarPublicacionAction}>
                        <input type="hidden" name="publicacion_id" value={pub.id} />
                        <button
                          type="submit"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition"
                        >
                          <CheckCircle2 size={12} /> Aprobar
                        </button>
                      </form>
                      <button
                        onClick={() => {
                          setModalRechazar(pub.id)
                          setMotivo('')
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition"
                      >
                        <XCircle size={12} /> Rechazar
                      </button>
                    </>
                  )}

                  {pub.estado === 'activa' && (
                    <button
                      onClick={() => setModalSuspender(pub.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition"
                    >
                      <Ban size={12} /> Suspender
                    </button>
                  )}

                  {pub.estado === 'suspendida' && (
                    <form action={reactivarPublicacionAction}>
                      <input type="hidden" name="publicacion_id" value={pub.id} />
                      <button
                        type="submit"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition"
                      >
                        <CheckCircle2 size={12} /> Reactivar
                      </button>
                    </form>
                  )}

                  {pub.estado !== 'eliminada' && (
                    <form action={eliminarPublicacionAction}>
                      <input type="hidden" name="publicacion_id" value={pub.id} />
                      <button
                        type="submit"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold transition"
                      >
                        <XCircle size={12} /> Eliminar
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalSuspender && (
        <div
          className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setModalSuspender(null)
            setMotivo('')
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-primary mb-2">
              Suspender publicación
            </h3>
            <p className="text-sm text-on-surface-variant mb-4">
              Indica el motivo de la suspensión. Se notificará al propietario.
            </p>
            <form
              action={(formData) => {
                suspenderPublicacionAction(formData)
                setModalSuspender(null)
                setMotivo('')
              }}
              className="space-y-4"
            >
              <input type="hidden" name="publicacion_id" value={modalSuspender} />
              <textarea
                name="motivo"
                required
                rows={3}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Fotos no coinciden con la propiedad, contenido discriminatorio, precio engañoso..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary outline-none text-sm resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalSuspender(null)
                    setMotivo('')
                  }}
                  className="flex-1 border-2 border-gray-200 text-on-surface-variant py-2 rounded-lg hover:bg-gray-50 font-semibold text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!motivo.trim()}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-semibold text-sm disabled:opacity-50"
                >
                  Suspender
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalRechazar && (
        <div
          className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setModalRechazar(null)
            setMotivo('')
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-primary mb-2">Rechazar publicación</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              Explica los cambios necesarios. El propietario podrá editarla y volver a enviarla.
            </p>
            <form
              action={async (formData) => {
                await rechazarPublicacionAction(formData)
                setModalRechazar(null)
                setMotivo('')
              }}
              className="space-y-4"
            >
              <input type="hidden" name="publicacion_id" value={modalRechazar} />
              <textarea
                name="motivo"
                required
                rows={3}
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
                placeholder="Indica qué información debe corregirse."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary outline-none text-sm resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalRechazar(null)
                    setMotivo('')
                  }}
                  className="flex-1 border-2 border-gray-200 text-on-surface-variant py-2 rounded-lg hover:bg-gray-50 font-semibold text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!motivo.trim()}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-semibold text-sm disabled:opacity-50"
                >
                  Rechazar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}