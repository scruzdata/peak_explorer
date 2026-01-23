'use client'

import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { Route, FerrataGrade } from '@/types'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Mountain, Star, X, RotateCcw, Eye, EyeOff, MapPin, ZoomIn, Clock, TrendingUp } from 'lucide-react'
import { getDifficultyColor, getFerrataGradeColor, formatDistance, formatElevation } from '@/lib/utils'
import type { MapRef } from 'react-map-gl'
import { RouteElevationProfile } from './RouteElevationProfile'

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
const Popup = dynamic(
  () => import('react-map-gl').then((mod) => mod.Popup),
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
  /** Ref para exponer la función de zoom a una ruta (para uso externo desde tarjetas del grid) */
  zoomToRouteRef?: { current: ((lat: number, lng: number) => void) | null }
}

/**
 * Componente SVG que representa a una persona escalando una vía ferrata con casco, arnés y mochila
 */
export function FerrataClimberIcon({ className, color }: { className?: string; color?: string }) {
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
 * Tipo para representar un cluster de rutas
 */
interface Cluster {
  lat: number
  lng: number
  routes: Route[]
}

/**
 * Agrupa rutas cercanas en clusters basándose en la distancia en píxeles del mapa
 * @param routes Rutas a agrupar
 * @param map Instancia del mapa de Mapbox
 * @param pixelRadius Radio en píxeles para considerar que dos puntos están juntos (por defecto 50px)
 * @returns Array de clusters y rutas individuales (sin agrupar)
 */
function clusterRoutes(
  routes: Route[],
  map: any,
  pixelRadius: number = 50
): { clusters: Cluster[]; individualRoutes: Route[] } {
  if (!map || routes.length === 0) {
    return { clusters: [], individualRoutes: routes }
  }

  const clusters: Cluster[] = []
  const processed = new Set<string>()
  
  for (let i = 0; i < routes.length; i++) {
    if (processed.has(routes[i].id)) continue

    const route1 = routes[i]
    const clusterRoutes: Route[] = [route1]

    // Convertir coordenadas del primer punto a píxeles
    const point1 = map.project([route1.location.coordinates.lng, route1.location.coordinates.lat])

    // Buscar otros puntos cercanos
    for (let j = i + 1; j < routes.length; j++) {
      if (processed.has(routes[j].id)) continue

      const route2 = routes[j]
      const point2 = map.project([route2.location.coordinates.lng, route2.location.coordinates.lat])

      // Calcular distancia en píxeles
      const dx = point2.x - point1.x
      const dy = point2.y - point1.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance <= pixelRadius) {
        clusterRoutes.push(route2)
      }
    }

    // Si hay más de una ruta, crear un cluster
    if (clusterRoutes.length > 1) {
      // Marcar todas las rutas del cluster como procesadas
      clusterRoutes.forEach(r => processed.add(r.id))
      
      // Calcular el centro del cluster (promedio de coordenadas)
      const avgLat = clusterRoutes.reduce((sum: number, r: Route) => sum + r.location.coordinates.lat, 0) / clusterRoutes.length
      const avgLng = clusterRoutes.reduce((sum: number, r: Route) => sum + r.location.coordinates.lng, 0) / clusterRoutes.length
      clusters.push({ lat: avgLat, lng: avgLng, routes: clusterRoutes })
    }
    // Si solo hay una ruta, no la marcamos como procesada, así aparecerá como individual
  }

  // Obtener rutas individuales (no procesadas = no agrupadas)
  const individualRoutes = routes.filter(r => !processed.has(r.id))

  return { clusters, individualRoutes }
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
  onMarkerHover,
  zoomToRouteRef
}: RoutesMapViewProps) {
  const mapRef = useRef<MapRef | null>(null)
  const mapInstanceRef = useRef<any>(null) // Instancia del mapa de Mapbox
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  // Ruta seleccionada desde el POI del mapa (muestra la tarjeta flotante)
  const [internalSelectedRouteId, setInternalSelectedRouteId] = useState<string | null>(null)
  // Estado interno para manejar el hover cuando no se pasa onMarkerHover desde el padre
  const [internalHoveredRouteId, setInternalHoveredRouteId] = useState<string | null>(null)
  // Estado para controlar la visibilidad de la tarjeta y el perfil
  const [showDetailPanel, setShowDetailPanel] = useState(true)
  const [mapStyle, setMapStyle] = useState<'satellite-streets-v12' | 'outdoors-v12'>('outdoors-v12')
  const [viewState, setViewState] = useState<{latitude: number; longitude: number; zoom: number} | null>(null)
  const [selectedRouteTrack, setSelectedRouteTrack] = useState<{ lat: number; lng: number; elevation?: number }[] | null>(null)
  const [isLoadingTrack, setIsLoadingTrack] = useState(false)
  const [trackError, setTrackError] = useState<string | null>(null)
  // Estado para el popup de cluster
  const [clusterPopup, setClusterPopup] = useState<{ lat: number; lng: number; routes: Route[] } | null>(null)

  // Combinar hoveredRouteId externo con interno (el interno tiene prioridad si no hay externo)
  const effectiveHoveredRouteId = hoveredRouteId ?? internalHoveredRouteId

  // Ruta seleccionada para mostrar track (puede venir del grid o del POI)
  const trackRouteId = selectedRouteId ?? internalSelectedRouteId
  
  // Efecto para cerrar el popup cuando se selecciona una ruta desde el grid
  // No cambiamos showDetailPanel para mantener el estado estable
  useEffect(() => {
    if (selectedRouteId) {
      setClusterPopup(null)
      // No forzamos showDetailPanel a true, mantenemos el estado actual
    }
  }, [selectedRouteId])
  const trackRoute = useMemo(
    () => routes.find((r) => r.id === trackRouteId) ?? null,
    [routes, trackRouteId]
  )

  // Ruta seleccionada para mostrar tarjeta (puede venir del grid o del POI)
  // Si viene del grid (selectedRouteId), usarla; si no, usar la interna (click en POI)
  const cardRouteId = selectedRouteId ?? internalSelectedRouteId
  const cardRouteBase = useMemo(
    () => routes.find((r) => r.id === cardRouteId) ?? null,
    [routes, cardRouteId]
  )

  // Ruta con track cargado para mostrar en la tarjeta y perfil
  const cardRoute = useMemo(() => {
    if (!cardRouteBase) return null
    
    // Si hay un track cargado y coincide con la ruta seleccionada, usarlo
    if (selectedRouteTrack && trackRouteId === cardRouteId) {
      return {
        ...cardRouteBase,
        track: selectedRouteTrack
      }
    }
    
    // Si la ruta ya tiene track, usarlo
    if (cardRouteBase.track && cardRouteBase.track.length > 0) {
      return cardRouteBase
    }
    
    return cardRouteBase
  }, [cardRouteBase, selectedRouteTrack, trackRouteId, cardRouteId])

  /**
   * Importa dinámicamente los estilos de Mapbox cuando el componente se monta
   */
  useEffect(() => {
    // Importar CSS de Mapbox dinámicamente
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css'
    document.head.appendChild(link)

    // Agregar estilos personalizados para el popup del cluster
    const style = document.createElement('style')
    style.id = 'cluster-popup-styles'
    style.textContent = `
      .mapboxgl-popup.cluster-popup {
        max-width: 280px !important;
        padding: 0 !important;
      }
      .mapboxgl-popup.cluster-popup.mapboxgl-popup-anchor-top .mapboxgl-popup-tip {
        border-bottom-color: white !important;
        border-top-color: transparent !important;
      }
      .mapboxgl-popup.cluster-popup.mapboxgl-popup-anchor-left .mapboxgl-popup-tip {
        border-right-color: white !important;
        border-top-color: transparent !important;
        border-bottom-color: transparent !important;
      }
      .mapboxgl-popup.cluster-popup.mapboxgl-popup-anchor-right .mapboxgl-popup-tip {
        border-left-color: white !important;
        border-top-color: transparent !important;
        border-bottom-color: transparent !important;
      }
      .mapboxgl-popup.cluster-popup.mapboxgl-popup-anchor-top-left .mapboxgl-popup-tip,
      .mapboxgl-popup.cluster-popup.mapboxgl-popup-anchor-top-right .mapboxgl-popup-tip {
        border-bottom-color: white !important;
        border-top-color: transparent !important;
        border-left-color: transparent !important;
        border-right-color: transparent !important;
      }
      .mapboxgl-popup.cluster-popup.mapboxgl-popup-anchor-bottom-left .mapboxgl-popup-tip,
      .mapboxgl-popup.cluster-popup.mapboxgl-popup-anchor-bottom-right .mapboxgl-popup-tip {
        border-top-color: white !important;
        border-bottom-color: transparent !important;
        border-left-color: transparent !important;
        border-right-color: transparent !important;
      }
      .mapboxgl-popup.cluster-popup .mapboxgl-popup-content {
        padding: 0 !important;
        border-radius: 0.75rem !important;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
        background: transparent !important;
        width: 240px !important;
        max-width: 240px !important;
      }
      .mapboxgl-popup.cluster-popup .mapboxgl-popup-tip {
        border-top-color: white !important;
      }
      .mapboxgl-popup.cluster-popup .mapboxgl-popup-close-button {
        position: absolute !important;
        right: 6px !important;
        top: 6px !important;
        z-index: 1000 !important;
        width: 22px !important;
        height: 22px !important;
        font-size: 16px !important;
        line-height: 1 !important;
        color: white !important;
        background: rgba(0, 0, 0, 0.4) !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: all 0.2s !important;
        border: none !important;
        cursor: pointer !important;
      }
      .mapboxgl-popup.cluster-popup .mapboxgl-popup-close-button:hover {
        background: rgba(0, 0, 0, 0.6) !important;
        transform: scale(1.1) !important;
      }
      .mapboxgl-popup.cluster-popup {
        pointer-events: auto !important;
      }
      .mapboxgl-popup.cluster-popup .mapboxgl-popup-content {
        pointer-events: auto !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      // Limpiar el link cuando el componente se desmonte
      const existingLink = document.head.querySelector(`link[href="${link.href}"]`)
      if (existingLink && existingLink.parentNode) {
        existingLink.parentNode.removeChild(existingLink)
      }
      // Limpiar los estilos personalizados
      const existingStyle = document.head.querySelector('#cluster-popup-styles')
      if (existingStyle && existingStyle.parentNode) {
        existingStyle.parentNode.removeChild(existingStyle)
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

  // Calcular clusters basándose en el estado actual del mapa
  const { clusters, individualRoutes } = useMemo(() => {
    if (!isMapLoaded || !mapInstanceRef.current || routesWithCoordinates.length === 0) {
      return { clusters: [], individualRoutes: routesWithCoordinates }
    }
    try {
      return clusterRoutes(routesWithCoordinates, mapInstanceRef.current, 50)
    } catch (error) {
      console.error('Error calculando clusters:', error)
      return { clusters: [], individualRoutes: routesWithCoordinates }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routesWithCoordinates, isMapLoaded, viewState])

  // Encontrar si la ruta hovered está en un cluster
  const hoveredRouteInCluster = useMemo(() => {
    if (!effectiveHoveredRouteId) return null
    const hoveredRoute = routesWithCoordinates.find((r: Route) => r.id === effectiveHoveredRouteId)
    if (!hoveredRoute) return null
    
    for (const cluster of clusters) {
      if (cluster.routes.some((r: Route) => r.id === effectiveHoveredRouteId)) {
        return { cluster, route: hoveredRoute }
      }
    }
    return null
  }, [effectiveHoveredRouteId, clusters, routesWithCoordinates])

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
    // No forzamos showDetailPanel a true, mantenemos el estado actual del usuario
    // También notificar al padre (para sincronizar con la cuadrícula si es necesario)
    onRouteSelect?.(route.id)
  }, [onRouteSelect])

  /**
   * Maneja el doble click en un marcador/POI del mapa.
   * Hace zoom suave al POI.
   */
  const handleMarkerDoubleClick = useCallback((lat: number, lng: number) => {
    if (!isMapLoaded) {
      console.log('Mapa no cargado aún')
      return
    }

    let map = mapInstanceRef.current
    if (!map && mapRef.current) {
      try {
        map = mapRef.current.getMap()
      } catch (e) {
        console.log('Error obteniendo mapa desde mapRef:', e)
        return
      }
    }

    if (!map) {
      console.log('Mapa no disponible')
      return
    }

    try {
      const currentZoom = map.getZoom()
      // Zoom objetivo: mínimo 15 para ver bien el POI, o aumentar significativamente el zoom actual
      const targetZoom = Math.max(currentZoom + 4, 13)

      console.log('Doble click - haciendo zoom de', currentZoom, 'a', targetZoom, 'en', lat, lng)

      map.flyTo({
        center: [lng, lat],
        zoom: targetZoom,
        duration: 1000,
        essential: true,
      })
    } catch (error) {
      console.error('Error al hacer zoom al POI:', error)
    }
  }, [isMapLoaded])

  // Exponer la función de zoom mediante el ref proporcionado
  useEffect(() => {
    if (zoomToRouteRef) {
      zoomToRouteRef.current = handleMarkerDoubleClick
    }
  }, [handleMarkerDoubleClick, zoomToRouteRef])

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

  // NOTA: El zoom automático al seleccionar una ruta se ha eliminado.
  // Ahora el zoom solo se hace explícitamente con doble click (handleMarkerDoubleClick).

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
          // Cerrar tarjeta y popup al pinchar en cualquier parte del mapa que no sea un marcador
          setInternalSelectedRouteId(null)
          onRouteSelect?.(null)
          setClusterPopup(null)
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

        {/* Marcadores de clusters - ocultar si la ruta hovered está en este cluster */}
        {clusters
          .filter((cluster: Cluster) => {
            // Ocultar este cluster si contiene la ruta que está siendo hovered
            if (hoveredRouteInCluster && effectiveHoveredRouteId) {
              return !cluster.routes.some(r => r.id === effectiveHoveredRouteId)
            }
            return true
          })
          .map((cluster: Cluster, clusterIndex: number) => (
            <Marker
              key={`cluster-${clusterIndex}`}
              longitude={cluster.lng}
              latitude={cluster.lat}
              anchor="center"
              onClick={(e: any) => {
                e.originalEvent.stopPropagation()
                // Si ya hay un popup abierto del mismo cluster, cerrarlo; si no, abrirlo
                if (clusterPopup && clusterPopup.lat === cluster.lat && clusterPopup.lng === cluster.lng) {
                  setClusterPopup(null)
                } else {
                  setClusterPopup(cluster)
                  // Cerrar cualquier tarjeta de ruta abierta
                  setInternalSelectedRouteId(null)
                  onRouteSelect?.(null)
                }
              }}
            >
              <div 
                className="relative cursor-pointer group"
                style={{ zIndex: 1001 }}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  handleMarkerDoubleClick(cluster.lat, cluster.lng)
                }}
              >
                <div className="rounded-full bg-primary-600 border-2 border-white shadow-lg transition-all duration-300 group-hover:scale-110 flex items-center justify-center min-w-[40px] h-10 px-3">
                  <span className="text-white text-sm font-bold">{cluster.routes.length}</span>
                </div>
                {/* Tooltip al hover */}
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap transition-opacity pointer-events-none opacity-0 group-hover:opacity-100`}
                  style={{ zIndex: 99999 }}
                >
                  {cluster.routes.length} {type === 'ferrata' 
                    ? (cluster.routes.length === 1 ? 'vía ferrata' : 'vías ferratas')
                    : (cluster.routes.length === 1 ? 'ruta' : 'rutas')
                  }
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </Marker>
          ))}

        {/* Marcadores para rutas individuales (no agrupadas) - primero los no hovered */}
        {individualRoutes
          .filter(route => effectiveHoveredRouteId !== route.id)
          .map((route) => {
            return (
              <Marker
                key={route.id}
                longitude={route.location.coordinates.lng}
                latitude={route.location.coordinates.lat}
                anchor="bottom"
                onClick={(e: any) => {
                  e.originalEvent.stopPropagation()
                  handleMarkerClick(route)
                }}
              >
                <div 
                  className="relative cursor-pointer group"
                  style={{ zIndex: 1000 }}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    handleMarkerDoubleClick(route.location.coordinates.lat, route.location.coordinates.lng)
                  }}
                  onMouseEnter={() => {
                    if (onMarkerHover) {
                      onMarkerHover(route.id)
                    } else {
                      setInternalHoveredRouteId(route.id)
                    }
                  }}
                  onMouseLeave={() => {
                    if (onMarkerHover) {
                      onMarkerHover(null)
                    } else {
                      setInternalHoveredRouteId(null)
                    }
                  }}
                >
                  <div className={`${type === 'ferrata' ? 'p-0.5' : 'p-2'} rounded-full bg-white shadow-lg border-2 transition-all duration-300 group-hover:scale-110 relative ${
                    cardRouteId === route.id ? 'scale-50' : ''
                  } ${
                    type === 'ferrata' && route.ferrataGrade
                      ? getFerrataGradeBorderColor(route.ferrataGrade).border
                      : route.difficulty === 'Fácil' ? 'border-green-600' :
                        route.difficulty === 'Moderada' ? 'border-orange-600' :
                        route.difficulty === 'Difícil' ? 'border-red-600' :
                        route.difficulty === 'Muy Difícil' ? 'border-purple-600' :
                        'border-gray-600'
                  }`}
                  style={{ zIndex: 1000 }}
                  >
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
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap transition-opacity pointer-events-none opacity-0 group-hover:opacity-100`}
                    style={{ zIndex: 99999 }}
                  >
                    {route.title}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </Marker>
            )
          })}
        
        {/* Marcador hovered renderizado al final para que aparezca encima - incluye rutas en clusters */}
        {effectiveHoveredRouteId && (
          <>
            {/* Rutas individuales hovered */}
            {individualRoutes
              .filter(route => effectiveHoveredRouteId === route.id)
              .map((route) => {
                return (
                  <Marker
                    key={route.id}
                    longitude={route.location.coordinates.lng}
                    latitude={route.location.coordinates.lat}
                    anchor="bottom"
                    onClick={(e: any) => {
                      e.originalEvent.stopPropagation()
                      handleMarkerClick(route)
                    }}
                  >
                    <div 
                      className="relative cursor-pointer group"
                      style={{ zIndex: 99998 }}
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        handleMarkerDoubleClick(route.location.coordinates.lat, route.location.coordinates.lng)
                      }}
                      onMouseEnter={() => {
                        if (onMarkerHover) {
                          onMarkerHover(route.id)
                        } else {
                          setInternalHoveredRouteId(route.id)
                        }
                      }}
                      onMouseLeave={() => {
                        if (onMarkerHover) {
                          onMarkerHover(null)
                        } else {
                          setInternalHoveredRouteId(null)
                        }
                      }}
                    >
                      <div className={`${type === 'ferrata' ? 'p-0.5' : 'p-2'} rounded-full bg-white shadow-lg border-2 transition-all duration-300 ${
                        cardRouteId === route.id ? 'scale-50' : 'scale-150'
                      } shadow-xl relative ${
                        type === 'ferrata' && route.ferrataGrade
                          ? getFerrataGradeBorderColor(route.ferrataGrade).border
                          : route.difficulty === 'Fácil' ? 'border-green-600' :
                            route.difficulty === 'Moderada' ? 'border-orange-600' :
                            route.difficulty === 'Difícil' ? 'border-red-600' :
                            route.difficulty === 'Muy Difícil' ? 'border-purple-600' :
                            'border-gray-600'
                      }`}
                      style={{ zIndex: 99998 }}
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
                      <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap pointer-events-none`}
                        style={{ zIndex: 99999 }}
                      >
                        {route.title}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                      {/* Anillo de resaltado cuando está hovered */}
                      <div className="absolute inset-0 rounded-full border-4 border-primary-400 animate-ping opacity-75" style={{ zIndex: 9999 }}></div>
                    </div>
                  </Marker>
                )
              })}
            
            {/* Ruta hovered que está en un cluster - mostrar marcador individual temporalmente */}
            {hoveredRouteInCluster && hoveredRouteInCluster.route && (
              <Marker
                key={`hovered-cluster-route-${hoveredRouteInCluster.route.id}`}
                longitude={hoveredRouteInCluster.route.location.coordinates.lng}
                latitude={hoveredRouteInCluster.route.location.coordinates.lat}
                anchor="bottom"
                onClick={(e: any) => {
                  e.originalEvent.stopPropagation()
                  handleMarkerClick(hoveredRouteInCluster.route)
                }}
              >
                <div 
                  className="relative cursor-pointer group"
                  style={{ zIndex: 99998 }}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    handleMarkerDoubleClick(hoveredRouteInCluster.route.location.coordinates.lat, hoveredRouteInCluster.route.location.coordinates.lng)
                  }}
                  onMouseEnter={() => {
                    if (onMarkerHover) {
                      onMarkerHover(hoveredRouteInCluster.route.id)
                    } else {
                      setInternalHoveredRouteId(hoveredRouteInCluster.route.id)
                    }
                  }}
                  onMouseLeave={() => {
                    if (onMarkerHover) {
                      onMarkerHover(null)
                    } else {
                      setInternalHoveredRouteId(null)
                    }
                  }}
                >
                  <div className={`${type === 'ferrata' ? 'p-0.5' : 'p-2'} rounded-full bg-white shadow-lg border-2 transition-all duration-300 ${
                    cardRouteId === hoveredRouteInCluster.route.id ? 'scale-50' : 'scale-150'
                  } shadow-xl relative ${
                    type === 'ferrata' && hoveredRouteInCluster.route.ferrataGrade
                      ? getFerrataGradeBorderColor(hoveredRouteInCluster.route.ferrataGrade).border
                      : hoveredRouteInCluster.route.difficulty === 'Fácil' ? 'border-green-600' :
                        hoveredRouteInCluster.route.difficulty === 'Moderada' ? 'border-orange-600' :
                        hoveredRouteInCluster.route.difficulty === 'Difícil' ? 'border-red-600' :
                        hoveredRouteInCluster.route.difficulty === 'Muy Difícil' ? 'border-purple-600' :
                        'border-gray-600'
                  }`}
                  style={{ zIndex: 99998 }}
                  >
                    {type === 'ferrata' ? (
                      <FerrataClimberIcon className={`h-10 w-10 transition-all duration-300 ${
                        hoveredRouteInCluster.route.ferrataGrade
                          ? getFerrataGradeBorderColor(hoveredRouteInCluster.route.ferrataGrade).text
                          : 'text-primary-600'
                      }`} />
                    ) : (
                      <Mountain className="h-5 w-5 transition-all duration-300 text-primary-600" />
                    )}
                    {type === 'ferrata' && hoveredRouteInCluster.route.ferrataGrade && (
                      <span className={`absolute -bottom-0.5 -right-0.5 text-[7px] px-0.5 py-0.5 rounded font-bold ${getFerrataGradeColor(hoveredRouteInCluster.route.ferrataGrade)} shadow-sm`}>
                        {hoveredRouteInCluster.route.ferrataGrade}
                      </span>
                    )}
                  </div>
                  {/* Tooltip siempre visible cuando está hovered */}
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap pointer-events-none`}
                    style={{ zIndex: 99999 }}
                  >
                    {hoveredRouteInCluster.route.title}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                  {/* Anillo de resaltado cuando está hovered */}
                  <div className="absolute inset-0 rounded-full border-4 border-primary-400 animate-ping opacity-75" style={{ zIndex: 9999 }}></div>
                </div>
              </Marker>
            )}
          </>
        )}

        {/* Popup para mostrar las rutas de un cluster - posicionado en esquina superior izquierda */}
        {clusterPopup && !cardRoute && (
          <div className="absolute top-4 left-6 sm:left-8 z-20 w-48 sm:w-56 max-w-[60vw]">
            {/* Contenedor principal de la tarjeta de cluster (el encabezado y la lista se ajustan directamente a este div) */}
            <div className="relative overflow-hidden rounded-xl bg-white shadow-xl border border-gray-200">
              {/* Botón cerrar */}
              <button
                type="button"
                onClick={() => setClusterPopup(null)}
                className="absolute top-2 right-2 z-20 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow hover:bg-white"
              >
                <X className="h-3 w-3" />
              </button>

              {/* Header con badge moderno */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <span className="text-white text-xs font-bold">
                      {clusterPopup.routes.length}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold text-xs">
                    {type === 'ferrata' 
                      ? (clusterPopup.routes.length === 1 ? 'Vía ferrata' : 'Vías ferratas')
                      : (clusterPopup.routes.length === 1 ? 'Ruta' : 'Rutas')
                    }
                  </h3>
                </div>
              </div>
              
              {/* Lista de rutas con scroll personalizado */}
              <div className="max-h-64 overflow-y-auto custom-scrollbar p-2 bg-gray-50/50">
                <div className="space-y-1.5">
                  {clusterPopup.routes.map((route) => (
                    <button
                      key={route.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        // Cerrar el popup primero
                        setClusterPopup(null)
                        // Luego actualizar la ruta seleccionada
                        handleMarkerClick(route)
                      }}
                      onMouseEnter={() => {
                        if (onMarkerHover) {
                          onMarkerHover(route.id)
                        } else {
                          setInternalHoveredRouteId(route.id)
                        }
                      }}
                      onMouseLeave={() => {
                        if (onMarkerHover) {
                          onMarkerHover(null)
                        } else {
                          setInternalHoveredRouteId(null)
                        }
                      }}
                      className="w-full text-left p-2 rounded-lg bg-white border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
                    >
                      <div className="flex items-start gap-2">
                        {/* Icono con fondo circular */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          type === 'ferrata' 
                            ? (route.ferrataGrade 
                                ? (route.ferrataGrade === 'K1' ? 'bg-green-50' :
                                   route.ferrataGrade === 'K2' ? 'bg-blue-50' :
                                   route.ferrataGrade === 'K3' ? 'bg-yellow-50' :
                                   route.ferrataGrade === 'K4' ? 'bg-orange-50' :
                                   route.ferrataGrade === 'K5' ? 'bg-red-50' :
                                   route.ferrataGrade === 'K6' ? 'bg-purple-50' :
                                   'bg-gray-100')
                                : 'bg-gray-100')
                            : (route.difficulty === 'Fácil' ? 'bg-green-50' :
                               route.difficulty === 'Moderada' ? 'bg-orange-50' :
                               route.difficulty === 'Difícil' ? 'bg-red-50' :
                               route.difficulty === 'Muy Difícil' ? 'bg-purple-50' :
                               'bg-gray-100')
                        } group-hover:scale-110 transition-transform duration-200`}>
                          {type === 'ferrata' ? (
                            <FerrataClimberIcon className={`h-4 w-4 ${
                              route.ferrataGrade
                                ? getFerrataGradeBorderColor(route.ferrataGrade).text
                                : 'text-gray-600'
                            }`} />
                          ) : (
                            <Mountain className={`h-4 w-4 ${
                              route.difficulty === 'Fácil' ? 'text-green-600' :
                              route.difficulty === 'Moderada' ? 'text-orange-600' :
                              route.difficulty === 'Difícil' ? 'text-red-600' :
                              route.difficulty === 'Muy Difícil' ? 'text-purple-600' :
                              'text-gray-600'
                            }`} />
                          )}
                        </div>
                        
                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
                            {route.title}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
                            <p className="text-[10px] text-gray-500 truncate">
                              {route.location.region}, {route.location.province}
                            </p>
                          </div>
                          {/* Información de la ruta: distancia, elevación y duración */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[9px] text-gray-600">
                            <div className="flex items-center gap-0.5">
                              <MapPin className="h-2 w-2" />
                              <span>{formatDistance(route.distance)}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <TrendingUp className="h-2 w-2" />
                              <span>{formatElevation(route.elevation)}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <Clock className="h-2 w-2" />
                              <span>{route.duration}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Map>

      {/* Botón desplegable desde el borde superior izquierdo para mostrar/ocultar panel de detalle */}
      {cardRoute && (
        <div className="absolute top-2 left-2 z-30">
          <button
            onClick={() => setShowDetailPanel(!showDetailPanel)}
            className="bg-white rounded-full shadow-md p-1.5 hover:bg-gray-50 transition-colors border border-gray-200"
            title={showDetailPanel ? 'Ocultar detalle' : 'Mostrar detalle'}
          >
            {showDetailPanel ? (
              <EyeOff className="h-4 w-4 text-gray-700" />
            ) : (
              <Eye className="h-4 w-4 text-gray-700" />
            )}
          </button>
        </div>
      )}

      {/* Tarjeta fija de la ruta seleccionada (arriba a la izquierda) - Se muestra cuando se selecciona desde el POI o desde el grid */}
      {cardRoute && showDetailPanel && (
        <div className="absolute top-12 left-4 sm:left-6 z-20 w-48 sm:w-56 max-w-[60vw]">
          <div className="relative overflow-hidden rounded-md bg-white shadow-md border border-gray-200">
            {/* Botón cerrar */}
            <button
              type="button"
              onClick={() => {
                setInternalSelectedRouteId(null)
                // Si selectedRouteId viene del grid, también limpiarlo
                if (selectedRouteId) {
                  onRouteSelect?.(null)
                }
                // Cerrar el popup del cluster si está abierto
                setClusterPopup(null)
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

              {/* Información de la ruta: distancia, elevación y duración */}
              <div className="mb-1 flex flex-wrap gap-2 text-[9px] text-gray-600">
                <div className="flex items-center gap-0.5">
                  <MapPin className="h-2.5 w-2.5" />
                  <span>{formatDistance(cardRoute.distance)}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <TrendingUp className="h-2.5 w-2.5" />
                  <span>{formatElevation(cardRoute.elevation)}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  <span>{cardRoute.duration}</span>
                </div>
              </div>

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

              {/* Botón de zoom al POI */}
              {cardRoute.location?.coordinates && (
                <button
                  type="button"
                  onClick={() => {
                    const coords = cardRoute.location?.coordinates
                    if (coords) {
                      handleMarkerDoubleClick(coords.lat, coords.lng)
                    }
                  }}
                  className="mb-1.5 w-full rounded-sm bg-blue-600 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm transition hover:bg-blue-700 flex items-center justify-center gap-1"
                  title="Hacer zoom al POI en el mapa"
                >
                  <ZoomIn className="h-3 w-3" />
                  Zoom
                </button>
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

          {/* Perfil de elevación debajo de la tarjeta */}
          {cardRoute.track && cardRoute.track.length > 0 && (
            <div className="mt-2 rounded-md bg-white shadow-md border border-gray-200 overflow-hidden">
              <RouteElevationProfile route={cardRoute as Route} compact={true} />
            </div>
          )}
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

