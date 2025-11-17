import { Route } from '@/types'
import { generateSlug } from '@/lib/utils'
import { sampleTrekkingRoutes, sampleFerratas } from './data'
import { getRouteTrack } from './tracks'

// Función helper para crear rutas completas con IDs y slugs
function createRoutes(
  routes: Omit<Route, 'id' | 'slug' | 'createdAt' | 'updatedAt'>[]
): Route[] {
  const now = new Date().toISOString()
  return routes.map((route, index) => {
    const slug = generateSlug(route.title)
    const track = getRouteTrack(slug)
    return {
      ...route,
      id: `route-${index + 1}`,
      slug,
      track, // Añadir el track desde tracks.ts si existe
      createdAt: now,
      updatedAt: now,
    }
  })
}

// Funciones que leen los datos dinámicamente para que los cambios se reflejen automáticamente
function getTrekkingRoutes(): Route[] {
  return createRoutes(sampleTrekkingRoutes)
}

function getFerratas(): Route[] {
  return createRoutes(sampleFerratas)
}

function getAllRoutes(): Route[] {
  return [...getTrekkingRoutes(), ...getFerratas()]
}

// Exportar como funciones para forzar recarga en cada acceso
export const allTrekkingRoutes = getTrekkingRoutes()
export const allFerratas = getFerratas()
export const allRoutes: Route[] = getAllRoutes()

// Funciones getter que recargan los datos cada vez
export function getTrekkingRoutesFresh(): Route[] {
  return getTrekkingRoutes()
}

export function getFerratasFresh(): Route[] {
  return getFerratas()
}

export function getAllRoutesFresh(): Route[] {
  return getAllRoutes()
}

export function getRouteBySlug(slug: string, type?: 'trekking' | 'ferrata'): Route | undefined {
  const routes = type === 'trekking' 
    ? getTrekkingRoutes()
    : type === 'ferrata' 
    ? getFerratas()
    : getAllRoutes()
  return routes.find(r => r.slug === slug)
}

export function getRoutesByType(type: 'trekking' | 'ferrata'): Route[] {
  return type === 'trekking' ? getTrekkingRoutes() : getFerratas()
}

