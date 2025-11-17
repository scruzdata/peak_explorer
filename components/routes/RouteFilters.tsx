'use client'

import { Difficulty, FerrataGrade, Season } from '@/types'
import { Filter } from 'lucide-react'
import { useState } from 'react'

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
  const [isOpen, setIsOpen] = useState(false)

  const difficulties: Difficulty[] = ['Fácil', 'Moderada', 'Difícil', 'Muy Difícil', 'Extrema']
  const grades: FerrataGrade[] = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6']
  const seasons: Season[] = ['Primavera', 'Verano', 'Otoño', 'Invierno', 'Todo el año']

  const activeFiltersCount = [
    selectedDifficulty !== 'all',
    selectedGrade !== 'all',
    selectedSeason !== 'all',
    selectedRegion !== 'all',
  ].filter(Boolean).length

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Filter className="h-4 w-4" />
        <span>Filtros</span>
        {activeFiltersCount > 0 && (
          <span className="rounded-full bg-primary-600 px-2 py-0.5 text-xs text-white">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 z-20 mt-2 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
            <div className="space-y-4">
              {/* Difficulty Filter */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Dificultad
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => onDifficultyChange(e.target.value as Difficulty | 'all')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Grado K
                  </label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => onGradeChange(e.target.value as FerrataGrade | 'all')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Mejor Época
                </label>
                <select
                  value={selectedSeason}
                  onChange={(e) => onSeasonChange(e.target.value as Season | 'all')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Región
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => onRegionChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Todas</option>
                  {regions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => {
                    onDifficultyChange('all')
                    onGradeChange('all')
                    onSeasonChange('all')
                    onRegionChange('all')
                  }}
                  className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

