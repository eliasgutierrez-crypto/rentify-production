// Purpose: Captura una calificacion y comentario de una renta finalizada.
'use client'

import { useActionState, useState } from 'react'
import { Star, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { crearEvaluacionAction, EvaluacionState } from '@/app/actions/evaluaciones'

const initialState: EvaluacionState = {}

interface Props {
  experienciaId: number
  tipo: 'inmueble' | 'propietario' | 'inquilino'
  titulo: string
  yaEvaluado: boolean
}

const criteriosPorTipo = {
  propietario: [
    { name: 'calificacion_atencion', label: 'Atención' },
    { name: 'calificacion_mantenimiento', label: 'Mantenimiento' },
    { name: 'calificacion_cumplimiento', label: 'Cumplimiento de acuerdos' },
  ],
  inquilino: [
    { name: 'calificacion_puntualidad', label: 'Puntualidad de pagos' },
    { name: 'calificacion_cuidado', label: 'Cuidado del inmueble' },
    { name: 'calificacion_higiene', label: 'Higiene' },
  ],
}

export default function EvaluacionForm({ experienciaId, tipo, titulo, yaEvaluado }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [calificacion, setCalificacion] = useState(0)
  const [calificaciones, setCalificaciones] = useState<Record<string, number>>({
    calificacion_atencion: 0,
    calificacion_mantenimiento: 0,
    calificacion_cumplimiento: 0,
    calificacion_puntualidad: 0,
    calificacion_cuidado: 0,
    calificacion_higiene: 0,
  })
  const [state, formAction, isPending] = useActionState(crearEvaluacionAction, initialState)
  const criterios = tipo === 'inmueble' ? [] : criteriosPorTipo[tipo]
  const promedioCriterios = criterios.length
    ? criterios.reduce((total, criterio) => total + calificaciones[criterio.name], 0) /
      criterios.length
    : calificacion
  const formularioValido = criterios.length
    ? criterios.every((criterio) => calificaciones[criterio.name] >= 1)
    : calificacion >= 1

  if (yaEvaluado) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold">
        <CheckCircle2 size={12} /> {titulo} ✓
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-secondary transition"
      >
        <Star size={12} /> {titulo}
      </button>

      {abierto && (
        <div
          className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setAbierto(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-primary">{titulo}</h3>
              <button onClick={() => setAbierto(false)} className="text-on-surface-variant">
                <X size={20} />
              </button>
            </div>

            {state?.success ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <CheckCircle2 size={18} /> {state.mensaje}
                </div>
                <button
                  onClick={() => setAbierto(false)}
                  className="w-full bg-primary text-white py-2.5 rounded-xl hover:bg-secondary font-semibold"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form action={formAction} className="space-y-4">
                <input type="hidden" name="experiencia_renta_id" value={experienciaId} />
                <input type="hidden" name="tipo_evaluacion" value={tipo} />
                {tipo === 'inmueble' ? (
                  <input type="hidden" name="calificacion" value={calificacion} />
                ) : (
                  criterios.map((criterio) => (
                    <input
                      key={criterio.name}
                      type="hidden"
                      name={criterio.name}
                      value={calificaciones[criterio.name]}
                    />
                  ))
                )}

                {tipo === 'inmueble' ? (
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-2">
                      Calificación del inmueble
                    </label>
                    <div className="flex gap-1 justify-center">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          aria-label={`${n} estrellas`}
                          aria-pressed={calificacion === n}
                          onClick={() => setCalificacion(n)}
                          className="p-1 transition"
                        >
                          <Star
                            size={32}
                            className={
                              n <= calificacion
                                ? 'fill-rating-gold text-rating-gold'
                                : 'text-gray-300'
                            }
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-center text-xs text-on-surface-variant mt-1">
                      {calificacion ? `${calificacion} de 5 estrellas` : 'Selecciona una calificación'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {criterios.map((criterio) => (
                      <fieldset key={criterio.name}>
                        <legend className="block text-sm font-semibold text-primary mb-1">
                          {criterio.label}
                        </legend>
                        <div className="flex gap-1" role="group" aria-label={criterio.label}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              aria-label={`${n} estrellas para ${criterio.label}`}
                              aria-pressed={calificaciones[criterio.name] === n}
                              onClick={() =>
                                setCalificaciones((actuales) => ({
                                  ...actuales,
                                  [criterio.name]: n,
                                }))
                              }
                              className="p-1 transition"
                            >
                              <Star
                                size={22}
                                className={
                                  n <= calificaciones[criterio.name]
                                    ? 'fill-rating-gold text-rating-gold'
                                    : 'text-gray-300'
                                }
                              />
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    ))}
                    <p className="text-center text-sm font-semibold text-primary">
                      {formularioValido
                        ? `Promedio: ${promedioCriterios.toFixed(2)} de 5`
                        : 'Califica todos los criterios para continuar'}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-primary mb-1.5">
                    Comentario (opcional)
                  </label>
                  <textarea
                    name="comentario"
                    rows={3}
                    placeholder="Comparte tu experiencia..."
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-canvas border border-gray-200 focus:ring-2 focus:ring-secondary outline-none text-sm resize-none"
                  />
                </div>

                {state?.error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {state.error}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAbierto(false)}
                    className="flex-1 border-2 border-gray-200 text-on-surface-variant py-2.5 rounded-xl hover:bg-gray-50 font-semibold text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !formularioValido}
                    className="flex-1 bg-primary text-white py-2.5 rounded-xl hover:bg-secondary font-semibold text-sm disabled:opacity-50"
                  >
                    {isPending ? 'Enviando...' : 'Enviar evaluación'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}