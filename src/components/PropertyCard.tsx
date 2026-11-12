// Purpose: Componente reutilizable de interfaz. Resume una propiedad en listados y enlaza a su ficha detallada.
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Star, Heart, CheckCircle2 } from 'lucide-react'

export interface PropertyProps {
  id: number
  titulo: string
  ubicacion: string
  precio: number
  habitaciones: number
  banos: number
  metros: number
  imagen: string
  tipo: string
  verificada: boolean
  calificacion_promedio: number
  total_evaluaciones: number
  permite_mascotas?: boolean
  permite_ninos?: boolean
}

interface Props {
  property: PropertyProps
}

export default function PropertyCard({ property }: Props) {
  return (
    <div className="group bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      <div>
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-surface-container">
          <Image
            src={property.imagen}
            alt={property.titulo}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="absolute top-2 left-2 inline-flex items-center gap-1 bg-white/90 backdrop-blur-md px-2 py-1 rounded-full shadow-sm">
            <CheckCircle2 size={14} className={property.verificada ? 'text-status-success' : 'text-yellow-600'} />
            <span className="text-[11px] font-bold text-primary">
              {property.verificada ? 'Propiedad y propietario verificados' : 'Verificación pendiente'}
            </span>
          </div>
          <button
            aria-label="Guardar en favoritos"
            className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-on-surface hover:scale-110 transition-all shadow-sm"
          >
            <Heart size={16} className="text-on-surface-variant" />
          </button>
        </div>

        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <p className="text-[11px] font-semibold text-secondary uppercase">
              {property.tipo}
            </p>
            <h3 className="text-base font-semibold text-on-surface group-hover:text-secondary transition-colors">
              {property.titulo}
            </h3>
          </div>
          <div className="flex items-center gap-0.5 text-on-surface font-semibold text-sm">
            <Star size={14} className="text-rating-gold fill-rating-gold" />
            <span>
              {property.total_evaluaciones > 0
                ? property.calificacion_promedio.toFixed(1)
                : 'Nuevo'}
            </span>
          </div>
        </div>

        <p className="text-xs text-on-surface-variant flex items-center gap-1 mb-4">
          <MapPin size={12} />
          {property.ubicacion}
        </p>

        <div className="grid grid-cols-3 gap-1 py-2 px-3 rounded-xl bg-surface-canvas text-center mb-4">
          <div>
            <span className="block text-sm font-bold text-primary">{property.habitaciones}</span>
            <span className="text-[11px] text-on-surface-variant">Recámaras</span>
          </div>
          <div>
            <span className="block text-sm font-bold text-primary">{property.banos}</span>
            <span className="text-[11px] text-on-surface-variant">Baños</span>
          </div>
          <div>
            <span className="block text-sm font-bold text-primary">{property.metros}</span>
            <span className="text-[11px] text-on-surface-variant">m² const.</span>
          </div>
        </div>
        <p className="mb-3 text-xs text-on-surface-variant">
          Mascotas: {property.permite_mascotas ? 'sí' : 'no'} · Niños: {property.permite_ninos ? 'sí' : 'no'}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div>
          <span className="text-xl font-bold text-primary">
            ${property.precio.toLocaleString()}
          </span>
          <span className="text-xs text-on-surface-variant"> MXN / mes</span>
        </div>
        <Link
          href={`/propiedad/${property.id}`}
          className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-secondary hover:text-white text-on-surface text-xs font-semibold transition-colors inline-flex items-center gap-1"
        >
          Ver detalle →
        </Link>
      </div>
    </div>
  )
}