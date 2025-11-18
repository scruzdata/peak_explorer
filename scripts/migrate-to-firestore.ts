// Script para migrar datos desde data.ts a Firestore
// Ejecutar con: npx tsx scripts/migrate-to-firestore.ts

import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, query, getDocs, where } from 'firebase/firestore'
import { sampleTrekkingRoutes, sampleFerratas } from '../lib/data'
import { generateSlug } from '../lib/utils'

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

// Verificar que las variables de entorno estén configuradas
if (!firebaseConfig.projectId) {
  console.error('❌ Error: Variables de entorno de Firebase no configuradas\n')
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
  process.exit(1)
}

// Verificar configuración de Firebase
console.log('🔍 Verificando configuración de Firebase...')
console.log(`   Project ID: ${firebaseConfig.projectId}`)
console.log(`   Auth Domain: ${firebaseConfig.authDomain}`)
console.log('')

// Inicializar Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

/**
 * Valida y limpia datos para Firestore
 * Firestore no acepta: undefined, funciones, símbolos, objetos Date sin convertir
 */
function cleanForFirestore(obj: any, depth = 0): any {
  // Prevenir recursión infinita
  if (depth > 10) {
    console.warn('⚠️  Profundidad máxima alcanzada en limpieza de datos')
    return null
  }
  
  // Manejar null y undefined
  if (obj === null) {
    return null
  }
  
  if (obj === undefined) {
    return null // Firestore no acepta undefined, convertir a null
  }
  
  // Manejar arrays
  if (Array.isArray(obj)) {
    return obj.map(item => cleanForFirestore(item, depth + 1)).filter(item => item !== undefined)
  }
  
  // Manejar objetos Date
  if (obj instanceof Date) {
    return obj.toISOString()
  }
  
  // Manejar tipos primitivos
  if (typeof obj !== 'object') {
    // Rechazar funciones y símbolos
    if (typeof obj === 'function' || typeof obj === 'symbol') {
      return null
    }
    return obj
  }
  
  // Manejar objetos
  const cleaned: any = {}
  for (const [key, value] of Object.entries(obj)) {
    // Saltar campos undefined
    if (value === undefined) {
      continue
    }
    
    // Limpiar el valor recursivamente
    const cleanedValue = cleanForFirestore(value, depth + 1)
    
    // Solo añadir si el valor limpio no es undefined
    if (cleanedValue !== undefined) {
      cleaned[key] = cleanedValue
    }
  }
  
  return cleaned
}

/**
 * Valida que los datos sean compatibles con Firestore
 */
function validateFirestoreData(data: any, routeTitle: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  try {
    // Intentar serializar para detectar problemas
    const jsonString = JSON.stringify(data, (key, value) => {
      if (value === undefined) {
        errors.push(`Campo "${key}" tiene valor undefined`)
        return null
      }
      if (typeof value === 'function') {
        errors.push(`Campo "${key}" es una función`)
        return null
      }
      if (typeof value === 'symbol') {
        errors.push(`Campo "${key}" es un símbolo`)
        return null
      }
      return value
    })
    
    // Verificar tamaño (Firestore tiene límite de 1MB por documento)
    const sizeInBytes = new Blob([jsonString]).size
    const sizeInMB = sizeInBytes / (1024 * 1024)
    
    if (sizeInMB > 1) {
      errors.push(`Documento demasiado grande: ${sizeInMB.toFixed(2)}MB (máximo 1MB)`)
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  } catch (error: any) {
    errors.push(`Error al validar: ${error.message}`)
    return {
      valid: false,
      errors
    }
  }
}

/**
 * Convierte una ruta a formato Firestore
 */
function routeToFirestore(route: any) {
  const now = new Date().toISOString()
  const slug = generateSlug(route.title)
  
  // Crear objeto sin el campo track (se carga dinámicamente desde tracks.ts)
  const { track, ...routeWithoutTrack } = route
  
  const routeData = {
    ...routeWithoutTrack,
    slug,
    createdAt: now,
    updatedAt: now,
    views: route.views || 0,
    downloads: route.downloads || 0,
  }
  
  // Limpiar y validar datos para Firestore
  const cleanedData = cleanForFirestore(routeData)
  
  return cleanedData
}

/**
 * Verifica si una ruta ya existe en Firestore
 */
async function routeExists(slug: string): Promise<boolean> {
  try {
    const routesRef = collection(db, 'routes')
    const q = query(routesRef, where('slug', '==', slug))
    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  } catch (error: any) {
    // Si es un error de conexión, asumir que no existe para intentar crear
    if (error?.code === 'not-found' || error?.code === 'unavailable') {
      console.warn(`⚠️  Advertencia: No se pudo verificar si la ruta existe (${error.code})`)
      return false
    }
    console.error('Error verificando si la ruta existe:', error)
    return false
  }
}

/**
 * Migra las rutas a Firestore
 */
async function migrateRoutes() {
  console.log('🚀 Iniciando migración a Firestore...\n')
  
  const allRoutes = [
    ...sampleTrekkingRoutes.map(r => ({ ...r, type: 'trekking' })),
    ...sampleFerratas.map(r => ({ ...r, type: 'ferrata' })),
  ]
  
  let migrated = 0
  let skipped = 0
  let errors = 0
  
  for (const route of allRoutes) {
    const slug = generateSlug(route.title)
    
    try {
      // Verificar si la ruta ya existe
      if (await routeExists(slug)) {
        console.log(`⏭️  Saltando: ${route.title} (ya existe)`)
        skipped++
        continue
      }
      
      // Convertir y añadir a Firestore
      const routeData = routeToFirestore(route)
      const routesRef = collection(db, 'routes')
      
      // Validar datos antes de guardar
      const validation = validateFirestoreData(routeData, route.title)
      
      if (!validation.valid) {
        console.error(`❌ Error de validación para ${route.title}:`)
        validation.errors.forEach(err => console.error(`   - ${err}`))
        errors++
        continue
      }
      
      // Intentar guardar
      await addDoc(routesRef, routeData)
      
      console.log(`✅ Migrada: ${route.title}`)
      migrated++
    } catch (error: any) {
      console.error(`❌ Error migrando "${route.title}":`)
      
      if (error?.code === 'not-found') {
        console.error('   Tipo: Error de conexión con Firestore')
        console.error('   Verifica que:')
        console.error('   1. Firestore esté habilitado en Firebase Console')
        console.error('   2. El PROJECT_ID sea correcto')
        console.error('   3. Tengas conexión a Internet')
        console.error(`   Detalles: ${error.message}`)
      } else if (error?.code === 'invalid-argument') {
        console.error('   Tipo: Datos inválidos')
        console.error(`   Mensaje: ${error.message}`)
        console.error('   Posibles causas:')
        console.error('   - Campos undefined o null en lugares no permitidos')
        console.error('   - Tipos de datos no soportados')
        console.error('   - Estructura de datos incorrecta')
        
        // Intentar mostrar qué campo causa el problema
        if (error.message) {
          const fieldMatch = error.message.match(/field (\w+)/i)
          if (fieldMatch) {
            console.error(`   Campo problemático: ${fieldMatch[1]}`)
          }
        }
      } else if (error?.code === 'permission-denied') {
        console.error('   Tipo: Permiso denegado')
        console.error('   Verifica las reglas de seguridad en Firestore')
        console.error(`   Detalles: ${error.message}`)
      } else {
        console.error(`   Tipo: Error desconocido`)
        console.error(`   Código: ${error?.code || 'N/A'}`)
        console.error(`   Mensaje: ${error?.message || error}`)
        if (error?.stack) {
          console.error(`   Stack: ${error.stack.split('\n')[0]}`)
        }
      }
      
      errors++
    }
  }
  
  console.log('\n📊 Resumen de migración:')
  console.log(`   ✅ Migradas: ${migrated}`)
  console.log(`   ⏭️  Saltadas: ${skipped}`)
  console.log(`   ❌ Errores: ${errors}`)
  console.log(`   📝 Total procesadas: ${allRoutes.length}`)
  
  if (errors === 0) {
    console.log('\n🎉 ¡Migración completada exitosamente!')
  } else {
    console.log('\n⚠️  Migración completada con errores')
  }
}

// Ejecutar migración
migrateRoutes()
  .then(() => {
    console.log('\n✅ Script finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error)
    process.exit(1)
  })

