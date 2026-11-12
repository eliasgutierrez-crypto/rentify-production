// Purpose: Captura credenciales y presenta el resultado del inicio de sesion.
'use client'

import Image from 'next/image'
import { useActionState, useState } from 'react'
import Link from 'next/link'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Key,
  UserCheck,
} from 'lucide-react'
import { loginAction, FormState } from '@/app/actions/auth'

const initialState: FormState = {}

export default function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState)
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [emailValid, setEmailValid] = useState(false)
  const [rolSeleccionado, setRolSeleccionado] = useState<'inquilino' | 'propietario'>('inquilino')

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setEmailValid(val.includes('@') && val.includes('.') && val.length > 5)
  }

  return (
    <main className="min-h-screen bg-surface flex flex-col justify-center items-center py-8 px-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Columna izquierda: Branding (solo desktop) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 rounded-xl bg-primary text-white relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary opacity-95 -z-10" />

          <svg
            className="absolute -right-12 -bottom-12 w-80 h-80 text-white/10 pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            viewBox="0 0 200 200"
          >
            <circle cx="100" cy="100" r="80" strokeDasharray="4 4" />
            <rect height="130" rx="8" width="130" x="35" y="35" />
            <line x1="35" x2="165" y1="100" y2="100" />
            <line x1="100" x2="100" y1="35" y2="165" />
            <circle cx="100" cy="100" r="30" />
          </svg>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Building2 size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold uppercase tracking-wider">Rentify</span>
          </div>

          <div className="my-8 space-y-5">
            <div className="relative w-full h-56 rounded-xl overflow-hidden shadow-md">
              <Image
                src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Imagen ilustrativa de un apartamento"
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                <div>
                  <p className="text-[11px] text-white/80">Imagen ilustrativa</p>
                  <p className="text-sm font-semibold">Espacios en Guadalajara</p>
                </div>
              </div>
            </div>

            <blockquote>
              <p className="text-sm text-white/90 leading-relaxed">
                Consulta propiedades, administra solicitudes y organiza las visitas desde tu cuenta.
              </p>
            </blockquote>
          </div>

          <div className="pt-4 grid grid-cols-2 gap-3 bg-white/5 p-4 rounded-xl backdrop-blur-sm">
            <div>
              <span className="text-xl font-bold text-white block">Solicitudes</span>
              <span className="text-[11px] text-white/70">Consulta su estado desde el dashboard</span>
            </div>
            <div>
              <span className="text-xl font-bold text-white block">Revisión</span>
              <span className="text-[11px] text-white/70">Los anuncios nuevos requieren aprobación</span>
            </div>
          </div>
        </div>

        {/* Columna derecha: Formulario */}
        <div className="col-span-1 lg:col-span-7 bg-white rounded-xl p-6 sm:p-10 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <Link href="/" className="flex items-center gap-2 lg:hidden">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Building2 size={16} className="text-white" />
                </div>
                <span className="text-sm font-bold uppercase tracking-wider text-primary">
                  Rentify
                </span>
              </Link>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
              Bienvenido de nuevo a Rentify
            </h1>
            <p className="text-sm text-on-surface-variant mt-1.5">
              Ingresa a tu cuenta para gestionar tus rentas, solicitudes y propiedades guardadas.
            </p>

            {/* Selector de rol (visual) */}
            <div className="mt-6 p-1 bg-surface-container-low rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setRolSeleccionado('inquilino')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  rolSeleccionado === 'inquilino'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <Key size={14} />
                Soy Inquilino
              </button>
              <button
                type="button"
                onClick={() => setRolSeleccionado('propietario')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  rolSeleccionado === 'propietario'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <UserCheck size={14} />
                Soy Propietario
              </button>
            </div>

            <div className="relative my-6 flex items-center justify-center">
              <div className="w-full h-px bg-gray-200" />
              <span className="absolute bg-white px-3 text-[11px] text-on-surface-variant uppercase tracking-wider">
                o ingresa con tu correo
              </span>
            </div>

            <form action={formAction} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-primary" htmlFor="email">
                  Correo electrónico
                </label>
                <div className="relative rounded-xl overflow-hidden shadow-sm bg-surface-canvas focus-within:bg-white focus-within:shadow-md transition-all">
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-3 text-on-surface-variant pointer-events-none"
                  />
                  <input
                    id="email"
                    name="correo"
                    type="email"
                    required
                    onChange={handleEmailChange}
                    placeholder="ejemplo@correo.com"
                    className="w-full bg-transparent pl-11 pr-10 py-3 text-on-surface text-sm placeholder:text-gray-400 outline-none"
                  />
                  {emailValid && (
                    <CheckCircle2
                      size={18}
                      className="absolute right-3.5 top-3 text-status-success"
                    />
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-primary" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative rounded-xl overflow-hidden shadow-sm bg-surface-canvas focus-within:bg-white focus-within:shadow-md transition-all">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-3 text-on-surface-variant pointer-events-none"
                  />
                  <input
                    id="password"
                    name="contrasena"
                    type={mostrarPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    className="w-full bg-transparent pl-11 pr-11 py-3 text-on-surface text-sm placeholder:text-gray-400 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-3.5 top-3 text-on-surface-variant hover:text-primary transition"
                  >
                    {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Recordar / Recuperar */}
              <div className="flex items-center justify-between pt-1 pb-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded accent-secondary cursor-pointer"
                  />
                  <span className="text-[11px] text-on-surface-variant">
                    Recordar mi sesión
                  </span>
                </label>
                <Link
                  href="/recuperar"
                  className="text-[11px] text-secondary hover:text-primary font-medium transition"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {(state?.error || initialError) && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {state?.error || initialError}
                </div>
              )}
              {state?.success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
                  {state.mensaje}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3.5 px-6 rounded-xl bg-primary hover:bg-secondary text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  'Iniciando sesión...'
                ) : (
                  <>
                    Iniciar sesión
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 pt-6 space-y-4">
            <div className="text-center text-sm text-on-surface-variant">
              ¿Aún no tienes una cuenta en Rentify?{' '}
              <Link
                href="/registro"
                className="text-secondary hover:text-primary underline font-semibold transition"
              >
                Regístrate aquí
              </Link>
            </div>

            <div className="flex items-center justify-center gap-4 text-center text-[11px] text-on-surface-variant">
              <Link href="/seguridad" className="hover:text-primary hover:underline transition">
                Términos y Condiciones
              </Link>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <Link href="/seguridad" className="hover:text-primary hover:underline transition">
                Aviso de Privacidad
              </Link>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="text-[11px] text-gray-400 mb-2">
                Credenciales de prueba (contraseña: test123):
              </p>
              <div className="text-[11px] text-gray-500 space-y-1">
                <p><strong>Propietario:</strong> carlos@rentify.com</p>
                <p><strong>Inquilino + Propietario:</strong> ana@rentify.com</p>
                <p><strong>Admin:</strong> admin@rentify.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}