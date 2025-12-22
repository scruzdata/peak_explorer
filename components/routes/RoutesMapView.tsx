'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import { Route, FerrataGrade } from '@/types'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Mountain, Star } from 'lucide-react'
import { getDifficultyColor, getFerrataGradeColor } from '@/lib/utils'

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
 */
export function RoutesMapView({ routes, type, fullHeight = false, hoveredRouteId = null, onViewStateChange, onMarkerHover }: RoutesMapViewProps) {
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
        max-width: 180px !important;
        width: 160px !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        border-radius: 10px !important;
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
   * Calcula el anchor del popup basado en la posición del marcador en el viewport
   * Considera la altura del popup para evitar que se corte
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
    const distanceFromCenter = markerLat - viewportLat
    
    // El popup tiene aproximadamente 200px de altura (imagen 144px + contenido ~60px)
    // Necesitamos calcular cuántos grados representa esto en el viewport actual
    // Aproximadamente, a zoom 6, 1 grado ≈ 111km, y el viewport muestra ~10-15 grados
    // Usar un umbral más conservador (40% en lugar de 25%) para asegurar espacio suficiente
    const threshold = latRange * 0.08
    
    // Prioridad: primero verificar si está cerca del borde superior
    // Si el marcador está en el 40% superior, SIEMPRE usar 'top' (popup debajo)
    if (distanceFromCenter > threshold) {
      // Marcador está en la parte superior -> popup debe aparecer debajo
      setPopupAnchor('top')
    } else if (distanceFromCenter < -threshold) {
      // Marcador está en la parte inferior -> popup debe aparecer arriba
      setPopupAnchor('bottom')
    } else {
      // Si está en el medio, verificar los bordes laterales
      const markerLng = selectedRoute.location.coordinates.lng
      const viewportLng = viewState.longitude
      const lngRange = 360 / Math.pow(2, zoom)
      const lngDistance = markerLng - viewportLng
      const lngThreshold = lngRange * 0.35
      
      if (Math.abs(lngDistance) > lngThreshold) {
        // Si el marcador está a la izquierda del centro, el popup debe aparecer a la derecha
        // Si el marcador está a la derecha del centro, el popup debe aparecer a la izquierda
        if (lngDistance < 0) {
          // Marcador a la izquierda -> popup a la derecha del marcador
          setPopupAnchor('left')
        } else {
          // Marcador a la derecha -> popup a la izquierda del marcador
          setPopupAnchor('right')
        }
      } else {
        // Por defecto, popup abajo (más seguro que arriba)
        setPopupAnchor('bottom')
      }
    }
  }, [selectedRoute, viewState])

  /**
   * Maneja el click en un marcador para navegar al detalle de la ruta en una nueva pestaña
   */
  const handleMarkerClick = useCallback((route: Route) => {
    const url = `/${route.type === 'trekking' ? 'rutas' : 'vias-ferratas'}/${route.slug}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [])

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
        initialViewState={initialViewState}
        onMove={(evt: any) => {
          setViewState(evt.viewState)
          onViewStateChange?.(evt.viewState)
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={`mapbox://styles/mapbox/${mapStyle}`}
        mapboxAccessToken={mapboxToken}
        attributionControl={false}
      >
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
                  setSelectedRoute(route)
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
                  setSelectedRoute(route)
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

        {/* Popup con información de la ruta */}
        {selectedRoute && (
          <Popup
            longitude={selectedRoute.location.coordinates.lng}
            latitude={selectedRoute.location.coordinates.lat}
            anchor={popupAnchor}
            offset={popupAnchor === 'top' ? [0, 15] : popupAnchor === 'bottom' ? [0, -15] : popupAnchor === 'left' ? [10, 0] : [-10, 0]}
            onClose={() => setSelectedRoute(null)}
            closeButton={true}
            closeOnClick={true}
          >
            <div className="w-full max-w-full overflow-hidden rounded-lg bg-white box-border">
              {/* Imagen de la ruta - ocupa todo el ancho y parte superior */}
              <div className="relative h-28 w-full overflow-hidden box-border rounded-t-lg">
                <Image
                  src={selectedRoute.heroImage.url}
                  alt={selectedRoute.heroImage.alt}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                
                {/* Rating Badge - esquina superior derecha */}
                {selectedRoute.rating && typeof selectedRoute.rating === 'number' && (
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded-full bg-white/95 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-semibold text-gray-900 shadow-lg border border-gray-200 z-10">
                    <Star className="h-2.5 w-2.5 text-amber-500" fill="currentColor" strokeWidth={1.5} />
                    <span>{selectedRoute.rating.toFixed(1)}</span>
                  </div>
                )}
                
                {/* Badges de dificultad - esquina inferior izquierda */}
                <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 z-10">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium shadow-sm ${getDifficultyColor(selectedRoute.difficulty)}`}>
                    {selectedRoute.difficulty}
                  </span>
                  {selectedRoute.ferrataGrade && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium bg-blue-100 text-blue-800 shadow-sm">
                      {selectedRoute.ferrataGrade}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Contenido del popup */}
              <div className="p-2 w-full box-border">
                <h3 className="font-bold text-gray-900 mb-0.5 line-clamp-1 w-full text-xs leading-tight">{selectedRoute.title}</h3>
                <p className="text-[10px] text-gray-600 mb-1.5 line-clamp-2 w-full leading-snug">{selectedRoute.summary}</p>
                <p className="text-[10px] text-gray-500 mb-2 w-full">
                  {selectedRoute.location.region}, {selectedRoute.location.province}
                </p>
                <button
                  onClick={() => handleMarkerClick(selectedRoute)}
                  className="w-full px-2 py-1.5 bg-primary-600 text-white text-[10px] font-semibold rounded-md hover:bg-primary-700 transition-all duration-200 box-border shadow-sm hover:shadow-md"
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

