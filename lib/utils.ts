import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

export function formatElevation(m: number): string {
  return `${Math.round(m)}m`
}

export function formatDuration(duration: string): string {
  return duration
}

// Devuelve las clases de color de Tailwind según la dificultad de la ruta
export function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    'Fácil': 'bg-green-100 text-green-800',
    'Moderada': 'bg-orange-100 text-orange-800',
    'Difícil': 'bg-red-100 text-red-800',
    'Muy Difícil': 'bg-purple-100 text-purple-800',
  }
  return colors[difficulty] || 'bg-gray-500 text-white font-semibold'
}

export function getFerrataGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    'K1': 'bg-green-100 text-green-800',
    'K2': 'bg-blue-100 text-blue-800',
    'K3': 'bg-yellow-100 text-yellow-800',
    'K4': 'bg-orange-100 text-orange-800',
    'K5': 'bg-red-100 text-red-800',
    'K6': 'bg-purple-100 text-purple-800',
  }
  return colors[grade] || 'bg-gray-100 text-gray-800'
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

/**
 * Calcula la distancia horizontal entre dos puntos usando la fórmula de Haversine (en km)
 */
export function calculateDistance(
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
 * Calcula la pendiente en porcentaje entre dos puntos
 * @returns Pendiente en porcentaje (positivo = subida, negativo = bajada)
 */
export function calculateSlope(
  lat1: number,
  lng1: number,
  elevation1: number,
  lat2: number,
  lng2: number,
  elevation2: number
): number {
  const distance = calculateDistance(lat1, lng1, lat2, lng2)
  if (distance === 0) return 0
  
  const elevationDiff = elevation2 - elevation1
  // Pendiente en porcentaje: (desnivel / distancia horizontal) * 100
  return (elevationDiff / (distance * 1000)) * 100
}

/**
 * Interpola entre dos colores hexadecimales
 */
function interpolateColor(color1: string, color2: string, factor: number): string {
  const c1 = parseInt(color1.slice(1), 16)
  const c2 = parseInt(color2.slice(1), 16)
  
  const r1 = (c1 >> 16) & 255
  const g1 = (c1 >> 8) & 255
  const b1 = c1 & 255
  
  const r2 = (c2 >> 16) & 255
  const g2 = (c2 >> 8) & 255
  const b2 = c2 & 255
  
  const r = Math.round(r1 + (r2 - r1) * factor)
  const g = Math.round(g1 + (g2 - g1) * factor)
  const b = Math.round(b1 + (b2 - b1) * factor)
  
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

/**
 * Obtiene el color según la pendiente con interpolación suave
 * @param slope Pendiente en porcentaje
 * @returns Color hexadecimal
 */
export function getSlopeColor(slope: number): string {
  const absSlope = Math.abs(slope)
  
  // Colores base
  const green = '#22c55e'    // 0%
  const yellow = '#eab308'   // 5%
  const orange = '#f97316'   // 10%
  const red = '#ef4444'      // 20%
  const darkRed = '#dc2626'  // 30%+
  
  // Interpolación suave entre colores
  if (absSlope < 5) {
    // Verde a amarillo (0-5%)
    const factor = absSlope / 5
    return interpolateColor(green, yellow, factor)
  } else if (absSlope < 10) {
    // Amarillo a naranja (5-10%)
    const factor = (absSlope - 5) / 5
    return interpolateColor(yellow, orange, factor)
  } else if (absSlope < 20) {
    // Naranja a rojo (10-20%)
    const factor = (absSlope - 10) / 10
    return interpolateColor(orange, red, factor)
  } else if (absSlope < 30) {
    // Rojo a rojo oscuro (20-30%)
    const factor = (absSlope - 20) / 10
    return interpolateColor(red, darkRed, factor)
  } else {
    // Pendiente muy extrema (>30%)
    return darkRed
  }
}

