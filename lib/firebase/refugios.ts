// Funciones para gestionar refugios en Firestore
import {
  collection,
  getDocs,
  query,
} from 'firebase/firestore'
import { db } from './config'

const REFUGIOS_COLLECTION = 'refugios'

export interface Refugio {
  type: string
  id: number | string
  tags?: Record<string, any>
  location: {
    coordinates: {
      lat: number
      lng: number
    }
  }
  name: string
  elevation?: string
}

/**
 * Obtiene todos los refugios desde Firestore
 */
export async function getAllRefugios(): Promise<Refugio[]> {
  try {
    const refugiosRef = collection(db, REFUGIOS_COLLECTION)
    const querySnapshot = await getDocs(refugiosRef)
    
    const refugios: Refugio[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      // Validar que tenga location.coordinates con lat y lng
      if (data.location?.coordinates && 
          typeof data.location.coordinates.lat === 'number' && 
          typeof data.location.coordinates.lng === 'number') {
        refugios.push({
          ...data,
          id: doc.id,
        } as Refugio)
      }
    })
    
    return refugios
  } catch (error) {
    console.error('Error obteniendo refugios desde Firestore:', error)
    return []
  }
}
