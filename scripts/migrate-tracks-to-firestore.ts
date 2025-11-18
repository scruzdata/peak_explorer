// Script para migrar tracks desde tracks.ts a Firestore
// Ejecutar con: npx tsx scripts/migrate-tracks-to-firestore.ts

import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, addDoc, updateDoc, query, getDocs, where, Timestamp } from 'firebase/firestore'
import { TrackPoint } from '../lib/tracks'

// Cargar variables de entorno desde .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// También intentar cargar desde .env si existe
config({ path: resolve(process.cwd(), '.env') })

// Configuración de Firebase (debe coincidir con lib/firebase/config.ts)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Verificar que todas las variables de entorno estén configuradas
const requiredVars = [
  { key: 'NEXT_PUBLIC_FIREBASE_API_KEY', value: firebaseConfig.apiKey, name: 'API Key' },
  { key: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', value: firebaseConfig.authDomain, name: 'Auth Domain' },
  { key: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', value: firebaseConfig.projectId, name: 'Project ID' },
  { key: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', value: firebaseConfig.storageBucket, name: 'Storage Bucket' },
  { key: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', value: firebaseConfig.messagingSenderId, name: 'Messaging Sender ID' },
  { key: 'NEXT_PUBLIC_FIREBASE_APP_ID', value: firebaseConfig.appId, name: 'App ID' },
]

const missingVars = requiredVars.filter(v => !v.value || v.value.trim() === '')

if (missingVars.length > 0) {
  console.error('❌ Error: Variables de entorno de Firebase no configuradas\n')
  console.error('Las siguientes variables están faltando o están vacías:')
  missingVars.forEach(v => {
    console.error(`   - ${v.key} (${v.name})`)
  })
  console.error('')
  console.error('Por favor, crea un archivo .env.local en la raíz del proyecto con:')
  console.error('')
  console.error('NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key')
  console.error('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com')
  console.error('NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id')
  console.error('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com')
  console.error('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id')
  console.error('NEXT_PUBLIC_FIREBASE_APP_ID=tu-app-id')
  console.error('')
  console.error('💡 Puedes obtener estas credenciales en Firebase Console:')
  console.error('   https://console.firebase.google.com/')
  console.error('   Configuración del proyecto > Tus aplicaciones > Web')
  console.error('')
  console.error('📝 Nota: Asegúrate de que el archivo .env.local esté en la raíz del proyecto')
  console.error('   y que las variables comiencen con NEXT_PUBLIC_')
  process.exit(1)
}

// Validar formato de API Key (debe comenzar con "AIza")
if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('AIza')) {
  console.warn('⚠️  Advertencia: La API Key no tiene el formato esperado (debe comenzar con "AIza")')
  console.warn('   Verifica que hayas copiado correctamente la API Key desde Firebase Console')
  console.warn('')
}

// Verificar configuración de Firebase
console.log('🔍 Verificando configuración de Firebase...')
console.log(`   Project ID: ${firebaseConfig.projectId}`)
console.log(`   Auth Domain: ${firebaseConfig.authDomain}`)
console.log('')

// Inicializar Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const TRACKS_COLLECTION = 'tracks'

/**
 * Limpia datos para Firestore (elimina undefined)
 */
function cleanForFirestore(obj: any, depth = 0): any {
  if (depth > 10) {
    return null
  }
  
  if (obj === null || obj === undefined) {
    return null
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanForFirestore(item, depth + 1)).filter(item => item !== undefined)
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
    
    const cleanedValue = cleanForFirestore(value, depth + 1)
    if (cleanedValue !== undefined) {
      cleaned[key] = cleanedValue
    }
  }
  
  return cleaned
}

/**
 * Verifica si un track ya existe en Firestore y devuelve su referencia
 */
async function getExistingTrack(routeSlug: string): Promise<{ exists: boolean; docId?: string }> {
  try {
    const tracksRef = collection(db, TRACKS_COLLECTION)
    const q = query(tracksRef, where('routeSlug', '==', routeSlug))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return { exists: false }
    }
    
    return { exists: true, docId: querySnapshot.docs[0].id }
  } catch (error) {
    console.error(`Error verificando existencia de track ${routeSlug}:`, error)
    return { exists: false }
  }
}

/**
 * Guarda o actualiza un track en Firestore
 */
async function saveTrack(routeSlug: string, points: TrackPoint[]): Promise<boolean> {
  try {
    const existing = await getExistingTrack(routeSlug)
    
    const trackData = {
      routeSlug,
      points: cleanForFirestore(points),
      updatedAt: Timestamp.now(),
    }
    
    if (existing.exists && existing.docId) {
      // Actualizar track existente
      const trackDocRef = doc(db, TRACKS_COLLECTION, existing.docId)
      await updateDoc(trackDocRef, trackData)
      console.log(`   ✅ Actualizado: ${routeSlug}`)
      return true
    } else {
      // Crear nuevo track
      const trackDataWithCreated = {
        ...trackData,
        createdAt: Timestamp.now(),
      }
      const tracksRef = collection(db, TRACKS_COLLECTION)
      await addDoc(tracksRef, cleanForFirestore(trackDataWithCreated))
      console.log(`   ✅ Creado: ${routeSlug}`)
      return true
    }
  } catch (error: any) {
    console.error(`   ❌ Error guardando track ${routeSlug}:`, error.message)
    return false
  }
}

/**
 * Función principal de migración
 */
async function migrateTracks() {
  try {
    console.log('🚀 Iniciando migración de tracks a Firestore...\n')
    
    // Importar tracks dinámicamente
    const { routeTracks } = await import('../lib/tracks')
    
    const totalTracks = Object.keys(routeTracks).length
    console.log(`📊 Total de tracks a migrar: ${totalTracks}\n`)
    
    if (totalTracks === 0) {
      console.log('⚠️  No hay tracks para migrar')
      return
    }
    
    // Verificar tracks existentes
    let existingCount = 0
    for (const routeSlug of Object.keys(routeTracks)) {
      const existing = await getExistingTrack(routeSlug)
      if (existing.exists) {
        existingCount++
      }
    }
    
    if (existingCount > 0) {
      console.log(`⚠️  Se encontraron ${existingCount} tracks existentes que serán actualizados\n`)
    }
    
    // Migrar todos los tracks
    console.log('📦 Migrando tracks...\n')
    let successCount = 0
    let errorCount = 0
    
    for (const [routeSlug, points] of Object.entries(routeTracks)) {
      console.log(`   Procesando: ${routeSlug} (${points.length} puntos)`)
      const success = await saveTrack(routeSlug, points)
      
      if (success) {
        successCount++
      } else {
        errorCount++
      }
    }
    
    console.log(`\n✅ Migración completada: ${successCount} exitosos, ${errorCount} errores`)
    console.log(`\n💡 Próximos pasos:`)
    console.log(`   1. Verifica los datos en Firebase Console`)
    console.log(`   2. Actualiza las reglas de seguridad si es necesario`)
    console.log(`   3. El código ya está configurado para leer desde Firestore con fallback a datos locales`)
    
  } catch (error: any) {
    console.error('\n❌ Error durante la migración:', error)
    console.error('Detalles:', {
      code: error?.code,
      message: error?.message,
      stack: error?.stack,
    })
    process.exit(1)
  }
}

// Ejecutar migración
migrateTracks()
  .then(() => {
    console.log('\n✨ Proceso finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error)
    process.exit(1)
  })

