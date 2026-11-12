// Purpose: Pagina de Next.js para la ruta /seguridad.
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function SeguridadPage() {
  return (
    <main className="min-h-screen bg-[#F3F1EB]">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-[#3A4D39] font-medium">
            <ArrowLeft size={20} /> Volver
          </Link>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <ShieldCheck size={64} className="mx-auto text-[#3A4D39] mb-6" />
        <h1 className="text-3xl font-bold text-[#1F1F1F] mb-4">Seguridad y privacidad</h1>
        <div className="space-y-4 text-left text-gray-600">
          <p>
            Rentify no verifica automáticamente a todas las personas ni garantiza el resultado
            de una renta. Los documentos enviados para revisión deben ser validados manualmente
            por una cuenta administradora.
          </p>
          <p>
            El contacto del propietario se muestra al inquilino después de que su solicitud
            sea aprobada. Los documentos de identidad y propiedad no deben publicarse como
            imágenes de una ficha pública; el acceso seguro a los archivos también depende de
            configurar correctamente el almacenamiento privado del entorno.
          </p>
          <p>
            Rentify es un proyecto académico: no procesa pagos, no genera contratos y no
            sustituye la revisión legal de un arrendamiento.
          </p>
        </div>
      </div>
    </main>
  )
}