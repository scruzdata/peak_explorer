'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { Difficulty, FerrataGrade, Season } from '@/types'
import { getFerrataGradeColor } from '@/lib/utils'

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
    type === 'trekking' && selectedDifficulty !== 'all',
    type === 'ferrata' && selectedGrade !== 'all',
    selectedSeason !== 'all',
    selectedRegion !== 'all',
  ].filter(Boolean).length

  // Función para limpiar todos los filtros
  const handleClearFilters = () => {
    if (type === 'trekking') {
      onDifficultyChange('all')
    } else {
      onGradeChange('all')
    }
    onSeasonChange('all')
    onRegionChange('all')
  }

  return (
    <div className="w-full flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-end gap-3">
      {/* Difficulty Filter (only for trekking) */}
      {type === 'trekking' && (
        <div className="w-full sm:w-40">
          {/* Optimización accesibilidad: label asociado con select usando htmlFor e id */}
          <label 
            htmlFor="difficulty-filter"
            className="mb-0.5 block text-xs font-medium text-gray-700"
          >
            Dificultad
          </label>
          <select
            id="difficulty-filter"
            value={selectedDifficulty}
            onChange={(e) => onDifficultyChange(e.target.value as Difficulty | 'all')}
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Filtrar por dificultad de la ruta"
          >
            <option value="all">Todas</option>
            {difficulties.map((diff) => (
              <option key={diff} value={diff}>
                {diff}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Grade Filter (only for ferratas) */}
      {type === 'ferrata' && (
        <GradeFilterDropdown
          selectedGrade={selectedGrade}
          grades={grades}
          onGradeChange={onGradeChange}
        />
      )}

      {/* Season Filter */}
      <div className="w-full sm:w-40">
        {/* Optimización accesibilidad: label asociado con select usando htmlFor e id */}
        <label 
          htmlFor="season-filter"
          className="mb-0.5 block text-xs font-medium text-gray-700"
        >
          Mejor Época
        </label>
        <select
          id="season-filter"
          value={selectedSeason}
          onChange={(e) => onSeasonChange(e.target.value as Season | 'all')}
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Filtrar por mejor época del año para realizar la ruta"
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
      <div className="w-full sm:w-40">
        {/* Optimización accesibilidad: label asociado con select usando htmlFor e id */}
        <label 
          htmlFor="region-filter"
          className="mb-0.5 block text-xs font-medium text-gray-700"
        >
          Región
        </label>
        <select
          id="region-filter"
          value={selectedRegion}
          onChange={(e) => onRegionChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Filtrar por región de España"
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
          className="mt-1 sm:mt-0 w-full sm:w-auto rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}

// Componente dropdown personalizado para el filtro de Grado K con colores
function GradeFilterDropdown({
  selectedGrade,
  grades,
  onGradeChange,
}: {
  selectedGrade: FerrataGrade | 'all'
  grades: FerrataGrade[]
  onGradeChange: (value: FerrataGrade | 'all') => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedGradeColor = selectedGrade !== 'all' ? getFerrataGradeColor(selectedGrade) : ''

  return (
    <div className="w-full sm:w-32 relative" ref={dropdownRef}>
      {/* Optimización accesibilidad: label asociado con button usando htmlFor e id */}
      <label 
        htmlFor="grade-filter-button"
        className="mb-0.5 block text-xs font-medium text-gray-700"
      >
        Grado K
      </label>
      <button
        id="grade-filter-button"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Filtrar por grado K de vía ferrata"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-between ${
          selectedGrade !== 'all' ? selectedGradeColor : 'bg-white'
        }`}
      >
        <span className={selectedGrade !== 'all' ? 'font-medium' : ''}>
          {selectedGrade === 'all' ? 'Todos' : selectedGrade}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
          <button
            type="button"
            onClick={() => {
              onGradeChange('all')
              setIsOpen(false)
            }}
            className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
          >
            Todos
          </button>
          {grades.map((grade) => (
            <button
              key={grade}
              type="button"
              onClick={() => {
                onGradeChange(grade)
                setIsOpen(false)
              }}
              className={`w-full px-3 py-2 text-sm text-left font-medium ${getFerrataGradeColor(grade)} hover:opacity-80 transition-opacity`}
            >
              {grade}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

