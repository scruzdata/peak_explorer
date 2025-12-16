'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import { Route } from '@/types'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Mountain, Star } from 'lucide-react'
import { getDifficultyColor } from '@/lib/utils'

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
const Popup = dynamic(
  () => import('react-map-gl').then((mod) => mod.Popup),
  { ssr: false }
)

interface RoutesMapViewProps {
  routes: Route[]
  type: 'trekking' | 'ferrata'
  fullHeight?: boolean
  hoveredRouteId?: string | null
}

/**
 * Componente que muestra todas las rutas en un mapa de España usando Mapbox
 * Muestra el POI principal de cada ruta y permite navegar al detalle
 */
export function RoutesMapView({ routes, type, fullHeight = false, hoveredRouteId = null }: RoutesMapViewProps) {
  const router = useRouter()
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [mapStyle, setMapStyle] = useState<'satellite-streets-v12' | 'outdoors-v12'>('outdoors-v12')
  const [popupAnchor, setPopupAnchor] = useState<'bottom' | 'top' | 'left' | 'right'>('bottom')
  const [viewState, setViewState] = useState<{latitude: number; longitude: number; zoom: number} | null>(null)

  /**
   * Importa dinámicamente los estilos de Mapbox cuando el componente se monta
   */
  useEffect(() => {
    // Importar CSS de Mapbox dinámicamente
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css'
    document.head.appendChild(link)
    
    // Añadir estilos personalizados para el popup
    const style = document.createElement('style')
    style.textContent = `
      .mapboxgl-popup-content {
        padding: 0 !important;
        max-width: 220px !important;
        width: 200px !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        border-radius: 12px !important;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
      }
      .mapboxgl-popup-content > * {
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      .mapboxgl-popup-tip {
        border-top-color: white !important;
      }
      .mapboxgl-popup-close-button {
        width: 28px !important;
        height: 28px !important;
        font-size: 18px !important;
        color: #333 !important;
        background: rgba(255, 255, 255, 0.9) !important;
        border-radius: 50% !important;
        top: 8px !important;
        right: 8px !important;
        z-index: 10 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: all 0.2s !important;
      }
      .mapboxgl-popup-close-button:hover {
        background: white !important;
        transform: scale(1.1) !important;
      }
    `
    document.head.appendChild(style)
    
    return () => {
      // Limpiar el link cuando el componente se desmonte
      const existingLink = document.head.querySelector(`link[href="${link.href}"]`)
      if (existingLink) {
        document.head.removeChild(existingLink)
      }
      // Limpiar el estilo
      document.head.removeChild(style)
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
   */
  const initialViewState = useMemo(() => {
    if (routesWithCoordinates.length === 0) {
      // Centro de España por defecto
      return {
        longitude: -3.7038,
        latitude: 40.4168,
        zoom: 6,
      }
    }

    // Calcular bounding box de todas las rutas
    const lats = routesWithCoordinates.map(r => r.location.coordinates.lat)
    const lngs = routesWithCoordinates.map(r => r.location.coordinates.lng)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    // Calcular centro
    const centerLat = (minLat + maxLat) / 2
    const centerLng = (minLng + maxLng) / 2

    // Calcular zoom basado en el área cubierta
    const latDiff = maxLat - minLat
    const lngDiff = maxLng - minLng
    const maxDiff = Math.max(latDiff, lngDiff)
    
    let zoom = 6
    if (maxDiff > 10) zoom = 5
    else if (maxDiff > 5) zoom = 6
    else if (maxDiff > 2) zoom = 7
    else if (maxDiff > 1) zoom = 8
    else zoom = 9

    return {
      longitude: centerLng,
      latitude: centerLat,
      zoom,
    }
  }, [routesWithCoordinates])

  /**
   * Calcula el anchor del popup basado en la posición del marcador en el viewport
   */
  useEffect(() => {
    if (!selectedRoute || !viewState) {
      return
    }

    const markerLat = selectedRoute.location.coordinates.lat
    const viewportLat = viewState.latitude
    const zoom = viewState.zoom

    // Calcular la distancia en grados desde el centro del viewport
    // A mayor zoom, menor es el área visible
    const latRange = 180 / Math.pow(2, zoom)
    const distanceFromCenter = Math.abs(markerLat - viewportLat)
    
    // Si el marcador está en el 30% superior del viewport, usar anchor 'top'
    // Si está en el 30% inferior, usar 'bottom'
    // Si está en el medio, usar 'bottom' por defecto
    if (distanceFromCenter > latRange * 0.3 && markerLat > viewportLat) {
      setPopupAnchor('top')
    } else if (distanceFromCenter > latRange * 0.3 && markerLat < viewportLat) {
      setPopupAnchor('bottom')
    } else {
      // Si está cerca del borde izquierdo o derecho, usar 'left' o 'right'
      const markerLng = selectedRoute.location.coordinates.lng
      const viewportLng = viewState.longitude
      const lngRange = 360 / Math.pow(2, zoom)
      const lngDistance = Math.abs(markerLng - viewportLng)
      
      if (lngDistance > lngRange * 0.4) {
        // Si el marcador está a la izquierda del centro, el popup debe aparecer a la derecha
        // Si el marcador está a la derecha del centro, el popup debe aparecer a la izquierda
        if (markerLng < viewportLng) {
          // Marcador a la izquierda -> popup a la derecha del marcador
          setPopupAnchor('left')
        } else {
          // Marcador a la derecha -> popup a la izquierda del marcador
          setPopupAnchor('right')
        }
      } else {
        setPopupAnchor('bottom')
      }
    }
  }, [selectedRoute, viewState])

  /**
   * Maneja el click en un marcador para navegar al detalle de la ruta
   */
  const handleMarkerClick = useCallback((route: Route) => {
    const url = `/${route.type === 'trekking' ? 'rutas' : 'vias-ferratas'}/${route.slug}`
    router.push(url)
  }, [router])

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
    <div className={`relative w-full overflow-hidden border border-gray-200 ${fullHeight ? 'h-full rounded-none' : 'h-[600px] rounded-lg'}`}>
      <Map
        initialViewState={initialViewState}
        onMove={(evt: any) => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={`mapbox://styles/mapbox/${mapStyle}`}
        mapboxAccessToken={mapboxToken}
        attributionControl={false}
      >
        {/* Marcadores para cada ruta */}
        {routesWithCoordinates.map((route) => {
          const isHovered = hoveredRouteId === route.id
          return (
            <Marker
              key={route.id}
              longitude={route.location.coordinates.lng}
              latitude={route.location.coordinates.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                setSelectedRoute(route)
              }}
            >
              <div className="relative cursor-pointer group">
                <div className={`p-2 rounded-full bg-white shadow-lg border-2 transition-all duration-300 ${
                  isHovered 
                    ? 'scale-150 border-primary-600 shadow-xl z-50' 
                    : 'group-hover:scale-110'
                } ${
                  route.difficulty === 'Fácil' ? isHovered ? 'border-green-600' : 'border-green-600' :
                  route.difficulty === 'Moderada' ? isHovered ? 'border-orange-600' : 'border-orange-600' :
                  route.difficulty === 'Difícil' ? isHovered ? 'border-red-600' : 'border-red-600' :
                  route.difficulty === 'Muy Difícil' ? isHovered ? 'border-purple-600' : 'border-purple-600' :
                  isHovered ? 'border-gray-600' : 'border-gray-600'
                }`}>
                  <Mountain className={`h-5 w-5 transition-all duration-300 ${
                    isHovered 
                      ? 'text-primary-600' 
                      : route.difficulty === 'Fácil' ? 'text-green-600' :
                        route.difficulty === 'Moderada' ? 'text-orange-600' :
                        route.difficulty === 'Difícil' ? 'text-red-600' :
                        route.difficulty === 'Muy Difícil' ? 'text-purple-600' :
                        'text-gray-600'
                  }`} />
                </div>
                {/* Tooltip al hover */}
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap transition-opacity pointer-events-none ${
                  isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  {route.title}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
                {/* Anillo de resaltado cuando está hovered */}
                {isHovered && (
                  <div className="absolute inset-0 rounded-full border-4 border-primary-400 animate-ping opacity-75"></div>
                )}
              </div>
            </Marker>
          )
        })}

        {/* Popup con información de la ruta */}
        {selectedRoute && (
          <Popup
            longitude={selectedRoute.location.coordinates.lng}
            latitude={selectedRoute.location.coordinates.lat}
            anchor={popupAnchor}
            onClose={() => setSelectedRoute(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="w-full max-w-full overflow-hidden rounded-xl bg-white box-border">
              {/* Imagen de la ruta - ocupa todo el ancho y parte superior */}
              <div className="relative h-36 w-full overflow-hidden box-border rounded-t-xl">
                <Image
                  src={selectedRoute.heroImage.url}
                  alt={selectedRoute.heroImage.alt}
                  fill
                  className="object-cover"
                  sizes="200px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                
                {/* Rating Badge - esquina superior derecha */}
                {selectedRoute.rating && typeof selectedRoute.rating === 'number' && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-sm px-2 py-1 text-xs font-semibold text-gray-900 shadow-lg border border-gray-200 z-10">
                    <Star className="h-3 w-3 text-amber-500" fill="currentColor" strokeWidth={1.5} />
                    <span>{selectedRoute.rating.toFixed(1)}</span>
                  </div>
                )}
                
                {/* Badges de dificultad - esquina inferior izquierda */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-10">
                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium shadow-sm ${getDifficultyColor(selectedRoute.difficulty)}`}>
                    {selectedRoute.difficulty}
                  </span>
                  {selectedRoute.ferrataGrade && (
                    <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-blue-100 text-blue-800 shadow-sm">
                      {selectedRoute.ferrataGrade}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Contenido del popup */}
              <div className="p-3 w-full box-border">
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 w-full text-sm leading-tight">{selectedRoute.title}</h3>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2 w-full leading-snug">{selectedRoute.summary}</p>
                <p className="text-xs text-gray-500 mb-3 w-full">
                  {selectedRoute.location.region}, {selectedRoute.location.province}
                </p>
                <button
                  onClick={() => handleMarkerClick(selectedRoute)}
                  className="w-full px-3 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-all duration-200 box-border shadow-sm hover:shadow-md"
                >
                  Ver detalles
                </button>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Controles del mapa */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setMapStyle(mapStyle === 'outdoors-v12' ? 'satellite-streets-v12' : 'outdoors-v12')}
          className="px-3 py-2 bg-white rounded-lg shadow-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {mapStyle === 'outdoors-v12' ? 'Satélite' : 'Mapa'}
        </button>
      </div>

      {/* Contador de rutas */}
      <div className="absolute bottom-4 left-4 px-3 py-2 bg-white rounded-lg shadow-md text-sm text-gray-700">
        {routesWithCoordinates.length} {routesWithCoordinates.length === 1 ? 'ruta' : 'rutas'} en el mapa
      </div>
    </div>
  )
}

