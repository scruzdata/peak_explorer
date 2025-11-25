'use client'

import { useState, useMemo } from 'react'
import { Route, Difficulty, FerrataGrade, Season } from '@/types'
import { RouteCard } from './RouteCard'
import { RouteFilters } from './RouteFilters'
import { Search } from 'lucide-react'

interface RouteListProps {
  routes: Route[]
  type: 'trekking' | 'ferrata'
}

export function RouteList({ routes, type }: RouteListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all')
  const [selectedGrade, setSelectedGrade] = useState<FerrataGrade | 'all'>('all')
  const [selectedSeason, setSelectedSeason] = useState<Season | 'all'>('all')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar rutas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pl-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
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
      <div className="mb-6 text-sm text-gray-600">
        Mostrando {filteredRoutes.length} de {routes.length} rutas
      </div>

      {/* Routes Grid */}
      {filteredRoutes.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredRoutes.map((route) => (
            <RouteCard key={route.id} route={route} />
          ))}
        </div>
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

