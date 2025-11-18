import { Route } from '@/types'

/**
 * Interfaz para los datos extraídos de un archivo GPX
 */
export interface GPXParseResult {
  title?: string
  distance: number // km
  elevation: number // metros (desnivel total)
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
 * Parsea un archivo GPX y extrae la información relevante
 */
export async function parseGPXFile(file: File): Promise<GPXParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(text, 'text/xml')
        
        // Verificar errores de parseo
        const parserError = xmlDoc.querySelector('parsererror')
        if (parserError) {
          reject(new Error('Error al parsear el archivo GPX. Verifica que sea un archivo válido.'))
          return
        }
        
        // Extraer nombre/título de la ruta
        const nameElement = xmlDoc.querySelector('gpx > metadata > name') || 
                           xmlDoc.querySelector('gpx > trk > name') ||
                           xmlDoc.querySelector('gpx > rte > name')
        let title = nameElement?.textContent?.trim()
        
        // Si no hay título en el GPX, generarlo desde el nombre del archivo
        if (!title) {
          title = file.name
            .replace(/\.gpx$/i, '')
            .replace(/_/g, ' ')
            .replace(/-/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        }
        
        // Extraer descripción si existe
        const descElement = xmlDoc.querySelector('gpx > metadata > desc') ||
                           xmlDoc.querySelector('gpx > trk > desc') ||
                           xmlDoc.querySelector('gpx > rte > desc')
        const description = descElement?.textContent?.trim()
        
        // Buscar tracks (trkseg) o rutas (rtept)
        const trackSegments = xmlDoc.querySelectorAll('trkseg')
        const routePoints = xmlDoc.querySelectorAll('rtept')
        
        let points: Array<{ lat: number; lng: number; elevation: number }> = []
        
        if (trackSegments.length > 0) {
          // Procesar tracks
          trackSegments.forEach(segment => {
            const trkpts = segment.querySelectorAll('trkpt')
            trkpts.forEach(trkpt => {
              const lat = parseFloat(trkpt.getAttribute('lat') || '0')
              const lng = parseFloat(trkpt.getAttribute('lon') || '0')
              const eleElement = trkpt.querySelector('ele')
              const elevation = eleElement ? parseFloat(eleElement.textContent || '0') : 0
              
              if (lat && lng) {
                points.push({ lat, lng, elevation })
              }
            })
          })
        } else if (routePoints.length > 0) {
          // Procesar rutas
          routePoints.forEach(rtept => {
            const lat = parseFloat(rtept.getAttribute('lat') || '0')
            const lng = parseFloat(rtept.getAttribute('lon') || '0')
            const eleElement = rtept.querySelector('ele')
            const elevation = eleElement ? parseFloat(eleElement.textContent || '0') : 0
            
            if (lat && lng) {
              points.push({ lat, lng, elevation })
            }
          })
        }
        
        if (points.length === 0) {
          reject(new Error('No se encontraron puntos de track o ruta en el archivo GPX.'))
          return
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
        
        // Calcular ganancia y pérdida de elevación
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
        // Velocidad promedio: 4 km/h en terreno plano, reducida según pendiente
        const avgSpeed = 4 // km/h
        const baseHours = totalDistance / avgSpeed
        // Añadir tiempo extra por desnivel (1 hora por cada 300m de desnivel)
        const elevationHours = elevationGain / 300
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
        
        resolve({
          title,
          distance: Math.round(totalDistance * 10) / 10, // Redondear a 1 decimal
          elevation: Math.round(elevationDiff),
          elevationGain: Math.round(elevationGain),
          elevationLoss: Math.round(elevationLoss),
          minElevation: Math.round(minElevation),
          maxElevation: Math.round(maxElevation),
          coordinates,
          track: points,
          routeType,
          duration,
          description,
        })
      } catch (error) {
        reject(new Error(`Error al procesar el archivo GPX: ${error instanceof Error ? error.message : 'Error desconocido'}`))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo.'))
    }
    
    reader.readAsText(file)
  })
}

/**
 * Convierte los datos parseados de GPX en datos parciales de Route para rellenar el formulario
 */
export function gpxToRouteData(gpxData: GPXParseResult, filename: string): Partial<Route> {
  return {
    title: gpxData.title || filename.replace('.gpx', ''),
    distance: gpxData.distance,
    elevation: gpxData.elevation,
    duration: gpxData.duration || '',
    routeType: gpxData.routeType,
    location: {
      region: '',
      province: '',
      coordinates: gpxData.coordinates,
    },
    track: gpxData.track,
    summary: gpxData.description || '',
  }
}

