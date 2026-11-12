// Purpose: Carga y presenta detalle, reputacion, ubicacion y acciones del anuncio.
import { notFound } from 'next/navigation'
import Image from 'next/image'
import {
  ChevronRight,
  MapPin,
  Bed,
  Bath,
  Ruler,
  CheckCircle2,
  Share2,
  Heart,
  Star,
  Building2,
  Lock,
  Wifi,
  ChefHat,
  Wind,
  WashingMachine,
  Dog,
  Shield,
  Dumbbell,
  Monitor,
  Sparkles,
  Home,
  type LucideIcon,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import SolicitarRentaButton from './SolicitarRentaButton'
import Navbar from '@/components/Navbar'
import MapaPropiedad from '@/components/MapaPropiedad'
import BotonReportar from './BotonReportar'
import { getCurrentUser } from '@/lib/auth'
import { parsearDisponibilidadVisitas } from '@/lib/disponibilidad-visitas'
import { aproximarCoordenada, obtenerUbicacionAproximada } from '@/lib/ubicacion-publica'

interface Props {
  params: Promise<{ id: string }>
}

const ICONOS_CARACTERISTICAS: Record<string, LucideIcon> = {
  'Internet de Alta Velocidad': Wifi,
  'Cocina Integral Equipada': ChefHat,
  'A/C Inverter': Wind,
  'Centro de Lavado': WashingMachine,
  'Pet-Friendly': Dog,
  'Seguridad 24/7': Shield,
  'Gimnasio': Dumbbell,
  'Espacio Home Office': Monitor,
  'Alberca': Sparkles,
  'Balcón': Building2,
  'Amueblado': Home,
  'Cerradura Biométrica': Lock,
}

export default async function PropiedadContent({ params }: Props) {
  const { id } = await params
  const propiedadId = parseInt(id)

  if (isNaN(propiedadId)) notFound()

  const usuario = await getCurrentUser()

  const publicacion = await prisma.publicacion.findUnique({
    where: { id: propiedadId },
    include: {
      inmueble: {
        include: {
          propietario: {
            include: { usuario: true },
          },
          caracteristicas: {
            include: { caracteristica: true },
          },
        },
      },
      fotos: { orderBy: { orden: 'asc' } },
      resenas: {
        include: {
          usuario: true,
        },
        orderBy: { fecha: 'desc' },
      },
    },
  })

  const puedeRevisarNoPublicada = Boolean(usuario?.administrador)
  if (
    !publicacion ||
    (!puedeRevisarNoPublicada &&
      (publicacion.estado !== 'activa' ||
        publicacion.inmueble.estado_inventario !== 'disponible'))
  ) {
    notFound()
  }

  const evaluacionesInmueble = await prisma.evaluacion.findMany({
    where: {
      tipo_evaluacion: 'inmueble',
      experiencia: {
        solicitud: { publicacion: { inmueble_id: publicacion.inmueble_id } },
      },
    },
    include: { usuario_evaluador: true },
    orderBy: { fecha_evaluacion: 'desc' },
    take: 20,
  })

  const imagenes = publicacion.fotos.map((f) => f.ruta_archivo)
  const imagenPrincipal = imagenes[0] || 'https://via.placeholder.com/800x500'
  const imagenesSecundarias = imagenes.slice(1, 5)
  while (imagenesSecundarias.length < 4) {
    imagenesSecundarias.push(imagenPrincipal)
  }

  const calificacion = publicacion.inmueble.calificacion_promedio || 0
  const totalResenas = publicacion.inmueble.total_evaluaciones || 0
  const disponibilidadVisitas = parsearDisponibilidadVisitas(
    publicacion.inmueble.disponibilidad_visitas
  )
  const ubicacionAproximada = obtenerUbicacionAproximada(publicacion.inmueble.direccion)
  const solicitudAprobada = usuario
    ? await prisma.solicitudRenta.findFirst({
        where: {
          publicacion_id: publicacion.id,
          inquilino_id: usuario.id,
          estado: 'aprobada',
        },
        select: { id: true },
      })
    : null

  // Verificar si el usuario es el dueño (para no mostrar "Reportar" en su propia propiedad)
  const esPropietario = usuario?.id === publicacion.inmueble.propietario_id

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />

      <div className="pt-20">
        <div className="w-full max-w-7xl mx-auto px-6 py-6">
          {/* Breadcrumb + acciones */}
          <div className="flex items-center justify-between pb-4 text-on-surface-variant text-xs">
            <div className="flex items-center gap-1 flex-wrap">
              <span>Jalisco</span>
              <ChevronRight size={14} />
              <span>Guadalajara</span>
              <ChevronRight size={14} />
              <span className="text-primary font-semibold truncate max-w-[200px]">
                {publicacion.inmueble.direccion.split(',')[1]?.trim() || 'Centro'}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <button className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-surface-container transition shadow-sm">
                <Share2 size={14} /> Compartir
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-surface-container transition shadow-sm">
                <Heart size={14} /> Guardar
              </button>
              {usuario && !esPropietario && (
                <BotonReportar publicacionId={publicacion.id} />
              )}
            </div>
          </div>

          {/* Título */}
          <div className="flex flex-col gap-2 pb-6">
            {puedeRevisarNoPublicada && publicacion.estado !== 'activa' && (
              <p className="w-fit rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                Vista administrativa · Estado: {publicacion.estado}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {publicacion.inmueble.documento_verificado && (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                  <Shield size={12} /> Propiedad verificada
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">
              {publicacion.inmueble.tipo_inmueble}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
              <span className="flex items-center gap-1">
                <Star size={16} className="fill-rating-gold text-rating-gold" />
                <span className="font-semibold text-on-surface">{calificacion.toFixed(2)}</span>
                <span className="underline cursor-pointer">({totalResenas} reseñas)</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {ubicacionAproximada}
              </span>
            </div>
          </div>

          {/* Galería mosaico */}
          <div className="relative w-full rounded-2xl overflow-hidden shadow-md mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 h-[420px] md:h-[540px]">
              <div className="md:col-span-2 md:row-span-2 relative overflow-hidden bg-surface-container">
                <Image
                  src={imagenPrincipal}
                  alt={publicacion.inmueble.tipo_inmueble}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 66vw"
                />
                <div className="absolute top-4 left-4 bg-primary/80 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs">
                  Sala principal & Ventanales
                </div>
              </div>
              {imagenesSecundarias.map((img, idx) => (
                <div
                  key={idx}
                  className="hidden md:block col-span-1 row-span-1 relative overflow-hidden bg-surface-container"
                >
                  <Image
                    src={img}
                    alt={`Foto ${idx + 2}`}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    sizes="(max-width: 768px) 0px, 25vw"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-white/90 text-[11px] text-on-surface">
                    {['Cocina equipada', 'Recámara principal', 'Terraza privada', 'Baño en cantera'][idx]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Layout 2 columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
            {/* Columna izquierda */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Especificaciones */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  <div className="flex flex-col gap-1">
                    <Ruler size={22} className="text-secondary" />
                    <span className="text-[11px] text-on-surface-variant">Área</span>
                    <span className="text-sm font-semibold text-primary">{publicacion.inmueble.metros_cuadrados} m²</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Bed size={22} className="text-secondary" />
                    <span className="text-[11px] text-on-surface-variant">Recámaras</span>
                    <span className="text-sm font-semibold text-primary">{publicacion.inmueble.numero_habitaciones}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Bath size={22} className="text-secondary" />
                    <span className="text-[11px] text-on-surface-variant">Baños</span>
                    <span className="text-sm font-semibold text-primary">{publicacion.inmueble.numero_banos}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Building2 size={22} className="text-secondary" />
                    <span className="text-[11px] text-on-surface-variant">Nivel</span>
                    <span className="text-sm font-semibold text-primary">Piso {publicacion.inmueble.piso || 1}</span>
                  </div>
                </div>
              </div>

              {/* Host card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
                        {publicacion.inmueble.propietario.usuario.nombre.charAt(0)}
                      </div>
                      {publicacion.inmueble.propietario.estado_verificacion === 'verificado' && (
                        <span className="absolute -bottom-1 -right-1 bg-status-success text-white rounded-full p-1">
                          <Shield size={12} />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-primary">
                          {publicacion.inmueble.propietario.usuario.nombre}{' '}
                          {publicacion.inmueble.propietario.usuario.apellido}
                        </h3>
                        {publicacion.inmueble.propietario.estado_verificacion === 'verificado' && (
                          <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full text-[10px] font-semibold">
                            Propietario verificado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant">
                        {publicacion.inmueble.propietario.usuario.total_evaluaciones_como_propietario > 0
                          ? `${publicacion.inmueble.propietario.usuario.calificacion_promedio_como_propietario.toFixed(1)}/5 como propietario · ${publicacion.inmueble.propietario.usuario.total_evaluaciones_como_propietario} evaluación(es)`
                          : 'Aún sin evaluaciones como propietario'}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-on-surface-variant">
                        <span className="text-status-success flex items-center gap-1">
                          <CheckCircle2 size={12} /> Perfil de propietario Rentify
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-primary mb-3">Acerca de este espacio</h2>
                <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                  {publicacion.descripcion}
                </p>
              </div>

              {/* Amenidades */}
              {publicacion.inmueble.caracteristicas.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-primary">Amenidades y comodidades</h2>
                    <span className="text-xs text-on-surface-variant">
                      {publicacion.inmueble.caracteristicas.length} características
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {publicacion.inmueble.caracteristicas.map((ic) => {
                      const Icono = ICONOS_CARACTERISTICAS[ic.caracteristica.nombre] || CheckCircle2
                      return (
                        <div
                          key={ic.caracteristica_id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-surface-canvas"
                        >
                          <Icono size={22} className="text-secondary flex-shrink-0" />
                          <span className="text-sm font-medium text-on-surface">
                            {ic.caracteristica.nombre}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Términos económicos */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-primary mb-2">Términos económicos claros</h2>
                <p className="text-xs text-on-surface-variant mb-4">
                  Rentify elimina las letras pequeñas. Estos son los montos exactos sin aval tradicional.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-surface-canvas p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-on-surface">Renta Mensual</span>
                      <span className="text-base font-bold text-primary">
                        ${publicacion.precio_renta.toLocaleString()} MXN
                      </span>
                    </div>
                  </div>
                  <div className="bg-surface-canvas p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-on-surface">Depósito en Garantía</span>
                      <span className="text-base font-bold text-primary">
                        ${publicacion.deposito.toLocaleString()} MXN
                      </span>
                    </div>
                  </div>
                  <div className="bg-surface-canvas p-4 rounded-xl md:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-on-surface">Servicios</span>
                      <span className="text-sm font-semibold text-secondary">
                        {publicacion.inmueble.servicios_incluidos || 'A cargo del inquilino'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-surface-canvas p-4 rounded-xl md:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-on-surface">Plazo mínimo</span>
                      <span className="text-sm font-semibold text-primary">
                        {publicacion.inmueble.plazo_minimo_meses} meses
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reglas */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-primary mb-3">Reglas de convivencia</h2>
                <p className="mb-3 text-sm text-on-surface-variant">
                  Mascotas: {publicacion.permite_mascotas ? 'permitidas' : 'no permitidas'} ·
                  Niños: {publicacion.permite_ninos ? 'permitidos' : 'no permitidos'}
                </p>
                {publicacion.reglas && (
                  <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                    {publicacion.reglas}
                  </p>
                )}
              </div>

              {/* Reseñas */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Star size={28} className="fill-rating-gold text-rating-gold" />
                  <div>
                    <span className="text-2xl font-bold text-primary">{calificacion.toFixed(2)}</span>
                    <p className="text-xs text-on-surface-variant">
                      Basado en {totalResenas} {totalResenas === 1 ? 'estancia' : 'estancias'} registradas
                    </p>
                  </div>
                </div>
                {evaluacionesInmueble.length === 0 ? (
                  <p className="text-sm text-on-surface-variant italic">
                    Aún no hay evaluaciones de rentas finalizadas para esta propiedad.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {evaluacionesInmueble.map((evaluacion) => (
                      <div key={evaluacion.id} className="p-4 rounded-xl bg-surface-canvas">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-bold">
                            {evaluacion.usuario_evaluador.nombre.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-on-surface">
                              {evaluacion.usuario_evaluador.nombre} {evaluacion.usuario_evaluador.apellido}
                            </p>
                            <p className="text-[11px] text-on-surface-variant">
                              {new Date(evaluacion.fecha_evaluacion).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex text-rating-gold mb-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={i < Math.round(evaluacion.calificacion) ? 'fill-rating-gold' : 'text-gray-300'}
                            />
                          ))}
                        </div>
                        {evaluacion.comentario && (
                          <p className="text-xs text-on-surface-variant leading-relaxed">
                            {evaluacion.comentario}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ubicación con mapa real */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-primary mb-2">Explora el vecindario</h2>
                <p className="text-xs text-on-surface-variant mb-4">
                  {ubicacionAproximada}
                </p>

                {publicacion.inmueble.latitud && publicacion.inmueble.longitud ? (
                  <MapaPropiedad
                    latitud={aproximarCoordenada(publicacion.inmueble.latitud)}
                    longitud={aproximarCoordenada(publicacion.inmueble.longitud)}
                    direccion={ubicacionAproximada}
                    tipoInmueble={publicacion.inmueble.tipo_inmueble}
                  />
                ) : (
                  <div className="w-full h-64 rounded-xl bg-surface-container flex items-center justify-center">
                    <p className="text-sm text-on-surface-variant">
                      Ubicación aproximada no disponible
                    </p>
                  </div>
                )}

              </div>
            </div>

            {/* Columna derecha: Sticky card */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-2xl p-6 shadow-xl flex flex-col gap-4 sticky top-24">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-primary">
                      ${publicacion.precio_renta.toLocaleString()}
                    </span>
                    <span className="text-sm text-on-surface-variant">MXN / mes</span>
                  </div>
                  {publicacion.inmueble.mantenimiento_incluido && (
                    <span className="px-2 py-1 rounded-md bg-secondary-container text-on-secondary-container text-[10px] font-semibold">
                      Mantenimiento incluido
                    </span>
                  )}
                </div>

                <div className="bg-surface-canvas p-3 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">1er mes de renta</span>
                    <span className="font-medium text-on-surface">
                      ${publicacion.precio_renta.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Depósito en garantía</span>
                    <span className="font-medium text-on-surface">
                      ${publicacion.deposito.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-px bg-gray-200 my-1" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-primary font-semibold">Total inicial</span>
                    <span className="text-base font-bold text-primary">
                      ${(publicacion.precio_renta + publicacion.deposito).toLocaleString()}
                    </span>
                  </div>
                </div>

                {publicacion.estado === 'activa' &&
                publicacion.inmueble.estado_inventario === 'disponible' ? (
                  <>
                    <SolicitarRentaButton
                      publicacionId={publicacion.id}
                      titulo={publicacion.inmueble.tipo_inmueble}
                      disponibilidad={disponibilidadVisitas}
                      usuarioNombre={usuario?.nombre && usuario?.apellido ? `${usuario.nombre} ${usuario.apellido}` : undefined}
                      usuarioTelefono={usuario?.telefono || undefined}
                    />
                    <p className="text-center text-[11px] text-on-surface-variant">
                      Rentify no procesa pagos ni sustituye un contrato de arrendamiento.
                    </p>
                  </>
                ) : (
                  <p className="rounded-xl bg-surface-canvas p-3 text-center text-sm font-medium text-on-surface-variant">
                    Esta propiedad no está disponible actualmente.
                  </p>
                )}

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-on-surface-variant mb-2">Propietario</p>
                  <p className="font-semibold text-primary">
                    {publicacion.inmueble.propietario.usuario.nombre}{' '}
                    {publicacion.inmueble.propietario.usuario.apellido}
                  </p>
                  {publicacion.inmueble.propietario.estado_verificacion === 'verificado' ? (
                    <span className="text-xs text-status-success flex items-center gap-1 mt-1">
                      <CheckCircle2 size={12} /> Verificado
                    </span>
                  ) : (
                    <span className="text-xs text-yellow-600 mt-1 inline-block">
                      Verificación pendiente
                    </span>
                  )}
                </div>

                {solicitudAprobada && (
                  <div className="rounded-xl bg-surface-container p-3">
                    <p className="text-xs font-semibold text-primary">Contacto del propietario</p>
                    <p className="mt-1 text-[11px] text-on-surface-variant">
                      Disponible porque tu solicitud fue aprobada.
                    </p>
                    <div className="mt-2 flex flex-col gap-1 text-sm">
                      <a
                        href={`mailto:${publicacion.inmueble.propietario.usuario.correo}`}
                        className="text-secondary underline"
                      >
                        {publicacion.inmueble.propietario.usuario.correo}
                      </a>
                      {publicacion.inmueble.propietario.usuario.telefono && (
                        <a
                          href={`tel:${publicacion.inmueble.propietario.usuario.telefono}`}
                          className="text-secondary underline"
                        >
                          {publicacion.inmueble.propietario.usuario.telefono}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Botón reportar en móvil */}
                {usuario && !esPropietario && (
                  <div className="md:hidden pt-3 border-t border-gray-100 flex justify-center">
                    <BotonReportar publicacionId={publicacion.id} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}