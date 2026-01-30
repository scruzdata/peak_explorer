import { Route } from '@/types'
import { generateSlug, calculateDistance } from '@/lib/utils'
import { sampleTrekkingRoutes, sampleFerratas } from './data'
import { getRouteTrack } from './tracks'

// OPTIMIZACIÓN: Lazy loading de getTrackByRouteSlug - Firebase solo se carga cuando se necesita
async function getTrackByRouteSlugLazy(slug: string) {
  try {
    const { getTrackByRouteSlug } = await import('./firebase/tracks')
    return await getTrackByRouteSlug(slug)
  } catch (error) {
    console.error('Error cargando track desde Firebase:', error)
    return null
  }
}

// Función helper para verificar si Firestore está disponible
async function getFirestoreRoutes() {
  try {
    // Importación dinámica para evitar errores si Firebase no está configurado
    const firestoreRoutesModule = await import('./firebase/routes')
    return firestoreRoutesModule
  } catch (error) {
    return null
  }
}

// Verificar si Firebase está configurado
function isFirestoreConfigured(): boolean {
  if (typeof window !== 'undefined') {
    const projectId = (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
                      (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process?.env?.NEXT_PUBLIC_FIREBASE_PROJECT_ID) ||
                      undefined
    return !!projectId
  }
  
  try {
    const processEnv = (globalThis as any).process?.env
    const projectId = processEnv?.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    return !!projectId
  } catch {
    return false
  }
}

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

// Funciones async para obtener rutas desde Firestore
async function getTrekkingRoutesFromFirestore(): Promise<Route[]> {
  if (!isFirestoreConfigured()) {
    throw new Error('Firestore no está configurado')
  }
  
  const firestoreRoutes = await getFirestoreRoutes()
  if (!firestoreRoutes) {
    throw new Error('No se pudo cargar módulo de Firestore')
  }
  
  const routes = await firestoreRoutes.getRoutesByTypeFromFirestore('trekking')
  
  // OPTIMIZACIÓN: Lazy loading de tracks desde Firebase
  const routesWithTracks = await Promise.all(
    routes.map(async (route) => {
      const track = await getTrackByRouteSlugLazy(route.slug)
      return {
        ...route,
        track: track || undefined,
      }
    })
  )
  
  return routesWithTracks
}

async function getFerratasFromFirestore(): Promise<Route[]> {
  if (!isFirestoreConfigured()) {
    throw new Error('Firestore no está configurado')
  }
  
  const firestoreRoutes = await getFirestoreRoutes()
  if (!firestoreRoutes) {
    throw new Error('No se pudo cargar módulo de Firestore')
  }
  
  const routes = await firestoreRoutes.getRoutesByTypeFromFirestore('ferrata')
  
  // OPTIMIZACIÓN: Lazy loading de tracks desde Firebase
  const routesWithTracks = await Promise.all(
    routes.map(async (route) => {
      const track = await getTrackByRouteSlugLazy(route.slug)
      return {
        ...route,
        track: track || undefined,
      }
    })
  )
  
  return routesWithTracks
}

async function getAllRoutesFromFirestore(): Promise<Route[]> {
  const firestoreRoutes = await getFirestoreRoutes()
  if (!firestoreRoutes) {
    throw new Error('No se pudo cargar módulo de Firestore')
  }
  
  const routes = await firestoreRoutes.getAllRoutesFromFirestore()
  
  // OPTIMIZACIÓN: Lazy loading de tracks desde Firebase
  const routesWithTracks = await Promise.all(
    routes.map(async (route) => {
      const track = await getTrackByRouteSlugLazy(route.slug)
      return {
        ...route,
        track: track || undefined,
      }
    })
  )
  
  return routesWithTracks
}

// Exportar como funciones para forzar recarga en cada acceso (sincrónicas para compatibilidad)
export const allTrekkingRoutes = getTrekkingRoutes()
export const allFerratas = getFerratas()
export const allRoutes: Route[] = getAllRoutes()

// Funciones getter que recargan los datos cada vez (sincrónicas - compatibilidad)
export function getTrekkingRoutesFresh(): Route[] {
  return getTrekkingRoutes()
}

export function getFerratasFresh(): Route[] {
  return getFerratas()
}

export function getAllRoutesFresh(): Route[] {
  return getAllRoutes()
}

// Funciones async para obtener desde Firestore (usar en Server Components)
// Si Firestore está configurado, SOLO usa Firestore (sin fallback a datos estáticos)
export async function getTrekkingRoutesAsync(): Promise<Route[]> {
  if (!isFirestoreConfigured()) {
    return getTrekkingRoutes()
  }
  
  try {
    return await getTrekkingRoutesFromFirestore()
  } catch (error) {
    console.error('Error obteniendo rutas de trekking de Firestore:', error)
    return []
  }
}

export async function getFerratasAsync(): Promise<Route[]> {
  if (!isFirestoreConfigured()) {
    return getFerratas()
  }
  
  try {
    return await getFerratasFromFirestore()
  } catch (error) {
    console.error('Error obteniendo ferratas de Firestore:', error)
    return []
  }
}

export async function getAllRoutesAsync(): Promise<Route[]> {
  if (!isFirestoreConfigured()) {
    return getAllRoutes()
  }
  
  try {
    return await getAllRoutesFromFirestore()
  } catch (error) {
    console.error('Error obteniendo rutas de Firestore:', error)
    return []
  }
}

export function getRouteBySlug(slug: string, type?: 'trekking' | 'ferrata'): Route | undefined {
  const routes = type === 'trekking' 
    ? getTrekkingRoutes()
    : type === 'ferrata' 
    ? getFerratas()
    : getAllRoutes()
  return routes.find(r => r.slug === slug)
}

// Función async para obtener ruta por slug desde Firestore
// Si Firestore está configurado, SOLO busca en Firestore
export async function getRouteBySlugAsync(
  slug: string,
  type?: 'trekking' | 'ferrata'
): Promise<Route | null> {
  if (!isFirestoreConfigured()) {
    // Solo usar datos estáticos si Firestore NO está configurado
    return getRouteBySlug(slug, type) || null
  }
  
  try {
    const firestoreRoutes = await getFirestoreRoutes()
    if (!firestoreRoutes) {
      console.warn('No se pudo cargar módulo de Firestore')
      return null // No hacer fallback, devolver null
    }
    
    const route = await firestoreRoutes.getRouteBySlugFromFirestore(slug, type)
    if (route) {
      // OPTIMIZACIÓN: Lazy loading de track desde Firebase
      const track = await getTrackByRouteSlugLazy(route.slug)
      return {
        ...route,
        track: track || undefined,
      }
    }
    return null
  } catch (error) {
    console.error(`Error obteniendo ruta con slug ${slug} desde Firestore:`, error)
    return null // No hacer fallback, devolver null
  }
}

export function getRoutesByType(type: 'trekking' | 'ferrata'): Route[] {
  return type === 'trekking' ? getTrekkingRoutes() : getFerratas()
}

/**
 * Función específica para el admin que SIEMPRE obtiene de Firestore (sin fallback a datos estáticos)
 */
export async function getAllRoutesForAdmin(): Promise<Route[]> {
  try {
    const firestoreRoutes = await getFirestoreRoutes()
    if (!firestoreRoutes) {
      throw new Error('Firestore no está disponible')
    }
    
    const routes = await firestoreRoutes.getAllRoutesFromFirestore()
    
    // OPTIMIZACIÓN: Lazy loading de tracks desde Firebase
    const routesWithTracks = await Promise.all(
      routes.map(async (route) => {
        const track = await getTrackByRouteSlugLazy(route.slug)
        return {
          ...route,
          track: track || undefined,
        }
      })
    )
    
    return routesWithTracks
  } catch (error) {
    console.error('Error obteniendo rutas para admin:', error)
    return []
  }
}

/**
 * Obtiene rutas recientes por tipo excluyendo la ruta actual
 */
export async function getRecentRoutesAsync(
  excludeRouteId: string,
  type: 'trekking' | 'ferrata',
  limit: number = 6
): Promise<Route[]> {
  if (!isFirestoreConfigured()) {
    // Si no hay Firestore, devolver array vacío
    return []
  }
  
  try {
    const firestoreRoutes = await getFirestoreRoutes()
    if (!firestoreRoutes) {
      return []
    }
    
    const routes = await firestoreRoutes.getRecentRoutesFromFirestore(excludeRouteId, type, limit)
    
    // OPTIMIZACIÓN: Lazy loading de tracks desde Firebase
    const routesWithTracks = await Promise.all(
      routes.map(async (route) => {
        const track = await getTrackByRouteSlugLazy(route.slug)
        return {
          ...route,
          track: track || undefined,
        }
      })
    )
    
    return routesWithTracks
  } catch (error) {
    console.error(`Error obteniendo rutas recientes de tipo ${type}:`, error)
    return []
  }
}

/**
 * Obtiene las rutas más cercanas por distancia a una ruta de referencia
 */
export async function getClosestRoutesAsync(
  referenceRoute: Route,
  limit: number = 6
): Promise<Route[]> {
  try {
    // Obtener todas las rutas del mismo tipo
    const allRoutes = referenceRoute.type === 'trekking'
      ? await getTrekkingRoutesAsync()
      : await getFerratasAsync()
    
    // Filtrar la ruta actual y calcular distancias
    const routesWithDistance = allRoutes
      .filter(route => route.id !== referenceRoute.id)
      .map(route => {
        const distance = calculateDistance(
          referenceRoute.location.coordinates.lat,
          referenceRoute.location.coordinates.lng,
          route.location.coordinates.lat,
          route.location.coordinates.lng
        )
        return { route, distance }
      })
      .sort((a, b) => a.distance - b.distance) // Ordenar por distancia ascendente
      .slice(0, limit) // Limitar al número solicitado
      .map(item => item.route) // Extraer solo las rutas
    
    return routesWithDistance
  } catch (error) {
    console.error(`Error obteniendo rutas más cercanas:`, error)
    return []
  }
}

// Exportar funciones de Firestore para uso en admin
export {
  createRouteInFirestore,
  updateRouteInFirestore,
  deleteRouteFromFirestore,
  getRouteByIdFromFirestore,
  incrementRouteViews,
  incrementRouteDownloads,
} from './firebase/routes'

