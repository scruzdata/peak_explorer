'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, MapPin, TrendingUp, Star, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { Route } from '@/types'
import { formatDistance, formatElevation, getDifficultyColor, getFerrataGradeColor } from '@/lib/utils'

interface RouteCardProps {
  route: Route
  compact?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  isHovered?: boolean
  isSelected?: boolean
  type?: 'trekking' | 'ferrata'
  /** Click personalizado (por ejemplo, para centrar en el mapa en modo "Ambas") */
  onClick?: () => void
  /** Doble click personalizado (por ejemplo, para hacer zoom en el mapa) */
  onDoubleClick?: () => void
}

export function RouteCard({ route, compact = false, onMouseEnter, onMouseLeave, isHovered = false, isSelected = false, type = 'trekking', onClick, onDoubleClick }: RouteCardProps) {
  const hasRating = typeof route.rating === 'number'
  const ratingValue = hasRating ? Number(route.rating?.toFixed(1)) : null
  
  // Combinar heroImage con gallery para el carrusel
  const allImages = [route.heroImage, ...(route.gallery || []).slice(1) ]
  const hasMultipleImages = allImages.length > 1
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Resetear índice cuando cambie la ruta
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [route.id])

  const goToPrevious = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
  }

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
  }

  const goToImage = (index: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex(index)
  }

  // Modo compacto con click personalizado (por ejemplo, en vista "Ambas" para centrar el mapa)
  if (compact && onClick) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className={`group cursor-pointer transition-all duration-300 ${
          isSelected ? 'ring-2 ring-primary-600 ring-offset-2 rounded-xl shadow-lg' : ''
        } ${
          isHovered && !isSelected ? 'ring-2 ring-primary-500 ring-offset-2 rounded-xl scale-105 shadow-lg' : ''
        }`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('Click en tarjeta compacta, ruta:', route.id, route.title)
          onClick()
        }}
        onMouseDown={(e) => {
          // Prevenir que el Link (si existe) capture el evento
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <div className="relative h-48 overflow-hidden rounded-xl mb-2 group/image">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <Image
                src={allImages[currentImageIndex].url}
                alt={allImages[currentImageIndex].alt || route.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Rating Badge */}
          {hasRating && (
            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-gray-900 shadow z-10">
              <Star className="h-3 w-3 text-amber-500" fill="currentColor" strokeWidth={1.5} />
              {ratingValue}
            </div>
          )}

          {/* Navigation Arrows */}
          {hasMultipleImages && (
            <>
              {/* Left Arrow */}
              <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 backdrop-blur-sm p-1.5 shadow-lg hover:bg-white transition-all opacity-0 group-hover/image:opacity-100"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="h-4 w-4 text-gray-900" />
              </button>
              
              {/* Right Arrow */}
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 backdrop-blur-sm p-1.5 shadow-lg hover:bg-white transition-all opacity-0 group-hover/image:opacity-100"
                aria-label="Siguiente imagen"
              >
                <ChevronRight className="h-4 w-4 text-gray-900" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {hasMultipleImages && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => goToImage(index, e)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentImageIndex 
                      ? 'w-6 bg-white' 
                      : 'w-1.5 bg-white/60 hover:bg-white/80'
                  }`}
                  aria-label={`Ir a imagen ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Difficulty/Grade Badge */}
          <div className="absolute bottom-2 left-2 z-10">
            {type === 'ferrata' && route.ferrataGrade ? (
              <span className={`text-xs px-2 py-1 rounded-md font-medium ${getFerrataGradeColor(route.ferrataGrade)}`}>
                {route.ferrataGrade}
              </span>
            ) : (
              <span className={`text-xs px-2 py-1 rounded-md font-medium ${getDifficultyColor(route.difficulty)}`}>
                {route.difficulty}
              </span>
            )}
          </div>

          {/* Botón para ir al detalle - esquina inferior derecha */}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              const url = `/${route.type === 'trekking' ? 'rutas' : 'vias-ferratas'}/${route.slug}`
              window.open(url, '_blank', 'noopener,noreferrer')
            }}
            className="absolute bottom-2 right-2 z-20 rounded-full bg-white/95 backdrop-blur-sm p-1.5 shadow-lg hover:bg-white transition-all opacity-0 group-hover/image:opacity-100"
            title="Ver detalles de la ruta"
            aria-label="Ver detalles de la ruta"
          >
            <ExternalLink className="h-3.5 w-3.5 text-gray-900" />
          </button>
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
            {route.title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-1">
            {route.location.region}, {route.location.province}
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-600 pt-1">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{formatDistance(route.distance)}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>{formatElevation(route.elevation)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{route.duration}</span>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className={`group cursor-pointer transition-all duration-300 ${
          isSelected ? 'ring-2 ring-primary-600 ring-offset-2 rounded-xl shadow-lg' : ''
        } ${
          isHovered && !isSelected ? 'ring-2 ring-primary-500 ring-offset-2 rounded-xl scale-105 shadow-lg' : ''
        }`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onDoubleClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDoubleClick?.()
        }}
      >
        <Link 
          href={`/${route.type === 'trekking' ? 'rutas' : 'vias-ferratas'}/${route.slug}`} 
          target="_blank" 
          rel="noopener noreferrer"
          onDoubleClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDoubleClick?.()
          }}
        >
          <div className="relative h-48 overflow-hidden rounded-xl mb-2 group/image">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <Image
                  src={allImages[currentImageIndex].url}
                  alt={allImages[currentImageIndex].alt || route.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Rating Badge */}
            {hasRating && (
              <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-gray-900 shadow z-10">
                <Star className="h-3 w-3 text-amber-500" fill="currentColor" strokeWidth={1.5} />
                {ratingValue}
              </div>
            )}

            {/* Navigation Arrows */}
            {hasMultipleImages && (
              <>
                {/* Left Arrow */}
                <button
                  onClick={goToPrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 backdrop-blur-sm p-1.5 shadow-lg hover:bg-white transition-all opacity-0 group-hover/image:opacity-100"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-900" />
                </button>
                
                {/* Right Arrow */}
                <button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 backdrop-blur-sm p-1.5 shadow-lg hover:bg-white transition-all opacity-0 group-hover/image:opacity-100"
                  aria-label="Siguiente imagen"
                >
                  <ChevronRight className="h-4 w-4 text-gray-900" />
                </button>
              </>
            )}

            {/* Dots Indicator */}
            {hasMultipleImages && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                {allImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => goToImage(index, e)}
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentImageIndex 
                        ? 'w-6 bg-white' 
                        : 'w-1.5 bg-white/60 hover:bg-white/80'
                    }`}
                    aria-label={`Ir a imagen ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Difficulty/Grade Badge */}
            <div className="absolute bottom-2 left-2 z-10">
              {type === 'ferrata' && route.ferrataGrade ? (
                <span className={`text-xs px-2 py-1 rounded-md font-medium ${getFerrataGradeColor(route.ferrataGrade)}`}>
                  {route.ferrataGrade}
                </span>
              ) : (
                <span className={`text-xs px-2 py-1 rounded-md font-medium ${getDifficultyColor(route.difficulty)}`}>
                  {route.difficulty}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
              {route.title}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-1">
              {route.location.region}, {route.location.province}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-600 pt-1">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{formatDistance(route.distance)}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>{formatElevation(route.elevation)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{route.duration}</span>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`card card-hover group transition-all duration-300 ${
        isSelected ? 'ring-2 ring-primary-600 ring-offset-2 shadow-xl' : ''
      } ${
        isHovered && !isSelected ? 'ring-2 ring-primary-500 ring-offset-2 scale-105 shadow-xl' : ''
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDoubleClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onDoubleClick?.()
      }}
    >
      <Link 
        href={`/${route.type === 'trekking' ? 'rutas' : 'vias-ferratas'}/${route.slug}`} 
        target="_blank" 
        rel="noopener noreferrer"
        onDoubleClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDoubleClick?.()
        }}
      >
        <div className="relative h-48 overflow-hidden group/image">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <Image
                src={allImages[currentImageIndex].url}
                alt={allImages[currentImageIndex].alt || route.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Rating Badge */}
          {hasRating && (
            <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-gray-900 shadow z-10">
              <Star className="h-4 w-4 text-amber-500" fill="currentColor" strokeWidth={1.5} />
              {ratingValue}
            </div>
          )}

          {/* Navigation Arrows */}
          {hasMultipleImages && (
            <>
              {/* Left Arrow */}
              <button
                onClick={goToPrevious}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 backdrop-blur-sm p-2 shadow-lg hover:bg-white transition-all opacity-0 group-hover/image:opacity-100"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="h-5 w-5 text-gray-900" />
              </button>
              
              {/* Right Arrow */}
              <button
                onClick={goToNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 backdrop-blur-sm p-2 shadow-lg hover:bg-white transition-all opacity-0 group-hover/image:opacity-100"
                aria-label="Siguiente imagen"
              >
                <ChevronRight className="h-5 w-5 text-gray-900" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {hasMultipleImages && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => goToImage(index, e)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentImageIndex 
                      ? 'w-8 bg-white' 
                      : 'w-2 bg-white/60 hover:bg-white/80'
                  }`}
                  aria-label={`Ir a imagen ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Difficulty/Grade Badge */}
          <div className="absolute bottom-3 left-3 z-10">
            {type === 'ferrata' && route.ferrataGrade ? (
              <span className={`badge ${getFerrataGradeColor(route.ferrataGrade)}`}>
                {route.ferrataGrade}
              </span>
            ) : (
              <span className={`badge ${getDifficultyColor(route.difficulty)}`}>
                {route.difficulty}
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          <h3 className="mb-2 text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
            {route.title}
          </h3>
          <p className="mb-4 line-clamp-2 text-gray-600">
            {route.summary}
          </p>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <MapPin className="mr-1 h-4 w-4" />
              {formatDistance(route.distance)}
            </div>
            <div className="flex items-center">
              <TrendingUp className="mr-1 h-4 w-4" />
              {formatElevation(route.elevation)}
            </div>
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              {route.duration}
            </div>
          </div>

          <div className="mt-4 flex items-center text-sm text-gray-500">
            <MapPin className="mr-1 h-4 w-4" />
            {route.location.region}, {route.location.province}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

