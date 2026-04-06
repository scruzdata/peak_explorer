'use client'
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { Route, FerrataGrade } from '@/types'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Mountain, Star, X, RotateCcw, Eye, EyeOff, MapPin, ZoomIn, Clock, TrendingUp, ExternalLink, Camera } from 'lucide-react'
import { getDifficultyColor, getFerrataGradeColor, formatDistance, formatElevation, formatArrayWithDashes } from '@/lib/utils'
import type { MapRef } from 'react-map-gl'
import { RouteElevationProfile } from './RouteElevationProfile'
import camerasJson from '../../public/cameras.json'
import { getAllRefugios, Refugio } from '@/lib/firebase/refugios'
import { FaHome } from 'react-icons/fa'
import { FerrataClimberIcon } from './FerrataClimberIcon'

/**
 * Icono de triángulo de exclamación personalizado
 */
const ExclamationTriangleIcon = ({
  size = undefined,
  color = '#dc2626',
  strokeWidth = 2,
  background = 'transparent',
  opacity = 1,
  rotation = 0,
  shadow = 0,
  flipHorizontal = false,
  flipVertical = false,
  padding = 0,
  className = ''
}: {
  size?: number | string
  color?: string
  strokeWidth?: number
  background?: string
  opacity?: number
  rotation?: number
  shadow?: number
  flipHorizontal?: boolean
  flipVertical?: boolean
  padding?: number
  className?: string
}) => {
  const transforms = []
  if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`)
  if (flipHorizontal) transforms.push('scaleX(-1)')
  if (flipVertical) transforms.push('scaleY(-1)')

  const viewBoxSize = 24 + (padding * 2)
  const viewBoxOffset = -padding
  const viewBox = `${viewBoxOffset} ${viewBoxOffset} ${viewBoxSize} ${viewBoxSize}`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{
        color,
        opacity,
        transform: transforms.join(' ') || undefined,
        filter: shadow > 0 ? `drop-shadow(0 ${shadow}px ${shadow * 2}px rgba(0,0,0,0.3))` : undefined,
        backgroundColor: background !== 'transparent' ? background : undefined
      }}
    >
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0zM12 15.75h.007v.008H12z"/>
    </svg>
  )
}

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
 * POIs de boletines de peligro de aludes
 */
interface AvalancheBulletinPOI {
  name: string
  url: string
  lat: number
  lng: number
}

/**
 * POIs de cámaras DGT
 * Basados en el JSON de /public/cameras.json
 */
interface DgtCameraPOI {
  latitud: number
  longitud: number
  imagen: string
  carretera: string
  pk: string
  provincia: string
}

// Datos estáticos de cámaras DGT basados en el JSON de /public/cameras.json
const DGT_CAMERAS: DgtCameraPOI[] = (camerasJson as any[])
  .map((item: any) => {
    const lat = Number(item.latitud)
    const lng = Number(item.longitud)
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null
    return {
      latitud: lat,
      longitud: lng,
      imagen: String(item.imagen ?? ''),
      carretera: String(item.carretera ?? ''),
      pk: String(item.pk ?? ''),
      provincia: String(item.provincia ?? ''),
    }
  })
  .filter((item: DgtCameraPOI | null): item is DgtCameraPOI => {
    return !!item && item.latitud !== 0 && item.longitud !== 0
  })

const AVALANCHE_BULLETIN_POIS: AvalancheBulletinPOI[] = [
  {
    name: 'AEMET-BPA PICOS DE EUROPA',
    url: 'https://www.aemet.es/documentos/es/eltiempo/prediccion/montana/boletin_peligro_aludes/BPA_PN_Picos_Europa.pdf',
    lat: 43.187067,
    lng: -4.821908
  },
  {
    name: 'AEMET - BPA SIERRAS DEL CORDELY PEÑA LABRA',
    url: 'https://www.aemet.es/documentos/es/eltiempo/prediccion/montana/boletin_peligro_aludes/BPA_sierra_Cordel_PLabra.pdf',
    lat: 43.047413,
    lng: -4.326998
  },
  {
    name: 'AEMET - BPA PN SIERRA DE GUADARRAMA',
    url: 'https://www.aemet.es/documentos/es/eltiempo/prediccion/montana/boletin_peligro_aludes/BPA_PN_Guadarrama.pdf',
    lat: 40.850631,
    lng: -3.949723
  },
  {
    name: 'AEMET - BPA PIRINEO NAVARRO Y ARAGONES',
    url: 'https://www.aemet.es/documentos/es/eltiempo/prediccion/montana/boletin_peligro_aludes/BPA_Pirineo_Nav_Ara.pdf',
    lat: 42.857522,
    lng: -0.839908
  },
  {
    name: 'AEMET - BPA PIRINEO CATALAN',
    url: 'https://www.aemet.es/documentos/es/eltiempo/prediccion/montana/boletin_peligro_aludes/BPA_Pirineo_Cat.pdf',
    lat: 42.404873,
    lng: 2.214536
  },
  {
    name: 'BPA A LUARTE, VALLE DE ARAGON',
    url: 'https://www.alurte.es/boletin.php',
    lat: 42.789069,
    lng: -0.319240
  },
  {
    name: 'CENTRE DE LAUGUI D\'ARAN',
    url: 'https://lauegi.report/bulletin/latest',
    lat: 42.699263,
    lng: 0.815074
  },
  {
    name: 'BPA INSTITUC CARTOGRAFIC I GELOGIC DE CATALUNYA',
    url: 'https://www.icgc.cat/ca/Ambits-tematics/Riscos-i-emergencies/Allaus/Butlleti-de-Perill-dAllaus-BPA',
    lat: 42.379926,
    lng: 1.870372
  },
  {
    name: 'SERVEI METEOROLÓGIC NACIONAL ANDORRA',
    url: 'https://www.meteo.ad/estatneu',
    lat: 42.506007,
    lng: 1.522832
  },
  {
    name: 'BPA METEO FRANCES PYRÉNÉES',
    url: 'https://meteofrance.com/meteo-montagne/pyrenees/risques-avalanche',
    lat: 42.640564,
    lng: 2.005010
  },
  {
    name: 'BPA METEO SIERRA NEVADA',
    url: 'https://granalpina.com/aludes-sierra-nevada/',
    lat: 37.054006, 
    lng: -3.310611
  }
]

/**
 * Helper para obtener el primer valor de un array o el valor único
 */
function getFirstValue<T>(value: T | T[] | undefined): T | undefined {
  if (!value) return undefined
  return Array.isArray(value) ? value[0] : value
}

/**
 * Helper para obtener el color según la dificultad (maneja arrays)
 */
function getDifficultyBorderColor(difficulty: string | string[] | undefined): { border: string; text: string } {
  const firstDiff = getFirstValue(difficulty)
  if (!firstDiff) return { border: 'border-gray-600', text: 'text-gray-600' }
  const colors: Record<string, { border: string; text: string }> = {
    'Fácil': { border: 'border-green-600', text: 'text-green-600' },
    'Moderada': { border: 'border-orange-600', text: 'text-orange-600' },
    'Difícil': { border: 'border-red-600', text: 'text-red-600' },
    'Muy Difícil': { border: 'border-purple-600', text: 'text-purple-600' },
    'Extrema': { border: 'border-purple-600', text: 'text-purple-600' },
  }
  return colors[firstDiff] || { border: 'border-gray-600', text: 'text-gray-600' }
}

/**
 * Ordena los grados de ferrata de menor a mayor (K1, K2, K3, K4, K5, K6)
 */
function sortFerrataGrades(grades: FerrataGrade[]): FerrataGrade[] {
  const order: FerrataGrade[] = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6']
  return grades.sort((a, b) => order.indexOf(a) - order.indexOf(b))
}

/**
 * Obtiene el color del borde según el grado K de la vía ferrata
 * Si es un array, usa el color del grado más alto (más difícil)
 */
function getFerrataGradeBorderColor(grade: FerrataGrade | FerrataGrade[] | undefined): { border: string; text: string } {
  if (!grade) return { border: 'border-gray-600', text: 'text-gray-600' }
  
  // Normalizar a array y ordenar
  const grades = Array.isArray(grade) ? grade : [grade]
  const sorted = sortFerrataGrades(grades)
  const highestGrade = sorted[sorted.length - 1] // Grado más alto (más difícil)
  
  const colors: Record<FerrataGrade, { border: string; text: string }> = {
    'K1': { border: 'border-green-600', text: 'text-green-600' },
    'K2': { border: 'border-blue-600', text: 'text-blue-600' },
    'K3': { border: 'border-yellow-600', text: 'text-yellow-600' },
    'K4': { border: 'border-orange-600', text: 'text-orange-600' },
    'K5': { border: 'border-red-600', text: 'text-red-600' },
    'K6': { border: 'border-purple-600', text: 'text-purple-600' },
  }
  return colors[highestGrade] || { border: 'border-gray-600', text: 'text-gray-600' }
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
  // Estado para mostrar/ocultar los POIs de boletines de peligro de aludes
  const [showAvalancheBulletins, setShowAvalancheBulletins] = useState(false)
  // Estado para el POI de boletín de aludes seleccionado
  const [selectedBulletinPOI, setSelectedBulletinPOI] = useState<number | null>(null)
  // Estado para refugios
  const [refugios, setRefugios] = useState<Refugio[]>([])
  const [showRefugios, setShowRefugios] = useState(false)
  const [selectedRefugioIndex, setSelectedRefugioIndex] = useState<number | null>(null)
  const refugioPopupScrollRef = useRef<HTMLDivElement | null>(null)
  // Estado para mostrar/ocultar cámaras DGT
  // Nota: showDgtCameras se sincroniza automáticamente con isDgtZoomEnabled
  // pero el usuario puede forzar el estado cuando el zoom es suficiente
  const [showDgtCameras, setShowDgtCameras] = useState(false)
  const [selectedDgtCameraIndex, setSelectedDgtCameraIndex] = useState<number | null>(null)
  // Estado para los límites actuales del mapa
  const [mapBounds, setMapBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null)

  // Combinar hoveredRouteId externo con interno (el interno tiene prioridad si no hay externo)
  const effectiveHoveredRouteId = hoveredRouteId ?? internalHoveredRouteId

  // Ruta seleccionada para mostrar track (puede venir del grid o del POI)
  const trackRouteId = selectedRouteId ?? internalSelectedRouteId
  
  // Efecto para cerrar el popup y mostrar el panel de detalle cuando se selecciona una ruta desde el grid
  useEffect(() => {
    if (selectedRouteId) {
      console.log('Ruta seleccionada desde el grid:', selectedRouteId)
      setClusterPopup(null)
      // Mostrar el panel de detalle automáticamente cuando se selecciona desde el grid
      setShowDetailPanel(true)
      // Limpiar la selección interna para que prevalezca la del grid
      setInternalSelectedRouteId(null)
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
    if (!cardRouteBase) {
      console.log('No hay cardRouteBase, cardRouteId:', cardRouteId)
      return null
    }
    
    console.log('Calculando cardRoute para:', cardRouteId, 'trackRouteId:', trackRouteId, 'selectedRouteTrack:', !!selectedRouteTrack)
    
    // Si hay un track cargado y coincide con la ruta seleccionada, usarlo
    if (selectedRouteTrack && trackRouteId === cardRouteId) {
      console.log('Usando selectedRouteTrack para cardRoute')
      return {
        ...cardRouteBase,
        track: selectedRouteTrack
      }
    }
    
    // Si la ruta ya tiene track, usarlo
    if (cardRouteBase.track && cardRouteBase.track.length > 0) {
      console.log('Usando track de cardRouteBase')
      return cardRouteBase
    }
    
    console.log('Retornando cardRouteBase sin track')
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

  // Determinar si el zoom es suficiente para mostrar cámaras DGT
  const isDgtZoomEnabled = useMemo(() => {
    if (!viewState) return false
    // Umbral de zoom: ajusta este valor si quieres exigir más/menos zoom
    return viewState.zoom >= 11
  }, [viewState])

  // Sincronizar automáticamente showDgtCameras con el zoom
  // Las cámaras aparecen automáticamente cuando zoom >= 11 y desaparecen cuando zoom < 11
  useEffect(() => {
    if (isDgtZoomEnabled) {
      // Cuando el zoom es suficiente, mostrar las cámaras automáticamente
      setShowDgtCameras(true)
    } else {
      // Cuando el zoom es insuficiente, ocultar las cámaras automáticamente
      setShowDgtCameras(false)
      setSelectedDgtCameraIndex(null)
    }
  }, [isDgtZoomEnabled])

  // Sincronizar automáticamente showRefugios con el zoom
  const isRefugiosZoomEnabled = useMemo(() => {
    if (!viewState) return false
    return viewState.zoom >= 11
  }, [viewState])

  useEffect(() => {
    if (isRefugiosZoomEnabled) {
      setShowRefugios(true)
    } else {
      setShowRefugios(false)
      setSelectedRefugioIndex(null)
    }
  }, [isRefugiosZoomEnabled])

  // Cargar refugios desde Firestore
  useEffect(() => {
    getAllRefugios().then(setRefugios).catch(console.error)
  }, [])

  // Filtrar refugios visibles según los bounds del mapa
  const visibleRefugios = useMemo(() => {
    if (!mapBounds || refugios.length === 0) return []
    const { north, south, east, west } = mapBounds
    return refugios.filter((refugio: Refugio) => {
      const lat = refugio.location.coordinates.lat
      const lng = refugio.location.coordinates.lng
      const inLat = lat >= south && lat <= north
      const inLng =
        east >= west
          ? lng >= west && lng <= east
          : lng >= west || lng <= east
      return inLat && inLng
    })
  }, [mapBounds, refugios])

  // Hacer scroll al top del popup cuando se abre
  useEffect(() => {
    if (selectedRefugioIndex !== null) {
      // Intentar múltiples veces para asegurar que el DOM esté renderizado
      const attemptScroll = (attempts = 0) => {
        if (attempts > 10) return // Máximo 10 intentos
        requestAnimationFrame(() => {
          if (refugioPopupScrollRef.current) {
            refugioPopupScrollRef.current.scrollTop = 0
          } else {
            // Fallback: buscar en el DOM
            const popup = document.querySelector('.mapboxgl-popup-content')
            if (popup) {
              const scrollableDiv = popup.querySelector('div[style*="overflow-y-auto"]') as HTMLElement
              if (scrollableDiv) {
                scrollableDiv.scrollTop = 0
              } else if (attempts < 10) {
                setTimeout(() => attemptScroll(attempts + 1), 20)
              }
            } else if (attempts < 10) {
              setTimeout(() => attemptScroll(attempts + 1), 20)
            }
          }
        })
      }
      attemptScroll()
    }
  }, [selectedRefugioIndex])

  /**
   * Obtiene el color según el tipo de refugio
   */
  const getRefugioColor = (type: string): string => {
    switch (type) {
      case 'alpine_hut':
        return '#8b5cf6' // morado 
      case 'wilderness_hut':
        return '#10b981' // verde
      case 'basic_hut':
        return '#f59e0b' // naranja
      case 'shelter':
        return '#3b82f6' // azul
      case 'hut':
        return '#ef4444' // rojo
      default:
        return '#6b7280' // gris
    }
  }

  // Cámaras DGT dentro del recuadro actual del mapa
  const visibleDgtCameras = useMemo(() => {
    if (!mapBounds) return []
    const { north, south, east, west } = mapBounds
    return DGT_CAMERAS.filter((camera) => {
      const lat = camera.latitud
      const lng = camera.longitud
      const inLat = lat >= south && lat <= north
      // Manejar cruces de meridiano 180 (no es el caso de España, pero lo dejamos genérico)
      const inLng =
        east >= west
          ? lng >= west && lng <= east
          : lng >= west || lng <= east
      return inLat && inLng
    })
  }, [mapBounds])

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

          try {
            const map = mapInstanceRef.current || (mapRef.current?.getMap())
            if (map) {
              const bounds = map.getBounds()
              if (bounds) {
                // Mapbox GL devuelve un objeto con propiedades _ne (noreste) y _sw (suroeste)
                const ne = (bounds as any)._ne
                const sw = (bounds as any)._sw
                if (ne && sw) {
                  setMapBounds({
                    north: ne.lat,
                    south: sw.lat,
                    east: ne.lng,
                    west: sw.lng,
                  })
                }
              }
            }
          } catch (error) {
            console.error('Error obteniendo bounds del mapa:', error)
          }
        }}
        onClick={(e: any) => {
          // Verificar si el click fue en un popup o marcador
          const target = e.originalEvent?.target || e.target
          if (target) {
            const isMarker = target.closest?.('.mapboxgl-marker') || 
                            target.closest?.('.mapboxgl-popup') ||
                            target.classList?.contains('mapboxgl-marker') ||
                            target.classList?.contains('mapboxgl-popup')
            
            if (isMarker) {
              return // No cerrar si el click fue en un marker o popup
            }
          }
          
          // Cerrar tarjeta y popup al pinchar en cualquier parte del mapa que no sea un marcador
          setInternalSelectedRouteId(null)
          onRouteSelect?.(null)
          setClusterPopup(null)
          setSelectedBulletinPOI(null)
          setSelectedDgtCameraIndex(null)
          setSelectedRefugioIndex(null)
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
                      : getDifficultyBorderColor(route.difficulty).border
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
                      <Mountain className={`h-5 w-5 transition-all duration-300 ${getDifficultyBorderColor(route.difficulty).text}`} />
                    )}
                    {type === 'ferrata' && route.ferrataGrade && (
                      <span className={`absolute -bottom-0.5 -right-0.5 text-[7px] px-0.5 py-0.5 rounded font-bold ${getFerrataGradeColor(route.ferrataGrade)} shadow-sm`}>
                        {formatArrayWithDashes(route.ferrataGrade)}
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
                          : getDifficultyBorderColor(route.difficulty).border
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
                            {formatArrayWithDashes(route.ferrataGrade)}
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
                      : getDifficultyBorderColor(hoveredRouteInCluster.route.difficulty).border
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
                        {formatArrayWithDashes(hoveredRouteInCluster.route.ferrataGrade)}
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

        {/* Marcadores de boletines de peligro de aludes */}
        {showAvalancheBulletins && AVALANCHE_BULLETIN_POIS.map((poi, index) => (
          <Marker
            key={`avalanche-bulletin-${index}`}
            longitude={poi.lng}
            latitude={poi.lat}
            anchor="bottom"
          >
            <div
              className="cursor-pointer"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                setSelectedBulletinPOI(selectedBulletinPOI === index ? null : index)
              }}
            >
              <div className="relative">
                {/* Icono de alerta sin fondo */}
                <div 
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ExclamationTriangleIcon size={24} color="#dc2626" strokeWidth={2} shadow={2} />
                </div>
                {/* Punto inferior del marcador */}
                <div 
                  className="absolute bg-red-600"
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    bottom: '-4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                />
              </div>
            </div>
            {selectedBulletinPOI === index && (
              <Popup
                longitude={poi.lng}
                latitude={poi.lat}
                anchor="bottom"
                onClose={() => setSelectedBulletinPOI(null)}
                closeButton={false}
                closeOnClick={false}
                className="avalanche-bulletin-popup"
              >
                <div className="p-1.5 min-w-[200px] rounded-xl bg-white border border-gray-200 shadow-xl">
                  <div className="flex items-start gap-1.5">
                    <div className="flex-shrink-0 w-5 h-5 rounded-md bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-md">
                      <ExclamationTriangleIcon size={10} color="#ffffff" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[11px] text-gray-900 mb-1 leading-tight">
                        {poi.name}
                      </h3>
                      <a
                        href={poi.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-[9px] text-red-600 hover:text-red-700 font-semibold transition-colors"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        <span>Ver boletín</span>
                      </a>
                    </div>
                  </div>
                </div>
              </Popup>
            )}
          </Marker>
        ))}

        {/* Marcadores de cámaras DGT (solo las visibles en el recuadro actual del mapa) */}
        {/* Marcadores de refugios */}
        {showRefugios && visibleRefugios.map((refugio: Refugio, index: number) => (
          <Marker
            key={`refugio-${refugio.id}-${index}`}
            longitude={refugio.location.coordinates.lng}
            latitude={refugio.location.coordinates.lat}
            anchor="bottom"
          >
            <div
              className="cursor-pointer"
              onClick={(e: any) => {
                e.stopPropagation()
                setSelectedRefugioIndex(selectedRefugioIndex === index ? null : index)
              }}
            >
              <div className="relative">
                <div 
                  className="flex items-center justify-center w-7 h-7 rounded-full text-white shadow-md"
                  style={{ backgroundColor: getRefugioColor(refugio.type) }}
                >
                  <FaHome className="w-4 h-4" />
                </div>
                <div
                  className="absolute"
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    bottom: '-4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    backgroundColor: getRefugioColor(refugio.type),
                  }}
                />
              </div>
            </div>
            {selectedRefugioIndex === index && (
              <Popup
                longitude={refugio.location.coordinates.lng}
                latitude={refugio.location.coordinates.lat}
                anchor="top"
                offset={[0, 10]}
                onClose={() => setSelectedRefugioIndex(null)}
                closeButton={false}
                closeOnClick={false}
              >
                <div 
                  ref={refugioPopupScrollRef}
                  className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xl max-w-[420px] overflow-y-auto" 
                  style={{ maxHeight: 'min(400px, calc(100vh - 200px))' }}
                >
                  <div className="flex flex-col gap-3">
                    {/* Header */}
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 leading-tight mb-2">
                        {refugio.name}
                      </h3>
                      <div className="flex flex-col gap-1.5">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-gray-100 rounded-lg w-fit">
                          <span className="text-xs font-medium text-gray-700 capitalize">{refugio.type.replace('_', ' ')}</span>
                        </div>
                        {refugio.elevation && (
                          <p className="text-sm text-gray-600 font-medium">
                            Elevación: <span className="text-gray-900">{refugio.elevation}m</span>
                          </p>
                        )}
                        {refugio.tags?.capacity && (
                          <p className="text-sm text-gray-600 font-medium">
                            Capacidad: <span className="text-gray-900">{refugio.tags.capacity}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Imagen si existe */}
                    {refugio.tags?.image && (
                      <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-black/5">
                        <img
                          src={refugio.tags.image}
                          alt={refugio.name}
                          className="block w-full max-h-[280px] object-contain bg-black"
                          loading="lazy"
                        />
                      </div>
                    )}
                    
                    {/* Información de tags (excluyendo campos específicos) */}
                    {refugio.tags && (() => {
                      const excludedFields = ['name', 'elevation', 'tourism', 'shelter_type', 'capacity', 'image', 'backcountry',
                        "addr:postcode","addr:city","access","wikidata","wikipedia","name:ca","name:es","name:fr","name:oc","description:fr","ref:refuges.info","addr:street", "addr:housenumber","addr:city",
                      ]
                      const filteredTags = Object.entries(refugio.tags).filter(([key]) => !excludedFields.includes(key))
                      return filteredTags.length > 0 && (
                        <div className="border-t border-gray-200 pt-3">
                          <h4 className="font-semibold text-sm text-gray-800 mb-2">Información adicional:</h4>
                          <div className="flex flex-col gap-2">
                            {filteredTags.map(([key, value]) => {
                              const valueStr = String(value)
                              const isUrl = /^https?:\/\//.test(valueStr)
                              return (
                                <div key={key} className="text-xs text-gray-700">
                                  <span className="font-semibold text-gray-800 capitalize">{key.replace('_', ' ')}:</span>{' '}
                                  {isUrl ? (
                                    <a
                                      href={valueStr}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-700 underline inline-flex items-center gap-1"
                                    >
                                      {valueStr}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  ) : (
                                    <span className="text-gray-700">{valueStr}</span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}
                    
                    {/* Enlace a Google Maps */}
                    <a
                      href={`https://www.google.com/maps?q=${refugio.location.coordinates.lat},${refugio.location.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors mt-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Abrir en Google Maps</span>
                    </a>
                  </div>
                </div>
              </Popup>
            )}
          </Marker>
        ))}

        {showDgtCameras && visibleDgtCameras.map((camera, index) => (
          <Marker
            key={`dgt-camera-${index}`}
            longitude={camera.longitud}
            latitude={camera.latitud}
            anchor="bottom"
          >
            <div
              className="cursor-pointer"
              onClick={(e: any) => {
                e.stopPropagation()
                setSelectedDgtCameraIndex(selectedDgtCameraIndex === index ? null : index)
              }}
            >
              <div className="relative">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white shadow-md">
                  <Camera className="w-4 h-4" />
                </div>
                <div
                  className="absolute bg-blue-600"
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    bottom: '-4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                />
              </div>
            </div>
            {selectedDgtCameraIndex === index && (
              <Popup
                longitude={camera.longitud}
                latitude={camera.latitud}
                anchor="bottom"
                onClose={() => setSelectedDgtCameraIndex(null)}
                closeButton={false}
                closeOnClick={false}
              >
                <div className="p-1.5 rounded-xl bg-white border border-gray-200 shadow-xl max-w-[260px]">
                  <div className="flex flex-col gap-1.5">
                    <div>
                      <h3 className="font-bold text-[11px] text-gray-900 leading-tight">
                        {camera.carretera} pk: {camera.pk}
                      </h3>
                      <p className="text-[9px] text-gray-500 leading-tight">
                        {camera.provincia}
                      </p>
                    </div>
                    <div className="relative w-full overflow-hidden rounded-md border border-gray-200 bg-black/5">
                      <img
                        src={camera.imagen}
                        alt={`${camera.carretera} pk ${camera.pk}`}
                        className="block w-full max-h-[180px] object-contain bg-black"
                        loading="lazy"
                      />
                    </div>
                    <a
                      href={camera.imagen}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[9px] text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                      <span>Abrir en nueva pestaña</span>
                    </a>
                  </div>
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </Map>

      {/* Popup para mostrar las rutas de un cluster - posicionado en esquina superior izquierda */}
      {clusterPopup && !cardRoute && (
        <div className="absolute top-4 left-6 sm:left-8 z-20 w-[200px] sm:w-[220px] lg:w-[200px] max-w-[calc(100%-3rem)] sm:max-w-[calc(100%-4rem)] lg:max-w-[calc(100%-3rem)]">
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
                              ? (getFirstValue(route.ferrataGrade) === 'K1' ? 'bg-green-50' :
                                 getFirstValue(route.ferrataGrade) === 'K2' ? 'bg-blue-50' :
                                 getFirstValue(route.ferrataGrade) === 'K3' ? 'bg-yellow-50' :
                                 getFirstValue(route.ferrataGrade) === 'K4' ? 'bg-orange-50' :
                                 getFirstValue(route.ferrataGrade) === 'K5' ? 'bg-red-50' :
                                 getFirstValue(route.ferrataGrade) === 'K6' ? 'bg-purple-50' :
                                 'bg-gray-100')
                              : 'bg-gray-100')
                          : (getFirstValue(route.difficulty) === 'Fácil' ? 'bg-green-50' :
                             getFirstValue(route.difficulty) === 'Moderada' ? 'bg-orange-50' :
                             getFirstValue(route.difficulty) === 'Difícil' ? 'bg-red-50' :
                             getFirstValue(route.difficulty) === 'Muy Difícil' ? 'bg-purple-50' :
                             'bg-gray-100')
                      } group-hover:scale-110 transition-transform duration-200`}>
                        {type === 'ferrata' ? (
                          <FerrataClimberIcon className={`h-4 w-4 ${
                            route.ferrataGrade
                              ? getFerrataGradeBorderColor(route.ferrataGrade).text
                              : 'text-gray-600'
                          }`} />
                        ) : (
                          <Mountain className={`h-4 w-4 ${getDifficultyBorderColor(route.difficulty).text}`} />
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
        <div className="absolute top-12 left-4 sm:left-6 bottom-4 sm:bottom-6 z-20 w-[200px] sm:w-[220px] lg:w-[200px] max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-3rem)] lg:max-w-[calc(100%-2rem)] flex flex-col min-h-0 overflow-y-auto">
          <div className="flex-shrink-0 relative overflow-hidden rounded-md bg-white shadow-md border border-gray-200">
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
              className="absolute top-1.5 right-1.5 z-20 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow hover:bg-white"
            >
              <X className="h-2.5 w-2.5" />
            </button>

            {/* Imagen */}
            <div className="relative h-24 w-full overflow-hidden">
              {(() => {
                const optimized = cardRoute.heroImage.optimizedSources
                const src =
                  optimized?.w400 ||
                  optimized?.w800 ||
                  optimized?.w1600 ||
                  cardRoute.heroImage.url
                return (
                  <Image
                    src={src}
                    alt={cardRoute.heroImage.alt}
                    fill
                    className="object-cover"
                    sizes="288px"
                  />
                )
              })()}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {/* Rating (más hacia la izquierda) */}
              {cardRoute.rating && typeof cardRoute.rating === 'number' && (
                <div className="absolute top-1 left-1 flex items-center gap-0.5 rounded-full bg-white/95 backdrop-blur px-1 py-0.5 text-[10px] font-semibold text-gray-900 shadow border border-gray-200">
                  <Star className="h-2 w-2 text-amber-500" fill="currentColor" strokeWidth={1.5} />
                  <span>{cardRoute.rating.toFixed(1)}</span>
                </div>
              )}

              {/* Badges dificultad / grado */}
              <div className="absolute bottom-1 left-1 flex items-center gap-0.5">
                <span className={`text-[10px] px-1 py-0.5 rounded-md font-medium shadow-sm ${getDifficultyColor(cardRoute.difficulty)}`}>
                  {formatArrayWithDashes(cardRoute.difficulty)}
                </span>
                {cardRoute.ferrataGrade && (
                  <span
                    className={`text-[10px] px-1 py-0.5 rounded-md font-medium shadow-sm ${getFerrataGradeColor(
                      cardRoute.ferrataGrade
                    )}`}
                  >
                    {formatArrayWithDashes(cardRoute.ferrataGrade)}
                  </span>
                )}
              </div>
            </div>

            {/* Contenido */}
            <div className="p-1.5">
              <h3 className="mb-0.5 text-[10px] font-bold text-gray-900 line-clamp-1 leading-tight">
                {cardRoute.title}
              </h3>
              <p className="mb-0.5 text-[9px] text-gray-600 line-clamp-1 leading-tight">
                {cardRoute.summary}
              </p>
              <p className="mb-0.5 text-[9px] text-gray-500">
                {cardRoute.location.region}, {cardRoute.location.province}
              </p>

              {/* Información de la ruta: distancia, elevación y duración */}
              <div className="mb-1 flex flex-wrap gap-1 text-[8px] text-gray-600">
                <div className="flex items-center gap-0.5">
                  <MapPin className="h-2 w-2" />
                  <span>{formatDistance(cardRoute.distance)}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <TrendingUp className="h-2 w-2" />
                  <span>{formatElevation(cardRoute.elevation)}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <Clock className="h-2 w-2" />
                  <span>{cardRoute.duration}</span>
                </div>
              </div>

              {/* Estado de carga del track */}
              {isLoadingTrack && (
                <p className="mb-0.5 text-[9px] text-primary-600">
                  Cargando track…
                </p>
              )}
              {trackError && (
                <p className="mb-0.5 text-[9px] text-red-600">
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
                  className="mb-1 w-full rounded-sm bg-blue-600 px-2 py-0.5 text-[9px] font-semibold text-white shadow-sm transition hover:bg-blue-700 flex items-center justify-center gap-1"
                  title="Hacer zoom al POI en el mapa"
                >
                  <ZoomIn className="h-2.5 w-2.5" />
                  Zoom
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const url = `/${cardRoute.type === 'trekking' ? 'rutas' : 'vias-ferratas'}/${cardRoute.slug}`
                  window.open(url, '_blank', 'noopener,noreferrer')
                }}
                className="w-full rounded-sm bg-primary-600 px-2 py-0.5 text-[9px] font-semibold text-white shadow-sm transition hover:bg-primary-700"
              >
                Ver detalles
              </button>
            </div>
          </div>

          {/* Perfil de elevación debajo de la tarjeta */}
          {cardRoute.track && cardRoute.track.length > 0 && (
            <div className="mt-1.5 flex-shrink-0 rounded-md bg-white shadow-md border border-gray-200 overflow-hidden">
              <RouteElevationProfile route={cardRoute as Route} compact={true} />
            </div>
          )}
        </div>
      )}

      {/* Controles del mapa */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 lg:gap-2">
        <button
          onClick={() => setShowAvalancheBulletins(!showAvalancheBulletins)}
          className={`px-1 py-1.5 lg:px-3 lg:py-2 bg-white rounded-lg shadow-md text-xs lg:text-sm font-medium transition-colors flex items-center gap-1.5 lg:gap-2 ${
            showAvalancheBulletins 
              ? 'text-red-600 hover:bg-red-50' 
              : 'text-gray-700 hover:bg-gray-50'
          }`}
          title={showAvalancheBulletins ? 'Ocultar boletines de peligro de aludes' : 'Mostrar boletines de peligro de aludes'}
        >
          <ExclamationTriangleIcon size={16} color="#dc2626" strokeWidth={2} className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
          <span className="text-[10px] lg:text-xs">Boletines</span>
        </button>
        <button
          onClick={() => setMapStyle(mapStyle === 'outdoors-v12' ? 'satellite-streets-v12' : 'outdoors-v12')}
          className="px-1 py-1.5 lg:px-3 lg:py-2 bg-white rounded-lg shadow-md text-xs lg:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          title="Cambiar estilo de mapa"
        >
          {mapStyle === 'outdoors-v12' ? 'Satélite' : 'Mapa'}
        </button>
        <button
          onClick={handleResetView}
          className="px-1 py-1.5 lg:px-3 lg:py-2 bg-white rounded-lg shadow-md text-xs lg:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5 lg:gap-2"
          title="Resetear vista del mapa"
        >
          <RotateCcw className="h-3 w-3 lg:h-4 lg:w-4" />
          <span>Resetear</span>
        </button>
      </div>

      {/* Contador de rutas (todavía más pegado al borde izquierdo para no solapar la tarjeta) */}
      <div className="absolute bottom-4 right-0 sm:right-1 px-2.5 py-1.5 bg-white rounded-lg shadow-md text-xs text-gray-700">
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

