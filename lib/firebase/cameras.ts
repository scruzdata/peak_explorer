import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from './config'

export interface DgtCameraData {
  latitud: string
  longitud: string
  imagen: string
  carretera: string
  pk: string
  provincia: string
  source: string
}

const EXTRA_CAMERAS: DgtCameraData[] = [
  {
    latitud: '40.823691',
    longitud: '-3.9617929',
    imagen: 'https://meteocercedilla.com/webcams/webcamnorte.jpg',
    carretera: 'Venta Marcelino Norte',
    pk: '',
    provincia: '',
    source: 'Venta marcelino',
  },
  {
    latitud: '40.823436',
    longitud: '-3.962318',
    imagen: 'https://meteocercedilla.com/webcams/webcamoeste.jpg',
    carretera: 'Venta Marcelino Oeste',
    pk: '',
    provincia: '',
    source: 'Venta marcelino',
  },
  {
    latitud: '40.823291',
    longitud: '-3.961610',
    imagen: 'https://meteocercedilla.com/webcams/webcamsur.jpg',
    carretera: 'Venta Marcelino Sur',
    pk: '',
    provincia: '',
    source: 'Venta marcelino',
  },
  {
    latitud: '43.258343',
    longitud: '-4.830722',
    imagen: 'https://rtsp.me/embed/f63Za2K6/',
    carretera: 'Ruta del Cares',
    pk: '',
    provincia: '',
    source: 'rtsp',
  },
  {
    latitud: '43.350604',
    longitud: '-5.132046',
    imagen: 'https://rtsp.me/embed/8A6sRKZG/',
    carretera: 'Cangas de Onís',
    pk: '',
    provincia: '',
    source: 'rtsp',
  },
  {
    latitud: '43.154034',
    longitud: '-4.805420',
    imagen: 'https://cantur.com/camaras/home/cantucom/public.html/camaras/fuentede.jpg',
    carretera: 'Fuente Dé',
    pk: '',
    provincia: '',
    source: 'cantur.com',
  },
  {
    latitud: '40.738776',
    longitud: '-3.878280',
    imagen: 'https://meteosierra.com/cams/pedriza/thumb.jpg',
    carretera: 'La Pedriza',
    pk: '',
    provincia: '',
    source: 'meteosierra.com',
  },
]

export async function getCamerasFromFirestore(): Promise<DgtCameraData[]> {
  try {
    const snap = await getDoc(doc(db, 'config', 'dgt-cameras'))
    if (!snap.exists()) return []
    return (snap.data().items as DgtCameraData[]) ?? []
  } catch (error) {
    console.error('Error loading cameras from Firestore:', error)
    return []
  }
}

/** Returns DGT cameras from Firestore merged with the hardcoded extra cameras. */
export async function getAllCameras(): Promise<DgtCameraData[]> {
  const dgt = await getCamerasFromFirestore()
  return [...dgt, ...EXTRA_CAMERAS]
}

export async function saveCamerasToFirestore(cameras: DgtCameraData[]): Promise<void> {
  await setDoc(doc(db, 'config', 'dgt-cameras'), {
    items: cameras,
    updatedAt: Timestamp.now(),
  })
}
