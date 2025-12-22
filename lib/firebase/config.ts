// Configuración de Firebase/Firestore
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

// Inicializar Firebase solo si no está ya inicializado
let app: FirebaseApp
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

// Inicializar servicios
export const db: Firestore = getFirestore(app)
export const auth: Auth = getAuth(app)

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

export default app

