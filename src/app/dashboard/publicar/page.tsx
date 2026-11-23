// Purpose: Pagina de Next.js para la ruta /dashboard/publicar.
'use client'

import Image from 'next/image'
import { useActionState, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Home,
  MapPin,
  Bed,
  Bath,
  Ruler,
  DollarSign,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Wind,
  WashingMachine,
  Dog,
  Shield,
  Dumbbell,
  Monitor,
  ChefHat,
  Sparkles,
  Lock,
  Building2,
  Plus,
  Trash2,
  Calendar,
  Star,
} from 'lucide-react'
import { publicarPropiedadAction, PublicarState } from '@/app/actions/propiedades'

const initialState: PublicarState = {}

const AMENIDADES = [
  { id: 'Internet de Alta Velocidad', label: 'Internet de Alta Velocidad', icon: Wifi },
  { id: 'Cocina Integral Equipada', label: 'Cocina Integral', icon: ChefHat },
  { id: 'A/C Inverter', label: 'A/C Inverter', icon: Wind },
  { id: 'Centro de Lavado', label: 'Centro de Lavado', icon: WashingMachine },
  { id: 'Pet-Friendly', label: 'Pet-Friendly', icon: Dog },
  { id: 'Seguridad 24/7', label: 'Seguridad 24/7', icon: Shield },
  { id: 'Gimnasio', label: 'Gimnasio', icon: Dumbbell },
  { id: 'Espacio Home Office', label: 'Home Office', icon: Monitor },
  { id: 'Alberca', label: 'Alberca', icon: Sparkles },
  { id: 'Balcón', label: 'Balcón', icon: Building2 },
  { id: 'Amueblado', label: 'Amueblado', icon: Home },
  { id: 'Cerradura Biométrica', label: 'Cerradura Biométrica', icon: Lock },
]

export default function PublicarPage() {
  const [state, formAction, isPending] = useActionState(
    publicarPropiedadAction,
    initialState
  )

  const [paso, setPaso] = useState(1)
  const [tipoInmueble, setTipoInmueble] = useState('')
  const [direccion, setDireccion] = useState('')
  const [numeroHabitaciones, setNumeroHabitaciones] = useState('1')
  const [numeroBanos, setNumeroBanos] = useState('1')
  const [metrosCuadrados, setMetrosCuadrados] = useState('')
  const [latitud, setLatitud] = useState('')
  const [longitud, setLongitud] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [reglas, setReglas] = useState('')
  const [permiteMascotas, setPermiteMascotas] = useState(false)
  const [permiteNinos, setPermiteNinos] = useState(true)
  const [precioRenta, setPrecioRenta] = useState('')
  const [deposito, setDeposito] = useState('')
  const [amenidadesSeleccionadas, setAmenidadesSeleccionadas] = useState<string[]>([])
  const [imagenes, setImagenes] = useState<string[]>([''])
  const [mantenimientoIncluido, setMantenimientoIncluido] = useState(true)
  const [plazoMinimo, setPlazoMinimo] = useState(12)

  const toggleAmenidad = (nombre: string) => {
    setAmenidadesSeleccionadas((prev) =>
      prev.includes(nombre) ? prev.filter((a) => a !== nombre) : [...prev, nombre]
    )
  }

  const agregarImagen = () => {
    if (imagenes.length < 6) {
      setImagenes([...imagenes, ''])
    }
  }

  const actualizarImagen = (index: number, valor: string) => {
    const nuevas = [...imagenes]
    nuevas[index] = valor
    setImagenes(nuevas)
  }

  const eliminarImagen = (index: number) => {
    if (imagenes.length > 1) {
      setImagenes(imagenes.filter((_, i) => i !== index))
    }
  }

  const totalInicial =
    (parseFloat(precioRenta) || 0) + (parseFloat(deposito) || 0)

  const imagenesValidas = imagenes.filter((url) => url.trim() !== '')

  return (
    <div className="max-w-6xl mx-auto px-4 pb-32">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-secondary font-medium mb-6 hover:opacity-80"
      >
        <ArrowLeft size={18} /> Volver al dashboard
      </Link>

      {/* Header con stepper */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold uppercase tracking-wider mb-2">
              <CheckCircle2 size={12} /> Publicación en Rentify
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">
              Publicar nueva propiedad
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { num: 1, label: 'Datos básicos' },
            { num: 2, label: 'Amenidades' },
            { num: 3, label: 'Fotos y precio' },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-2 p-2 rounded-xl transition ${
                paso === s.num
                  ? 'bg-surface-container'
                  : paso > s.num
                  ? 'bg-green-50'
                  : 'bg-surface-container-lowest opacity-60'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  paso > s.num
                    ? 'bg-status-success text-white'
                    : paso === s.num
                    ? 'bg-primary text-white'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {paso > s.num ? <CheckCircle2 size={14} /> : s.num}
              </div>
              <span
                className={`text-xs font-semibold truncate ${
                  paso === s.num ? 'text-primary' : 'text-on-surface-variant'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <form action={formAction}>
        <input type="hidden" name="tipo_inmueble" value={tipoInmueble} />
        <input type="hidden" name="direccion" value={direccion} />
        <input type="hidden" name="numero_habitaciones" value={numeroHabitaciones} />
        <input type="hidden" name="numero_banos" value={numeroBanos} />
        <input type="hidden" name="metros_cuadrados" value={metrosCuadrados} />
        <input type="hidden" name="latitud" value={latitud} />
        <input type="hidden" name="longitud" value={longitud} />
        <input type="hidden" name="descripcion" value={descripcion} />
        <input type="hidden" name="reglas" value={reglas} />
        <input type="hidden" name="permite_mascotas" value={permiteMascotas ? 'on' : ''} />
        <input type="hidden" name="permite_ninos" value={permiteNinos ? 'on' : ''} />
        <input
          type="hidden"
          name="mantenimiento_incluido"
          value={mantenimientoIncluido ? 'on' : ''}
        />
        <input type="hidden" name="plazo_minimo_meses" value={plazoMinimo} />
        {amenidadesSeleccionadas.map((a) => (
          <input key={a} type="hidden" name="caracteristicas" value={a} />
        ))}
        {imagenesValidas.map((url, i) => (
          <input key={i} type="hidden" name="imagenes" value={url} />
        ))}

        {/* PASO 1: Datos básicos */}
        {paso === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                  <Home size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary">
                    Información del inmueble
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Datos básicos para clasificar tu propiedad
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-primary mb-1.5">
                    Tipo de inmueble *
                  </label>
                  <div className="relative">
                    <Home size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      type="text"
                      value={tipoInmueble}
                      onChange={(e) => setTipoInmueble(e.target.value)}
                      required
                      placeholder="Ej. Departamento, Casa, Loft, Estudio..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-canvas border border-gray-200 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary mb-1.5">
                    Dirección completa *
                  </label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      type="text"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      required
                      placeholder="Calle, número, colonia, ciudad"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-canvas border border-gray-200 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm font-semibold text-primary">
                    Latitud (opcional)
                    <input
                      type="number"
                      step="any"
                      value={latitud}
                      onChange={(event) => setLatitud(event.target.value)}
                      placeholder="20.6597"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-surface-canvas px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm font-semibold text-primary">
                    Longitud (opcional)
                    <input
                      type="number"
                      step="any"
                      value={longitud}
                      onChange={(event) => setLongitud(event.target.value)}
                      placeholder="-103.3496"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-surface-canvas px-3 py-2 text-sm"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1.5">
                      Recámaras *
                    </label>
                    <div className="relative">
                      <Bed size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        type="number"
                        required
                        min={1}
                        value={numeroHabitaciones}
                        onChange={(e) => setNumeroHabitaciones(e.target.value)}
                        className="w-full pl-9 pr-3 py-3 rounded-xl bg-surface-canvas border border-gray-200 focus:ring-2 focus:ring-secondary outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1.5">
                      Baños *
                    </label>
                    <div className="relative">
                      <Bath size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        type="number"
                        required
                        min={1}
                        value={numeroBanos}
                        onChange={(e) => setNumeroBanos(e.target.value)}
                        className="w-full pl-9 pr-3 py-3 rounded-xl bg-surface-canvas border border-gray-200 focus:ring-2 focus:ring-secondary outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1.5">
                      m² *
                    </label>
                    <div className="relative">
                      <Ruler size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        type="number"
                        required
                        min={1}
                        step="0.1"
                        placeholder="80"
                        value={metrosCuadrados}
                        onChange={(e) => setMetrosCuadrados(e.target.value)}
                        className="w-full pl-9 pr-3 py-3 rounded-xl bg-surface-canvas border border-gray-200 focus:ring-2 focus:ring-secondary outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary mb-1.5">
                    Descripción *
                  </label>
                  <div className="relative">
                    <FileText size={18} className="absolute left-3 top-3 text-on-surface-variant" />
                    <textarea
                      required
                      rows={4}
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Describe las características, amenidades y ubicación de la propiedad..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-canvas border border-gray-200 focus:ring-2 focus:ring-secondary outline-none text-sm resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary mb-1.5">
                    Reglas de la casa (opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. No fumar, mascotas bienvenidas, contrato mínimo 12 meses..."
                    value={reglas}
                    onChange={(e) => setReglas(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-canvas border border-gray-200 focus:ring-2 focus:ring-secondary outline-none text-sm resize-none"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex items-start gap-3 rounded-xl bg-surface-canvas p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={permiteMascotas}
                      onChange={(event) => setPermiteMascotas(event.target.checked)}
                      className="mt-1 accent-secondary"
                    />
                    <span>Se permiten mascotas</span>
                  </label>
                  <label className="flex items-start gap-3 rounded-xl bg-surface-canvas p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={permiteNinos}
                      onChange={(event) => setPermiteNinos(event.target.checked)}
                      className="mt-1 accent-secondary"
                    />
                    <span>Se permiten niños</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPaso(2)}
                disabled={!tipoInmueble}
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-secondary transition font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar a Amenidades <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: Amenidades */}
        {paso === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary">
                    Amenidades y comodidades
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Selecciona todas las que apliquen ({amenidadesSeleccionadas.length} seleccionadas)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {AMENIDADES.map((amenidad) => {
                  const Icon = amenidad.icon
                  const seleccionada = amenidadesSeleccionadas.includes(amenidad.id)
                  return (
                    <button
                      key={amenidad.id}
                      type="button"
                      onClick={() => toggleAmenidad(amenidad.id)}
                      className={`p-3 rounded-xl text-left transition ${
                        seleccionada
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-surface-canvas hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon size={20} className={seleccionada ? 'text-white' : 'text-secondary'} />
                        {seleccionada && <CheckCircle2 size={16} />}
                      </div>
                      <span className="text-xs font-semibold block">
                        {amenidad.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setPaso(1)}
                className="inline-flex items-center gap-2 border-2 border-gray-200 text-on-surface-variant px-6 py-3 rounded-xl hover:bg-gray-50 transition font-semibold text-sm"
              >
                <ArrowLeft size={16} /> Atrás
              </button>
              <button
                type="button"
                onClick={() => setPaso(3)}
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-secondary transition font-semibold text-sm"
              >
                Continuar a Fotos y Precio <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: Fotos y precio */}
        {paso === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda: formulario */}
            <div className="lg:col-span-2 space-y-6">
              {/* Fotos múltiples */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                    <ImageIcon size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-primary">
                      Galería fotográfica
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Agrega hasta 6 URLs de imágenes ({imagenes.length}/6)
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {imagenes.map((url, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="flex-1 relative">
                        <ImageIcon
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                        />
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => actualizarImagen(idx, e.target.value)}
                          placeholder={`https://images.unsplash.com/photo-... (foto ${idx + 1})`}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-canvas border border-gray-200 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none text-sm"
                        />
                      </div>
                      {imagenes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarImagen(idx)}
                          className="p-2.5 rounded-xl text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}

                  {imagenes.length < 6 && (
                    <button
                      type="button"
                      onClick={agregarImagen}
                      className="flex items-center gap-2 text-sm font-semibold text-secondary hover:text-primary transition px-2 py-1"
                    >
                      <Plus size={16} /> Agregar otra imagen
                    </button>
                  )}

                  <p className="text-xs text-on-surface-variant mt-2">
                    Puedes usar URLs de Unsplash:{' '}
                    <a
                      href="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"
                      target="_blank"
                      rel="noreferrer"
                      className="text-secondary underline"
                    >
                      ver ejemplo
                    </a>
                  </p>

                  {imagenesValidas.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {imagenesValidas.map((url, i) => (
                        <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-surface-canvas">
                          <Image
                            src={url}
                            alt={`Foto ${i + 1}`}
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="(max-width: 768px) 33vw, 200px"
                            onError={() => undefined}
                          />
                          {i === 0 && (
                            <span className="absolute top-1 left-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded">
                              Portada
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Precio y depósito */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                    <DollarSign size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-primary">
                      Precio y arrendamiento
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Define el precio y las condiciones del contrato
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-1.5">
                        Renta mensual (MXN) *
                      </label>
                      <div className="relative">
                        <DollarSign
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                        />
                        <input
                          type="number"
                          name="precio_renta"
                          required
                          min={1}
                          value={precioRenta}
                          onChange={(e) => setPrecioRenta(e.target.value)}
                          placeholder="15000"
                          className="w-full pl-9 pr-3 py-3 rounded-xl bg-surface-canvas border border-gray-200 focus:ring-2 focus:ring-secondary outline-none text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-1.5">
                        Depósito (MXN) *
                      </label>
                      <div className="relative">
                        <DollarSign
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                        />
                        <input
                          type="number"
                          name="deposito"
                          required
                          min={0}
                          value={deposito}
                          onChange={(e) => setDeposito(e.target.value)}
                          placeholder="15000"
                          className="w-full pl-9 pr-3 py-3 rounded-xl bg-surface-canvas border border-gray-200 focus:ring-2 focus:ring-secondary outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mantenimiento incluido */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-surface-canvas">
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        Mantenimiento incluido
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        El inquilino no pagará cuotas de mantenimiento adicionales
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={mantenimientoIncluido}
                      onClick={() => setMantenimientoIncluido(!mantenimientoIncluido)}
                      className={`w-12 h-6 rounded-full relative overflow-hidden transition-colors ${
                        mantenimientoIncluido ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          mantenimientoIncluido ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Plazo mínimo */}
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1.5 flex items-center gap-1">
                      <Calendar size={14} /> Plazo mínimo del contrato
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPlazoMinimo(12)}
                        className={`py-2.5 rounded-xl text-sm font-semibold transition ${
                          plazoMinimo === 12
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-surface-canvas text-on-surface hover:bg-surface-container'
                        }`}
                      >
                        12 meses
                        <span className="text-[10px] block opacity-70">Recomendado</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlazoMinimo(6)}
                        className={`py-2.5 rounded-xl text-sm font-semibold transition ${
                          plazoMinimo === 6
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-surface-canvas text-on-surface hover:bg-surface-container'
                        }`}
                      >
                        6 meses
                      </button>
                    </div>
                  </div>

                  {precioRenta && deposito && (
                    <div className="bg-surface-canvas p-4 rounded-xl">
                      <p className="text-xs text-on-surface-variant mb-2">
                        Desglose para el inquilino
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-on-surface-variant">1er mes de renta</span>
                          <span className="font-medium text-on-surface">
                            ${parseFloat(precioRenta || '0').toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-on-surface-variant">Depósito</span>
                          <span className="font-medium text-on-surface">
                            ${parseFloat(deposito || '0').toLocaleString()}
                          </span>
                        </div>
                        <div className="h-px bg-gray-200 my-1" />
                        <div className="flex justify-between items-baseline">
                          <span className="font-semibold text-primary">Total inicial</span>
                          <span className="text-lg font-bold text-primary">
                            ${totalInicial.toLocaleString()} MXN
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {state?.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {state.error}
                </div>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setPaso(2)}
                  className="inline-flex items-center gap-2 border-2 border-gray-200 text-on-surface-variant px-6 py-3 rounded-xl hover:bg-gray-50 transition font-semibold text-sm"
                >
                  <ArrowLeft size={16} /> Atrás
                </button>
                <button
                  type="submit"
                  disabled={isPending || imagenesValidas.length === 0}
                  className="inline-flex items-center gap-2 bg-status-success text-white px-8 py-3 rounded-xl hover:bg-green-700 transition font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Publicando...' : (
                    <>
                      <CheckCircle2 size={16} /> Publicar propiedad
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Columna derecha: vista previa */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-md p-4 sticky top-24">
                <div className="flex items-center gap-1 text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">
                  <Star size={12} className="fill-rating-gold text-rating-gold" />
                  Vista previa en el catálogo
                </div>

                <div className="rounded-xl overflow-hidden bg-surface-container-lowest shadow-sm">
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface-canvas">
                    {imagenesValidas[0] ? (
                      <Image
                        src={imagenesValidas[0]}
                        alt="Portada"
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 320px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                        <ImageIcon size={32} />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <CheckCircle2 size={12} className="text-status-success" />
                      <span className="text-[10px] text-primary font-bold">Verificada</span>
                    </div>
                    {imagenesValidas.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-primary/80 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded">
                        1/{imagenesValidas.length} fotos
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-secondary font-semibold uppercase tracking-wider">
                        {tipoInmueble || 'Tipo de inmueble'}
                      </span>
                      <div className="flex items-center gap-0.5 text-on-surface text-[10px] font-bold">
                        <Star size={10} className="fill-rating-gold text-rating-gold" />
                        Nuevo
                      </div>
                    </div>
                    <h5 className="text-sm font-semibold text-primary truncate">
                      {tipoInmueble || 'Título de tu propiedad'}
                    </h5>
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-[11px] py-1">
                      <MapPin size={10} />
                      <span className="truncate">Colonia, Guadalajara</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-on-surface-variant">
                      <span>2 Rec.</span>
                      <span>•</span>
                      <span>2 Baños</span>
                      <span>•</span>
                      <span>95 m²</span>
                    </div>
                    <div className="pt-2 flex items-baseline gap-1">
                      <span className="text-base font-bold text-primary">
                        ${parseFloat(precioRenta || '0').toLocaleString()}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">MXN / mes</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-on-surface-variant text-center mt-3">
                  Así se verá tu propiedad en el catálogo
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}