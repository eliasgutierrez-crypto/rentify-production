// Purpose: Componente reutilizable de interfaz. Presenta la portada y dirige la busqueda rapida al catalogo.
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Home, Wallet, Bed } from 'lucide-react'

export default function Hero() {
  const router = useRouter()
  const [ubicacion, setUbicacion] = useState('')
  const [presupuesto, setPresupuesto] = useState('')
  const [tipo, setTipo] = useState('')
  const [habitaciones, setHabitaciones] = useState('')

  const handleBuscar = () => {
    const params = new URLSearchParams()
    if (ubicacion) params.set('ubicacion', ubicacion)
    if (presupuesto) params.set('precio', presupuesto)
    if (tipo) params.set('tipo', tipo)
    if (habitaciones) params.set('habitaciones', habitaciones)
    router.push(`/propiedades?${params.toString()}`)
  }

  return (
    <section className="relative w-full overflow-hidden bg-primary -mt-20 pt-20">
      <div className="relative w-full min-h-[640px] lg:min-h-[720px] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center w-full h-full"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1600596542815-e32870110004?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/50 to-primary/40 backdrop-blur-[2px]" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white mb-4 shadow-sm">
            <span className="text-xs font-semibold tracking-wider uppercase">
              Proyecto académico de rentas en Guadalajara
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white max-w-4xl tracking-tight mb-4 drop-shadow-sm">
            Encuentra un lugar al que puedas llamar hogar
          </h1>

          <p className="text-lg md:text-xl text-white/90 max-w-2xl font-light mb-10 leading-relaxed">
            Explora propiedades, revisa sus condiciones y coordina solicitudes y visitas.
          </p>

          <div className="w-full max-w-5xl bg-white rounded-full p-1.5 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-1">
            <div className="w-full lg:w-1/4 px-6 py-2 rounded-full hover:bg-surface-container transition text-left cursor-pointer group">
              <span className="block text-[11px] text-on-surface-variant uppercase tracking-wider group-hover:text-primary font-semibold">
                Ubicación
              </span>
              <div className="flex items-center gap-1">
                <MapPin size={16} className="text-secondary" />
                <input
                  type="text"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  placeholder="Col. Americana, GDL"
                  className="w-full bg-transparent text-sm font-semibold text-on-surface focus:outline-none placeholder:text-on-surface-variant"
                />
              </div>
            </div>

            <div className="hidden lg:block w-px h-10 bg-outline-variant/30" />

            <div className="w-full lg:w-1/4 px-6 py-2 rounded-full hover:bg-surface-container transition text-left cursor-pointer group">
              <span className="block text-[11px] text-on-surface-variant uppercase tracking-wider group-hover:text-primary font-semibold">
                Tipo de Propiedad
              </span>
              <div className="flex items-center gap-1">
                <Home size={16} className="text-secondary" />
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-on-surface focus:outline-none cursor-pointer"
                >
                  <option value="">Cualquiera</option>
                  <option value="departamento">Departamento</option>
                  <option value="casa">Casa</option>
                  <option value="loft">Loft</option>
                  <option value="estudio">Estudio</option>
                </select>
              </div>
            </div>

            <div className="hidden lg:block w-px h-10 bg-outline-variant/30" />

            <div className="w-full lg:w-1/4 px-6 py-2 rounded-full hover:bg-surface-container transition text-left cursor-pointer group">
              <span className="block text-[11px] text-on-surface-variant uppercase tracking-wider group-hover:text-primary font-semibold">
                Presupuesto Mensual
              </span>
              <div className="flex items-center gap-1">
                <Wallet size={16} className="text-secondary" />
                <select
                  value={presupuesto}
                  onChange={(e) => setPresupuesto(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-on-surface focus:outline-none cursor-pointer"
                >
                  <option value="">Cualquier precio</option>
                  <option value="10000">Hasta $10,000</option>
                  <option value="15000">Hasta $15,000</option>
                  <option value="20000">Hasta $20,000</option>
                  <option value="30000">Hasta $30,000</option>
                </select>
              </div>
            </div>

            <div className="hidden lg:block w-px h-10 bg-outline-variant/30" />

            <div className="w-full lg:w-1/4 pl-4 pr-1 py-1 flex items-center justify-between gap-2">
              <div className="text-left hidden sm:block">
                <span className="block text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                  Recámaras
                </span>
                <div className="flex items-center gap-1">
                  <Bed size={16} className="text-secondary" />
                  <select
                    value={habitaciones}
                    onChange={(e) => setHabitaciones(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-on-surface focus:outline-none cursor-pointer"
                  >
                    <option value="">1 a 3</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3+</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleBuscar}
                className="w-full sm:w-auto flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-white px-6 py-3 rounded-full shadow-lg transition-all hover:scale-[1.02]"
              >
                <Search size={18} />
                <span className="text-sm font-semibold whitespace-nowrap">Buscar viviendas</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-white/80 text-xs font-semibold">
            <span className="flex items-center gap-1">
              <span aria-hidden="true">✓</span>
              Filtros para comparar propiedades
            </span>
            <span className="hidden sm:inline opacity-40">•</span>
            <span className="flex items-center gap-1">
              <span aria-hidden="true">✓</span>
              Seguimiento de solicitudes y visitas
            </span>
            <span className="hidden sm:inline opacity-40">•</span>
            <span className="flex items-center gap-1">
              <span aria-hidden="true">✓</span>
              Anuncios sujetos a revisión administrativa
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}