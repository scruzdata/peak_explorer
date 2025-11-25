/**
 * Tracks de las rutas extraídos de archivos GPX
 * Cada track está asociado a una ruta mediante su slug
 */

export interface TrackPoint {
  lat: number
  lng: number
  elevation: number
}

export type TrackId = string

export const routeTracks: Record<TrackId, TrackPoint[]> = {
  // Track de la Ruta del Cares - Garganta Divina
  'ruta-del-cares-garganta-divina': []
}

/**
 * Obtiene el track de una ruta por su slug
 */
export function getRouteTrack(slug: string): TrackPoint[] | undefined {
  return routeTracks[slug]
}
