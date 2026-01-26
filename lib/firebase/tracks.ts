// Funciones para gestionar tracks en Firestore
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { db } from './config'
import { TrackPoint, TrackId } from '@/lib/tracks'

const TRACKS_COLLECTION = 'tracks'

/**
 * Verifica que Firestore esté disponible antes de realizar operaciones
 */
function ensureFirestoreAvailable(): void {
  if (!db) {
    throw new Error('Firestore no está configurado. Por favor, configura las variables de entorno de Firebase.')
  }
}

/**
 * Interfaz para el documento de track en Firestore
 */
export interface TrackDocument {
  routeSlug: string
  points: TrackPoint[]
  gpx?: string // GPX cacheado (opcional)
  createdAt: Timestamp
  updatedAt: Timestamp
}

/**
 * Convierte un documento de Firestore a TrackPoint[]
 */
function firestoreToTrack(docData: any): TrackPoint[] {
  const data = docData.data()
  return data.points || []
}

/**
 * Elimina campos undefined de un objeto (Firestore no acepta undefined)
 */
function removeUndefinedFields(obj: any, depth = 0): any {
  if (depth > 10) {
    return null
  }
  
  if (obj === null || obj === undefined) {
    return null
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedFields(item, depth + 1)).filter(item => item !== undefined)
  }
  
  if (typeof obj !== 'object') {
    if (typeof obj === 'function' || typeof obj === 'symbol') {
      return null
    }
    return obj
  }
  
  const cleaned: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue
    }
    
    const cleanedValue = removeUndefinedFields(value, depth + 1)
    if (cleanedValue !== undefined) {
      cleaned[key] = cleanedValue
    }
  }
  
  return cleaned
}

/**
 * Convierte un track a formato Firestore
 */
function trackToFirestore(routeSlug: string, points: TrackPoint[]): TrackDocument {
  const now = Timestamp.now()
  return {
    routeSlug,
    points,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Obtiene el track de una ruta por su slug desde Firestore
 */
export async function getTrackByRouteSlug(routeSlug: string): Promise<TrackPoint[] | null> {
  try {
    ensureFirestoreAvailable()
    const tracksRef = collection(db!, TRACKS_COLLECTION)
    const q = query(tracksRef, where('routeSlug', '==', routeSlug))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }
    
    const doc = querySnapshot.docs[0]
    return firestoreToTrack(doc)
  } catch (error) {
    console.error(`Error obteniendo track con slug ${routeSlug} desde Firestore:`, error)
    return null
  }
}

/**
 * Obtiene todos los tracks desde Firestore
 */
export async function getAllTracksFromFirestore(): Promise<Map<string, TrackPoint[]>> {
  try {
    ensureFirestoreAvailable()
    const tracksRef = collection(db!, TRACKS_COLLECTION)
    const querySnapshot = await getDocs(tracksRef)
    
    const tracksMap = new Map<string, TrackPoint[]>()
    querySnapshot.docs.forEach((doc) => {
      const data = doc.data()
      if (data.routeSlug && data.points) {
        tracksMap.set(data.routeSlug, data.points)
      }
    })
    
    return tracksMap
  } catch (error) {
    console.error('Error obteniendo tracks desde Firestore:', error)
    return new Map()
  }
}

/**
 * Crea o actualiza un track en Firestore
 */
export async function saveTrackInFirestore(
  routeSlug: string,
  points: TrackPoint[]
): Promise<string | null> {
  try {
    ensureFirestoreAvailable()
    const tracksRef = collection(db!, TRACKS_COLLECTION)
    
    // Verificar si ya existe un track para esta ruta
    const existingTrack = await getTrackByRouteSlug(routeSlug)
    
    if (existingTrack !== null) {
      // Actualizar track existente
      const q = query(tracksRef, where('routeSlug', '==', routeSlug))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref
        const updateData = {
          points: removeUndefinedFields(points),
          updatedAt: Timestamp.now(),
        }
        
        await updateDoc(docRef, updateData)
        console.log(`✅ Track actualizado para ruta: ${routeSlug}`)
        return docRef.id
      }
    }
    
    // Crear nuevo track
    const trackData = trackToFirestore(routeSlug, points)
    const cleanedData = removeUndefinedFields(trackData)
    
    const docRef = await addDoc(tracksRef, cleanedData)
    console.log(`✅ Track creado para ruta: ${routeSlug} con ID: ${docRef.id}`)
    return docRef.id
  } catch (error: any) {
    console.error(`Error guardando track para ruta ${routeSlug} en Firestore:`, error)
    console.error('Detalles del error:', {
      code: error?.code,
      message: error?.message,
      stack: error?.stack,
    })
    throw error
  }
}

/**
 * Elimina un track de Firestore por routeSlug
 */
export async function deleteTrackFromFirestore(routeSlug: string): Promise<boolean> {
  try {
    ensureFirestoreAvailable()
    const tracksRef = collection(db!, TRACKS_COLLECTION)
    const q = query(tracksRef, where('routeSlug', '==', routeSlug))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      console.warn(`⚠️  Track con routeSlug ${routeSlug} no existe en Firestore`)
      return false
    }
    
    const docRef = querySnapshot.docs[0].ref
    await deleteDoc(docRef)
    console.log(`✅ Track ${routeSlug} eliminado exitosamente`)
    return true
  } catch (error: any) {
    console.error(`Error eliminando track ${routeSlug} de Firestore:`, error)
    console.error('Detalles del error:', {
      code: error?.code,
      message: error?.message,
      stack: error?.stack,
    })
    throw error
  }
}

/**
 * Guarda todos los tracks de routeTracks en Firestore
 */
export async function migrateAllTracksToFirestore(): Promise<void> {
  try {
    const { routeTracks } = await import('@/lib/tracks')
    
    console.log(`📦 Iniciando migración de ${Object.keys(routeTracks).length} tracks a Firestore...`)
    
    let successCount = 0
    let errorCount = 0
    
    for (const [routeSlug, points] of Object.entries(routeTracks)) {
      try {
        await saveTrackInFirestore(routeSlug, points)
        successCount++
      } catch (error) {
        console.error(`❌ Error migrando track para ${routeSlug}:`, error)
        errorCount++
      }
    }
    
    console.log(`✅ Migración completada: ${successCount} exitosos, ${errorCount} errores`)
  } catch (error) {
    console.error('❌ Error en la migración de tracks:', error)
    throw error
  }
}

