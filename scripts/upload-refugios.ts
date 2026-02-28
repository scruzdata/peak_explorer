/**
 * Script para subir refugios.json a Firestore en la colección "refugios"
 * Usa firebase-admin si hay serviceAccountKey.json, sino usa el SDK del cliente
 */
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Cargar variables de entorno desde .env.local o .env
const envLocalPath = path.join(process.cwd(), '.env.local')
const envPath = path.join(process.cwd(), '.env')

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath })
  console.log('✅ Variables de entorno cargadas desde .env.local')
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
  console.log('✅ Variables de entorno cargadas desde .env')
}

// Verificar si existe serviceAccountKey.json
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json')
const useAdmin = fs.existsSync(serviceAccountPath)

let db: any
let setDocFn: any
let docFn: any
let collectionFn: any
let deleteDocFn: any

if (useAdmin) {
  // Usar firebase-admin
  const admin = require('firebase-admin')
  const serviceAccount = require(serviceAccountPath)
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })
  }
  
  db = admin.firestore()
  setDocFn = async (ref: any, data: any) => await ref.set(data)
  docFn = (coll: any, id: string) => coll.doc(id)
  collectionFn = (name: string) => db.collection(name)
  deleteDocFn = async (ref: any) => await ref.delete()
  
  console.log('✅ Usando firebase-admin con serviceAccountKey.json')
} else {
  // Usar SDK del cliente
  const { initializeApp, getApps } = require('firebase/app')
  const { getFirestore, collection, doc, setDoc } = require('firebase/firestore')
  
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }
  
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  db = getFirestore(app)
  
  setDocFn = setDoc
  docFn = (coll: any, id: string) => doc(coll, id)
  collectionFn = (name: string) => collection(db, name)
  deleteDocFn = async (ref: any) => await setDoc(ref, {})
  
  console.log('✅ Usando SDK del cliente de Firebase')
}

/**
 * Elimina campos undefined y valores no válidos de un objeto (Firestore no acepta undefined)
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
    const cleaned = obj
      .map(item => removeUndefinedFields(item, depth + 1))
      .filter(item => {
        // Filtrar valores no válidos
        if (item === undefined) return false
        // Firestore acepta null en arrays, pero mejor filtrarlos para evitar problemas
        if (item === null) return false
        if (typeof item === 'function' || typeof item === 'symbol') return false
        if (typeof item === 'number' && (isNaN(item) || !isFinite(item))) return false
        return true
      })
    // Firestore acepta arrays vacíos, así que los mantenemos
    return cleaned
  }
  
  if (obj instanceof Date) {
    // Usar Timestamp según la librería que estemos usando
    if (useAdmin) {
      const admin = require('firebase-admin')
      return admin.firestore.Timestamp.fromDate(obj)
    } else {
      const { Timestamp } = require('firebase/firestore')
      return Timestamp.fromDate(obj)
    }
  }
  
  if (typeof obj !== 'object') {
    if (typeof obj === 'function' || typeof obj === 'symbol') {
      return null
    }
    // Validar números especiales
    if (typeof obj === 'number') {
      if (isNaN(obj) || !isFinite(obj)) {
        return null
      }
    }
    // Validar strings muy largos (Firestore tiene límite de 1MB por documento)
    if (typeof obj === 'string') {
      // Si el string es muy largo, truncarlo (límite conservador de 100KB por campo)
      if (obj.length > 100000) {
        return obj.substring(0, 100000) + '... [truncado]'
      }
    }
    return obj
  }
  
  const cleaned: any = {}
  for (const [key, value] of Object.entries(obj)) {
    // Saltar campos undefined
    if (value === undefined) {
      continue
    }
    
    // Validar nombre del campo (Firestore no permite ciertos caracteres al inicio)
    // Los nombres de campos no pueden empezar con ciertos caracteres especiales
    // Pero los dos puntos (:) están permitidos en nombres de campos
    if (key.startsWith('__') || key.length === 0) {
      continue
    }
    
    // Firestore tiene límites en la longitud de nombres de campos (1500 caracteres)
    if (key.length > 1500) {
      console.warn(`Campo con nombre muy largo ignorado: ${key.substring(0, 50)}...`)
      continue
    }
    
    // Limpiar el valor recursivamente
    const cleanedValue = removeUndefinedFields(value, depth + 1)
    
    // Solo añadir si el valor limpio no es undefined
    // Firestore acepta null, pero algunos contextos pueden tener problemas
    if (cleanedValue !== undefined) {
      // Si es null, convertirlo a string vacío o eliminarlo según el contexto
      if (cleanedValue === null) {
        // Para campos de texto, convertir null a string vacío
        // Para otros tipos, omitir el campo
        continue
      }
      cleaned[key] = cleanedValue
    }
  }
  
  return cleaned
}

async function uploadRefugios() {
  try {

    // Leer el archivo JSON
    const jsonPath = path.join(process.cwd(), 'refugios', 'refugios.json')
    const jsonData = fs.readFileSync(jsonPath, 'utf-8')
    const refugios = JSON.parse(jsonData)

    console.log(`Subiendo ${refugios.length} refugios a Firestore...`)

    // Subir cada refugio a Firestore
    let uploaded = 0
    let errors = 0

    for (let i = 0; i < refugios.length; i++) {
      const refugio = refugios[i]
      let cleanedRefugio: any = null
      try {
        // Limpiar el objeto refugio antes de subirlo
        cleanedRefugio = removeUndefinedFields(refugio)
        
        // Validar que tenga location.coordinates con lat y lng
        if (!cleanedRefugio.location?.coordinates || 
            typeof cleanedRefugio.location.coordinates.lat !== 'number' || 
            typeof cleanedRefugio.location.coordinates.lng !== 'number') {
          console.warn(`Refugio ${i + 1}/${refugios.length} (ID: ${refugio.id || 'sin ID'}) no tiene coordenadas válidas, saltando...`)
          errors++
          continue
        }
        
        // Convertir el ID a string si es un número muy grande
        let docId: string
        if (cleanedRefugio.id) {
          // Si el ID es un número muy grande, usar un hash o string
          if (typeof cleanedRefugio.id === 'number' && cleanedRefugio.id > Number.MAX_SAFE_INTEGER) {
            docId = `refugio_${cleanedRefugio.id}`
          } else {
            docId = String(cleanedRefugio.id)
          }
        } else {
          docId = `refugio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
        
        // Eliminar el campo id del objeto antes de subirlo (ya lo usamos como docId)
        // También eliminar cualquier otro campo que pueda causar problemas
        const { id, ...refugioData } = cleanedRefugio
        
        // Asegurar que no quede ningún campo 'id' en los datos
        if ('id' in refugioData) {
          delete refugioData.id
        }
        
        // Verificar que no hay campos numéricos llamados 'id' en objetos anidados
        const removeIdFields = (obj: any): any => {
          if (Array.isArray(obj)) {
            return obj.map(item => removeIdFields(item))
          }
          if (typeof obj === 'object' && obj !== null) {
            const cleaned: any = {}
            for (const [key, value] of Object.entries(obj)) {
              if (key === 'id' && typeof value === 'number') {
                // Omitir campos 'id' numéricos en objetos anidados
                continue
              }
              cleaned[key] = removeIdFields(value)
            }
            return cleaned
          }
          return obj
        }
        
        const refugioDataWithoutIds = removeIdFields(refugioData)
        
        // Validación final: limpiar una vez más para asegurar que no hay valores problemáticos
        const finalData = removeUndefinedFields(refugioDataWithoutIds, 0)
        
        // Verificar que no hay campos 'id'
        if ('id' in finalData) {
          delete finalData.id
        }
        
        // Asegurar que los datos están limpios usando JSON.parse(JSON.stringify())
        // Esto elimina cualquier valor no serializable
        const cleanDataForFirestore = JSON.parse(JSON.stringify(finalData))
        
        const refugioRef = docFn(collectionFn('refugios'), docId)
        await setDocFn(refugioRef, cleanDataForFirestore)
        uploaded++
        
        if (uploaded % 50 === 0) {
          console.log(`Progreso: ${uploaded}/${refugios.length} refugios subidos...`)
        }
      } catch (error: any) {
        console.error(`\n❌ Error subiendo refugio ${i + 1}/${refugios.length} (ID: ${refugio.id || 'sin ID'}):`)
        console.error(`   Mensaje: ${error?.message || error}`)
        if (error?.code) {
          console.error(`   Código: ${error.code}`)
        }
        errors++
      }
    }

    console.log(`\n✅ Completado:`)
    console.log(`   - Subidos: ${uploaded}`)
    console.log(`   - Errores: ${errors}`)
  } catch (error) {
    console.error('Error al subir refugios:', error)
    process.exit(1)
  }
}

uploadRefugios()
