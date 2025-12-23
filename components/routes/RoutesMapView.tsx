'use client'

import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { Route, FerrataGrade } from '@/types'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Mountain, Star, X, RotateCcw } from 'lucide-react'
import { getDifficultyColor, getFerrataGradeColor } from '@/lib/utils'
import type { MapRef } from 'react-map-gl'

// Dynamic import para evitar problemas de SSR con Mapbox
const Map = dynamic(
  () => import('react-map-gl').then((mod) => mod.Map),
  { 
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">Cargando mapa...</div>
  }
) 
const Marker = dynamic(
  () => import('react-map-gl').then((mod) => mod.Marker),
  { ssr: false }
)
const Source = dynamic(
  () => import('react-map-gl').then((mod) => mod.Source),
  { ssr: false }
)
const Layer = dynamic(
  () => import('react-map-gl').then((mod) => mod.Layer),
  { ssr: false }
)

interface RoutesMapViewProps {
  routes: Route[]
  type: 'trekking' | 'ferrata'
  fullHeight?: boolean
  hoveredRouteId?: string | null
  /** Ruta seleccionada externamente (por ejemplo, desde la cuadrícula en modo "Ambas") */
  selectedRouteId?: string | null
  /** Notifica cuando se selecciona una ruta (click en marcador o tarjeta) */
  onRouteSelect?: (routeId: string | null) => void
  onViewStateChange?: (viewState: {latitude: number; longitude: number; zoom: number} | null) => void
  onMarkerHover?: (routeId: string | null) => void
}

/**
 * Componente SVG que representa a una persona escalando una vía ferrata con casco, arnés y mochila
 */
function FerrataClimberIcon({ className, color }: { className?: string; color?: string }) {
  return (
    <svg
      version="1.0"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 281 264"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      style={{ color }}
      fill="currentColor"
    >
      <g transform="translate(0.000000,264.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none">
        <path d="M994 2310 c-12 -5 -25 -14 -30 -21 -4 -7 -7 -107 -7 -223 1 -201 2 -211 22 -227 12 -10 26 -19 31 -21 6 -2 5 -29 -2 -73 -13 -87 -4 -279 17 -360 38 -143 100 -192 229 -182 39 3 123 20 186 36 177 47 214 42 246 -35 17 -42 0 -105 -52 -188 -32 -51 -39 -57 -49 -42 -7 9 -15 16 -19 16 -9 0 -284 -158 -306 -175 -8 -7 -53 -17 -98 -23 -110 -15 -157 -30 -189 -59 -21 -20 -24 -30 -20 -61 10 -60 38 -75 129 -70 102 6 148 35 176 109 l19 51 31 -50 c17 -28 43 -59 57 -68 26 -17 28 -16 108 25 45 23 104 58 130 77 46 33 49 38 45 72 -3 20 -8 44 -12 53 -5 12 5 23 41 44 152 88 277 188 311 250 12 22 16 56 17 125 0 83 -3 101 -25 140 -28 49 -74 85 -129 99 -20 5 -109 14 -198 20 -186 11 -247 29 -259 76 -6 23 8 148 22 195 2 9 25 32 51 51 50 37 175 179 212 239 29 48 27 91 -5 130 -41 48 -79 63 -145 57 -31 -3 -68 -13 -83 -22 -36 -24 -74 -90 -81 -145 -4 -25 -18 -82 -32 -128 -28 -94 -25 -128 13 -143 23 -8 26 -13 20 -42 -16 -80 -27 -180 -20 -200 11 -38 56 -77 109 -93 27 -8 125 -19 217 -24 171 -9 204 -17 241 -58 27 -30 46 -90 47 -148 0 -84 -9 -110 -59 -159 -46 -45 -238 -185 -254 -185 -4 0 3 15 17 33 40 52 76 139 76 182 0 53 -36 115 -80 138 -42 22 -89 18 -228 -20 -71 -19 -122 -27 -190 -27 -93 -1 -94 -1 -122 31 -51 57 -75 190 -67 373 6 141 9 153 42 168 53 24 122 188 131 316 7 81 6 83 -20 104 -53 41 -175 77 -212 62z m145 -55 c72 -33 76 -43 61 -138 -24 -154 -94 -277 -157 -277 -57 0 -65 23 -58 162 4 70 2 149 -3 183 -8 49 -8 64 5 84 13 20 21 23 53 18 21 -2 65 -17 99 -32z m492 -6 c15 -10 32 -32 38 -48 11 -25 10 -35 -9 -71 -23 -45 -187 -231 -227 -257 -22 -15 -27 -15 -60 1 -41 19 -41 24 -5 161 12 44 24 97 27 118 16 102 149 156 236 96z m-32 -1359 c18 -38 30 -78 27 -87 -9 -28 -200 -143 -237 -143 -9 0 -37 31 -62 70 l-47 69 73 42 c39 23 101 59 137 80 36 21 68 38 71 39 3 0 21 -31 38 -70z m-353 -141 c-15 -77 -76 -119 -176 -122 -69 -2 -90 12 -90 58 0 30 4 35 44 50 35 14 146 36 220 44 5 1 6 -13 2 -30z"/>
        <path d="M1002 2247 c-10 -12 -4 -35 29 -121 23 -58 45 -106 50 -106 20 0 80 46 84 65 3 11 6 38 8 59 2 36 -2 42 -45 73 -54 40 -108 52 -126 30z m96 -39 l54 -33 -5 -44 c-3 -31 -12 -50 -28 -62 -13 -10 -26 -19 -29 -19 -4 0 -59 143 -68 178 -6 20 19 14 76 -20z"/>
        <path d="M1011 1921 c-14 -25 -5 -48 20 -56 27 -9 51 13 47 44 -4 34 -51 43 -67 12z"/>
        <path d="M1452 2218 c-5 -7 -17 -31 -26 -53 -14 -33 -15 -47 -5 -88 6 -27 17 -51 25 -54 17 -6 169 114 184 147 10 21 9 27 -10 42 -27 22 -151 26 -168 6z m158 -31 c0 -7 -35 -41 -77 -76 l-77 -62 -13 35 c-10 30 -9 42 5 76 l17 40 73 0 c53 0 72 -4 72 -13z"/>
        <path d="M1380 1955 c-26 -32 13 -81 48 -59 34 22 22 74 -18 74 -10 0 -23 -7 -30 -15z m43 -20 c8 -18 -11 -31 -25 -17 -11 11 -3 32 12 32 4 0 10 -7 13 -15z"/>
        <path d="M1490 770 c-70 -46 -95 -70 -71 -70 19 0 161 95 161 108 0 18 -9 15 -90 -38z"/>
      </g>
    </svg>
  )
}

/**
 * Obtiene el color del borde según el grado K de la vía ferrata
 */
function getFerrataGradeBorderColor(grade: FerrataGrade | undefined): { border: string; text: string } {
  const colors: Record<FerrataGrade, { border: string; text: string }> = {
    'K1': { border: 'border-green-600', text: 'text-green-600' },
    'K2': { border: 'border-blue-600', text: 'text-blue-600' },
    'K3': { border: 'border-yellow-600', text: 'text-yellow-600' },
    'K4': { border: 'border-orange-600', text: 'text-orange-600' },
    'K5': { border: 'border-red-600', text: 'text-red-600' },
    'K6': { border: 'border-purple-600', text: 'text-purple-600' },
  }
  return colors[grade as FerrataGrade] || { border: 'border-gray-600', text: 'text-gray-600' }
}

/**
 * Componente que muestra todas las rutas en un mapa de España usando Mapbox
 * Muestra el POI principal de cada ruta y permite navegar al detalle
 * Al hacer click en un POI:
 *  - Muestra una tarjeta fija arriba a la izquierda con la info de la ruta
 *  - Pinta el track de la ruta sobre el mapa (usando datos locales o Firestore)
 */
export function RoutesMapView({ 
  routes, 
  type, 
  fullHeight = false, 
  hoveredRouteId = null,
  selectedRouteId,
  onRouteSelect,
  onViewStateChange, 
  onMarkerHover 
}: RoutesMapViewProps) {
  const mapRef = useRef<MapRef | null>(null)
  const mapInstanceRef = useRef<any>(null) // Instancia del mapa de Mapbox
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  // Ruta seleccionada desde el POI del mapa (muestra la tarjeta flotante)
  const [internalSelectedRouteId, setInternalSelectedRouteId] = useState<string | null>(null)
  const [mapStyle, setMapStyle] = useState<'satellite-streets-v12' | 'outdoors-v12'>('outdoors-v12')
  const [viewState, setViewState] = useState<{latitude: number; longitude: number; zoom: number} | null>(null)
  const [selectedRouteTrack, setSelectedRouteTrack] = useState<{ lat: number; lng: number; elevation?: number }[] | null>(null)
  const [isLoadingTrack, setIsLoadingTrack] = useState(false)
  const [trackError, setTrackError] = useState<string | null>(null)

  // Ruta seleccionada para mostrar track (puede venir del grid o del POI)
  const trackRouteId = selectedRouteId ?? internalSelectedRouteId
  const trackRoute = useMemo(
    () => routes.find((r) => r.id === trackRouteId) ?? null,
    [routes, trackRouteId]
  )

  // Ruta seleccionada para mostrar tarjeta (solo cuando se hace click en el POI)
  const cardRoute = useMemo(
    () => routes.find((r) => r.id === internalSelectedRouteId) ?? null,
    [routes, internalSelectedRouteId]
  )

  /**
   * Importa dinámicamente los estilos de Mapbox cuando el componente se monta
   */
  useEffect(() => {
    // Importar CSS de Mapbox dinámicamente
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css'
    document.head.appendChild(link)

    return () => {
      // Limpiar el link cuando el componente se desmonte
      const existingLink = document.head.querySelector(`link[href="${link.href}"]`)
      if (existingLink) {
        document.head.removeChild(existingLink)
      }
    }
  }, [])

  // Filtrar rutas que tienen coordenadas válidas
  const routesWithCoordinates = useMemo(() => {
    return routes.filter(route => 
      route.location?.coordinates?.lat && 
      route.location?.coordinates?.lng &&
      route.location.coordinates.lat !== 0 &&
      route.location.coordinates.lng !== 0
    )
  }, [routes])

  /**
   * Calcula el viewState inicial para mostrar toda España
   * Siempre muestra el mapa completo de España independientemente de las rutas
   */
  const initialViewState = useMemo(() => {
    // Centro geográfico de España
    return {
      longitude: -3.7038, // Madrid (centro aproximado de España)
      latitude: 40.4168,  // Madrid (centro aproximado de España)
      zoom: 5,          // Zoom que muestra toda España
    }
  }, [])

  /**
   * Notifica el viewState inicial cuando el componente se monta
   */
  useEffect(() => {
    if (initialViewState && onViewStateChange) {
      onViewStateChange(initialViewState)
    }
  }, [initialViewState, onViewStateChange])

  /**
   * Carga el track de la ruta seleccionada (desde la propia ruta o desde Firestore)
   */
  useEffect(() => {
    if (!trackRoute) {
      setSelectedRouteTrack(null)
      setTrackError(null)
      return
    }

    // Si la ruta ya tiene el track cargado, úsalo directamente
    if (trackRoute.track && trackRoute.track.length > 1) {
      setSelectedRouteTrack(trackRoute.track)
      setIsLoadingTrack(false)
      setTrackError(null)
      return
    }

    // Guardar el slug en una constante para evitar problemas de tipo en la función asíncrona
    const routeSlug = trackRoute.slug

    let cancelled = false

    async function loadTrack() {
      try {
        setIsLoadingTrack(true)
        setTrackError(null)

        const { getTrackByRouteSlug } = await import('@/lib/firebase/tracks')
        const points = await getTrackByRouteSlug(routeSlug)

        if (!cancelled) {
          if (points && points.length > 1) {
            setSelectedRouteTrack(points as any)
          } else {
            setSelectedRouteTrack(null)
          }
        }
      } catch (error) {
        console.error('Error cargando track para la ruta seleccionada:', error)
        if (!cancelled) {
          setTrackError('No se ha podido cargar el track de esta ruta.')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTrack(false)
        }
      }
    }

    loadTrack()

    return () => {
      cancelled = true
    }
  }, [trackRoute])

  /**
   * GeoJSON del track de la ruta seleccionada para pintarlo en el mapa
   */
  const selectedRouteGeoJSON = useMemo(() => {
    if (!selectedRouteTrack || selectedRouteTrack.length < 2) return null

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: selectedRouteTrack.map((p) => [p.lng, p.lat]),
      },
      properties: {},
    }
  }, [selectedRouteTrack])

  /**
   * Maneja el click en un marcador/POI del mapa.
   * Selecciona la ruta para mostrar el track y la tarjeta flotante.
   */
  const handleMarkerClick = useCallback((route: Route) => {
    // Siempre establecer el estado interno para mostrar la tarjeta
    setInternalSelectedRouteId(route.id)
    // También notificar al padre (para sincronizar con la cuadrícula si es necesario)
    onRouteSelect?.(route.id)
  }, [onRouteSelect])

  /**
   * Resetea la vista del mapa al zoom inicial (vista de toda España)
   */
  const handleResetView = useCallback(() => {
    if (!mapInstanceRef.current && !mapRef.current) return

    try {
      const map = mapInstanceRef.current || (mapRef.current?.getMap())
      if (!map) return

      map.flyTo({
        center: [initialViewState.longitude, initialViewState.latitude],
        zoom: initialViewState.zoom,
        duration: 1500,
        essential: true,
      })

      // Limpiar selección de ruta al resetear
      setInternalSelectedRouteId(null)
      onRouteSelect?.(null)
    } catch (error) {
      console.error('Error al resetear la vista del mapa:', error)
    }
  }, [initialViewState, onRouteSelect])

  /**
   * Cuando cambia la ruta seleccionada desde el grid (selectedRouteId externo),
   * hacer zoom suave hasta el POI principal y mostrar el track.
   * NOTA: Solo hace zoom cuando viene desde fuera (grid), no cuando se hace click en el POI.
   */
  useEffect(() => {
    // Solo hacer zoom si la selección viene del grid (selectedRouteId externo)
    if (!selectedRouteId) return
    if (!isMapLoaded) {
      console.log('Mapa no cargado aún, esperando...')
      return
    }

    // Buscar la ruta directamente
    const route = routes.find((r) => r.id === selectedRouteId)
    if (!route || !route.location?.coordinates) {
      console.log('Ruta no encontrada o sin coordenadas:', selectedRouteId)
      return
    }

    const { lat, lng } = route.location.coordinates
    console.log('Haciendo zoom a ruta:', route.title, 'en', lat, lng)

    // Intentar hacer zoom con retry hasta que el mapa esté disponible
    let retryCount = 0
    const maxRetries = 20 // Intentar durante 2 segundos (20 * 100ms)
    
    const tryFlyTo = () => {
      // Intentar usar mapInstanceRef primero (más confiable)
      let map = mapInstanceRef.current
      
      // Si no está disponible, intentar con mapRef
      if (!map && mapRef.current) {
        try {
          map = mapRef.current.getMap()
        } catch (e) {
          console.log('Error obteniendo mapa desde mapRef:', e)
        }
      }

      if (!map) {
        retryCount++
        if (retryCount < maxRetries) {
          setTimeout(tryFlyTo, 100)
          return
        }
        console.log('Mapa no disponible después de múltiples intentos')
        return
      }

      try {
        const currentZoom = map.getZoom()
        // Zoom objetivo: mínimo 12 para ver bien el POI
        const targetZoom = Math.max(currentZoom, 12)

        console.log('Ejecutando flyTo:', { center: [lng, lat], zoom: targetZoom })
        
        // Usar el método flyTo del mapa directamente
        map.flyTo({
          center: [lng, lat],
          zoom: targetZoom,
          duration: 2000, // Zoom suave (2 segundos)
          essential: true,
        })
      } catch (error) {
        console.error('Error al hacer zoom a la ruta seleccionada en el mapa:', error)
      }
    }

    // Iniciar el intento después de un pequeño delay
    const timeoutId = setTimeout(tryFlyTo, 100)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [selectedRouteId, isMapLoaded, routes]) // Depende directamente de selectedRouteId

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (!mapboxToken) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
        <div className="text-center p-6">
          <p className="text-gray-600 mb-2">Mapbox no configurado</p>
          <p className="text-sm text-gray-500">
            Configura NEXT_PUBLIC_MAPBOX_TOKEN en tus variables de entorno
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-full overflow-hidden border border-gray-200 ${fullHeight ? 'h-full rounded-lg' : 'h-[600px] rounded-lg'}`}>
      <Map
        ref={mapRef}
        initialViewState={initialViewState}
        onLoad={(evt: any) => {
          console.log('Mapa cargado, mapRef disponible:', !!mapRef.current)
          // Guardar la instancia del mapa directamente desde el evento
          if (evt.target) {
            mapInstanceRef.current = evt.target
            console.log('Instancia del mapa guardada:', !!mapInstanceRef.current)
          }
          setIsMapLoaded(true)
        }}
        onMove={(evt: any) => {
          setViewState(evt.viewState)
          onViewStateChange?.(evt.viewState)
        }}
        onClick={() => {
          // Cerrar tarjeta al pinchar en cualquier parte del mapa que no sea un marcador
          setInternalSelectedRouteId(null)
          onRouteSelect?.(null)
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={`mapbox://styles/mapbox/${mapStyle}`}
        mapboxAccessToken={mapboxToken}
        attributionControl={false}
      >
        {/* Track de la ruta seleccionada */}
        {selectedRouteGeoJSON && (
          <Source id="selected-route-track" type="geojson" data={selectedRouteGeoJSON}>
            <Layer
              id="selected-route-line"
              type="line"
              paint={{
                'line-color': '#3b82f6',
                'line-width': 4,
                'line-opacity': 0.85,
              }}
            />
          </Source>
        )}

        {/* Marcadores para cada ruta - primero los no hovered */}
        {routesWithCoordinates
          .filter(route => hoveredRouteId !== route.id)
          .map((route) => {
            return (
              <Marker
                key={route.id}
                longitude={route.location.coordinates.lng}
                latitude={route.location.coordinates.lat}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation()
                  handleMarkerClick(route)
                }}
              >
                <div 
                  className="relative cursor-pointer group"
                  onMouseEnter={() => onMarkerHover?.(route.id)}
                  onMouseLeave={() => onMarkerHover?.(null)}
                >
                  <div className={`${type === 'ferrata' ? 'p-0.5' : 'p-2'} rounded-full bg-white shadow-lg border-2 transition-all duration-300 group-hover:scale-110 relative ${
                    type === 'ferrata' && route.ferrataGrade
                      ? getFerrataGradeBorderColor(route.ferrataGrade).border
                      : route.difficulty === 'Fácil' ? 'border-green-600' :
                        route.difficulty === 'Moderada' ? 'border-orange-600' :
                        route.difficulty === 'Difícil' ? 'border-red-600' :
                        route.difficulty === 'Muy Difícil' ? 'border-purple-600' :
                        'border-gray-600'
                  }`}>
                    {type === 'ferrata' ? (
                      <FerrataClimberIcon className={`h-10 w-10 transition-all duration-300 ${
                        route.ferrataGrade
                          ? getFerrataGradeBorderColor(route.ferrataGrade).text
                          : 'text-gray-600'
                      }`} />
                    ) : (
                      <Mountain className={`h-5 w-5 transition-all duration-300 ${
                        route.difficulty === 'Fácil' ? 'text-green-600' :
                        route.difficulty === 'Moderada' ? 'text-orange-600' :
                        route.difficulty === 'Difícil' ? 'text-red-600' :
                        route.difficulty === 'Muy Difícil' ? 'text-purple-600' :
                        'text-gray-600'
                      }`} />
                    )}
                    {type === 'ferrata' && route.ferrataGrade && (
                      <span className={`absolute -bottom-0.5 -right-0.5 text-[7px] px-0.5 py-0.5 rounded font-bold ${getFerrataGradeColor(route.ferrataGrade)} shadow-sm`}>
                        {route.ferrataGrade}
                      </span>
                    )}
                  </div>
                  {/* Tooltip al hover */}
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap transition-opacity pointer-events-none opacity-0 group-hover:opacity-100 z-10`}>
                    {route.title}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </Marker>
            )
          })}
        
        {/* Marcador hovered renderizado al final para que aparezca encima */}
        {hoveredRouteId && routesWithCoordinates
          .filter(route => hoveredRouteId === route.id)
          .map((route) => {
            return (
              <Marker
                key={route.id}
                longitude={route.location.coordinates.lng}
                latitude={route.location.coordinates.lat}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation()
                  handleMarkerClick(route)
                }}
              >
                <div 
                  className="relative cursor-pointer group"
                  style={{ zIndex: 9999 }}
                  onMouseEnter={() => onMarkerHover?.(route.id)}
                  onMouseLeave={() => onMarkerHover?.(null)}
                >
                  <div className={`${type === 'ferrata' ? 'p-0.5' : 'p-2'} rounded-full bg-white shadow-lg border-2 transition-all duration-300 scale-150 shadow-xl relative ${
                    type === 'ferrata' && route.ferrataGrade
                      ? getFerrataGradeBorderColor(route.ferrataGrade).border
                      : route.difficulty === 'Fácil' ? 'border-green-600' :
                        route.difficulty === 'Moderada' ? 'border-orange-600' :
                        route.difficulty === 'Difícil' ? 'border-red-600' :
                        route.difficulty === 'Muy Difícil' ? 'border-purple-600' :
                        'border-gray-600'
                  }`}
                  style={{ zIndex: 9999 }}
                  >
                    {type === 'ferrata' ? (
                      <FerrataClimberIcon className={`h-10 w-10 transition-all duration-300 ${
                        route.ferrataGrade
                          ? getFerrataGradeBorderColor(route.ferrataGrade).text
                          : 'text-primary-600'
                      }`} />
                    ) : (
                      <Mountain className="h-5 w-5 transition-all duration-300 text-primary-600" />
                    )}
                    {type === 'ferrata' && route.ferrataGrade && (
                      <span className={`absolute -bottom-0.5 -right-0.5 text-[7px] px-0.5 py-0.5 rounded font-bold ${getFerrataGradeColor(route.ferrataGrade)} shadow-sm`}>
                        {route.ferrataGrade}
                      </span>
                    )}
                  </div>
                  {/* Tooltip siempre visible cuando está hovered */}
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap pointer-events-none z-[10000]`}
                    style={{ zIndex: 10000 }}
                  >
                    {route.title}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                  {/* Anillo de resaltado cuando está hovered */}
                  <div className="absolute inset-0 rounded-full border-4 border-primary-400 animate-ping opacity-75" style={{ zIndex: 9998 }}></div>
                </div>
              </Marker>
            )
          })}
      </Map>

      {/* Tarjeta fija de la ruta seleccionada (arriba a la izquierda) - Solo se muestra cuando se hace click en el POI */}
      {cardRoute && (
        <div className="absolute top-4 left-6 sm:left-8 z-20 w-48 sm:w-56 max-w-[60vw]">
          <div className="relative overflow-hidden rounded-md bg-white shadow-md border border-gray-200">
            {/* Botón cerrar */}
            <button
              type="button"
              onClick={() => {
                setInternalSelectedRouteId(null)
                onRouteSelect?.(null)
              }}
              className="absolute top-2 right-2 z-20 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow hover:bg-white"
            >
              <X className="h-3 w-3" />
            </button>

            {/* Imagen */}
            <div className="relative h-24 w-full overflow-hidden">
              <Image
                src={cardRoute.heroImage.url}
                alt={cardRoute.heroImage.alt}
                fill
                className="object-cover"
                sizes="288px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {/* Rating (más hacia la izquierda) */}
              {cardRoute.rating && typeof cardRoute.rating === 'number' && (
                <div className="absolute top-2 left-2 flex items-center gap-0.5 rounded-full bg-white/95 backdrop-blur px-1.5 py-0.5 text-[11px] font-semibold text-gray-900 shadow border border-gray-200">
                  <Star className="h-2.5 w-2.5 text-amber-500" fill="currentColor" strokeWidth={1.5} />
                  <span>{cardRoute.rating.toFixed(1)}</span>
                </div>
              )}

              {/* Badges dificultad / grado */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1">
                <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium shadow-sm ${getDifficultyColor(cardRoute.difficulty)}`}>
                  {cardRoute.difficulty}
                </span>
                {cardRoute.ferrataGrade && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded-md font-medium bg-blue-100 text-blue-800 shadow-sm">
                    {cardRoute.ferrataGrade}
                  </span>
                )}
              </div>
            </div>

            {/* Contenido */}
            <div className="p-2">
              <h3 className="mb-0.5 text-[11px] font-bold text-gray-900 line-clamp-2 leading-snug">
                {cardRoute.title}
              </h3>
              <p className="mb-0.5 text-[10px] text-gray-600 line-clamp-2 leading-snug">
                {cardRoute.summary}
              </p>
              <p className="mb-1 text-[10px] text-gray-500">
                {cardRoute.location.region}, {cardRoute.location.province}
              </p>

              {/* Estado de carga del track */}
              {isLoadingTrack && (
                <p className="mb-0.5 text-[10px] text-primary-600">
                  Cargando track de la ruta…
                </p>
              )}
              {trackError && (
                <p className="mb-0.5 text-[10px] text-red-600">
                  {trackError}
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  const url = `/${cardRoute.type === 'trekking' ? 'rutas' : 'vias-ferratas'}/${cardRoute.slug}`
                  window.open(url, '_blank', 'noopener,noreferrer')
                }}
                className="mt-0.5 w-full rounded-sm bg-primary-600 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm transition hover:bg-primary-700"
              >
                Ver detalles de la ruta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controles del mapa */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setMapStyle(mapStyle === 'outdoors-v12' ? 'satellite-streets-v12' : 'outdoors-v12')}
          className="px-3 py-2 bg-white rounded-lg shadow-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          title="Cambiar estilo de mapa"
        >
          {mapStyle === 'outdoors-v12' ? 'Satélite' : 'Mapa'}
        </button>
        <button
          onClick={handleResetView}
          className="px-3 py-2 bg-white rounded-lg shadow-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          title="Resetear vista del mapa"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Resetear</span>
        </button>
      </div>

      {/* Contador de rutas (todavía más pegado al borde izquierdo para no solapar la tarjeta) */}
      <div className="absolute bottom-4 left-0 sm:left-1 px-2.5 py-1.5 bg-white rounded-lg shadow-md text-xs text-gray-700">
        {type === 'ferrata' ? (
          <>
            {routesWithCoordinates.length} {routesWithCoordinates.length === 1 ? 'vía ferrata' : 'vías ferratas'} en el mapa
          </>
        ) : (
          <>
            {routesWithCoordinates.length} {routesWithCoordinates.length === 1 ? 'ruta' : 'rutas'} en el mapa
          </>
        )}
      </div>
    </div>
  )
}

