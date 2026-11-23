// Purpose: Presenta documentos privados para revision administrativa.
'use client'

import { useState } from 'react'
import { FileText, Eye, CheckCircle2, XCircle, User, Calendar } from 'lucide-react'
import { aprobarDocumentoAction, rechazarDocumentoAction } from '@/app/actions/admin'
import { formatearFecha } from '@/lib/formato'

export interface DocumentoAdmin {
  id: number
  tipo_documento: string
  ruta_archivo: string
  fecha_carga: Date
  estado: string
  motivo_rechazo: string | null
  usuario: {
    nombre: string
    apellido: string
    correo: string
    propietario: { estado_verificacion: string } | null
    inquilino: { estado_verificacion: string } | null
  } | null
  inmueble: {
    tipo_inmueble: string
    direccion: string
  } | null
}

export default function TabVerificaciones({ documentos }: { documentos: DocumentoAdmin[] }) {
  const [modalRechazar, setModalRechazar] = useState<number | null>(null)
  const [motivo, setMotivo] = useState('')

  const pendientes = documentos.filter((d) => d.estado === 'pendiente')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-primary">
          Documentos pendientes de verificación
        </h3>
        <span className="text-xs text-on-surface-variant">
          {pendientes.length} pendientes de {documentos.length} totales
        </span>
      </div>

      {documentos.length === 0 ? (
        <div className="text-center py-12 text-on-surface-variant">
          No hay documentos pendientes
        </div>
      ) : (
        <div className="space-y-3">
          {documentos.map((doc) => (
            <div
              key={doc.id}
              className="border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row gap-4 hover:shadow-sm transition"
            >
              <div className="w-16 h-16 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                <FileText size={28} className="text-secondary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-primary">
                      {doc.tipo_documento}
                    </h3>
                    {doc.usuario && (
                      <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <User size={12} /> {doc.usuario.nombre} {doc.usuario.apellido} ·{' '}
                        {doc.usuario.correo}
                      </p>
                    )}
                    {doc.inmueble && (
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Inmueble: {doc.inmueble.tipo_inmueble}
                      </p>
                    )}
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                      <Calendar size={12} />{' '}
                      {formatearFecha(doc.fecha_carga)}
                    </p>
                    {doc.usuario?.propietario && (
                      <p className="text-[11px] text-on-surface-variant mt-1">
                        Rol: Propietario ({doc.usuario.propietario.estado_verificacion})
                      </p>
                    )}
                    {doc.usuario?.inquilino && (
                      <p className="text-[11px] text-on-surface-variant mt-1">
                        Rol: Inquilino ({doc.usuario.inquilino.estado_verificacion})
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${
                      doc.estado === 'aprobado'
                        ? 'bg-green-100 text-green-700'
                        : doc.estado === 'rechazado'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {doc.estado}
                  </span>
                </div>

                {doc.motivo_rechazo && (
                  <p className="text-xs text-red-600 mt-2 bg-red-50 px-2 py-1 rounded">
                    Motivo: {doc.motivo_rechazo}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  <a
                    href={doc.ruta_archivo}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-canvas hover:bg-surface-container text-xs font-semibold text-primary transition"
                  >
                    <Eye size={12} /> Ver documento
                  </a>

                  {doc.estado === 'pendiente' && (
                    <>
                      <form action={aprobarDocumentoAction}>
                        <input type="hidden" name="documento_id" value={doc.id} />
                        <button
                          type="submit"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition"
                        >
                          <CheckCircle2 size={12} /> Aprobar
                        </button>
                      </form>

                      <button
                        onClick={() => setModalRechazar(doc.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition"
                      >
                        <XCircle size={12} /> Rechazar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
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
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-primary mb-2">
              Rechazar documento
            </h3>
            <p className="text-sm text-on-surface-variant mb-4">
              Indica el motivo del rechazo. Se notificará al usuario para que suba uno nuevo.
            </p>
            <form
              action={(formData) => {
                rechazarDocumentoAction(formData)
                setModalRechazar(null)
                setMotivo('')
              }}
              className="space-y-4"
            >
              <input type="hidden" name="documento_id" value={modalRechazar} />
              <textarea
                name="motivo"
                required
                rows={3}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Documento borroso, información incompleta, no coincide con el usuario..."
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