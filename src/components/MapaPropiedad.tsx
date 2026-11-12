// Purpose: Componente reutilizable de interfaz. Renderiza con Leaflet la ubicacion aproximada de una propiedad.
'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix para el ícono del marcador que Leaflet rompe con bundlers
delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: () => string })
  ._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface Props {
  latitud: number
  longitud: number
  direccion: string
  tipoInmueble: string
}

export default function MapaPropiedad({ latitud, longitud, direccion, tipoInmueble }: Props) {
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    // Leaflet necesita el DOM del navegador, por eso el mapa se monta después de hidratar.
    const frame = requestAnimationFrame(() => setMontado(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  if (!montado) {
    return (
      <div className="w-full h-72 rounded-xl bg-surface-canvas flex items-center justify-center">
        <p className="text-sm text-on-surface-variant">Cargando mapa...</p>
      </div>
    )
  }

  return (
    <div className="w-full h-72 rounded-xl overflow-hidden shadow-inner">
      <MapContainer
        center={[latitud, longitud]}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitud, longitud]}>
          <Popup>
            <div className="text-xs">
              <strong>{tipoInmueble}</strong>
              <br />
              {direccion}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}