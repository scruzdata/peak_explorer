import { Route, Waypoint, WaypointType } from '@/types'
import { EnrichedMetadata } from './aiEnrichment'
import { getRouteMetadataFromAI } from './aiEnrichment'

/**
 * Detecta el tipo de waypoint basándose en palabras clave en el nombre y descripción
 */
function detectWaypointType(name?: string, description?: string): WaypointType {
  const text = `${name || ''} ${description || ''}`.toLowerCase()
  
  // Mirador
  if (/\b(mirador|viewpoint|viewpoint|miradouro|belvedere)\b/i.test(text)) {
    return 'mirador'
  }
  
  // Puente
  if (/\b(puente|bridge|pont|ponte|arco)\b/i.test(text)) {
    return 'puente'
  }
  
  // Fuente
  if (/\b(fuente|fountain|source|font|fontaine)\b/i.test(text)) {
    return 'fuente'
  }
  
  // Enlace
  if (/\b(enlace|link|gr[0-9]+|sendero|trail|path)\b/i.test(text)) {
    return 'enlace'
  }
  
  // Iglesia
  if (/\b(iglesia|church|église|igreja|templo|temple)\b/i.test(text)) {
    return 'iglesia'
  }
  
  // Hermita
  if (/\b(hermita|ermita|hermitage|ermitage|santuario|sanctuary)\b/i.test(text)) {
    return 'hermita'
  }
  
  // Árbol
  if (/\b(arbol|tree|árbol|arbre|albero|pino|pine|roble|oak|haya|beech|tejo|pinar|pino)\b/i.test(text)) {
    return 'arbol'
  }
  
  // Laguna/Lago
  if (/\b(laguna|lago|lake|étang|étang|lac|pond|estanque|ibón|ibon)\b/i.test(text)) {
    return 'laguna'
  }
  
  // Refugio/Albergue/Casa
  if (/\b(refugio|albergue|casa|refuge|shelter|hut|cabana|cabaña|hutte|bivouac|bivac|hostal|hostel|alberg|gîte)\b/i.test(text)) {
    return 'refugio'
  }
  
  // Pico/Montaña/Collado
  if (/\b(pico|peak|summit|cima|montaña|montana|mountain|monte|collado|col|pass|collet|port|portillo|portella|brecha|breche|garganta|gorge)\b/i.test(text)) {
    return 'pico'
  }
  
  // Por defecto, unknown
  return 'unknown'
}

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
  waypoints?: Waypoint[] // Puntos de interés extraídos del GPX
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
    
    // Extraer waypoints (puntos de interés)
    const wptMatches = xmlString.matchAll(/<wpt[^>]*lat=["']([^"']+)["'][^>]*lon=["']([^"']+)["'][^>]*>([\s\S]*?)<\/wpt>/gi)
    const waypoints: Waypoint[] = []
    
    // Calcular distancias acumuladas para cada punto del track (para ubicar waypoints)
    const cumulativeDistances: number[] = [0]
    for (let i = 1; i < points.length; i++) {
      cumulativeDistances.push(
        cumulativeDistances[i - 1] + calculateDistance(
          points[i - 1].lat,
          points[i - 1].lng,
          points[i].lat,
          points[i].lng
        )
      )
    }
    
    // Procesar waypoints
    for (const match of wptMatches) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      const content = match[3]
      
      if (!isNaN(lat) && !isNaN(lng)) {
        // Extraer elevación si existe
        const eleMatch = content.match(/<ele[^>]*>([^<]+)<\/ele>/i)
        const elevation = eleMatch ? parseFloat(eleMatch[1]) : undefined
        
        // Extraer nombre si existe
        const nameMatch = content.match(/<name[^>]*>([^<]+)<\/name>/i)
        const name = nameMatch ? nameMatch[1].trim() : undefined
        
        // Extraer descripción si existe
        const descMatch = content.match(/<desc[^>]*>([^<]+)<\/desc>/i)
        const description = descMatch ? descMatch[1].trim() : undefined
        
        // Calcular la distancia acumulada desde el inicio del track
        // Encontrar el punto del track más cercano al waypoint
        let minDistance = Infinity
        let closestTrackIndex = 0
        
        for (let i = 0; i < points.length; i++) {
          const dist = calculateDistance(lat, lng, points[i].lat, points[i].lng)
          if (dist < minDistance) {
            minDistance = dist
            closestTrackIndex = i
          }
        }
        
        // Usar la distancia acumulada del punto más cercano
        // Si el waypoint está muy cerca del track, usar la distancia exacta
        let waypointDistance = cumulativeDistances[closestTrackIndex]
        if (minDistance < 0.01) { // Si está a menos de 10m, usar la distancia del punto más cercano
          waypointDistance = cumulativeDistances[closestTrackIndex]
        } else {
          // Interpolar entre el punto más cercano y el siguiente
          if (closestTrackIndex < points.length - 1) {
            const distToNext = calculateDistance(
              lat, lng,
              points[closestTrackIndex + 1].lat,
              points[closestTrackIndex + 1].lng
            )
            if (distToNext < minDistance) {
              waypointDistance = cumulativeDistances[closestTrackIndex + 1]
            } else {
              // Interpolar basándose en la distancia
              const segmentDist = calculateDistance(
                points[closestTrackIndex].lat,
                points[closestTrackIndex].lng,
                points[closestTrackIndex + 1].lat,
                points[closestTrackIndex + 1].lng
              )
              if (segmentDist > 0) {
                const ratio = minDistance / (minDistance + distToNext)
                waypointDistance = cumulativeDistances[closestTrackIndex] + 
                  (cumulativeDistances[closestTrackIndex + 1] - cumulativeDistances[closestTrackIndex]) * ratio
              }
            }
          }
        }
        
        // Detectar el tipo de waypoint basándose en el nombre y descripción
        const waypointType = detectWaypointType(name, description)
        
        waypoints.push({
          lat,
          lng,
          elevation,
          name,
          description,
          distance: Math.round(waypointDistance * 100) / 100, // Redondear a 2 decimales
          type: waypointType,
        })
      }
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
      waypoints: waypoints.length > 0 ? waypoints : undefined,
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
    waypoints: gpxData.waypoints,
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
    gallery: (aiData.gallery || []).map(img => ({
      url: img.url,
      alt: img.alt,
      width: img.width ?? 800,
      height: img.height ?? 600,
    })),
    equipment: [],
    accommodations: [],
    heroImage: aiData.heroImage ? {
      url: aiData.heroImage.url,
      alt: aiData.heroImage.alt,
      width: aiData.heroImage.width ?? 1200,
      height: aiData.heroImage.height ?? 800,
    } : {
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
 * Parsea un archivo GPX sin enriquecimiento con IA (solo track y waypoints)
 * Útil para actualizar el track de una ruta existente
 */
export async function parseGPXOnly(
  gpxContent: string | Buffer,
  filename: string
): Promise<Partial<Route>> {
  // Solo parsear GPX sin enriquecimiento con IA
  const gpxData = await parseGPXBuffer(gpxContent, filename)
  
  // Devolver solo los datos básicos del GPX
  return {
    title: gpxData.title,
    distance: gpxData.distance,
    elevation: gpxData.elevation,
    duration: gpxData.duration,
    routeType: gpxData.routeType,
    location: {
      region: '',
      province: '',
      coordinates: gpxData.coordinates,
    },
    track: gpxData.track,
    waypoints: gpxData.waypoints,
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

