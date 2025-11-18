// Funciones para gestionar rutas en Firestore
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
  orderBy,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from './config'
import { Route, RouteType } from '@/types'
import { generateSlug } from '@/lib/utils'

const ROUTES_COLLECTION = 'routes'

/**
 * Convierte un documento de Firestore a Route
 */
function firestoreToRoute(docData: any, id: string): Route {
  const data = docData.data()
  return {
    id,
    slug: data.slug || generateSlug(data.title),
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
  } as Route
}

/**
 * Elimina campos undefined de un objeto (Firestore no acepta undefined)
 */
function removeUndefinedFields(obj: any, depth = 0): any {
  // Prevenir recursión infinita
  if (depth > 10) {
    return null
  }
  
  if (obj === null) {
    return null
  }
  
  if (obj === undefined) {
    return null
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedFields(item, depth + 1)).filter(item => item !== undefined)
  }
  
  if (obj instanceof Date) {
    return Timestamp.fromDate(obj)
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
 * Convierte un Route a formato Firestore
 */
function routeToFirestore(route: Omit<Route, 'id' | 'slug' | 'createdAt' | 'updatedAt'>): any {
  const now = Timestamp.now()
  const routeData = {
    ...route,
    createdAt: now,
    updatedAt: now,
  }
  
  // Limpiar campos undefined antes de guardar
  return removeUndefinedFields(routeData)
}

/**
 * Obtiene todas las rutas desde Firestore
 */
export async function getAllRoutesFromFirestore(): Promise<Route[]> {
  try {
    const routesRef = collection(db, ROUTES_COLLECTION)
    
    // Intentar ordenar por createdAt, pero si falla (por falta de índice), obtener sin ordenar
    let querySnapshot
    try {
      const q = query(routesRef, orderBy('createdAt', 'desc'))
      querySnapshot = await getDocs(q)
    } catch (orderError: any) {
      // Si falla el orderBy (probablemente falta índice), obtener sin ordenar
      console.warn('No se pudo ordenar por createdAt, obteniendo sin orden:', orderError.message)
      querySnapshot = await getDocs(routesRef)
    }
    
    return querySnapshot.docs.map((doc) => firestoreToRoute(doc, doc.id))
  } catch (error) {
    console.error('❌ Error obteniendo rutas desde Firestore:', error)
    return []
  }
}

/**
 * Obtiene rutas por tipo desde Firestore
 */
export async function getRoutesByTypeFromFirestore(type: RouteType): Promise<Route[]> {
  try {
    const routesRef = collection(db, ROUTES_COLLECTION)
    
    // Intentar ordenar por createdAt, pero si falla (por falta de índice), obtener sin ordenar
    let querySnapshot
    try {
      const q = query(
        routesRef,
        where('type', '==', type),
        orderBy('createdAt', 'desc')
      )
      querySnapshot = await getDocs(q)
    } catch (orderError: any) {
      // Si falla el orderBy (probablemente falta índice compuesto), obtener sin ordenar
      console.warn(`No se pudo ordenar por createdAt para tipo ${type}, obteniendo sin orden:`, orderError.message)
      const q = query(
        routesRef,
        where('type', '==', type)
      )
      querySnapshot = await getDocs(q)
    }
    
    return querySnapshot.docs.map((doc) => firestoreToRoute(doc, doc.id))
  } catch (error) {
    console.error(`Error obteniendo rutas de tipo ${type} desde Firestore:`, error)
    return []
  }
}

/**
 * Obtiene una ruta por slug desde Firestore
 */
export async function getRouteBySlugFromFirestore(
  slug: string,
  type?: RouteType
): Promise<Route | null> {
  try {
    const routesRef = collection(db, ROUTES_COLLECTION)
    const constraints: QueryConstraint[] = [where('slug', '==', slug)]
    
    if (type) {
      constraints.push(where('type', '==', type))
    }
    
    const q = query(routesRef, ...constraints)
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }
    
    const doc = querySnapshot.docs[0]
    return firestoreToRoute(doc, doc.id)
  } catch (error) {
    console.error(`Error obteniendo ruta con slug ${slug} desde Firestore:`, error)
    return null
  }
}

/**
 * Obtiene una ruta por ID desde Firestore
 */
export async function getRouteByIdFromFirestore(id: string): Promise<Route | null> {
  try {
    const routeRef = doc(db, ROUTES_COLLECTION, id)
    const routeSnap = await getDoc(routeRef)
    
    if (!routeSnap.exists()) {
      return null
    }
    
    return firestoreToRoute(routeSnap, routeSnap.id)
  } catch (error) {
    console.error(`Error obteniendo ruta con ID ${id} desde Firestore:`, error)
    return null
  }
}

/**
 * Crea una nueva ruta en Firestore
 */
export async function createRouteInFirestore(
  routeData: Omit<Route, 'id' | 'slug' | 'createdAt' | 'updatedAt'>
): Promise<string | null> {
  try {
    const slug = generateSlug(routeData.title)
    const routeRef = collection(db, ROUTES_COLLECTION)
    
    // Convertir a formato Firestore (ya limpia undefined)
    const firestoreData = {
      ...routeToFirestore(routeData),
      slug,
    }
    
    const docRef = await addDoc(routeRef, firestoreData)
    
    console.log(`✅ Ruta creada exitosamente con ID: ${docRef.id}`)
    return docRef.id
  } catch (error: any) {
    console.error('Error creando ruta en Firestore:', error)
    console.error('Detalles del error:', {
      code: error?.code,
      message: error?.message,
      stack: error?.stack,
    })
    throw error // Lanzar el error para que el formulario pueda manejarlo
  }
}

/**
 * Verifica si un ID es de Firestore (IDs de Firestore son strings aleatorios, no "route-X")
 */
function isFirestoreId(id: string): boolean {
  // Los IDs de Firestore son strings aleatorios de ~20 caracteres
  // Los IDs de datos estáticos son "route-1", "route-2", etc.
  return !id.startsWith('route-') && id.length > 10
}

/**
 * Actualiza una ruta existente en Firestore
 */
export async function updateRouteInFirestore(
  id: string,
  routeData: Partial<Omit<Route, 'id' | 'slug' | 'createdAt' | 'updatedAt'>>
): Promise<boolean> {
  try {
    console.log(`🔄 Intentando actualizar ruta con ID: ${id}`)
    
    // Si el ID no es de Firestore, buscar la ruta por slug en su lugar
    if (!isFirestoreId(id)) {
      console.warn(`⚠️  ID "${id}" parece ser de datos estáticos. Buscando por slug...`)
      
      // Intentar encontrar la ruta por slug si tenemos el título
      if (routeData.title) {
        const slug = generateSlug(routeData.title)
        const existingRoute = await getRouteBySlugFromFirestore(slug)
        
        if (existingRoute) {
          console.log(`✅ Ruta encontrada por slug, actualizando con ID de Firestore: ${existingRoute.id}`)
          // Usar el ID real de Firestore
          id = existingRoute.id
        } else {
          // Si no existe en Firestore, crear una nueva
          console.log(`📝 Ruta no existe en Firestore, creando nueva...`)
          const fullRouteData = {
            ...routeData,
            title: routeData.title || 'Ruta sin título',
            type: routeData.type || 'trekking',
            difficulty: routeData.difficulty || 'Moderada',
            distance: routeData.distance || 0,
            elevation: routeData.elevation || 0,
            duration: routeData.duration || '',
            orientation: routeData.orientation || '',
            status: routeData.status || 'Abierta',
            location: routeData.location || {
              region: '',
              province: '',
              coordinates: { lat: 0, lng: 0 },
            },
            heroImage: routeData.heroImage || {
              url: '',
              alt: '',
              width: 1200,
              height: 800,
            },
            gallery: routeData.gallery || [],
            features: routeData.features || [],
            bestSeason: routeData.bestSeason || [],
            safetyTips: routeData.safetyTips || [],
            equipment: routeData.equipment || [],
            accommodations: routeData.accommodations || [],
            seo: routeData.seo || {
              metaTitle: '',
              metaDescription: '',
              keywords: [],
            },
            storytelling: routeData.storytelling || '',
          } as Omit<Route, 'id' | 'slug' | 'createdAt' | 'updatedAt'>
          
          const newId = await createRouteInFirestore(fullRouteData)
          return !!newId
        }
      } else {
        throw new Error('No se puede actualizar una ruta de datos estáticos sin título')
      }
    }
    
    const routeRef = doc(db, ROUTES_COLLECTION, id)
    
    // Verificar que el documento existe
    const routeSnap = await getDoc(routeRef)
    if (!routeSnap.exists()) {
      console.error(`❌ Ruta con ID ${id} no existe en Firestore`)
      throw new Error(`La ruta con ID ${id} no existe en Firestore`)
    }
    
    console.log(`✅ Ruta encontrada: ${routeSnap.data().title}`)
    
    // Preparar datos de actualización (excluir createdAt, id, slug se regenera si cambia el título)
    const updateData: any = {
      ...routeData,
      updatedAt: Timestamp.now(),
    }
    
    // Eliminar campos que no deben actualizarse
    delete updateData.id
    delete updateData.createdAt
    
    // Si se actualiza el título, regenerar el slug
    if (routeData.title) {
      updateData.slug = generateSlug(routeData.title)
      console.log(`📝 Nuevo slug generado: ${updateData.slug}`)
    }
    
    // Limpiar campos undefined antes de actualizar
    const cleanedData = removeUndefinedFields(updateData)
    
    console.log(`💾 Actualizando con datos:`, Object.keys(cleanedData))
    
    await updateDoc(routeRef, cleanedData)
    console.log(`✅ Ruta ${id} actualizada exitosamente`)
    return true
  } catch (error: any) {
    console.error(`❌ Error actualizando ruta ${id} en Firestore:`, error)
    console.error('Detalles del error:', {
      code: error?.code,
      message: error?.message,
      stack: error?.stack,
    })
    throw error // Lanzar el error para que el formulario pueda manejarlo
  }
}

/**
 * Elimina una ruta de Firestore
 */
export async function deleteRouteFromFirestore(id: string): Promise<boolean> {
  try {
    console.log(`🗑️  Eliminando ruta con ID: ${id}`)
    const routeRef = doc(db, ROUTES_COLLECTION, id)
    
    // Verificar que el documento existe antes de eliminarlo
    const routeSnap = await getDoc(routeRef)
    if (!routeSnap.exists()) {
      console.error(`❌ Ruta con ID ${id} no existe en Firestore`)
      return false
    }
    
    console.log(`✅ Ruta encontrada: ${routeSnap.data().title}, eliminando...`)
    await deleteDoc(routeRef)
    console.log(`✅ Ruta ${id} eliminada exitosamente`)
    return true
  } catch (error: any) {
    console.error(`❌ Error eliminando ruta ${id} de Firestore:`, error)
    console.error('Detalles del error:', {
      code: error?.code,
      message: error?.message,
      stack: error?.stack,
    })
    throw error // Lanzar el error para que el AdminPanel pueda manejarlo
  }
}

/**
 * Incrementa el contador de visualizaciones de una ruta
 */
export async function incrementRouteViews(id: string): Promise<void> {
  try {
    const routeRef = doc(db, ROUTES_COLLECTION, id)
    const routeSnap = await getDoc(routeRef)
    
    if (routeSnap.exists()) {
      const currentViews = routeSnap.data().views || 0
      await updateDoc(routeRef, {
        views: currentViews + 1,
      })
    }
  } catch (error) {
    console.error(`Error incrementando visualizaciones de ruta ${id}:`, error)
  }
}

/**
 * Incrementa el contador de descargas de una ruta
 */
export async function incrementRouteDownloads(id: string): Promise<void> {
  try {
    const routeRef = doc(db, ROUTES_COLLECTION, id)
    const routeSnap = await getDoc(routeRef)
    
    if (routeSnap.exists()) {
      const currentDownloads = routeSnap.data().downloads || 0
      await updateDoc(routeRef, {
        downloads: currentDownloads + 1,
      })
    }
  } catch (error) {
    console.error(`Error incrementando descargas de ruta ${id}:`, error)
  }
}

