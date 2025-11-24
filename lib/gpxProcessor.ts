import { Route } from '@/types'
import { EnrichedMetadata } from './aiEnrichment'
import { getRouteMetadataFromAI } from './aiEnrichment'

/**
 * Interfaz para los datos extraídos de un archivo GPX en el servidor
 */
export interface GPXParseResult {
  title?: string
  distance: number // km
  elevation: number // metros (desnivel positivo acumulado)
  elevationGain: number // metros (solo subida)
  elevationLoss: number // metros (solo bajada)
  minElevation: number
  maxElevation: number
  coordinates: {
    lat: number
    lng: number
  }
  track: {
    lat: number
    lng: number
    elevation: number
  }[]
  routeType?: 'Circular' | 'Inicio-Fin'
  duration?: string
  description?: string
}

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine (en km)
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Parsea un archivo GPX desde un buffer o string XML y extrae la información relevante
 */
export async function parseGPXBuffer(gpxContent: string | Buffer, filename?: string): Promise<GPXParseResult> {
  try {
    const xmlString = typeof gpxContent === 'string' ? gpxContent : gpxContent.toString('utf-8')
    
    // Parsear XML usando regex básico (en Node.js no tenemos DOMParser nativo)
    // Extraer nombre/título de la ruta
    const nameMatch = xmlString.match(/<name[^>]*>([^<]+)<\/name>/i) ||
                     xmlString.match(/<trk>\s*<name[^>]*>([^<]+)<\/name>/i) ||
                     xmlString.match(/<rte>\s*<name[^>]*>([^<]+)<\/name>/i)
    let title = nameMatch ? nameMatch[1].trim() : undefined
    
    // Si no hay título en el GPX, generarlo desde el nombre del archivo
    if (!title && filename) {
      title = filename
        .replace(/\.gpx$/i, '')
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }
    
    if (!title) {
      title = 'Ruta sin nombre'
    }
    
    // Extraer descripción si existe
    const descMatch = xmlString.match(/<desc[^>]*>([^<]+)<\/desc>/i)
    const description = descMatch ? descMatch[1].trim() : undefined
    
    // Extraer puntos de track (trkpt) o ruta (rtept)
    const trkptMatches = xmlString.matchAll(/<trkpt[^>]*lat=["']([^"']+)["'][^>]*lon=["']([^"']+)["'][^>]*>([\s\S]*?)<\/trkpt>/gi)
    const rteptMatches = xmlString.matchAll(/<rtept[^>]*lat=["']([^"']+)["'][^>]*lon=["']([^"']+)["'][^>]*>([\s\S]*?)<\/rtept>/gi)
    
    let points: Array<{ lat: number; lng: number; elevation: number }> = []
    
    // Procesar tracks
    for (const match of trkptMatches) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      const content = match[3]
      const eleMatch = content.match(/<ele[^>]*>([^<]+)<\/ele>/i)
      const elevation = eleMatch ? parseFloat(eleMatch[1]) : 0
      
      if (!isNaN(lat) && !isNaN(lng)) {
        points.push({ lat, lng, elevation })
      }
    }
    
    // Si no hay tracks, procesar rutas
    if (points.length === 0) {
      for (const match of rteptMatches) {
        const lat = parseFloat(match[1])
        const lng = parseFloat(match[2])
        const content = match[3]
        const eleMatch = content.match(/<ele[^>]*>([^<]+)<\/ele>/i)
        const elevation = eleMatch ? parseFloat(eleMatch[1]) : 0
        
        if (!isNaN(lat) && !isNaN(lng)) {
          points.push({ lat, lng, elevation })
        }
      }
    }
    
    if (points.length === 0) {
      throw new Error('No se encontraron puntos de track o ruta en el archivo GPX.')
    }
    
    // Calcular distancia total
    let totalDistance = 0
    for (let i = 1; i < points.length; i++) {
      totalDistance += calculateDistance(
        points[i - 1].lat,
        points[i - 1].lng,
        points[i].lat,
        points[i].lng
      )
    }
    
    // Calcular elevaciones
    const elevations = points.map(p => p.elevation).filter(e => e > 0)
    const minElevation = elevations.length > 0 ? Math.min(...elevations) : 0
    const maxElevation = elevations.length > 0 ? Math.max(...elevations) : 0
    const elevationDiff = maxElevation - minElevation
    
    // Calcular ganancia y pérdida de elevación (desnivel positivo acumulado)
    let elevationGain = 0
    let elevationLoss = 0
    
    for (let i = 1; i < points.length; i++) {
      const prevElevation = points[i - 1].elevation || 0
      const currElevation = points[i].elevation || 0
      const diff = currElevation - prevElevation
      
      if (diff > 0) {
        elevationGain += diff
      } else {
        elevationLoss += Math.abs(diff)
      }
    }
    
    // Determinar si es circular o inicio-fin
    const firstPoint = points[0]
    const lastPoint = points[points.length - 1]
    const distanceBetweenEnds = calculateDistance(
      firstPoint.lat,
      firstPoint.lng,
      lastPoint.lat,
      lastPoint.lng
    )
    // Si el inicio y fin están a menos de 100m, consideramos la ruta circular
    const routeType: 'Circular' | 'Inicio-Fin' = distanceBetweenEnds < 0.1 ? 'Circular' : 'Inicio-Fin'
    
    // Coordenadas del punto inicial (o centro si es circular)
    const coordinates = {
      lat: firstPoint.lat,
      lng: firstPoint.lng
    }
    
    // Estimar duración basada en distancia y desnivel (aproximación)
    const avgSpeed = 4 // km/h
    const baseHours = totalDistance / avgSpeed
    const elevationHours = elevationGain / 300 // 1 hora por cada 300m de desnivel
    const totalHours = baseHours + elevationHours
    const hours = Math.floor(totalHours)
    const minutes = Math.round((totalHours - hours) * 60)
    
    let duration = ''
    if (hours > 0 && minutes > 0) {
      duration = `${hours}-${hours + 1} horas`
    } else if (hours > 0) {
      duration = `${hours}-${hours + 1} horas`
    } else {
      duration = `${minutes} minutos`
    }
    
    return {
      title,
      distance: Math.round(totalDistance * 10) / 10, // Redondear a 1 decimal
      elevation: Math.round(elevationGain), // Desnivel positivo acumulado
      elevationGain: Math.round(elevationGain),
      elevationLoss: Math.round(elevationLoss),
      minElevation: Math.round(minElevation),
      maxElevation: Math.round(maxElevation),
      coordinates,
      track: points,
      routeType,
      duration,
      description,
    }
  } catch (error) {
    throw new Error(`Error al procesar el archivo GPX: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

/**
 * Combina los datos extraídos del GPX con los metadatos enriquecidos por IA
 */
export function combineGPXAndAIData(
  gpxData: GPXParseResult,
  aiData: EnrichedMetadata,
  filename: string
): Partial<Route> {
  return {
    type: aiData.type || 'trekking',
    title: gpxData.title || filename.replace(/\.gpx$/i, ''),
    summary: aiData.summary || gpxData.description || '',
    difficulty: aiData.difficulty || 'Moderada',
    distance: gpxData.distance,
    elevation: gpxData.elevation, // Desnivel positivo acumulado
    duration: aiData.duration || gpxData.duration || '',
    approach: aiData.approach,
    approachInfo: aiData.approachInfo,
    return: aiData.return || (gpxData.routeType === 'Circular' ? 'Circular' : 'Mismo punto'),
    returnInfo: aiData.returnInfo,
    food: aiData.food,
    foodInfo: aiData.foodInfo,
    orientation: aiData.orientation || '',
    orientationInfo: aiData.orientationInfo,
    bestSeason: aiData.bestSeason || [],
    bestSeasonInfo: aiData.bestSeasonInfo,
    status: 'Abierta',
    routeType: aiData.routeType || gpxData.routeType,
    dogs: aiData.dogs || 'Atados',
    location: {
      region: aiData.location?.region || '',
      province: aiData.location?.province || '',
      coordinates: gpxData.coordinates,
    },
    track: gpxData.track,
    safetyTips: aiData.safetyTips || [],
    storytelling: aiData.storytelling || '',
    seo: aiData.seo ? {
      metaTitle: aiData.seo.metaTitle || `${gpxData.title} | Peak Explorer`,
      metaDescription: aiData.seo.metaDescription || aiData.summary || '',
      keywords: aiData.seo.keywords || [],
    } : {
      metaTitle: `${gpxData.title} | Peak Explorer`,
      metaDescription: aiData.summary || gpxData.description || '',
      keywords: [],
    },
    features: [],
    gallery: aiData.gallery || [],
    equipment: [],
    accommodations: [],
    heroImage: aiData.heroImage || {
      url: '',
      alt: '',
      width: 1200,
      height: 800,
    },
    views: 0,
    downloads: 0,
  }
}

/**
 * Procesa un archivo GPX completo: parsing + enriquecimiento con IA
 */
export async function processGPXFile(
  gpxContent: string | Buffer,
  filename: string
): Promise<Partial<Route>> {
  // 1. Parsear GPX
  const gpxData = await parseGPXBuffer(gpxContent, filename)
  
  // 2. Enriquecer con IA
  const routeTitle = gpxData.title || filename.replace(/\.gpx$/i, '')
  const aiData = await getRouteMetadataFromAI(routeTitle, gpxData.coordinates)
  
  // 3. Combinar datos
  return combineGPXAndAIData(gpxData, aiData, filename)
}

