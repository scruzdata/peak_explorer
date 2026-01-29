'use client'

import { useMemo, useRef, useCallback, useState } from 'react'
import { Route } from '@/types'
import { TrendingUp, ArrowDown, ArrowUp, TrendingDown } from 'lucide-react'
import { calculateSlope, getSlopeColor } from '@/lib/utils'

interface RouteElevationProfileProps {
  route: Route
  onHoverTrackIndex?: (index: number | null) => void
  highlightedTrackIndex?: number | null // Índice del track resaltado externamente (p.ej. desde el mapa)
  compact?: boolean // Modo compacto para usar en el mapa
  onWaypointClick?: (waypointIndex: number) => void // Callback cuando se hace click en un waypoint
}

/**
 * Componente que muestra el perfil de elevación de la ruta
 * Genera un gráfico de línea mostrando la elevación a lo largo del track
 */
export function RouteElevationProfile({ route, onHoverTrackIndex, highlightedTrackIndex, compact = false, onWaypointClick }: RouteElevationProfileProps) {
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

  // Hooks deben estar siempre al inicio, antes de cualquier return condicional
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [hoverData, setHoverData] = useState<{ distance: number; elevation: number; x: number } | null>(null)
  const [hoveredWaypointIndex, setHoveredWaypointIndex] = useState<number | null>(null)
  
  // El índice a mostrar es el hovered (del perfil) o el highlighted (del mapa), dando prioridad al hovered
  const displayIndex = hoveredIndex !== null ? hoveredIndex : highlightedTrackIndex ?? null

  // Dimensiones del gráfico - ajustadas para modo compacto
  const width = compact ? 400 : 800
  const height = compact ? 150 : 140
  // Padding ajustado para que los ticks no se corten y las etiquetas de waypoints no se corten
  const padding = compact 
    ? { top: 5, right: 12, bottom: 25, left: 40 }
    : { top: 38, right: 20, bottom: 25, left: 45 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Escalas (con valores por defecto si no hay elevationData)
  const elevationRange = elevationData ? elevationData.maxElevation - elevationData.minElevation || 1 : 1
  const scaleX = elevationData ? chartWidth / elevationData.totalDistance : 0
  const scaleY = elevationData ? chartHeight / elevationRange : 0

  /**
   * Maneja el movimiento del mouse sobre el SVG para detectar qué punto del track está bajo el cursor
   */
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !containerRef.current || !elevationData) return

    const svgRect = svgRef.current.getBoundingClientRect()
    const containerRect = containerRef.current.getBoundingClientRect()
    
    // Calcular la posición X relativa al SVG, considerando el viewBox
    const svgX = ((e.clientX - svgRect.left) / svgRect.width) * width
    const chartX = svgX - padding.left
    
    // Calcular la posición X relativa al contenedor para el tooltip
    const containerX = e.clientX - containerRect.left
    
    // Si el mouse está fuera del área del gráfico, no hacer nada
    if (chartX < 0 || chartX > chartWidth) {
      setHoveredIndex(null)
      setHoverData(null)
      if (onHoverTrackIndex) {
        onHoverTrackIndex(null)
      }
      return
    }

    // Calcular la distancia correspondiente a la posición X del mouse
    const distance = (chartX / scaleX)
    
    // Encontrar el índice del punto más cercano y calcular elevación interpolada
    let closestIndex = 0
    let minDiff = Math.abs(elevationData.distances[0] - distance)
    
    for (let i = 1; i < elevationData.distances.length; i++) {
      const diff = Math.abs(elevationData.distances[i] - distance)
      if (diff < minDiff) {
        minDiff = diff
        closestIndex = i
      }
    }
    
    // Interpolar la elevación entre los puntos más cercanos
    let elevation = elevationData.elevations[closestIndex]
    if (closestIndex < elevationData.distances.length - 1) {
      const prevDist = elevationData.distances[closestIndex]
      const nextDist = elevationData.distances[closestIndex + 1]
      if (distance >= prevDist && distance <= nextDist && nextDist !== prevDist) {
        const ratio = (distance - prevDist) / (nextDist - prevDist)
        elevation = elevationData.elevations[closestIndex] + 
          (elevationData.elevations[closestIndex + 1] - elevationData.elevations[closestIndex]) * ratio
      }
    }
    
    setHoveredIndex(closestIndex)
    setHoverData({
      distance,
      elevation,
      x: containerX
    })
    
    if (onHoverTrackIndex) {
      onHoverTrackIndex(closestIndex)
    }
  }, [elevationData, scaleX, chartWidth, padding.left, width, onHoverTrackIndex])

  /**
   * Maneja cuando el mouse sale del SVG
   */
  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null)
    setHoverData(null)
    if (onHoverTrackIndex) {
      onHoverTrackIndex(null)
    }
  }, [onHoverTrackIndex])

  /**
   * Genera los segmentos de línea con colores según pendiente
   */
  const pathSegments = useMemo(() => {
    if (!elevationData) return []
    
    const segments: Array<{ path: string; color: string }> = []
    const { elevations, distances, colors, minElevation } = elevationData
    
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
  }, [elevationData, scaleX, scaleY, padding.left, padding.top, chartHeight])

  if (!elevationData) {
    return (
      <div className={`rounded-lg border border-gray-200 bg-white ${compact ? 'p-2' : 'p-6'}`}>
        <h3 className={`${compact ? 'mb-2 text-xs' : 'mb-4 text-lg'} font-semibold flex items-center`}>
          <TrendingUp className={`${compact ? 'mr-1 h-3 w-3' : 'mr-2 h-5 w-5'} text-primary-600`} />
          Perfil de Elevación
        </h3>
        <p className={`${compact ? 'text-[10px]' : 'text-sm'} text-gray-500`}>
          No hay datos de track disponibles para mostrar el perfil de elevación.
        </p>
      </div>
    )
  }

  const { elevations, distances, slopes, colors, minElevation, maxElevation, totalDistance } = elevationData

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
    <div ref={containerRef} className={`rounded-lg border border-gray-200 bg-white ${compact ? 'p-2' : 'p-4'} relative`}>
      <h3 className={`${compact ? 'mb-2 text-xs' : 'mb-2 text-lg'} font-semibold flex items-center`}>
        <TrendingUp className={`${compact ? 'mr-1 h-3 w-3' : 'mr-2 h-5 w-5'} text-primary-600`} />
        Perfil de Elevación
      </h3>

      {/* Tooltip con datos de hover en tiempo real */}
      {hoverData && !compact && (
        <div 
          className="absolute bg-gray-900 text-white px-1.5 py-0.5 rounded shadow-lg z-20 pointer-events-none"
          style={{
            left: `${hoverData.x}px`,
            top: '35px',
            transform: 'translateX(-50%)',
            fontSize: '9px'
          }}
        >
          <div className="flex items-center gap-1.5">
            <div>
              <div className="text-[7px] text-gray-300">Distancia</div>
              <div className="text-[9px] font-semibold">{hoverData.distance.toFixed(2)} km</div>
            </div>
            <div className="h-3.5 w-px bg-gray-600"></div>
            <div>
              <div className="text-[7px] text-gray-300">Elevación</div>
              <div className="text-[9px] font-semibold">{Math.round(hoverData.elevation)} m</div>
            </div>
          </div>
          {/* Flecha hacia abajo */}
          <div 
            className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-gray-900"
          ></div>
        </div>
      )}

      {/* Leyenda de colores - esquina superior derecha */}
      {!compact && (
        <div className="absolute top-2 right-3 bg-white/95 backdrop-blur-sm border border-gray-200 rounded px-1 py-0.5 shadow-sm z-10">
          <div className="text-[7px] font-semibold text-gray-700 mb-0.5">Pendiente:</div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-0.5">
              <div className="h-1 w-2.5 rounded" style={{ backgroundColor: '#22c55e' }}></div>
              <span className="text-[7px] text-gray-600">Suave (0-5%)</span>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="h-1 w-2.5 rounded" style={{ backgroundColor: '#eab308' }}></div>
              <span className="text-[7px] text-gray-600">Moderada (5-10%)</span>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="h-1 w-2.5 rounded" style={{ backgroundColor: '#f97316' }}></div>
              <span className="text-[7px] text-gray-600">Fuerte (10-20%)</span>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="h-1 w-2.5 rounded" style={{ backgroundColor: '#ef4444' }}></div>
              <span className="text-[7px] text-gray-600">Muy fuerte (&gt;20%)</span>
            </div>
          </div>
        </div>
      )}
      
      <div className={`overflow-x-auto ${compact ? 'max-h-[140px]' : 'mt-2'}`}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className={`w-full cursor-crosshair ${compact ? 'h-auto' : ''}`}
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
              strokeWidth={compact ? "2" : "3"}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          
          {/* Indicador vertical en la posición del hover o highlight */}
          {displayIndex !== null && displayIndex < distances.length && (
            <g>
              <line
                x1={padding.left + distances[displayIndex] * scaleX}
                y1={padding.top}
                x2={padding.left + distances[displayIndex] * scaleX}
                y2={padding.top + chartHeight}
                stroke="#ef4444"
                strokeWidth={compact ? "1.5" : "2"}
                strokeDasharray="4 4"
                opacity="0.7"
              />
              <circle
                cx={padding.left + distances[displayIndex] * scaleX}
                cy={padding.top + chartHeight - (elevations[displayIndex] - minElevation) * scaleY}
                r={compact ? "3" : "5"}
                fill="#ef4444"
                stroke="white"
                strokeWidth={compact ? "1" : "2"}
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
                className={`${compact ? 'text-[8px]' : 'text-xs'} fill-gray-600`}
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
                className={`${compact ? 'text-[8px]' : 'text-xs'} fill-gray-600`}
              >
                {tick.elevation}m
              </text>
            </g>
          ))}

          {/* Waypoints (puntos de interés) */}
          {route.waypoints && route.waypoints.length > 0 && route.waypoints.map((waypoint, index) => {
            if (waypoint.distance === undefined) return null
            
            // Calcular posición X basada en la distancia
            const waypointX = padding.left + waypoint.distance * scaleX
            
            // Calcular la posición Y en el track (línea de elevación) - esta es la posición real del waypoint
            let trackY = padding.top + chartHeight
            for (let i = 0; i < distances.length - 1; i++) {
              if (waypoint.distance >= distances[i] && waypoint.distance <= distances[i + 1]) {
                const ratio = (waypoint.distance - distances[i]) / (distances[i + 1] - distances[i])
                const trackElevation = elevations[i] + (elevations[i + 1] - elevations[i]) * ratio
                trackY = padding.top + chartHeight - (trackElevation - minElevation) * scaleY
                break
              }
            }
            
            const isHovered = hoveredWaypointIndex === index
            const arrowColor = '#b8860b' // DarkGoldenrod - amarillento oscuro
            const arrowHeadSize = compact ? 5 : 7
            
            // Verificar si el waypoint debe mostrarse por defecto (contiene "pico", "Pico" o "Monte" en nombre o tipo)
            const nameMatches = waypoint.name && (
              waypoint.name.toLowerCase().includes('pico') || 
              waypoint.name.includes('Monte')
            )
            const typeMatches = waypoint.type && (
              waypoint.type.toLowerCase().includes('pico') || 
              waypoint.type.includes('Monte')
            )
            const shouldShowByDefault = nameMatches || typeMatches
            
            // Mostrar etiqueta si está hovered o si debe mostrarse por defecto
            const shouldShowLabel = isHovered || shouldShowByDefault
            
            // Calcular posición Y de la etiqueta (arriba del waypoint)
            const labelY = trackY - (compact ? 20 : 25)
            
            return (
              <g 
                key={`waypoint-${index}`} 
                className="waypoint-marker"
                style={{ cursor: onWaypointClick ? 'pointer' : 'default' }}
                onClick={() => onWaypointClick?.(index)}
                onMouseEnter={() => setHoveredWaypointIndex(index)}
                onMouseLeave={() => setHoveredWaypointIndex(null)}
              >
                {/* Área invisible más grande para facilitar el hover y click en el punto */}
                <circle
                  cx={waypointX}
                  cy={trackY}
                  r="15"
                  fill="transparent"
                  pointerEvents="all"
                />
                
                {/* Punto del waypoint en su posición real en el track */}
                <circle
                  cx={waypointX}
                  cy={trackY}
                  r={compact ? "4" : "5"}
                  fill={arrowColor}
                  stroke="white"
                  strokeWidth={compact ? "1.5" : "2"}
                  opacity="0.95"
                />
                
                {/* Línea vertical desde la etiqueta hasta el track (cuando debe mostrarse) */}
                {shouldShowLabel && (
                  <line
                    x1={waypointX}
                    y1={labelY - (compact ? 6 : 8)}
                    x2={waypointX}
                    y2={trackY}
                    stroke={arrowColor}
                    strokeWidth={compact ? "2" : "2.5"}
                    strokeDasharray="4 3"
                    opacity="0.8"
                  />
                )}
                
                {/* Nombre del waypoint (cuando debe mostrarse) */}
                {shouldShowLabel && waypoint.name && (
                  <g>
                    {/* Fondo del texto */}
                    <rect
                      x={waypointX - (waypoint.name.length * (compact ? 1 : 6)) / 2}
                      y={labelY - (compact ? 11 : 13)}
                      width={waypoint.name.length * (compact ? 3 : 6)}
                      height={compact ? 11 : 13}
                      fill="white"
                      fillOpacity="0.95"
                      stroke={arrowColor}
                      strokeWidth="0.8"
                      rx="3"
                    />
                    <text
                      x={waypointX}
                      y={labelY - (compact ? 3 : 4)}
                      textAnchor="middle"
                      className={`${compact ? 'text-[8px]' : 'text-[10px]'} font-semibold pointer-events-none`}
                      fill={arrowColor}
                    >
                      {waypoint.name}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

        </svg>
      </div>
      
      {/* Estadísticas */}
      <div className={`${compact ? 'mt-2 grid grid-cols-3 gap-2 border-t border-gray-100 pt-2' : 'mt-2 grid grid-cols-3 gap-3 border-t border-gray-100 pt-2'}`}>
        <div className="text-center">
          <div className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-gray-500 flex items-center justify-center gap-1`}>
            <ArrowDown className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
            Elevación mínima
          </div>
          <div className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-gray-900`}>{Math.round(minElevation)}m</div>
        </div>
        <div className="text-center">
          <div className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-gray-500 flex items-center justify-center gap-1`}>
            <ArrowUp className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
            Elevación máxima
          </div>
          <div className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-gray-900`}>{Math.round(maxElevation)}m</div>
        </div>
        <div className="text-center">
          <div className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-gray-500 flex items-center justify-center gap-1`}>
            <TrendingUp className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
            Desnivel total
          </div>
          <div className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-gray-900`}>{Math.round(maxElevation - minElevation)}m</div>
        </div>
      </div>
    </div>
  )
}

