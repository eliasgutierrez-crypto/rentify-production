// Purpose: Resume una solicitud recibida y el historial de su solicitante.
'use client'

import Image from 'next/image'
import { useTransition } from 'react'
import { Check, X, Clock } from 'lucide-react'
import {
  aprobarSolicitudAction,
  rechazarSolicitudAction,
} from '@/app/actions/solicitudes'
import HistorialSolicitante from '@/components/dashboard/HistorialSolicitante'

interface Props {
  solicitud: {
    id: number
    estado: string
    mensaje: string | null
    fecha_solicitud: Date
    inquilino_nombre: string
    inquilino_apellido: string
    inquilino_correo?: string
    inquilino_telefono?: string | null
    inmueble_tipo: string
    inmueble_direccion: string
    imagen: string
    historial: {
      verificado: boolean
      calificacion_promedio: number
      total_evaluaciones: number
      referencias: {
        id: number
        nombre_contacto: string
        telefono: string
        relacion: string
        comentario: string | null
      }[]
      experiencias: {
        id: number
        inmueble_tipo: string
        calificacion: number
        estado: string
      }[]
    }
  }
}

export default function SolicitudRecibidaCard({ solicitud }: Props) {
  const [isPending, startTransition] = useTransition()

  const handleAprobar = () => {
    const formData = new FormData()
    formData.set('solicitud_id', String(solicitud.id))
    startTransition(() => {
      aprobarSolicitudAction(formData)
    })
  }

  const handleRechazar = () => {
    const formData = new FormData()
    formData.set('solicitud_id', String(solicitud.id))
    startTransition(() => {
      rechazarSolicitudAction(formData)
    })
  }

  const estadoColor =
    solicitud.estado === 'pendiente'
      ? 'bg-yellow-100 text-yellow-700'
      : solicitud.estado === 'aprobada'
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700'

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-start gap-4">
      <div className="relative w-full md:w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
        <Image
          src={solicitud.imagen}
          alt={solicitud.inmueble_tipo}
          fill
          unoptimized
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 96px"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-[#1F1F1F]">
            {solicitud.inmueble_tipo}
          </p>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor}`}>
            {solicitud.estado}
          </span>
        </div>
        <p className="text-xs text-gray-500 truncate">
          {solicitud.inmueble_direccion}
        </p>
        <p className="text-sm text-gray-700 mt-2">
          <strong>Solicita:</strong> {solicitud.inquilino_nombre}{' '}
          {solicitud.inquilino_apellido}
        </p>
        {solicitud.mensaje && (
          <p className="text-sm text-gray-500 mt-1 italic">
            &quot;{solicitud.mensaje}&quot;
          </p>
        )}
        {solicitud.estado === 'aprobada' && (
          <div className="mt-2 text-sm text-secondary">
            <p>Contacto del inquilino</p>
            {solicitud.inquilino_correo && (
              <a className="block underline" href={`mailto:${solicitud.inquilino_correo}`}>
              {solicitud.inquilino_correo}
              </a>
            )}
            {solicitud.inquilino_telefono && (
              <a className="block underline" href={`tel:${solicitud.inquilino_telefono}`}>
                {solicitud.inquilino_telefono}
              </a>
            )}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <Clock size={12} />
          {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>

        {/* 🔹 RF05: Historial del solicitante */}
        <HistorialSolicitante historial={solicitud.historial} />
      </div>

      {solicitud.estado === 'pendiente' && (
        <div className="flex gap-2 md:flex-col flex-shrink-0">
          <button
            onClick={handleAprobar}
            disabled={isPending}
            className="flex-1 md:w-32 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-1"
          >
            <Check size={16} /> Aprobar
          </button>
          <button
            onClick={handleRechazar}
            disabled={isPending}
            className="flex-1 md:w-32 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-1"
          >
            <X size={16} /> Rechazar
          </button>
        </div>
      )}
    </div>
  )
}