'use client'

import { useMemo, useRef, useCallback, useState } from 'react'
import { Route } from '@/types'
import { TrendingUp } from 'lucide-react'
import { calculateSlope, getSlopeColor } from '@/lib/utils'

interface RouteElevationProfileProps {
  route: Route
  onHoverTrackIndex?: (index: number | null) => void
}

/**
 * Componente que muestra el perfil de elevación de la ruta
 * Genera un gráfico de línea mostrando la elevación a lo largo del track
 */
export function RouteElevationProfile({ route, onHoverTrackIndex }: RouteElevationProfileProps) {
  /**
   * Calcula los datos del perfil de elevación a partir del track
   */
  const elevationData = useMemo(() => {
    if (!route.track || route.track.length === 0) {
      return null
    }

    // Extraer elevaciones del track
    const elevations = route.track.map(point => point.elevation || 0)
    
    // Calcular distancia acumulada aproximada (en km)
    const distances: number[] = [0]
    for (let i = 1; i < route.track.length; i++) {
      const prev = route.track[i - 1]
      const curr = route.track[i]
      
      // Fórmula de Haversine para calcular distancia entre dos puntos
      const R = 6371 // Radio de la Tierra en km
      const dLat = (curr.lat - prev.lat) * Math.PI / 180
      const dLng = (curr.lng - prev.lng) * Math.PI / 180
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distance = R * c
      
      distances.push(distances[distances.length - 1] + distance)
    }

    // Calcular pendientes y colores para cada segmento
    const slopes: number[] = [0] // Primer punto no tiene pendiente
    const colors: string[] = []
    
    for (let i = 1; i < route.track.length; i++) {
      const prev = route.track[i - 1]
      const curr = route.track[i]
      const slope = calculateSlope(
        prev.lat,
        prev.lng,
        prev.elevation || 0,
        curr.lat,
        curr.lng,
        curr.elevation || 0
      )
      slopes.push(slope)
      colors.push(getSlopeColor(slope))
    }

    return {
      elevations,
      distances,
      slopes,
      colors,
      minElevation: Math.min(...elevations),
      maxElevation: Math.max(...elevations),
      totalDistance: distances[distances.length - 1],
    }
  }, [route.track])

  if (!elevationData) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-primary-600" />
          Perfil de Elevación
        </h3>
        <p className="text-sm text-gray-500">
          No hay datos de track disponibles para mostrar el perfil de elevación.
        </p>
      </div>
    )
  }

  const { elevations, distances, slopes, colors, minElevation, maxElevation, totalDistance } = elevationData
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Dimensiones del gráfico
  const width = 800
  const height = 200
  const padding = { top: 20, right: 40, bottom: 40, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Escalas
  const elevationRange = maxElevation - minElevation || 1
  const scaleX = chartWidth / totalDistance
  const scaleY = chartHeight / elevationRange

  /**
   * Maneja el movimiento del mouse sobre el SVG para detectar qué punto del track está bajo el cursor
   */
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !onHoverTrackIndex) return

    const rect = svgRef.current.getBoundingClientRect()
    // Calcular la posición X relativa al SVG, considerando el viewBox
    const svgX = ((e.clientX - rect.left) / rect.width) * width
    const chartX = svgX - padding.left
    
    // Si el mouse está fuera del área del gráfico, no hacer nada
    if (chartX < 0 || chartX > chartWidth) {
      setHoveredIndex(null)
      onHoverTrackIndex(null)
      return
    }

    // Calcular la distancia correspondiente a la posición X del mouse
    const distance = (chartX / scaleX)
    
    // Encontrar el índice del punto más cercano
    let closestIndex = 0
    let minDiff = Math.abs(distances[0] - distance)
    
    for (let i = 1; i < distances.length; i++) {
      const diff = Math.abs(distances[i] - distance)
      if (diff < minDiff) {
        minDiff = diff
        closestIndex = i
      }
    }
    
    setHoveredIndex(closestIndex)
    onHoverTrackIndex(closestIndex)
  }, [distances, scaleX, chartWidth, padding.left, width, onHoverTrackIndex])

  /**
   * Maneja cuando el mouse sale del SVG
   */
  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null)
    if (onHoverTrackIndex) {
      onHoverTrackIndex(null)
    }
  }, [onHoverTrackIndex])

  /**
   * Genera los segmentos de línea con colores según pendiente
   */
  const pathSegments = useMemo(() => {
    const segments: Array<{ path: string; color: string }> = []
    
    for (let i = 1; i < elevations.length; i++) {
      const x1 = padding.left + distances[i - 1] * scaleX
      const y1 = padding.top + chartHeight - (elevations[i - 1] - minElevation) * scaleY
      const x2 = padding.left + distances[i] * scaleX
      const y2 = padding.top + chartHeight - (elevations[i] - minElevation) * scaleY
      
      segments.push({
        path: `M ${x1} ${y1} L ${x2} ${y2}`,
        color: colors[i - 1] || '#22c55e'
      })
    }
    
    return segments
  }, [elevations, distances, colors, minElevation, scaleX, scaleY, padding.left, padding.top, chartHeight])

  /**
   * Genera el área bajo la curva con gradiente de colores
   */
  const areaPath = [
    `M ${padding.left} ${padding.top + chartHeight}`,
    ...elevations.map((elevation, index) => {
      const x = padding.left + distances[index] * scaleX
      const y = padding.top + chartHeight - (elevation - minElevation) * scaleY
      return `L ${x} ${y}`
    }),
    `L ${padding.left + totalDistance * scaleX} ${padding.top + chartHeight}`,
    'Z'
  ].join(' ')

  /**
   * Genera las marcas del eje X (distancia)
   */
  const xTicks = []
  const numTicks = 5
  for (let i = 0; i <= numTicks; i++) {
    const distance = (totalDistance / numTicks) * i
    const x = padding.left + distance * scaleX
    xTicks.push({ x, distance: distance.toFixed(1) })
  }

  /**
   * Genera las marcas del eje Y (elevación)
   */
  const yTicks = []
  const numYTicks = 5
  for (let i = 0; i <= numYTicks; i++) {
    const elevation = minElevation + (elevationRange / numYTicks) * i
    const y = padding.top + chartHeight - (elevation - minElevation) * scaleY
    yTicks.push({ y, elevation: Math.round(elevation) })
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 relative">
      <h3 className="mb-4 text-lg font-semibold flex items-center">
        <TrendingUp className="mr-2 h-5 w-5 text-primary-600" />
        Perfil de Elevación
      </h3>

      {/* Leyenda de colores - esquina superior derecha */}
      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm border border-gray-200 rounded px-1.5 py-1 shadow-sm z-10">
        <div className="text-[9px] font-semibold text-gray-700 mb-0.5">Pendiente:</div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-3 rounded" style={{ backgroundColor: '#22c55e' }}></div>
            <span className="text-[8px] text-gray-600">Suave (0-5%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-3 rounded" style={{ backgroundColor: '#eab308' }}></div>
            <span className="text-[8px] text-gray-600">Moderada (5-10%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-3 rounded" style={{ backgroundColor: '#f97316' }}></div>
            <span className="text-[8px] text-gray-600">Fuerte (10-20%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
            <span className="text-[8px] text-gray-600">Muy fuerte (&gt;20%)</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full cursor-crosshair"
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Área bajo la curva con gradiente suave */}
          <defs>
            <linearGradient id="elevationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          {/* Área bajo la curva */}
          <path
            d={areaPath}
            fill="url(#elevationGradient)"
          />
          
          {/* Segmentos de línea con colores según pendiente */}
          {pathSegments.map((segment, index) => (
            <path
              key={index}
              d={segment.path}
              fill="none"
              stroke={segment.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          
          {/* Indicador vertical en la posición del hover */}
          {hoveredIndex !== null && hoveredIndex < distances.length && (
            <g>
              <line
                x1={padding.left + distances[hoveredIndex] * scaleX}
                y1={padding.top}
                x2={padding.left + distances[hoveredIndex] * scaleX}
                y2={padding.top + chartHeight}
                stroke="#ef4444"
                strokeWidth="2"
                strokeDasharray="4 4"
                opacity="0.7"
              />
              <circle
                cx={padding.left + distances[hoveredIndex] * scaleX}
                cy={padding.top + chartHeight - (elevations[hoveredIndex] - minElevation) * scaleY}
                r="5"
                fill="#ef4444"
                stroke="white"
                strokeWidth="2"
              />
            </g>
          )}
          
          {/* Eje X - Distancia */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={padding.left + chartWidth}
            y2={padding.top + chartHeight}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          
          {/* Eje Y - Elevación */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartHeight}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          
          {/* Marcas del eje X */}
          {xTicks.map((tick, index) => (
            <g key={index}>
              <line
                x1={tick.x}
                y1={padding.top + chartHeight}
                x2={tick.x}
                y2={padding.top + chartHeight + 5}
                stroke="#9ca3af"
                strokeWidth="1"
              />
              <text
                x={tick.x}
                y={padding.top + chartHeight + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {tick.distance} km
              </text>
            </g>
          ))}
          
          {/* Marcas del eje Y */}
          {yTicks.map((tick, index) => (
            <g key={index}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={padding.left - 5}
                y2={tick.y}
                stroke="#9ca3af"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={tick.y + 4}
                textAnchor="end"
                className="text-xs fill-gray-600"
              >
                {tick.elevation}m
              </text>
            </g>
          ))}

        </svg>
      </div>
      
      {/* Estadísticas */}
      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
        <div>
          <div className="text-xs text-gray-500">Elevación mínima</div>
          <div className="text-lg font-semibold text-gray-900">{Math.round(minElevation)}m</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Elevación máxima</div>
          <div className="text-lg font-semibold text-gray-900">{Math.round(maxElevation)}m</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Desnivel total</div>
          <div className="text-lg font-semibold text-gray-900">{Math.round(maxElevation - minElevation)}m</div>
        </div>
      </div>
    </div>
  )
}

