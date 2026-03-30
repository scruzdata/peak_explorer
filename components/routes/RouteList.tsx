'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Route, Difficulty, FerrataGrade, Season } from '@/types'
import { RouteCard } from './RouteCard'
import { RouteFilters } from './RouteFilters'
import { RoutesMapView } from './RoutesMapView'
import { Search, Grid3x3, Map, LayoutGrid, ChevronDown } from 'lucide-react'

interface RouteListProps {
  routes: Route[]
  type: 'trekking' | 'ferrata'
}

type ViewMode = 'grid' | 'map' | 'both'

export function RouteList({ routes, type }: RouteListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all')
  const [selectedGrade, setSelectedGrade] = useState<FerrataGrade | 'all'>('all')
  const [selectedSeason, setSelectedSeason] = useState<Season | 'all'>('all')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('both')
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [mapViewState, setMapViewState] = useState<{latitude: number; longitude: number; zoom: number} | null>(null)
  const [debouncedViewState, setDebouncedViewState] = useState<{latitude: number; longitude: number; zoom: number} | null>(null)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const gridEndRef = useRef<HTMLDivElement>(null)
  const gridContainerRef = useRef<HTMLDivElement>(null)
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const zoomToRouteRef = useRef<((lat: number, lng: number) => void) | null>(null)

  /**
   * Detectar si estamos en móvil (viewport < lg) para:
   * - Forzar vista por defecto "map" en móvil
   * - Evitar el modo combinado "both" en móvil
   */
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return
      const isMobileViewport = window.innerWidth < 1024 // lg breakpoint de Tailwind
      setIsMobile(isMobileViewport)
      if (!isMobileViewport) {
        // Al pasar a escritorio, cerramos panel móvil de filtros
        setShowMobileFilters(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    // En móvil no permitimos el modo combinado, y por defecto mostramos el mapa
    if (isMobile && viewMode === 'both') {
      setViewMode('map')
    }
  }, [isMobile, viewMode])

  const regions = useMemo(() => {
    const uniqueRegions = new Set(routes.map(r => r.location.region))
    return Array.from(uniqueRegions).sort()
  }, [routes])

  /**
   * Debounce del viewState del mapa para suavizar la actualización de la cuadrícula
   */
  useEffect(() => {
    // Limpiar timeout anterior si existe
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Si no hay viewState, actualizar inmediatamente
    if (!mapViewState) {
      setDebouncedViewState(null)
      return
    }

    // Aplicar debounce de 300ms
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedViewState(mapViewState)
    }, 300)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [mapViewState])

  /**
   * Calcula si una ruta está dentro del viewport del mapa basándose en el viewState
   * Usa una aproximación simple basada en el zoom level con un margen adicional para capturar rutas en los bordes
   */
  const isRouteInViewport = useCallback((route: Route, viewState: {latitude: number; longitude: number; zoom: number}): boolean => {
    if (!route.location?.coordinates?.lat || !route.location?.coordinates?.lng) {
      return false
    }

    const { latitude: centerLat, longitude: centerLng, zoom } = viewState
    
    // Calcular el rango visible basándose en el zoom
    // Aproximación: a mayor zoom, menor es el área visible
    // Fórmula simplificada que funciona bien para España (latitud ~40°)
    const baseLatRange = 180 / Math.pow(2, zoom)
    const baseLngRange = 360 / Math.pow(2, zoom)
    
    // Ajustar por el aspect ratio del viewport (el mapa en modo "both" es más alto que ancho)
    // Asumiendo un viewport de aproximadamente 600px x 800px (ratio ~0.75)
    const aspectRatio = 0.75
    let latRange = baseLatRange / aspectRatio
    let lngRange = baseLngRange
    
    // Añadir un margen del 40% para capturar rutas que están parcialmente visibles en los bordes
    const margin = 1.2
    latRange = latRange * margin
    lngRange = lngRange * margin
    
    // Calcular los límites del viewport
    const minLat = centerLat - latRange / 2
    const maxLat = centerLat + latRange / 2
    const minLng = centerLng - lngRange / 2
    const maxLng = centerLng + lngRange / 2
    
    // Verificar si la ruta está dentro del viewport
    const routeLat = route.location.coordinates.lat
    const routeLng = route.location.coordinates.lng
    
    return routeLat >= minLat && routeLat <= maxLat && routeLng >= minLng && routeLng <= maxLng
  }, [])

  /**
   * Rutas filtradas sin el filtro de viewport (para el mapa)
   */
  const filteredRoutesForMap = useMemo(() => {
    return routes.filter(route => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          route.title.toLowerCase().includes(query) ||
          route.summary.toLowerCase().includes(query) ||
          route.location.region.toLowerCase().includes(query) ||
          route.location.province.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Difficulty filter (only for trekking)
      if (type === 'trekking') {
        if (selectedDifficulty !== 'all') {
          const difficulties = Array.isArray(route.difficulty) ? route.difficulty : [route.difficulty]
          if (!difficulties.includes(selectedDifficulty)) {
            return false
          }
        }
      }

      // Grade filter (only for ferratas)
      if (type === 'ferrata') {
        if (selectedGrade !== 'all' && route.ferrataGrade) {
          const grades = Array.isArray(route.ferrataGrade) ? route.ferrataGrade : [route.ferrataGrade]
          if (!grades.includes(selectedGrade)) {
            return false
          }
        }
      }

      // Season filter
      if (selectedSeason !== 'all' && !route.bestSeason.includes(selectedSeason)) {
        return false
      }

      // Region filter
      if (selectedRegion !== 'all' && route.location.region !== selectedRegion) {
        return false
      }

      return true
    })
  }, [routes, searchQuery, selectedDifficulty, selectedGrade, selectedSeason, selectedRegion, type])

  /**
   * Rutas filtradas con el filtro de viewport (para la cuadrícula en modo "both")
   * Usa el viewState con debounce para suavizar las actualizaciones
   */
  const filteredRoutes = useMemo(() => {
    let routesToFilter = filteredRoutesForMap

    // Aplicar filtro de viewport solo en modo "both"
    if (viewMode === 'both' && debouncedViewState) {
      routesToFilter = routesToFilter.filter(route => isRouteInViewport(route, debouncedViewState))
    }

    return routesToFilter
  }, [filteredRoutesForMap, viewMode, debouncedViewState, isRouteInViewport])

  /**
   * Detecta cuando se ha llegado al final del scroll del grid en modo "both"
   */
  useEffect(() => {
    if (viewMode !== 'both') {
      setHasScrolledToBottom(true)
      return
    }

    if (!gridEndRef.current || !gridContainerRef.current) {
      // Si no hay contenido suficiente para hacer scroll, mostrar footer
      const checkScroll = () => {
        const container = gridContainerRef.current
        if (container) {
          const hasScroll = container.scrollHeight > container.clientHeight
          setHasScrolledToBottom(!hasScroll || container.scrollTop + container.clientHeight >= container.scrollHeight - 10)
        }
      }
      
      // Verificar después de un pequeño delay para que el DOM se actualice
      const timeout = setTimeout(checkScroll, 100)
      return () => clearTimeout(timeout)
    }

    const container = gridContainerRef.current
    const hasScroll = container.scrollHeight > container.clientHeight
    
    // Si no hay scroll, mostrar footer inmediatamente
    if (!hasScroll) {
      setHasScrolledToBottom(true)
      return
    }

    // Inicializar como false si hay scroll
    setHasScrolledToBottom(false)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasScrolledToBottom(true)
          } else {
            // Verificar si estamos cerca del final
            const scrollTop = container.scrollTop
            const scrollHeight = container.scrollHeight
            const clientHeight = container.clientHeight
            const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50
            setHasScrolledToBottom(isNearBottom)
          }
        })
      },
      {
        root: container,
        rootMargin: '0px',
        threshold: 0.1,
      }
    )

    observer.observe(gridEndRef.current)

    // También escuchar eventos de scroll como respaldo
    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10
      setHasScrolledToBottom(isAtBottom)
    }

    container.addEventListener('scroll', handleScroll)

    return () => {
      observer.disconnect()
      container.removeEventListener('scroll', handleScroll)
    }
  }, [viewMode, filteredRoutes.length])

  /**
   * Controla la visibilidad del footer basado en el scroll
   */
  useEffect(() => {
    if (viewMode === 'both') {
      if (hasScrolledToBottom) {
        document.body.classList.remove('hide-footer')
      } else {
        document.body.classList.add('hide-footer')
      }
    } else {
      document.body.classList.remove('hide-footer')
      setHasScrolledToBottom(true)
    }

    return () => {
      // Solo limpiar si estamos saliendo del modo "both"
      if (viewMode === 'both') {
        document.body.classList.remove('hide-footer')
      }
    }
  }, [viewMode, hasScrolledToBottom])

  return (
    <div className={`${viewMode === 'both' ? 'w-full' : 'mx-auto max-w-7xl px-4 pt-4 pb-12 sm:px-6 lg:px-8 lg:pt-6'} ${isMobile && viewMode === 'map' ? 'flex flex-col h-[calc(100vh-80px)]' : ''}`}>
      {/* Panel de filtros superpuesto en móvil */}
      {isMobile && showMobileFilters && (
        <div className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm">
          <div className="absolute top-20 left-0 right-0 mx-4 rounded-2xl bg-white shadow-xl max-h-[70vh] overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-editorial-900 uppercase tracking-wider">Filtros</h2>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="text-sm font-medium text-editorial-500 hover:text-editorial-900 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
            <RouteFilters
              type={type}
              selectedDifficulty={selectedDifficulty}
              selectedGrade={selectedGrade}
              selectedSeason={selectedSeason}
              selectedRegion={selectedRegion}
              regions={regions}
              onDifficultyChange={setSelectedDifficulty}
              onGradeChange={setSelectedGrade}
              onSeasonChange={setSelectedSeason}
              onRegionChange={setSelectedRegion}
            />
          </div>
        </div>
      )}
      {/* Search and Filters */}
      <div className={`${viewMode === 'both' ? 'px-4 sm:px-6 lg:px-8 pt-3' : ''} ${isMobile && viewMode === 'map' ? 'flex-shrink-0' : ''} mb-4`}>
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center flex-1">
            {/* Search Bar */}
            <div className="relative flex-1 w-full lg:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-editorial-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar rutas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-editorial-200 bg-white pl-10 pr-4 py-2.5 text-sm text-editorial-900 placeholder:text-editorial-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>

            {/* Filters - desktop */}
            {!isMobile && (
              <div className="flex-1 lg:flex-none">
                <RouteFilters
                  type={type}
                  selectedDifficulty={selectedDifficulty}
                  selectedGrade={selectedGrade}
                  selectedSeason={selectedSeason}
                  selectedRegion={selectedRegion}
                  regions={regions}
                  onDifficultyChange={setSelectedDifficulty}
                  onGradeChange={setSelectedGrade}
                  onSeasonChange={setSelectedSeason}
                  onRegionChange={setSelectedRegion}
                />
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div
            role="group"
            aria-label="Seleccionar modo de visualización"
            className="flex items-center gap-1 bg-editorial-100 rounded-xl p-1 lg:flex-shrink-0"
          >
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Vista de cuadrícula"
              aria-pressed={viewMode === 'grid' || viewMode === 'both'}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                viewMode === 'grid' || viewMode === 'both'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-editorial-500 hover:text-editorial-800 hover:bg-white/50'
              }`}
            >
              <Grid3x3 className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Cuadrícula</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              aria-label="Vista de mapa"
              aria-pressed={viewMode === 'map' || viewMode === 'both'}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                viewMode === 'map' || viewMode === 'both'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-editorial-500 hover:text-editorial-800 hover:bg-white/50'
              }`}
            >
              <Map className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Mapa</span>
            </button>
            <button
              onClick={() => setViewMode('both')}
              aria-label="Vista combinada (solo escritorio)"
              aria-pressed={viewMode === 'both'}
              className={`hidden lg:flex px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 items-center gap-2 cursor-pointer ${
                viewMode === 'both'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-editorial-500 hover:text-editorial-800 hover:bg-white/50'
              }`}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Ambas</span>
            </button>
            {/* Mobile filters button */}
            <button
              type="button"
              onClick={() => setShowMobileFilters(true)}
              className="flex lg:hidden items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-editorial-700 shadow-sm hover:bg-editorial-50 cursor-pointer"
            >
              Filtros
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showMobileFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className={`${viewMode === 'both' ? 'px-4 sm:px-6 lg:px-8' : ''} ${isMobile && viewMode === 'map' ? 'flex-shrink-0' : ''} mb-5 text-sm text-editorial-500`}>
        {viewMode === 'both' ? (
          <>
            {filteredRoutes.length > 0 ? (
              <>Mostrando {filteredRoutes.length} {type === 'ferrata' 
                ? (filteredRoutes.length === 1 ? 'vía ferrata' : 'vías ferratas')
                : (filteredRoutes.length === 1 ? 'ruta' : 'rutas')} visible{filteredRoutes.length === 1 ? '' : 's'} en el mapa</>
            ) : (
              <>{type === 'ferrata' ? 'No hay vías ferratas visibles en esta zona del mapa' : 'No hay rutas visibles en esta zona del mapa'}</>
            )}
            {filteredRoutesForMap.length > 0 && filteredRoutes.length !== filteredRoutesForMap.length && (
              <span className="text-gray-500"> ({filteredRoutesForMap.length} {type === 'ferrata' 
                ? (filteredRoutesForMap.length === 1 ? 'vía ferrata' : 'vías ferratas')
                : (filteredRoutesForMap.length === 1 ? 'ruta' : 'rutas')} en total)</span>
            )}
          </>
        ) : (
          <>Mostrando {filteredRoutes.length} de {routes.length} rutas</>
        )}
      </div>

      {/* Content based on view mode */}
      {viewMode === 'both' ? (
        // Modo "both": siempre mostrar mapa y cuadrícula, incluso si la cuadrícula está vacía
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-[calc(100vh-200px)]">
          {/* Grid View - Left side - 3 columnas compactas estilo Airbnb */}
          <div 
            ref={gridContainerRef}
            className="overflow-y-auto px-4 sm:px-6 lg:px-8 py-4"
          >
            {filteredRoutes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRoutes.map((route) => (
                  <RouteCard 
                    key={route.id} 
                    route={route} 
                    compact={true}
                    type={type}
                    isHovered={hoveredRouteId === route.id}
                    isSelected={selectedRouteId === route.id}
                    onMouseEnter={() => setHoveredRouteId(route.id)}
                    onMouseLeave={() => setHoveredRouteId(null)}
                    onClick={() => {
                      console.log('Click en card del grid, estableciendo selectedRouteId:', route.id)
                      setSelectedRouteId(route.id)
                    }}
                    onDoubleClick={() => {
                      if (zoomToRouteRef.current && route.location?.coordinates) {
                        zoomToRouteRef.current(route.location.coordinates.lat, route.location.coordinates.lng)
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-editorial-100">
                  <Map className="h-5 w-5 text-editorial-400" />
                </div>
                <p className="text-sm font-medium text-editorial-500 text-center">
                  No hay rutas en esta zona del mapa
                </p>
              </div>
            )}
            {/* Elemento invisible al final para detectar el scroll */}
            <div ref={gridEndRef} className="h-1 w-full" />
          </div>
          {/* Map View - Right side */}
          <div className="hidden lg:block overflow-hidden h-full px-4 pb-6">
            <RoutesMapView 
              routes={filteredRoutesForMap} 
              type={type} 
              fullHeight={true}
              hoveredRouteId={hoveredRouteId}
              selectedRouteId={selectedRouteId}
              onRouteSelect={setSelectedRouteId}
              onViewStateChange={setMapViewState}
              onMarkerHover={setHoveredRouteId}
              zoomToRouteRef={zoomToRouteRef}
            />
          </div>
          {/* Map View - Mobile: mostrar debajo del grid */}
          <div className="lg:hidden h-[400px] px-4 sm:px-6">
            <RoutesMapView 
              routes={filteredRoutesForMap} 
              type={type}
              hoveredRouteId={hoveredRouteId}
              selectedRouteId={selectedRouteId}
              onRouteSelect={setSelectedRouteId}
              onMarkerHover={setHoveredRouteId}
              zoomToRouteRef={zoomToRouteRef}
            />
          </div>
        </div>
      ) : filteredRoutes.length > 0 ? (
        // Modos "map" o "grid" individuales: solo mostrar si hay rutas
        <>
          {/* Map View Only */}
          {viewMode === 'map' && (
            <div className={isMobile ? 'flex-1 min-h-0' : ''}>
              <RoutesMapView routes={filteredRoutes} type={type} zoomToRouteRef={zoomToRouteRef} fullHeight={isMobile} />
            </div>
          )}
          {/* Grid View Only */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredRoutes.map((route) => (
                <RouteCard 
                  key={route.id} 
                  route={route}
                  type={type}
                  isHovered={hoveredRouteId === route.id}
                  onMouseEnter={() => setHoveredRouteId(route.id)}
                  onMouseLeave={() => setHoveredRouteId(null)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        // Empty state — no routes match filters
        <div className="py-20 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-editorial-100">
            <Search className="h-7 w-7 text-editorial-400" />
          </div>
          <p className="text-lg font-semibold text-editorial-700 mb-1">
            No se encontraron rutas
          </p>
          <p className="text-sm text-editorial-400 mb-6">
            Prueba ajustando los filtros o la búsqueda.
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedDifficulty('all')
              setSelectedGrade('all')
              setSelectedSeason('all')
              setSelectedRegion('all')
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-5 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-100 transition-colors cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  )
}

