export function obtenerUbicacionAproximada(direccion: string): string {
  const partes = direccion.split(',').map((parte) => parte.trim()).filter(Boolean)
  return partes.length > 1
    ? partes.slice(-2).join(', ')
    : 'Zona de Guadalajara, Jalisco'
}

export function aproximarCoordenada(coordenada: number): number {
  return Number(coordenada.toFixed(2))
}
