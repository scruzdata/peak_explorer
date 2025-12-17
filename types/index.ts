export type Difficulty = 'Fácil' | 'Moderada' | 'Difícil' | 'Muy Difícil' | 'Extrema'
export type RouteType = 'trekking' | 'ferrata'
export type FerrataGrade = 'K1' | 'K2' | 'K3' | 'K4' | 'K5' | 'K6'
export type Season = 'Primavera' | 'Verano' | 'Otoño' | 'Invierno' | 'Todo el año'
export type RouteStatus = 'Abierta' | 'Cerrada' | 'Condicional' | 'Desconocido'
export type RouteTypeShape = 'Circular' | 'Inicio-Fin'
export type DogsAllowed = 'Sí' | 'No' | 'Sueltos' | 'Atados'

export interface RouteFeature {
  id: string
  name: string
  icon: string
}

export interface GPXData {
  url: string
  filename: string
  size: number
  points?: number
}

export interface ImageData {
  url: string
  alt: string
  width: number
  height: number
  lqip?: string // Low Quality Image Placeholder
}

export interface AffiliateLink {
  type: 'equipment' | 'accommodation'
  title: string
  url: string
  description?: string
}

export interface WebcamData {
  title: string
  url: string
}

export interface Route {
  id: string
  slug: string
  type: RouteType
  title: string
  summary: string
  difficulty: Difficulty
  ferrataGrade?: FerrataGrade
  distance: number // km
  elevation: number // metros
  duration: string // "4-5 horas"
  approach?: string // "1h desde parking"
  approachInfo?: string // Información adicional sobre la aproximación
  return?: string
  returnInfo?: string // Información adicional sobre el retorno
  features: RouteFeature[]
  bestSeason: Season[]
  bestSeasonInfo?: string // Información adicional sobre la mejor época
  orientation: string
  orientationInfo?: string // Información adicional sobre la orientación
  food?: string // Información sobre comida/restaurantes
  foodInfo?: string // Información adicional sobre comida
  status: RouteStatus
  routeType?: RouteTypeShape // Tipo de ruta: Circular o Inicio-Fin
  dogs?: DogsAllowed // Perros permitidos: Sí, No, Sueltos, Atados
  location: {
    region: string
    province: string
    coordinates: {
      lat: number
      lng: number
    }
  }
  parking?: {
    lat: number
    lng: number
  }[]
  restaurants?: {
    lat: number
    lng: number
    name?: string
  }[]
  track?: {
    lat: number
    lng: number,
    elevation: number
  }[] // Coordenadas del track de la ruta
  heroImage: ImageData
  gallery: ImageData[]
  gpx?: GPXData // Opcional: algunas rutas pueden no tener archivo GPX
  equipment: AffiliateLink[]
  accommodations: AffiliateLink[]
  safetyTips: string[]
  webcams?: WebcamData[] // Webcams con título y URL
  twitterHashtag?: string // Hashtag de Twitter para mostrar timeline
  storytelling: string // Markdown content
  seo: {
    metaTitle: string
    metaDescription: string
    keywords: string[]
  }
  createdAt: string
  updatedAt: string
  views?: number
  downloads?: number
  rating?: number
}

export interface User {
  id: string
  email: string
  name: string
  image?: string
  role: 'user' | 'admin'
  createdAt: string
}

export interface UserProgress {
  userId: string
  bookmarks: string[] // Route IDs
  completedRoutes: {
    routeId: string
    completedAt: string
    photo?: string
    notes?: string
  }[]
  badges: Badge[]
  stats: {
    totalDistance: number
    totalElevation: number
    routesCompleted: number
    gpxDownloads: number
  }
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt: string
  category: 'first' | 'milestone' | 'achievement' | 'special'
}

export interface ChecklistItem {
  id: string
  text: string
  checked: boolean
}

export interface RouteChecklist {
  routeId: string
  items: ChecklistItem[]
}

