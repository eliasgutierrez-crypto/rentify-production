// Purpose: Pagina de Next.js para la ruta /dashboard/admin.
import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AdminTabs from './AdminTabs'
import type { PublicacionAdmin } from './TabModeracion'
import type { DocumentoAdmin } from './TabVerificaciones'
import type { ReporteAdmin } from './TabReportes'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'

async function AdminContent() {
  const usuario = await getCurrentUser()

  if (!usuario) redirect('/login')
  if (!usuario.administrador) redirect('/dashboard')

  const [
    totalUsuarios,
    totalInmuebles,
    publicacionesActivas,
    publicacionesPendientes,
    publicacionesSuspendidas,
    verificacionesPendientes,
    reportesPendientes,
    usuariosBloqueados,
    publicaciones,
    documentos,
    reportes,
  ] = await Promise.all([
    prisma.usuario.count(),
    prisma.inmueble.count(),
    prisma.publicacion.count({ where: { estado: 'activa' } }),
    prisma.publicacion.count({ where: { estado: 'pendiente_revision' } }),
    prisma.publicacion.count({ where: { estado: 'suspendida' } }),
    prisma.documento.count({ where: { estado: 'pendiente' } }),
    prisma.reporte.count({ where: { estado: 'pendiente' } }),
    prisma.usuario.count({ where: { bloqueado: true } }),
    prisma.publicacion.findMany({
      include: {
        inmueble: {
          include: {
            propietario: { include: { usuario: true } },
          },
        },
        fotos: { take: 1, orderBy: { orden: 'asc' } },
        _count: { select: { reportes: true } },
      },
      orderBy: { fecha_publicacion: 'desc' },
    }),
    prisma.documento.findMany({
      include: {
        usuario: {
          include: { propietario: true, inquilino: true },
        },
        inmueble: true,
      },
      orderBy: { fecha_carga: 'desc' },
    }),
    prisma.reporte.findMany({
      include: {
        usuario: true,
        publicacion: {
          include: {
            inmueble: {
              include: {
                propietario: { include: { usuario: true } },
              },
            },
          },
        },
      },
      orderBy: { fecha_reporte: 'desc' },
    }),
  ])

  let documentosFirmados = documentos
  if (documentos.some((documento) => !documento.ruta_archivo.startsWith('http'))) {
    const supabaseAdmin = createSupabaseAdminClient()
    documentosFirmados = await Promise.all(
      documentos.map(async (documento) => {
        if (documento.ruta_archivo.startsWith('http')) return documento

        const { data, error } = await supabaseAdmin.storage
          .from('rentify')
          .createSignedUrl(documento.ruta_archivo, 5 * 60)
        if (error || !data?.signedUrl) {
          console.error(`No se pudo generar acceso temporal al documento ${documento.id}:`, error)
          throw new Error('No se pudieron cargar los documentos privados para revisión.')
        }

        return { ...documento, ruta_archivo: data.signedUrl }
      })
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-secondary font-medium mb-4 hover:opacity-80 text-sm"
        >
          <ArrowLeft size={16} /> Volver al dashboard
        </Link>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <ShieldCheck size={28} /> Panel de Administración
        </h1>
        <p className="text-on-surface-variant mt-1">
          Bienvenido, {usuario.nombre}. Gestiona usuarios, contenido y reportes.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider">Usuarios</p>
          <p className="text-2xl font-bold text-primary mt-1">{totalUsuarios}</p>
          <p className="text-[11px] text-on-surface-variant mt-1">{usuariosBloqueados} bloqueados</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider">Inmuebles</p>
          <p className="text-2xl font-bold text-primary mt-1">{totalInmuebles}</p>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {publicacionesActivas} activos · {publicacionesPendientes} pendientes · {publicacionesSuspendidas} suspendidos
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider">Verificaciones</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{verificacionesPendientes}</p>
          <p className="text-[11px] text-on-surface-variant mt-1">pendientes</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider">Reportes</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{reportesPendientes}</p>
          <p className="text-[11px] text-on-surface-variant mt-1">pendientes</p>
        </div>
      </div>

      <AdminTabs
        publicaciones={publicaciones as PublicacionAdmin[]}
        documentos={documentosFirmados as DocumentoAdmin[]}
        reportes={reportes as ReporteAdmin[]}
      />
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded w-64 animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  )
}