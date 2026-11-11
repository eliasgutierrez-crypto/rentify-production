export function obtenerUrlAplicacion(): string {
  const urlConfigurada = process.env.NEXT_PUBLIC_APP_URL?.trim()
  const esVercel = process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV)
  const hostVercel =
    process.env.VERCEL_ENV === 'production'
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
      : process.env.VERCEL_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL
  const urlVercel = hostVercel
    ? hostVercel.startsWith('http')
      ? hostVercel
      : `https://${hostVercel}`
    : undefined
  const urlConfiguradaLocal =
    urlConfigurada && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i.test(urlConfigurada)
  const url = esVercel && urlConfiguradaLocal
    ? urlVercel || urlConfigurada
    : urlConfigurada || urlVercel || 'http://localhost:3000'
  const urlValidada = new URL(url)

  if (!['http:', 'https:'].includes(urlValidada.protocol) || (esVercel && urlValidada.protocol !== 'https:')) {
    throw new Error('NEXT_PUBLIC_APP_URL debe ser una URL pública http o https.')
  }

  return urlValidada.origin
}
