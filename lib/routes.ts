import { Route } from '@/types'
import { generateSlug } from '@/lib/utils'
import { sampleTrekkingRoutes, sampleFerratas } from './data'
import { getRouteTrack } from './tracks'

// Función helper para verificar si Firestore está disponible
async function getFirestoreRoutes() {
  try {
    // Importación dinámica para evitar errores si Firebase no está configurado
    const module = await import('./firebase/routes')
    return module
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
  
  return routes.map(route => ({
    ...route,
    track: getRouteTrack(route.slug),
  }))
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
  
  return routes.map(route => ({
    ...route,
    track: getRouteTrack(route.slug),
  }))
}

async function getAllRoutesFromFirestore(): Promise<Route[]> {
  const firestoreRoutes = await getFirestoreRoutes()
  if (!firestoreRoutes) {
    throw new Error('No se pudo cargar módulo de Firestore')
  }
  
  const routes = await firestoreRoutes.getAllRoutesFromFirestore()
  
  return routes.map(route => ({
    ...route,
    track: getRouteTrack(route.slug),
  }))
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
      return {
        ...route,
        track: getRouteTrack(route.slug),
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
    
    return routes.map(route => ({
      ...route,
      track: getRouteTrack(route.slug),
    }))
  } catch (error) {
    console.error('Error obteniendo rutas para admin:', error)
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

