// Purpose: Permite editar los datos de un inmueble y su publicacion.
'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
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
  Plus,
  Trash2,
} from 'lucide-react'
import { editarInmuebleAction, EditarInmuebleState } from '@/app/actions/inmuebles'
import SubirDocumento from '@/app/perfil/SubirDocumento'

const initialState: EditarInmuebleState = {}

interface Props {
  documentos: {
    id: number
    tipo_documento: string
    estado: string
    motivo_rechazo: string | null
    fecha_carga: Date
  }[]
  inmueble: {
    id: number
    tipo_inmueble: string
    direccion: string
    numero_habitaciones: number
    numero_banos: number
    metros_cuadrados: number
    latitud: number | null
    longitud: number | null
    servicios_incluidos: string | null
    plazo_minimo_meses: number
    mantenimiento_incluido: boolean
    publicacion: {
      id: number
      precio_renta: number
      deposito: number
      descripcion: string
      reglas: string | null
      permite_mascotas: boolean
      permite_ninos: boolean
      fotos: string[]
    } | null
  }
}

export default function EditarPropiedadForm({ inmueble, documentos }: Props) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    editarInmuebleAction,
    initialState
  )

  const [precioRenta, setPrecioRenta] = useState(
    inmueble.publicacion?.precio_renta.toString() || ''
  )
  const [deposito, setDeposito] = useState(
    inmueble.publicacion?.deposito.toString() || ''
  )
  const [mantenimientoIncluido, setMantenimientoIncluido] = useState(
    inmueble.mantenimiento_incluido
  )
  const [plazoMinimo, setPlazoMinimo] = useState(inmueble.plazo_minimo_meses)
  const [imagenes, setImagenes] = useState<string[]>(
    inmueble.publicacion?.fotos.length ? inmueble.publicacion.fotos : ['']
  )

  const agregarImagen = () => {
    if (imagenes.length < 6) setImagenes([...imagenes, ''])
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

  useEffect(() => {
    if (state?.success) router.push('/dashboard')
  }, [router, state?.success])

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-secondary font-medium hover:opacity-80 text-sm"
      >
        <ArrowLeft size={16} /> Volver al dashboard
      </Link>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">
          Editar propiedad
        </h1>
        <p className="text-on-surface-variant text-sm">
          Actualiza los datos de tu inmueble y publicación
        </p>
      </div>

      <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Verificación legal del inmueble</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Adjunta una escritura, título de propiedad o recibo predial. El equipo de Rentify revisará el documento.
          </p>
        </div>
        <SubirDocumento inmuebleId={inmueble.id} />
        {documentos.length > 0 && (
          <ul className="space-y-2">
            {documentos.map((documento) => (
              <li key={documento.id} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <span className="font-medium">{documento.tipo_documento}</span>
                <span className="text-gray-500"> · {documento.estado}</span>
                {documento.motivo_rechazo && (
                  <p className="mt-1 text-xs text-red-700">{documento.motivo_rechazo}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="inmueble_id" value={inmueble.id} />
        <input
          type="hidden"
          name="mantenimiento_incluido"
          value={mantenimientoIncluido ? 'on' : ''}
        />
        <input type="hidden" name="plazo_minimo_meses" value={plazoMinimo} />

        {/* Información del inmueble */}
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
                Datos básicos de tu propiedad
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
                  name="tipo_inmueble"
                  required
                  defaultValue={inmueble.tipo_inmueble}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-canvas border border-gray-200 focus:ring-2 focus:ring-secondary outline-none text-sm"
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
                  name="direccion"
                  required
                  defaultValue={inmueble.direccion}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-canvas border border-gray-200 focus:ring-2 focus:ring-secondary outline-none text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold text-primary">
                Latitud (opcional)
                <input
                  type="number"
                  step="any"
                  name="latitud"
                  defaultValue={inmueble.latitud ?? ''}
                  placeholder="20.6597"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-surface-canvas px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm font-semibold text-primary">
                Longitud (opcional)
                <input
                  type="number"
                  step="any"
                  name="longitud"
                  defaultValue={inmueble.longitud ?? ''}
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
                    name="numero_habitaciones"
                    required
                    min={1}
                    defaultValue={inmueble.numero_habitaciones}
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
                    name="numero_banos"
                    required
                    min={1}
                    defaultValue={inmueble.numero_banos}
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
                    name="metros_cuadrados"
                    required
                    min={1}
                    step="0.1"
                    defaultValue={inmueble.metros_cuadrados}
                    className="w-full pl-9 pr-3 py-3 rounded-xl bg-surface-canvas border border-gray-200 focus:ring-2 focus:ring-secondary outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">
                Servicios incluidos
              </label>
              <input
                type="text"
                name="servicios_incluidos"
                defaultValue={inmueble.servicios_incluidos || ''}
                placeholder="Ej. Agua y mantenimiento incluidos"
                className="w-full px-4 py-3 rounded-xl bg-surface-canvas border border-gray-200 focus:ring-2 focus:ring-secondary outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Publicación */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
              <DollarSign size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary">
                Publicación y precio
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Ajusta el precio y la descripción
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
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    type="number"
                    name="precio_renta"
                    required
                    min={1}
                    value={precioRenta}
                    onChange={(e) => setPrecioRenta(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 rounded-xl bg-surface-canvas border border-gray-200 focus:ring-2 focus:ring-secondary outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-primary mb-1.5">
                  Depósito (MXN) *
                </label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    type="number"
                    name="deposito"
                    required
                    min={0}
                    value={deposito}
                    onChange={(e) => setDeposito(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 rounded-xl bg-surface-canvas border border-gray-200 focus:ring-2 focus:ring-secondary outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-canvas">
              <div>
                <p className="text-sm font-semibold text-primary">Mantenimiento incluido</p>
                <p className="text-xs text-on-surface-variant">
                  El inquilino no paga cuotas adicionales
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

            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">
                Plazo mínimo del contrato
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPlazoMinimo(12)}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition ${
                    plazoMinimo === 12 ? 'bg-primary text-white shadow-sm' : 'bg-surface-canvas'
                  }`}
                >
                  12 meses
                </button>
                <button
                  type="button"
                  onClick={() => setPlazoMinimo(6)}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition ${
                    plazoMinimo === 6 ? 'bg-primary text-white shadow-sm' : 'bg-surface-canvas'
                  }`}
                >
                  6 meses
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">
                Descripción *
              </label>
              <div className="relative">
                <FileText size={18} className="absolute left-3 top-3 text-on-surface-variant" />
                <textarea
                  name="descripcion"
                  required
                  rows={4}
                  defaultValue={inmueble.publicacion?.descripcion || ''}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-canvas border border-gray-200 focus:ring-2 focus:ring-secondary outline-none text-sm resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">
                Reglas de la casa (opcional)
              </label>
              <textarea
                name="reglas"
                rows={2}
                defaultValue={inmueble.publicacion?.reglas || ''}
                className="w-full px-4 py-3 rounded-xl bg-surface-canvas border border-gray-200 focus:ring-2 focus:ring-secondary outline-none text-sm resize-none"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-start gap-3 rounded-xl bg-surface-canvas p-3 text-sm">
                <input
                  type="checkbox"
                  name="permite_mascotas"
                  defaultChecked={inmueble.publicacion?.permite_mascotas ?? false}
                  className="mt-1 accent-secondary"
                />
                <span>Se permiten mascotas</span>
              </label>
              <label className="flex items-start gap-3 rounded-xl bg-surface-canvas p-3 text-sm">
                <input
                  type="checkbox"
                  name="permite_ninos"
                  defaultChecked={inmueble.publicacion?.permite_ninos ?? true}
                  className="mt-1 accent-secondary"
                />
                <span>Se permiten niños</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">
                Imágenes (URLs)
              </label>
              <div className="space-y-2">
                {imagenes.map((url, idx) => (
                  <div key={idx} className="flex gap-2">
                    <div className="relative flex-1">
                      <ImageIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        type="url"
                        name="imagenes"
                        value={url}
                        onChange={(e) => actualizarImagen(idx, e.target.value)}
                        placeholder={`URL de la imagen ${idx + 1}`}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-canvas border border-gray-200 focus:ring-2 focus:ring-secondary outline-none text-sm"
                      />
                    </div>
                    {imagenes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarImagen(idx)}
                        className="p-2.5 rounded-xl text-red-600 hover:bg-red-50"
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
                    className="flex items-center gap-2 text-sm font-semibold text-secondary hover:text-primary px-2 py-1"
                  >
                    <Plus size={16} /> Agregar imagen
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {state?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {state.error}
          </div>
        )}

        <div className="flex justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 border-2 border-gray-200 text-on-surface-variant px-6 py-3 rounded-xl hover:bg-gray-50 font-semibold text-sm"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl hover:bg-secondary font-semibold text-sm disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : (
              <>
                <CheckCircle2 size={16} /> Guardar cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}