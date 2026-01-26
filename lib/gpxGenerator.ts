/**
 * Generador de archivos GPX compatibles con Garmin, Amazfit, Komoot y Wikiloc
 */

import { TrackPoint } from './tracks'
import { Waypoint } from '@/types'

export interface GPXGenerationOptions {
  name: string
  description?: string
  trackPoints: TrackPoint[]
  waypoints?: Waypoint[]
}

/**
 * Escapa caracteres especiales XML
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Formatea una fecha en formato ISO 8601 para GPX
 */
function formatGPXDate(date: Date = new Date()): string {
  return date.toISOString()
}

/**
 * Genera un archivo GPX válido y compatible con dispositivos GPS
 */
export function generateGPX(options: GPXGenerationOptions): string {
  const { name, description, trackPoints, waypoints = [] } = options

  if (!trackPoints || trackPoints.length === 0) {
    throw new Error('El track debe contener al menos un punto')
  }

  const escapedName = escapeXml(name)
  const escapedDescription = description ? escapeXml(description) : ''

  // Generar waypoints XML
  const waypointsXML = waypoints
    .map((wpt) => {
      const wptName = wpt.name ? escapeXml(wpt.name) : 'Punto de interés'
      const wptDesc = wpt.description ? escapeXml(wpt.description) : ''
      const ele = wpt.elevation !== undefined ? `    <ele>${wpt.elevation.toFixed(2)}</ele>\n` : ''
      
      return `  <wpt lat="${wpt.lat.toFixed(7)}" lon="${wpt.lng.toFixed(7)}">\n${ele}    <name>${wptName}</name>\n${wptDesc ? `    <desc>${wptDesc}</desc>\n` : ''}  </wpt>`
    })
    .join('\n')

  // Generar track points XML
  const trackPointsXML = trackPoints
    .map((pt) => {
      const ele = pt.elevation !== undefined ? `      <ele>${pt.elevation.toFixed(2)}</ele>\n` : ''
      return `    <trkpt lat="${pt.lat.toFixed(7)}" lon="${pt.lng.toFixed(7)}">\n${ele}    </trkpt>`
    })
    .join('\n')

  // Construir el GPX completo
  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Peak Explorer" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapedName}</name>
${escapedDescription ? `    <desc>${escapedDescription}</desc>\n` : ''}    <time>${formatGPXDate()}</time>
  </metadata>
${waypointsXML ? waypointsXML + '\n' : ''}  <trk>
    <name>${escapedName}</name>
${escapedDescription ? `    <desc>${escapedDescription}</desc>\n` : ''}    <trkseg>
${trackPointsXML}
    </trkseg>
  </trk>
</gpx>`

  return gpx
}
