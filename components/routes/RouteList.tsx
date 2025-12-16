'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Route, Difficulty, FerrataGrade, Season } from '@/types'
import { RouteCard } from './RouteCard'
import { RouteFilters } from './RouteFilters'
import { RoutesMapView } from './RoutesMapView'
import { Search, Grid3x3, Map, LayoutGrid } from 'lucide-react'

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
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const gridEndRef = useRef<HTMLDivElement>(null)
  const gridContainerRef = useRef<HTMLDivElement>(null)

  const regions = useMemo(() => {
    const uniqueRegions = new Set(routes.map(r => r.location.region))
    return Array.from(uniqueRegions).sort()
  }, [routes])

  const filteredRoutes = useMemo(() => {
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

      // Difficulty filter
      if (selectedDifficulty !== 'all' && route.difficulty !== selectedDifficulty) {
        return false
      }

      // Grade filter (only for ferratas)
      if (type === 'ferrata') {
        if (selectedGrade !== 'all' && route.ferrataGrade !== selectedGrade) {
          return false
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
    <div className={viewMode === 'both' ? 'w-full' : 'mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'}>
      {/* Search and Filters */}
      <div className={`${viewMode === 'both' ? 'px-4 sm:px-6 lg:px-8 pt-6' : ''} mb-8 space-y-4`}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar rutas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pl-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'grid' || viewMode === 'both'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Vista de cuadrícula"
            >
              <Grid3x3 className="h-4 w-4" />
              <span className="hidden sm:inline">Cuadrícula</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'map' || viewMode === 'both'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Vista de mapa"
            >
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Mapa</span>
            </button>
            <button
              onClick={() => setViewMode('both')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'both'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Vista combinada"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Ambas</span>
            </button>
          </div>
        </div>

        {/* Filters */}
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

      {/* Results Count */}
      <div className={`${viewMode === 'both' ? 'px-4 sm:px-6 lg:px-8' : ''} mb-6 text-sm text-gray-600`}>
        Mostrando {filteredRoutes.length} de {routes.length} rutas
      </div>

      {/* Content based on view mode */}
      {filteredRoutes.length > 0 ? (
        <>
          {viewMode === 'both' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-[calc(100vh-280px)]">
              {/* Grid View - Left side - 3 columnas compactas estilo Airbnb */}
              <div 
                ref={gridContainerRef}
                className="overflow-y-auto px-4 sm:px-6 lg:px-8 py-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRoutes.map((route) => (
                    <RouteCard 
                      key={route.id} 
                      route={route} 
                      compact={true}
                      onMouseEnter={() => setHoveredRouteId(route.id)}
                      onMouseLeave={() => setHoveredRouteId(null)}
                    />
                  ))}
                </div>
                {/* Elemento invisible al final para detectar el scroll */}
                <div ref={gridEndRef} className="h-1 w-full" />
              </div>
              {/* Map View - Right side */}
              <div className="hidden lg:block overflow-hidden h-full">
                <RoutesMapView 
                  routes={filteredRoutes} 
                  type={type} 
                  fullHeight={true}
                  hoveredRouteId={hoveredRouteId}
                />
              </div>
              {/* Map View - Mobile: mostrar debajo del grid */}
              <div className="lg:hidden h-[400px] px-4 sm:px-6">
                <RoutesMapView routes={filteredRoutes} type={type} />
              </div>
            </div>
          ) : (
            <>
              {/* Map View Only */}
              {viewMode === 'map' && (
                <RoutesMapView routes={filteredRoutes} type={type} />
              )}
              {/* Grid View Only */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {filteredRoutes.map((route) => (
                    <RouteCard 
                      key={route.id} 
                      route={route}
                      onMouseEnter={() => setHoveredRouteId(route.id)}
                      onMouseLeave={() => setHoveredRouteId(null)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <div className="py-12 text-center">
          <p className="text-lg text-gray-600">No se encontraron rutas con los filtros seleccionados.</p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedDifficulty('all')
              setSelectedGrade('all')
              setSelectedSeason('all')
              setSelectedRegion('all')
            }}
            className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  )
}

