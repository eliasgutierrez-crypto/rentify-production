// Purpose: Pagina de Next.js para la ruta /login.
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import LoginForm from './LoginForm'

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ correo?: string }>
}) {
  const usuario = await getCurrentUser()
  if (usuario) redirect(usuario.administrador ? '/dashboard/admin' : '/dashboard')

  const { correo } = await searchParams
  const initialError =
    correo === 'error'
      ? 'El enlace de correo no es válido o expiró. Solicita uno nuevo.'
      : correo === 'cuenta'
        ? 'No se encontró un perfil activo asociado a este correo.'
        : undefined

  return <LoginForm initialError={initialError} />
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ correo?: string }>
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-surface flex items-center justify-center">
          <div className="h-10 w-48 animate-pulse rounded bg-gray-200" />
        </main>
      }
    >
      <LoginContent searchParams={searchParams} />
    </Suspense>
  )
}
