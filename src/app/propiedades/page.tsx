// Purpose: Pagina de Next.js para la ruta /propiedades.
import { Suspense } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import type { Prisma } from '@prisma/client'
import Navbar from '@/components/Navbar'
import PropertyCard from '@/components/PropertyCard'
import MapaCatalogo from '@/components/MapaCatalogo'
import { prisma } from '@/lib/prisma'
import { aproximarCoordenada, obtenerUbicacionAproximada } from '@/lib/ubicacion-publica'

interface Props {
  searchParams: Promise<{
    ubicacion?: string
    precio?: string
    minPrecio?: string
    maxPrecio?: string
    tipo?: string
    habitaciones?: string
    banos?: string
    amenidad?: string
    mascotas?: string
    ninos?: string
    orden?: string
    vista?: string
  }>
}

const AMENIDADES = [
  'Internet de Alta Velocidad',
  'Cocina Integral Equipada',
  'Pet-Friendly',
  'Seguridad 24/7',
  'Gimnasio',
  'Alberca',
  'Amueblado',
]

function numeroPositivo(valor?: string): number | undefined {
  if (!valor || valor.length > 12) return undefined
  const numero = Number(valor)
  return Number.isFinite(numero) && numero > 0 ? numero : undefined
}

async function getPropiedades(filtros: Awaited<Props['searchParams']>) {
  const where: Prisma.PublicacionWhereInput = { estado: 'activa' }
  const inmuebleWhere: Prisma.InmuebleWhereInput = {
    estado_inventario: 'disponible',
  }
  const ubicacion = filtros.ubicacion?.trim().slice(0, 100)
  const tipo = filtros.tipo?.trim().slice(0, 60)
  const amenidad = AMENIDADES.find((nombre) => nombre === filtros.amenidad)
  const precioMinimo = numeroPositivo(filtros.minPrecio)
  const precioMaximo = numeroPositivo(filtros.maxPrecio || filtros.precio)
  const habitaciones = numeroPositivo(filtros.habitaciones)
  const banos = numeroPositivo(filtros.banos)

  if (ubicacion) {
    inmuebleWhere.direccion = { contains: ubicacion, mode: 'insensitive' }
  }
  if (tipo) {
    inmuebleWhere.tipo_inmueble = { contains: tipo, mode: 'insensitive' }
  }
  if (habitaciones) {
    inmuebleWhere.numero_habitaciones = habitaciones >= 3 ? { gte: 3 } : Math.floor(habitaciones)
  }
  if (banos) {
    inmuebleWhere.numero_banos = banos >= 3 ? { gte: 3 } : Math.floor(banos)
  }
  if (amenidad) {
    inmuebleWhere.caracteristicas = {
      some: { caracteristica: { nombre: { contains: amenidad, mode: 'insensitive' } } },
    }
  }
  if (filtros.mascotas === 'on') where.permite_mascotas = true
  if (filtros.ninos === 'on') where.permite_ninos = true
  if (precioMinimo || precioMaximo) {
    where.precio_renta = {
      ...(precioMinimo ? { gte: precioMinimo } : {}),
      ...(precioMaximo ? { lte: precioMaximo } : {}),
    }
  }
  where.inmueble = { is: inmuebleWhere }

  const orden = filtros.orden === 'precio_asc'
    ? { precio_renta: 'asc' as const }
    : filtros.orden === 'precio_desc'
      ? { precio_renta: 'desc' as const }
      : { fecha_publicacion: 'desc' as const }

  const publicaciones = await prisma.publicacion.findMany({
    where,
    include: {
      inmueble: {
        include: {
          propietario: true,
          caracteristicas: { include: { caracteristica: true } },
        },
      },
      fotos: { orderBy: { orden: 'asc' }, take: 1 },
    },
    orderBy: orden,
    take: 100,
  })

  return publicaciones.map((publicacion) => ({
    id: publicacion.id,
    titulo: publicacion.inmueble.tipo_inmueble,
    ubicacion: obtenerUbicacionAproximada(publicacion.inmueble.direccion),
    precio: publicacion.precio_renta,
    habitaciones: publicacion.inmueble.numero_habitaciones,
    banos: publicacion.inmueble.numero_banos,
    metros: publicacion.inmueble.metros_cuadrados,
    tipo: publicacion.inmueble.tipo_inmueble,
    verificada:
      publicacion.inmueble.documento_verificado &&
      publicacion.inmueble.propietario.estado_verificacion === 'verificado',
    imagen:
      publicacion.fotos[0]?.ruta_archivo ||
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    latitud: publicacion.inmueble.latitud === null
      ? null
      : aproximarCoordenada(publicacion.inmueble.latitud),
    longitud: publicacion.inmueble.longitud === null
      ? null
      : aproximarCoordenada(publicacion.inmueble.longitud),
    permite_mascotas: publicacion.permite_mascotas,
    permite_ninos: publicacion.permite_ninos,
    calificacion_promedio: publicacion.inmueble.calificacion_promedio,
    total_evaluaciones: publicacion.inmueble.total_evaluaciones,
    caracteristicas: publicacion.inmueble.caracteristicas.map(
      ({ caracteristica }) => caracteristica.nombre
    ),
  }))
}

async function PropiedadesContent({ searchParams }: Props) {
  const filtros = await searchParams
  const propiedades = await getPropiedades(filtros)
  const vista = ['lista', 'mapa'].includes(filtros.vista || '') ? filtros.vista! : 'cuadricula'
  const urlVista = (seleccion: string) => {
    const parametros = new URLSearchParams()
    Object.entries({ ...filtros, vista: seleccion }).forEach(([clave, valor]) => {
      if (valor) parametros.set(clave, valor)
    })
    return `/propiedades?${parametros.toString()}`
  }

  return (
    <div className="flex w-full flex-col">
      <section className="sticky top-20 z-40 bg-white/95 shadow-sm backdrop-blur-xl">
        <form action="/propiedades" className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-6 py-4 md:grid-cols-4 lg:grid-cols-7">
          <input
            name="ubicacion"
            defaultValue={filtros.ubicacion}
            placeholder="Ubicación"
            aria-label="Ubicación"
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            name="minPrecio"
            type="number"
            min="1"
            defaultValue={filtros.minPrecio}
            placeholder="Precio mínimo"
            aria-label="Precio mínimo"
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            name="maxPrecio"
            type="number"
            min="1"
            defaultValue={filtros.maxPrecio || filtros.precio}
            placeholder="Precio máximo"
            aria-label="Precio máximo"
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            name="tipo"
            defaultValue={filtros.tipo}
            placeholder="Tipo de vivienda"
            aria-label="Tipo de vivienda"
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <select name="habitaciones" defaultValue={filtros.habitaciones || ''} aria-label="Recámaras" className="rounded-lg border px-3 py-2 text-sm">
            <option value="">Recámaras</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
          </select>
          <select name="banos" defaultValue={filtros.banos || ''} aria-label="Baños" className="rounded-lg border px-3 py-2 text-sm">
            <option value="">Baños</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
          </select>
          <select name="amenidad" defaultValue={filtros.amenidad || ''} aria-label="Amenidad" className="rounded-lg border px-3 py-2 text-sm">
            <option value="">Amenidad</option>
            {AMENIDADES.map((amenidad) => <option key={amenidad}>{amenidad}</option>)}
          </select>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="mascotas" defaultChecked={filtros.mascotas === 'on'} value="on" />
            Acepta mascotas
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="ninos" defaultChecked={filtros.ninos === 'on'} value="on" />
            Acepta niños
          </label>
          <select name="orden" defaultValue={filtros.orden || 'recientes'} aria-label="Ordenar" className="rounded-lg border px-3 py-2 text-sm">
            <option value="recientes">Más recientes</option>
            <option value="precio_asc">Menor precio</option>
            <option value="precio_desc">Mayor precio</option>
          </select>
          <input type="hidden" name="vista" value={vista} />
          <button type="submit" className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
            <Search size={16} /> Buscar
          </button>
          <Link href="/propiedades" className="flex items-center justify-center rounded-lg border px-3 py-2 text-sm">
            Limpiar filtros
          </Link>
        </form>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-on-surface-variant">
            <strong className="text-primary">{propiedades.length}</strong> viviendas disponibles
          </p>
          <nav aria-label="Vista de propiedades" className="flex gap-2 text-sm">
            {[
              ['cuadricula', 'Cuadrícula'],
              ['lista', 'Lista'],
              ['mapa', 'Mapa'],
            ].map(([valor, etiqueta]) => (
              <Link
                key={valor}
                href={urlVista(valor)}
                aria-current={vista === valor ? 'page' : undefined}
                className={`rounded-lg px-3 py-2 ${vista === valor ? 'bg-primary text-white' : 'bg-white text-primary'}`}
              >
                {etiqueta}
              </Link>
            ))}
          </nav>
        </div>

        {propiedades.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <Search size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="mb-2 text-gray-500">No se encontraron propiedades con esos filtros.</p>
            <Link href="/propiedades" className="font-semibold text-primary underline">Ver todas las propiedades</Link>
          </div>
        ) : vista === 'mapa' ? (
          <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
            <MapaCatalogo propiedades={propiedades} />
            <div className="max-h-[65vh] space-y-4 overflow-y-auto">
              {propiedades.map((propiedad) => <PropertyCard key={propiedad.id} property={propiedad} />)}
            </div>
          </div>
        ) : (
          <div className={vista === 'lista' ? 'grid grid-cols-1 gap-5' : 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'}>
            {propiedades.map((propiedad) => <PropertyCard key={propiedad.id} property={propiedad} />)}
          </div>
        )}
      </section>
    </div>
  )
}

export default async function PropiedadesPage({ searchParams }: Props) {
  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-20">
        <Suspense fallback={<div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-10 md:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="h-96 animate-pulse rounded-2xl bg-white" />)}</div>}>
          <PropiedadesContent searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  )
}
