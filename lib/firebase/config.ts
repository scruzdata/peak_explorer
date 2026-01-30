// Configuración de Firebase/Firestore
// OPTIMIZACIÓN: Lazy loading de Firebase para evitar cargar código no usado en la landing
import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAuth, Auth } from 'firebase/auth'

// Configuración de Firebase desde variables de entorno
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

/**
 * Verifica si Firebase está configurado correctamente
 */
export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.projectId &&
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain
  )
}

// OPTIMIZACIÓN: Variables lazy para inicializar Firebase solo cuando se necesite
let app: FirebaseApp | null = null
let dbInstance: Firestore | null = null
let authInstance: Auth | null = null

/**
 * Inicializa Firebase de forma lazy (solo cuando se necesita)
 * Esto evita cargar Firebase en la landing page si no se usa
 */
function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }
  }
  return app
}

/**
 * Obtiene la instancia de Firestore de forma lazy
 * OPTIMIZACIÓN: Solo inicializa Firebase cuando realmente se necesita
 */
export function getDb(): Firestore {
  if (!dbInstance) {
    // Verificar que Firebase esté configurado antes de inicializar
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase no está configurado. Verifica las variables de entorno NEXT_PUBLIC_FIREBASE_*.')
    }
    dbInstance = getFirestore(getFirebaseApp())
  }
  return dbInstance
}

/**
 * Obtiene la instancia de Auth de forma lazy
 * OPTIMIZACIÓN: Solo inicializa Firebase cuando realmente se necesita
 */
export function getAuthInstance(): Auth {
  if (!authInstance) {
    // Verificar que Firebase esté configurado antes de inicializar
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase no está configurado. Verifica las variables de entorno NEXT_PUBLIC_FIREBASE_*.')
    }
    authInstance = getAuth(getFirebaseApp())
  }
  return authInstance
}

// OPTIMIZACIÓN: Inicializar Firebase cuando se importa este módulo
// Esto mantiene el lazy loading porque la landing page no importa módulos de Firebase directamente
// Solo se inicializa cuando se importa desde routes.ts, blogs.ts, etc. (que usan dynamic import)
//
// IMPORTANTE: La optimización real está en que la landing page usa dynamic import de Firebase
// (ver app/page.tsx getAllBlogsLazy()), por lo que este módulo solo se carga cuando se necesita
//
// Si Firebase no está configurado, intentar inicializar de todas formas (las variables pueden estar
// disponibles en runtime aunque no en build time). Si falla, el código que usa estos módulos debe
// manejar el error (como en routes.ts con try/catch)

// Inicializar Firebase cuando se accede a db o auth
// Usar try/catch para manejar el caso donde Firebase no esté configurado
let _db: Firestore
let _auth: Auth

try {
  _db = getDb()
  _auth = getAuthInstance()
} catch (error) {
  // Si Firebase no está configurado, crear instancias dummy
  // Esto permitirá que el código se compile pero fallará en runtime con un error claro
  // cuando se intente usar collection(db, ...) u otras funciones
  console.warn('⚠️ Firebase no está configurado. Las funciones de Firebase no funcionarán.')
  console.warn('Error:', error instanceof Error ? error.message : error)
  // Crear objetos que fallarán al usarse pero permitirán que el código se compile
  _db = {} as Firestore
  _auth = {} as Auth
}

export const db: Firestore = _db
export const auth: Auth = _auth

export default getFirebaseApp

