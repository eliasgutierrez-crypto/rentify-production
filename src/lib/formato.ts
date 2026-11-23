export function formatearFecha(valor: Date | string): string {
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return ''

  const dia = String(fecha.getUTCDate()).padStart(2, '0')
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0')
  return `${dia}/${mes}/${fecha.getUTCFullYear()}`
}

export function formatearImporte(valor: number): string {
  if (!Number.isFinite(valor)) return '0'
  return Math.round(valor).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
