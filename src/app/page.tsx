// Purpose: Pagina de Next.js para la ruta /.
import { Suspense } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import PropertyCard, { PropertyProps } from '@/components/PropertyCard'
import { prisma } from '@/lib/prisma'
import { MapPin, Calendar, FileText } from 'lucide-react'
import { obtenerUbicacionAproximada } from '@/lib/ubicacion-publica'

async function PropiedadesDestacadas() {
  // La página inicial muestra solo publicaciones activas y una foto de portada por inmueble.
  const publicaciones = await prisma.publicacion.findMany({
    take: 6,
    where: {
      estado: 'activa',
      inmueble: { is: { estado_inventario: 'disponible' } },
    },
    include: {
      inmueble: { include: { propietario: true } },
      fotos: { orderBy: { orden: 'asc' }, take: 1 },
    },
  })

  const propiedades: PropertyProps[] = publicaciones.map((pub) => ({
    id: pub.id,
    titulo: pub.inmueble.tipo_inmueble,
    ubicacion: obtenerUbicacionAproximada(pub.inmueble.direccion),
    precio: pub.precio_renta,
    habitaciones: pub.inmueble.numero_habitaciones,
    banos: pub.inmueble.numero_banos,
    metros: pub.inmueble.metros_cuadrados,
    tipo: pub.inmueble.tipo_inmueble,
    permite_mascotas: pub.permite_mascotas,
    permite_ninos: pub.permite_ninos,
    calificacion_promedio: pub.inmueble.calificacion_promedio,
    total_evaluaciones: pub.inmueble.total_evaluaciones,
    verificada:
      pub.inmueble.documento_verificado &&
      pub.inmueble.propietario.estado_verificacion === 'verificado',
    imagen:
      pub.fotos[0]?.ruta_archivo ||
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  }))

  if (propiedades.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
        <p className="text-gray-500">No hay propiedades publicadas todavía.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {propiedades.map((prop) => (
        <PropertyCard key={prop.id} property={prop} />
      ))}
    </div>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen bg-surface font-sans">
      <Navbar />
      <Hero />

      {/* Filtros rápidos */}
      <section className="w-full max-w-7xl mx-auto px-6 pt-12 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1 text-secondary text-xs font-semibold tracking-wider uppercase mb-1">
              <MapPin size={14} />
              Jalisco • Zona Metropolitana de Guadalajara
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
              Propiedades destacadas en Guadalajara
            </h2>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Link href="/propiedades" className="px-4 py-1.5 rounded-full bg-primary text-white text-xs font-semibold whitespace-nowrap shadow-sm">
              Todas
            </Link>
            <Link href="/propiedades?ubicacion=Americana" className="px-4 py-1.5 rounded-full bg-white hover:bg-surface-container text-on-surface text-xs font-semibold whitespace-nowrap transition-colors shadow-sm">
              Colonia Americana
            </Link>
            <Link href="/propiedades?ubicacion=Chapalita" className="px-4 py-1.5 rounded-full bg-white hover:bg-surface-container text-on-surface text-xs font-semibold whitespace-nowrap transition-colors shadow-sm">
              Chapalita
            </Link>
            <Link href="/propiedades?ubicacion=Providencia" className="px-4 py-1.5 rounded-full bg-white hover:bg-surface-container text-on-surface text-xs font-semibold whitespace-nowrap transition-colors shadow-sm">
              Providencia
            </Link>
          </div>
        </div>
      </section>

      {/* Grid de propiedades */}
      <section className="w-full max-w-7xl mx-auto px-6 pb-12">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-96 animate-pulse" />
              ))}
            </div>
          }
        >
          <PropiedadesDestacadas />
        </Suspense>

        <div className="mt-12 flex justify-center">
          <Link
            href="/propiedades"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-surface-container text-primary text-sm font-semibold shadow-sm hover:shadow-md transition-all"
          >
            Explorar todas las viviendas disponibles
          </Link>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="w-full bg-surface-canvas py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest">
              Proyecto académico
            </span>
            <h2 className="text-3xl font-bold text-primary tracking-tight mt-2 mb-3">
              ¿Qué puedes hacer en Rentify?
            </h2>
            <p className="text-sm text-on-surface-variant">
              Explora inmuebles, revisa sus condiciones y coordina solicitudes y visitas
              desde un solo lugar. Rentify no procesa pagos ni sustituye un contrato.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Calendar,
                num: '01',
                title: 'Explora y agenda',
                desc: 'Filtra propiedades por precio, ubicación, características y reglas. Puedes solicitar una visita presencial o por videollamada.',
              },
              {
                icon: FileText,
                num: '02',
                title: 'Envía tu solicitud',
                desc: 'El propietario revisa y aprueba o rechaza cada solicitud. El estado queda visible en tu dashboard.',
              },
              {
                icon: MapPin,
                num: '03',
                title: 'Coordina con las partes',
                desc: 'Después de la aprobación se comparte el contacto para coordinar. Rentify no procesa pagos ni genera contratos.',
              },
            ].map((paso, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-secondary" />
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-secondary">
                    <paso.icon size={28} />
                  </div>
                  <span className="text-5xl font-bold text-surface-container">{paso.num}</span>
                </div>
                <h3 className="text-lg font-semibold text-primary mb-2">{paso.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{paso.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funciones principales */}
      <section className="w-full max-w-7xl mx-auto px-6 py-16">
        <div className="mb-10">
          <span className="text-xs font-semibold text-secondary uppercase tracking-widest">
            Herramientas de la plataforma
          </span>
          <h2 className="text-3xl font-bold text-primary tracking-tight mt-1">
            Mantén cada paso organizado
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              titulo: 'Búsqueda con filtros',
              texto: 'Compara precios, ubicación, habitaciones, amenidades y reglas desde el catálogo.',
            },
            {
              titulo: 'Solicitudes y visitas',
              texto: 'Consulta el estado de tus solicitudes y coordina visitas presenciales o por videollamada.',
            },
            {
              titulo: 'Revisión y evaluaciones',
              texto: 'Los administradores revisan documentos y anuncios; las evaluaciones se habilitan al finalizar una renta.',
            },
          ].map((funcion) => (
            <div key={funcion.titulo} className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-lg font-semibold text-primary">{funcion.titulo}</h3>
              <p className="text-sm leading-relaxed text-on-surface-variant">{funcion.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-white shadow-sm mt-12">
        <div className="max-w-7xl mx-auto px-6 pt-12 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8">
            <div className="lg:col-span-2">
              <h3 className="text-2xl font-bold text-primary mb-3">Rentify</h3>
              <p className="text-sm text-on-surface-variant max-w-sm">
                Proyecto académico para explorar inmuebles en renta y organizar solicitudes,
                visitas y revisiones. No procesa pagos ni genera contratos.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-primary mb-3">Explorar Guadalajara</h4>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li><Link href="/propiedades" className="hover:text-on-surface">Guadalajara & Zapopan</Link></li>
                <li><Link href="/propiedades" className="hover:text-on-surface">Colonia Americana</Link></li>
                <li><Link href="/propiedades" className="hover:text-on-surface">Providencia</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-primary mb-3">Soporte y Legal</h4>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li><Link href="/seguridad" className="hover:text-on-surface">Centro de ayuda</Link></li>
                <li><Link href="/guia" className="hover:text-on-surface">Guía del inquilino</Link></li>
                <li><Link href="/seguridad" className="hover:text-on-surface">Términos del servicio</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-on-surface-variant">
              © 2026 Rentify · Proyecto académico
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}