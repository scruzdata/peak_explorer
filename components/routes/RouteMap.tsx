'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Route } from '@/types'
import dynamic from 'next/dynamic'
import { Car, RotateCcw, Play, Pause, Square, Download, Eye, EyeOff, Menu, X, Maximize2, Minimize2, UtensilsCrossed } from 'lucide-react'
import { calculateSlope, getSlopeColor } from '@/lib/utils'

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
const Source = dynamic(
  () => import('react-map-gl').then((mod) => mod.Source),
  { ssr: false }
)
const Layer = dynamic(
  () => import('react-map-gl').then((mod) => mod.Layer),
  { ssr: false }
)


interface RouteMapProps {
  route: Route
  hoveredTrackIndex?: number | null
}

/**
 * Componente que muestra el mapa de la ruta usando Mapbox
 * Muestra solo los POIs del parking con iconos de coche
 */
export function RouteMap({ route, hoveredTrackIndex }: RouteMapProps) {
  const [selectedParking, setSelectedParking] = useState<number | null>(null)
  const [mapStyle, setMapStyle] = useState<'satellite-streets-v12' | 'outdoors-v12'>('outdoors-v12')
  const [is3D, setIs3D] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationIndex, setAnimationIndex] = useState(0)
  const [showParking, setShowParking] = useState(true)
  const [showRestaurants, setShowRestaurants] = useState(true)
  const [showTrack, setShowTrack] = useState(true)
  const [showSlopeColors, setShowSlopeColors] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const animationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /**
   * Calcula el bounding box y el viewState inicial para mostrar toda la ruta
   */
  const initialViewState = useMemo(() => {
    // Recopilar todos los puntos (track + parking + restaurants)
    const allPoints: { lat: number; lng: number }[] = []
    
    // Añadir puntos del track
    if (route.track && route.track.length > 0) {
      allPoints.push(...route.track.map(p => ({ lat: p.lat, lng: p.lng })))
    }
    
    // Añadir puntos del parking
    if (route.parking && route.parking.length > 0) {
      allPoints.push(...route.parking)
    }
    
    // Añadir puntos de restaurantes
    if (route.restaurants && route.restaurants.length > 0) {
      allPoints.push(...route.restaurants.map(r => ({ lat: r.lat, lng: r.lng })))
    }
    
    // Si no hay puntos, usar la ubicación de la ruta
    if (allPoints.length === 0) {
      return {
        longitude: route.location.coordinates.lng,
        latitude: route.location.coordinates.lat,
        zoom: 13,
        pitch: 0,
        bearing: 0,
      }
    }
    
    // Calcular bounding box
    const lats = allPoints.map(p => p.lat)
    const lngs = allPoints.map(p => p.lng)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    
    // Calcular centro
    const centerLat = (minLat + maxLat) / 2
    const centerLng = (minLng + maxLng) / 2
    
    // Calcular el zoom apropiado basado en el tamaño del bounding box
    // Usar la fórmula de zoom de Mapbox basada en la diferencia de coordenadas
    const latDiff = maxLat - minLat
    const lngDiff = maxLng - minLng
    
    // Calcular el zoom usando una fórmula más precisa
    // Considerar el padding (multiplicar por 1.2 para añadir margen)
    const padding = 1.2
    const latZoom = Math.log2(360 / (latDiff * padding))
    const lngZoom = Math.log2(360 / (lngDiff * padding))
    
    // Usar el zoom menor para asegurar que todo quepa
    let zoom = Math.min(latZoom, lngZoom)
    
    // Limitar el zoom entre 8 y 16
    zoom = Math.max(8, Math.min(16, Math.floor(zoom)))
    
    return {
      longitude: centerLng,
      latitude: centerLat,
      zoom,
      pitch: 0,
      bearing: 0,
    }
  }, [route.track, route.parking, route.restaurants, route.location.coordinates])
  
  const [viewState, setViewState] = useState(initialViewState)

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
      document.head.removeChild(link)
    }
  }, [])

  /**
   * Cierra el menú cuando se hace clic fuera de él
   */
  useEffect(() => {
    if (!isMenuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.menu-container')) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  /**
   * Actualiza el viewState cuando cambia la ruta
   */
  useEffect(() => {
    setViewState(initialViewState)
  }, [initialViewState])

  /**
   * Maneja el cambio de vista del mapa
   */
  const onMove = useCallback((evt: { viewState: { longitude: number; latitude: number; zoom: number; pitch?: number; bearing?: number } }) => {
    setViewState({
      ...evt.viewState,
      pitch: evt.viewState.pitch ?? 0,
      bearing: evt.viewState.bearing ?? 0,
    })
  }, [])

  /**
   * Alterna entre estilos de mapa satélite y outdoors
   */
  const toggleMapStyle = useCallback(() => {
    setMapStyle((prev: 'satellite-streets-v12' | 'outdoors-v12') => prev === 'satellite-streets-v12' ? 'outdoors-v12' : 'satellite-streets-v12')
  }, [])

  /**
   * Alterna el modo 3D del mapa
   */
  const toggle3D = useCallback(() => {
    setIs3D((prev: boolean) => {
      const newIs3D = !prev
      // Actualizar pitch cuando se activa/desactiva el modo 3D
      setViewState((current: typeof initialViewState) => ({
        ...current,
        pitch: newIs3D ? 60 : 0,
        bearing: current.bearing ?? 0,
      }))
      return newIs3D
    })
  }, [initialViewState])

  /**
   * Resetea el mapa a la vista inicial por defecto
   */
  const resetView = useCallback(() => {
    setViewState({
      longitude: initialViewState.longitude,
      latitude: initialViewState.latitude,
      zoom: initialViewState.zoom,
      pitch: is3D ? 60 : 0,
      bearing: initialViewState.bearing ?? 0,
    })
  }, [initialViewState, is3D])

  /**
   * Inicia o pausa la animación del recorrido
   */
  const toggleAnimation = useCallback(() => {
    if (!route.track || route.track.length === 0) return

    setIsAnimating((prev: boolean) => {
      if (prev) {
        // Pausar
        if (animationIntervalRef.current) {
          clearInterval(animationIntervalRef.current)
          animationIntervalRef.current = null
        }
        return false
      } else {
        // Iniciar o continuar
        const startIndex = animationIndex >= route.track!.length ? 0 : animationIndex
        setAnimationIndex(startIndex)
        return true
      }
    })
  }, [route.track, animationIndex])

  /**
   * Detiene la animación y resetea la posición
   */
  const stopAnimation = useCallback(() => {
    setIsAnimating(false)
    setAnimationIndex(0)
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current)
      animationIntervalRef.current = null
    }
    resetView()
  }, [resetView])

  /**
   * Efecto que maneja la animación del recorrido
   */
  useEffect(() => {
    if (!isAnimating || !route.track || route.track.length === 0) {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current)
        animationIntervalRef.current = null
      }
      return
    }

    const interval = setInterval(() => {
      setAnimationIndex((currentIndex: number) => {
        const nextIndex = currentIndex + 1
        if (nextIndex >= route.track!.length) {
          setIsAnimating(false)
          return currentIndex
        }

        // Actualizar vista del mapa al siguiente punto
        const point = route.track![nextIndex]
        setViewState((prev: typeof initialViewState) => ({
          longitude: point.lng,
          latitude: point.lat,
          zoom: prev.zoom, // Mantener el zoom actual
          pitch: prev.pitch ?? 0,
          bearing: prev.bearing ?? 0,
        }))

        return nextIndex
      })
    }, 100) // 100ms entre puntos (ajustable)

    animationIntervalRef.current = interval

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current)
        animationIntervalRef.current = null
      }
    }
  }, [isAnimating, route.track])

  /**
   * Exporta el mapa como imagen PNG usando la API nativa del navegador
   */
  const exportMapAsImage = useCallback(() => {
    try {
      // Buscar el contenedor del mapa
      const mapContainer = document.querySelector('.mapboxgl-map')
      if (!mapContainer) {
        alert('No se encontró el mapa para exportar')
        return
      }

      // Intentar usar html2canvas si está disponible, sino usar método alternativo
      const exportImage = async () => {
        try {
          // Intentar importar html2canvas dinámicamente
          const html2canvas = (await import('html2canvas')).default
          const canvas = await html2canvas(mapContainer as HTMLElement, {
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            scale: 2, // Mayor resolución
          })

          // Crear un enlace de descarga
          const link = document.createElement('a')
          link.download = `mapa-${route.slug || 'ruta'}.png`
          link.href = canvas.toDataURL('image/png')
          link.click()
        } catch (error) {
          // Fallback: usar método alternativo con canvas nativo
          console.warn('html2canvas no disponible, usando método alternativo')
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            throw new Error('No se pudo crear el contexto del canvas')
          }

          // Obtener dimensiones del mapa
          const rect = mapContainer.getBoundingClientRect()
          canvas.width = rect.width
          canvas.height = rect.height

          // Dibujar fondo blanco
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          // Intentar capturar usando toDataURL del canvas de Mapbox
          const mapboxCanvas = mapContainer.querySelector('canvas')
          if (mapboxCanvas) {
            ctx.drawImage(mapboxCanvas, 0, 0)
          }

          // Crear enlace de descarga
          const link = document.createElement('a')
          link.download = `mapa-${route.slug || 'ruta'}.png`
          link.href = canvas.toDataURL('image/png')
          link.click()
        }
      }

      exportImage()
    } catch (error) {
      console.error('Error al exportar el mapa:', error)
      alert('No se pudo exportar el mapa. Intenta hacer una captura de pantalla manual (Ctrl+Shift+S o Cmd+Shift+4).')
    }
  }, [route.slug])

  /**
   * Tipo para los segmentos del track con colores
   */
  type TrackSegment = {
    type: 'Feature'
    geometry: {
      type: 'LineString'
      coordinates: number[][]
    }
    properties: {
      color: string
    }
  }

  /**
   * Crea el GeoJSON para el track de la ruta con segmentos coloreados según pendiente o color uniforme
   */
  const routeGeoJSONSegments = useMemo(() => {
    if (!route.track || route.track.length < 2) return null

    const segments: TrackSegment[] = []

    for (let i = 1; i < route.track.length; i++) {
      const prev = route.track[i - 1]
      const curr = route.track[i]
      
      let color = '#3b82f6' // Color azul por defecto
      
      if (showSlopeColors) {
        const slope = calculateSlope(
          prev.lat,
          prev.lng,
          prev.elevation || 0,
          curr.lat,
          curr.lng,
          curr.elevation || 0
        )
        color = getSlopeColor(slope)
      }
      
      segments.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [prev.lng, prev.lat],
            [curr.lng, curr.lat]
          ]
        },
        properties: {
          color
        }
      })
    }

    return segments
  }, [route.track, showSlopeColors])

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (!mapboxToken) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-4">
          <p className="text-gray-600 mb-2">Mapbox no configurado</p>
          <p className="text-sm text-gray-500">
            Configura NEXT_PUBLIC_MAPBOX_TOKEN en tus variables de entorno
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full relative">
      <Map
        {...viewState}
        onMove={onMove}
        style={{ width: '100%', height: '100%' }}
        mapStyle={`mapbox://styles/mapbox/${mapStyle}`}
        mapboxAccessToken={mapboxToken}
        attributionControl={true}
        terrain={is3D ? { source: 'mapbox-dem', exaggeration: 1.5 } : undefined}
      >
        {/* Terreno 3D */}
        {is3D && (
          <Source
            id="mapbox-dem"
            type="raster-dem"
            url="mapbox://mapbox.mapbox-terrain-dem-v1"
            tileSize={512}
            maxzoom={14}
          />
        )}

        {/* Track de la ruta con colores según pendiente */}
        {routeGeoJSONSegments && showTrack && routeGeoJSONSegments.map((segment: TrackSegment, index: number) => (
          <Source key={index} id={`route-track-${index}`} type="geojson" data={segment}>
            <Layer
              id={`route-line-${index}`}
              type="line"
              paint={{
                'line-color': segment.properties.color,
                'line-width': 4,
                'line-opacity': 0.8,
              }}
            />
          </Source>
        ))}

        {/* Marcador de animación del recorrido */}
        {isAnimating && route.track && route.track[animationIndex] && (
          <Marker
            longitude={route.track[animationIndex].lng}
            latitude={route.track[animationIndex].lat}
            anchor="center"
          >
            <div className="relative">
              <div 
                className="rounded-full bg-green-500 shadow-lg border-2 border-white animate-pulse"
                style={{
                  width: '20px',
                  height: '20px'
                }}
              />
            </div>
          </Marker>
        )}

        {/* Marcador de posición hover del perfil de elevación */}
        {hoveredTrackIndex !== null && hoveredTrackIndex !== undefined && route.track && route.track[hoveredTrackIndex] && (
          <Marker
            longitude={route.track[hoveredTrackIndex].lng}
            latitude={route.track[hoveredTrackIndex].lat}
            anchor="center"
          >
            <div className="relative">
              {/* Círculo pulsante */}
              <div 
                className="absolute inset-0 rounded-full bg-red-500 opacity-30 animate-ping"
                style={{
                  width: '24px',
                  height: '24px',
                  margin: '-12px 0 0 -12px'
                }}
              />
              {/* Círculo principal */}
              <div 
                className="rounded-full bg-red-500 shadow-lg border-2 border-white"
                style={{
                  width: '16px',
                  height: '16px'
                }}
              />
            </div>
          </Marker>
        )}

        {/* Marcadores del parking */}
        {showParking && route.parking && route.parking.length > 0 && route.parking.map((parking, index) => (
          <Marker
            key={index}
            longitude={parking.lng}
            latitude={parking.lat}
            anchor="bottom"
          >
            <div
              className="cursor-pointer"
              onClick={() => setSelectedParking(selectedParking === index ? null : index)}
            >
              <div className="relative">
                {/* Forma de gota/pin clásica */}
                <div 
                  className="bg-blue-500 shadow-lg hover:bg-blue-600 transition-colors"
                  style={{
                    width: '32px',
                    height: '40px',
                    borderRadius: '50% 50% 50% 0',
                    transform: 'rotate(-45deg)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {/* Icono de coche rotado para compensar la rotación del fondo */}
                  <div style={{ transform: 'rotate(45deg)' }}>
                    <Car className="h-4 w-4 text-white" />
                  </div>
                </div>
                {/* Punto inferior de la gota */}
                <div 
                  className="absolute bg-blue-500"
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
            {selectedParking === index && (
              <Popup
                longitude={parking.lng}
                latitude={parking.lat}
                anchor="bottom"
                onClose={() => setSelectedParking(null)}
                closeButton={true}
                closeOnClick={false}
              >
                <div className="p-2">
                  <h3 className="font-semibold text-sm">Parking {index + 1}</h3>
                  <p className="text-xs text-gray-600">
                    {parking.lat.toFixed(6)}, {parking.lng.toFixed(6)}
                  </p>
                </div>
              </Popup>
            )}
          </Marker>
        ))}

        {/* Marcadores de restaurantes */}
        {showRestaurants && route.restaurants && route.restaurants.length > 0 && route.restaurants.map((restaurant, index) => (
          <Marker
            key={`restaurant-${index}`}
            longitude={restaurant.lng}
            latitude={restaurant.lat}
            anchor="bottom"
          >
            <div
              className="cursor-pointer"
              onClick={() => setSelectedRestaurant(selectedRestaurant === index ? null : index)}
            >
              <div className="relative">
                {/* Forma de gota/pin clásica */}
                <div 
                  className="bg-orange-500 shadow-lg hover:bg-orange-600 transition-colors"
                  style={{
                    width: '32px',
                    height: '40px',
                    borderRadius: '50% 50% 50% 0',
                    transform: 'rotate(-45deg)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {/* Icono de restaurante rotado para compensar la rotación del fondo */}
                  <div style={{ transform: 'rotate(45deg)' }}>
                    <UtensilsCrossed className="h-4 w-4 text-white" />
                  </div>
                </div>
                {/* Punto inferior de la gota */}
                <div 
                  className="absolute bg-orange-500"
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
            {selectedRestaurant === index && (
              <Popup
                longitude={restaurant.lng}
                latitude={restaurant.lat}
                anchor="bottom"
                onClose={() => setSelectedRestaurant(null)}
                closeButton={true}
                closeOnClick={false}
              >
                <div className="p-2">
                  <h3 className="font-semibold text-sm">{restaurant.name || `Restaurante ${index + 1}`}</h3>
                  <p className="text-xs text-gray-600">
                    {restaurant.lat.toFixed(6)}, {restaurant.lng.toFixed(6)}
                  </p>
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </Map>

      {/* Menú desplegable de controles */}
      <div className="absolute top-4 right-4 z-10 menu-container">
        {/* Botón principal del menú */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="bg-white px-2.5 py-1.5 rounded-md shadow-md hover:bg-gray-50 transition-colors text-xs font-medium text-gray-700 flex items-center gap-1.5"
          title="Menú de controles"
        >
          {isMenuOpen ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
          <span>Menú</span>
        </button>

        {/* Menú desplegable */}
        {isMenuOpen && (
          <div className="absolute top-12 right-0 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[160px] flex flex-col gap-0.5">
            <button
              onClick={() => {
                toggleMapStyle()
                setIsMenuOpen(false)
              }}
              className="px-2 py-1.5 text-left hover:bg-gray-50 transition-colors text-xs font-medium text-gray-700"
              title="Alternar estilo de mapa"
            >
              {mapStyle === 'satellite-streets-v12' ? '🗺️ Outdoors' : '🛰️ Satélite'}
            </button>
            <button
              onClick={() => {
                toggle3D()
                setIsMenuOpen(false)
              }}
              className={`px-2 py-1.5 text-left hover:bg-gray-50 transition-colors text-xs font-medium ${
                is3D 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700'
              }`}
              title="Alternar vista 3D"
            >
              {is3D ? '🗻 3D' : '📐 2D'}
            </button>
            <div className="border-t border-gray-200 my-0.5"></div>
            <button
              onClick={() => {
                setShowTrack(!showTrack)
                setIsMenuOpen(false)
              }}
              className={`px-2 py-1.5 text-left hover:bg-gray-50 transition-colors text-xs font-medium flex items-center gap-1.5 ${
                showTrack 
                  ? 'text-gray-700' 
                  : 'text-gray-500'
              }`}
              title="Mostrar/ocultar track"
            >
              {showTrack ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              <span>Track</span>
            </button>
            <button
              onClick={() => {
                setShowSlopeColors(!showSlopeColors)
                setIsMenuOpen(false)
              }}
              className={`px-2 py-1.5 text-left hover:bg-gray-50 transition-colors text-xs font-medium flex items-center gap-1.5 ${
                showSlopeColors 
                  ? 'text-gray-700' 
                  : 'text-gray-500'
              }`}
              title="Mostrar/ocultar colores de pendiente"
            >
              {showSlopeColors ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              <span>Colores pendiente</span>
            </button>
            {route.parking && route.parking.length > 0 && (
              <button
                onClick={() => {
                  setShowParking(!showParking)
                  setIsMenuOpen(false)
                }}
                className={`px-2 py-1.5 text-left hover:bg-gray-50 transition-colors text-xs font-medium flex items-center gap-1.5 ${
                  showParking 
                    ? 'text-gray-700' 
                    : 'text-gray-500'
                }`}
                title="Mostrar/ocultar parking"
              >
                {showParking ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                <span>Parking</span>
              </button>
            )}
            {route.restaurants && route.restaurants.length > 0 && (
              <button
                onClick={() => {
                  setShowRestaurants(!showRestaurants)
                  setIsMenuOpen(false)
                }}
                className={`px-2 py-1.5 text-left hover:bg-gray-50 transition-colors text-xs font-medium flex items-center gap-1.5 ${
                  showRestaurants 
                    ? 'text-gray-700' 
                    : 'text-gray-500'
                }`}
                title="Mostrar/ocultar restaurantes"
              >
                {showRestaurants ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                <span>Restaurantes</span>
              </button>
            )}
            <button
              onClick={() => {
                resetView()
                setIsMenuOpen(false)
              }}
              className="px-2 py-1.5 text-left hover:bg-gray-50 transition-colors text-xs font-medium text-gray-700 flex items-center gap-1.5"
              title="Resetear vista del mapa"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Resetear</span>
            </button>
            <div className="border-t border-gray-200 my-0.5"></div>
            <button
              onClick={() => {
                setIsFullscreen(true)
                setIsMenuOpen(false)
              }}
              className="px-2 py-1.5 text-left hover:bg-gray-50 transition-colors text-xs font-medium text-gray-700 flex items-center gap-1.5"
              title="Ver mapa en pantalla completa"
            >
              <Maximize2 className="h-3 w-3" />
              <span>Pantalla completa</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal de pantalla completa */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <div className="relative w-full h-full">
            {/* Botón para cerrar */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 z-50 bg-white/90 hover:bg-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors"
              title="Cerrar pantalla completa"
            >
              <Minimize2 className="h-4 w-4" />
              <span>Salir</span>
            </button>
            
            {/* Mapa en pantalla completa */}
            <div className="w-full h-full">
              <Map
                {...viewState}
                onMove={onMove}
                style={{ width: '100%', height: '100%' }}
                mapStyle={`mapbox://styles/mapbox/${mapStyle}`}
                mapboxAccessToken={mapboxToken}
                attributionControl={true}
                terrain={is3D ? { source: 'mapbox-dem', exaggeration: 1.5 } : undefined}
              >
                {/* Terreno 3D */}
                {is3D && (
                  <Source
                    id="mapbox-dem-fullscreen"
                    type="raster-dem"
                    url="mapbox://mapbox.mapbox-terrain-dem-v1"
                    tileSize={512}
                    maxzoom={14}
                  />
                )}

                {/* Track de la ruta con colores según pendiente */}
                {routeGeoJSONSegments && showTrack && routeGeoJSONSegments.map((segment: TrackSegment, index: number) => (
                  <Source key={`fullscreen-${index}`} id={`route-track-fullscreen-${index}`} type="geojson" data={segment}>
                    <Layer
                      id={`route-line-fullscreen-${index}`}
                      type="line"
                      paint={{
                        'line-color': segment.properties.color,
                        'line-width': 4,
                        'line-opacity': 0.8,
                      }}
                    />
                  </Source>
                ))}

                {/* Marcador de animación del recorrido */}
                {isAnimating && route.track && route.track[animationIndex] && (
                  <Marker
                    longitude={route.track[animationIndex].lng}
                    latitude={route.track[animationIndex].lat}
                    anchor="center"
                  >
                    <div className="relative">
                      <div 
                        className="rounded-full bg-green-500 shadow-lg border-2 border-white animate-pulse"
                        style={{
                          width: '20px',
                          height: '20px'
                        }}
                      />
                    </div>
                  </Marker>
                )}

                {/* Marcador de posición hover del perfil de elevación */}
                {hoveredTrackIndex !== null && hoveredTrackIndex !== undefined && route.track && route.track[hoveredTrackIndex] && (
                  <Marker
                    longitude={route.track[hoveredTrackIndex].lng}
                    latitude={route.track[hoveredTrackIndex].lat}
                    anchor="center"
                  >
                    <div className="relative">
                      <div 
                        className="absolute inset-0 rounded-full bg-red-500 opacity-30 animate-ping"
                        style={{
                          width: '24px',
                          height: '24px',
                          margin: '-12px 0 0 -12px'
                        }}
                      />
                      <div 
                        className="rounded-full bg-red-500 shadow-lg border-2 border-white"
                        style={{
                          width: '16px',
                          height: '16px'
                        }}
                      />
                    </div>
                  </Marker>
                )}

                {/* Marcadores del parking */}
                {showParking && route.parking && route.parking.length > 0 && route.parking.map((parking, index) => (
                  <Marker
                    key={`fullscreen-parking-${index}`}
                    longitude={parking.lng}
                    latitude={parking.lat}
                    anchor="bottom"
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => setSelectedParking(selectedParking === index ? null : index)}
                    >
                      <div className="relative">
                        <div 
                          className="bg-blue-500 shadow-lg hover:bg-blue-600 transition-colors"
                          style={{
                            width: '32px',
                            height: '40px',
                            borderRadius: '50% 50% 50% 0',
                            transform: 'rotate(-45deg)',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <div style={{ transform: 'rotate(45deg)' }}>
                            <Car className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div 
                          className="absolute bg-blue-500"
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
                    {selectedParking === index && (
                      <Popup
                        longitude={parking.lng}
                        latitude={parking.lat}
                        anchor="bottom"
                        onClose={() => setSelectedParking(null)}
                        closeButton={true}
                        closeOnClick={false}
                      >
                        <div className="p-2">
                          <h3 className="font-semibold text-sm">Parking {index + 1}</h3>
                          <p className="text-xs text-gray-600">
                            {parking.lat.toFixed(6)}, {parking.lng.toFixed(6)}
                          </p>
                        </div>
                      </Popup>
                    )}
                  </Marker>
                ))}

                {/* Marcadores de restaurantes en pantalla completa */}
                {showRestaurants && route.restaurants && route.restaurants.length > 0 && route.restaurants.map((restaurant, index) => (
                  <Marker
                    key={`fullscreen-restaurant-${index}`}
                    longitude={restaurant.lng}
                    latitude={restaurant.lat}
                    anchor="bottom"
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => setSelectedRestaurant(selectedRestaurant === index ? null : index)}
                    >
                      <div className="relative">
                        <div 
                          className="bg-orange-500 shadow-lg hover:bg-orange-600 transition-colors"
                          style={{
                            width: '32px',
                            height: '40px',
                            borderRadius: '50% 50% 50% 0',
                            transform: 'rotate(-45deg)',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <div style={{ transform: 'rotate(45deg)' }}>
                            <UtensilsCrossed className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div 
                          className="absolute bg-orange-500"
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
                    {selectedRestaurant === index && (
                      <Popup
                        longitude={restaurant.lng}
                        latitude={restaurant.lat}
                        anchor="bottom"
                        onClose={() => setSelectedRestaurant(null)}
                        closeButton={true}
                        closeOnClick={false}
                      >
                        <div className="p-2">
                          <h3 className="font-semibold text-sm">{restaurant.name || `Restaurante ${index + 1}`}</h3>
                          <p className="text-xs text-gray-600">
                            {restaurant.lat.toFixed(6)}, {restaurant.lng.toFixed(6)}
                          </p>
                        </div>
                      </Popup>
                    )}
                  </Marker>
                ))}
              </Map>
            </div>

            {/* Controles en pantalla completa */}
            <div className="absolute top-4 right-20 z-50 menu-container">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="bg-white/90 hover:bg-white px-2.5 py-1.5 rounded-md shadow-lg transition-colors text-xs font-medium text-gray-700 flex items-center gap-1.5"
                title="Menú de controles"
              >
                {isMenuOpen ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
                <span>Menú</span>
              </button>

              {isMenuOpen && (
                <div className="absolute top-12 right-0 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[160px] flex flex-col gap-0.5">
                  <button
                    onClick={() => {
                      toggleMapStyle()
                      setIsMenuOpen(false)
                    }}
                    className="px-2 py-1.5 text-left hover:bg-gray-50 transition-colors text-xs font-medium text-gray-700"
                    title="Alternar estilo de mapa"
                  >
                    {mapStyle === 'satellite-streets-v12' ? '🗺️ Outdoors' : '🛰️ Satélite'}
                  </button>
                  <button
                    onClick={() => {
                      toggle3D()
                      setIsMenuOpen(false)
                    }}
                    className={`px-2 py-1.5 text-left hover:bg-gray-50 transition-colors text-xs font-medium ${
                      is3D 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-700'
                    }`}
                    title="Alternar vista 3D"
                  >
                    {is3D ? '🗻 3D' : '📐 2D'}
                  </button>
                  <div className="border-t border-gray-200 my-0.5"></div>
                  <button
                    onClick={() => {
                      setShowTrack(!showTrack)
                      setIsMenuOpen(false)
                    }}
                    className={`px-2 py-1.5 text-left hover:bg-gray-50 transition-colors text-xs font-medium flex items-center gap-1.5 ${
                      showTrack 
                        ? 'text-gray-700' 
                        : 'text-gray-500'
                    }`}
                    title="Mostrar/ocultar track"
                  >
                    {showTrack ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    <span>Track</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowSlopeColors(!showSlopeColors)
                      setIsMenuOpen(false)
                    }}
                    className={`px-2 py-1.5 text-left hover:bg-gray-50 transition-colors text-xs font-medium flex items-center gap-1.5 ${
                      showSlopeColors 
                        ? 'text-gray-700' 
                        : 'text-gray-500'
                    }`}
                    title="Mostrar/ocultar colores de pendiente"
                  >
                    {showSlopeColors ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    <span>Colores pendiente</span>
                  </button>
                  {route.parking && route.parking.length > 0 && (
                    <button
                      onClick={() => {
                        setShowParking(!showParking)
                        setIsMenuOpen(false)
                      }}
                      className={`px-2 py-1.5 text-left hover:bg-gray-50 transition-colors text-xs font-medium flex items-center gap-1.5 ${
                        showParking 
                          ? 'text-gray-700' 
                          : 'text-gray-500'
                      }`}
                      title="Mostrar/ocultar parking"
                    >
                      {showParking ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      <span>Parking</span>
                    </button>
                  )}
                  {route.restaurants && route.restaurants.length > 0 && (
                    <button
                      onClick={() => {
                        setShowRestaurants(!showRestaurants)
                        setIsMenuOpen(false)
                      }}
                      className={`px-2 py-1.5 text-left hover:bg-gray-50 transition-colors text-xs font-medium flex items-center gap-1.5 ${
                        showRestaurants 
                          ? 'text-gray-700' 
                          : 'text-gray-500'
                      }`}
                      title="Mostrar/ocultar restaurantes"
                    >
                      {showRestaurants ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      <span>Restaurantes</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      resetView()
                      setIsMenuOpen(false)
                    }}
                    className="px-2 py-1.5 text-left hover:bg-gray-50 transition-colors text-xs font-medium text-gray-700 flex items-center gap-1.5"
                    title="Resetear vista del mapa"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Resetear</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
