'use client'

import { Difficulty, FerrataGrade, Season } from '@/types'

interface RouteFiltersProps {
  type: 'trekking' | 'ferrata'
  selectedDifficulty: Difficulty | 'all'
  selectedGrade: FerrataGrade | 'all'
  selectedSeason: Season | 'all'
  selectedRegion: string
  regions: string[]
  onDifficultyChange: (value: Difficulty | 'all') => void
  onGradeChange: (value: FerrataGrade | 'all') => void
  onSeasonChange: (value: Season | 'all') => void
  onRegionChange: (value: string) => void
}

// Componente que muestra los filtros de rutas directamente como dropdowns alineados en una fila
export function RouteFilters({
  type,
  selectedDifficulty,
  selectedGrade,
  selectedSeason,
  selectedRegion,
  regions,
  onDifficultyChange,
  onGradeChange,
  onSeasonChange,
  onRegionChange,
}: RouteFiltersProps) {
  const difficulties: Difficulty[] = ['Fácil', 'Moderada', 'Difícil', 'Muy Difícil', 'Extrema']
  const grades: FerrataGrade[] = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6']
  const seasons: Season[] = ['Primavera', 'Verano', 'Otoño', 'Invierno', 'Todo el año']

  const activeFiltersCount = [
    selectedDifficulty !== 'all',
    selectedGrade !== 'all',
    selectedSeason !== 'all',
    selectedRegion !== 'all',
  ].filter(Boolean).length

  // Función para limpiar todos los filtros
  const handleClearFilters = () => {
    onDifficultyChange('all')
    onGradeChange('all')
    onSeasonChange('all')
    onRegionChange('all')
  }

  return (
    <div className="flex items-end gap-3">
      {/* Difficulty Filter */}
      <div className="w-40">
        <label className="mb-0.5 block text-xs font-medium text-gray-700">
          Dificultad
        </label>
        <select
          value={selectedDifficulty}
          onChange={(e) => onDifficultyChange(e.target.value as Difficulty | 'all')}
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">Todas</option>
          {difficulties.map((diff) => (
            <option key={diff} value={diff}>
              {diff}
            </option>
          ))}
        </select>
      </div>

      {/* Grade Filter (only for ferratas) */}
      {type === 'ferrata' && (
        <div className="w-32">
          <label className="mb-0.5 block text-xs font-medium text-gray-700">
            Grado K
          </label>
          <select
            value={selectedGrade}
            onChange={(e) => onGradeChange(e.target.value as FerrataGrade | 'all')}
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Todos</option>
            {grades.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Season Filter */}
      <div className="w-40">
        <label className="mb-0.5 block text-xs font-medium text-gray-700">
          Mejor Época
        </label>
        <select
          value={selectedSeason}
          onChange={(e) => onSeasonChange(e.target.value as Season | 'all')}
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">Todas</option>
          {seasons.map((season) => (
            <option key={season} value={season}>
              {season}
            </option>
          ))}
        </select>
      </div>

      {/* Region Filter */}
      <div className="w-40">
        <label className="mb-0.5 block text-xs font-medium text-gray-700">
          Región
        </label>
        <select
          value={selectedRegion}
          onChange={(e) => onRegionChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">Todas</option>
          {regions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters Button */}
      {activeFiltersCount > 0 && (
        <button
          onClick={handleClearFilters}
          className="rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}

