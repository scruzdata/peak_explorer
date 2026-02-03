'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, MapPin, TrendingUp, Star, ChevronLeft, ChevronRight, ExternalLink, Hand } from 'lucide-react'
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
  /** Optimización: priority para imágenes en viewport inicial (mejora LCP) */
  priority?: boolean
}

export function RouteCard({ route, compact = false, onMouseEnter, onMouseLeave, isHovered = false, isSelected = false, type = 'trekking', onClick, onDoubleClick, priority = false }: RouteCardProps) {
  const hasRating = typeof route.rating === 'number'
  const ratingValue = hasRating ? Number(route.rating?.toFixed(1)) : null
  
  // Combinar heroImage con gallery para el carrusel
  const allImages = [route.heroImage, ...(route.gallery || []) ]
  const hasMultipleImages = allImages.length > 1
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isCentered, setIsCentered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  // Detectar si estamos en móvil
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 1024) // lg breakpoint
      }
    }
    // Verificar inmediatamente
    checkMobile()
    // También verificar después de un pequeño delay para asegurar que el DOM está listo
    const timeoutId = setTimeout(checkMobile, 100)
    window.addEventListener('resize', checkMobile)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Detectar si la card está centrada en el viewport (solo en móvil)
  useEffect(() => {
    if (!isMobile || !cardRef.current) return

    const checkIfCentered = () => {
      const element = cardRef.current
      if (!element) return

      const rect = element.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportCenter = viewportHeight / 2
      const elementCenter = rect.top + rect.height / 2
      
      // Considerar centrada si está dentro de un rango de ±150px del centro del viewport
      const distanceFromCenter = Math.abs(elementCenter - viewportCenter)
      setIsCentered(distanceFromCenter < 150)
    }

    // Verificar inicialmente
    checkIfCentered()

    // Verificar en scroll y resize
    window.addEventListener('scroll', checkIfCentered, { passive: true })
    window.addEventListener('resize', checkIfCentered)

    return () => {
      window.removeEventListener('scroll', checkIfCentered)
      window.removeEventListener('resize', checkIfCentered)
    }
  }, [isMobile])

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

  // Handlers para swipe en móvil
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile || !hasMultipleImages) return
    const touch = e.touches[0]
    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !hasMultipleImages || touchStartX.current === null) return
    // Prevenir scroll si estamos deslizando horizontalmente
    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartX.current)
    const deltaY = Math.abs(touch.clientY - (touchStartY.current || 0))
    
    if (deltaX > deltaY && deltaX > 10) {
      e.preventDefault()
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile || !hasMultipleImages || touchStartX.current === null || touchStartY.current === null) {
      touchStartX.current = null
      touchStartY.current = null
      return
    }

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartX.current
    const deltaY = Math.abs(touch.clientY - touchStartY.current)
    const minSwipeDistance = 50

    // Solo procesar si el movimiento horizontal es mayor que el vertical
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > minSwipeDistance) {
      e.preventDefault()
      e.stopPropagation()
      
      if (deltaX > 0) {
        // Swipe hacia la derecha - imagen anterior
        setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
      } else {
        // Swipe hacia la izquierda - siguiente imagen
        setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
      }
    }

    touchStartX.current = null
    touchStartY.current = null
  }

  // Modo compacto con click personalizado (por ejemplo, en vista "Ambas" para centrar el mapa)
  if (compact && onClick) {
    return (
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className={`relative group cursor-pointer transition-all duration-300 ${isMobile && hasMultipleImages ? 'pt-4' : ''} ${
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
        {/* Indicador animado "Desliza para ver más" - Solo en móvil cuando hay múltiples imágenes y está centrada */}
        {isMobile && hasMultipleImages && isCentered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-1 left-0 right-0 z-50 flex items-center justify-center gap-1.5 pointer-events-none"
          >
            <Hand className="h-4 w-4 text-gray-700 animate-pulse" />
            <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">Desliza para ver más imágenes</span>
            <div className="flex gap-0.5 items-center">
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronLeft className="h-3.5 w-3.5 text-gray-700" />
              </motion.div>
              <motion.div
                animate={{ x: [0, -4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              >
                <ChevronRight className="h-3.5 w-3.5 text-gray-700" />
              </motion.div>
            </div>
          </motion.div>
        )}
        
        <div 
          className="relative h-48 overflow-hidden rounded-xl mb-2 group/image"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          {...(onClick === undefined ? {
            onClick: (e: any) => {
              // Solo prevenir la propagación si no hay onClick personalizado
              e.preventDefault()
              e.stopPropagation()
            }
          } : {})}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 pointer-events-none"
            >
              {(() => {
                const img = allImages[currentImageIndex]
                const optimized = img.optimizedSources
                const src =
                  optimized?.w400 ||
                  optimized?.w800 ||
                  optimized?.w1600 ||
                  img.url
                return (
                  <Image
                    src={src}
                    alt={img.alt || route.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110 pointer-events-none"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                  />
                )
              })()}
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          
          {/* Rating Badge */}
          {hasRating && (
            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-gray-900 shadow z-10 pointer-events-none">
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

          {/* Dots Indicator - Solo visual, no interactivo */}
          {hasMultipleImages && (
            <div 
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-1.5"
              aria-label={`Imagen ${currentImageIndex + 1} de ${allImages.length}`}
              role="status"
            >
              {allImages.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all pointer-events-none ${
                    index === currentImageIndex 
                      ? 'w-6 bg-white' 
                      : 'w-1.5 bg-white/60'
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
          )}

          {/* Difficulty/Grade Badge */}
          <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
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
          <Link 
            href={`/${route.type === 'trekking' ? 'rutas' : 'vias-ferratas'}/${route.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation()
            }}
            className="block"
          >
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1 cursor-pointer hover:underline">
              {route.title}
            </h3>
          </Link>
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
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className={`relative group cursor-pointer transition-all duration-300 ${isMobile && hasMultipleImages ? 'pt-4' : ''} ${
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
          {/* Indicador animado "Desliza para ver más" - Solo en móvil cuando hay múltiples imágenes y está centrada */}
          {isMobile && hasMultipleImages && isCentered && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-1 left-0 right-0 z-50 flex items-center justify-center gap-1.5 pointer-events-none"
            >
              <Hand className="h-4 w-4 text-gray-700 animate-pulse" />
              <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">Desliza para ver más imágenes</span>
              <div className="flex gap-0.5 items-center">
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronLeft className="h-3.5 w-3.5 text-gray-700" />
                </motion.div>
                <motion.div
                  animate={{ x: [0, -4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                >
                  <ChevronRight className="h-3.5 w-3.5 text-gray-700" />
                </motion.div>
              </div>
            </motion.div>
          )}
          
          <div 
            className="relative h-48 overflow-hidden rounded-xl mb-2 group/image"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                {/* Optimización: priority para imágenes en viewport inicial, lazy para las demás */}
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

            {/* Dots Indicator - Solo visual, no interactivo */}
            {hasMultipleImages && (
              <div 
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-1.5"
                aria-label={`Imagen ${currentImageIndex + 1} de ${allImages.length}`}
                role="status"
              >
                {allImages.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all pointer-events-none ${
                      index === currentImageIndex 
                        ? 'w-6 bg-white' 
                        : 'w-1.5 bg-white/60'
                    }`}
                    aria-hidden="true"
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
            <Link 
              href={`/${route.type === 'trekking' ? 'rutas' : 'vias-ferratas'}/${route.slug}`}
              onClick={(e) => {
                e.stopPropagation()
              }}
              className="block"
            >
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1 cursor-pointer hover:underline">
                {route.title}
              </h3>
            </Link>
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

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`relative card card-hover group transition-all duration-300 ${isMobile && hasMultipleImages ? 'pt-10' : ''} ${
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
        {/* Indicador animado "Desliza para ver más" - Solo en móvil cuando hay múltiples imágenes y está centrada */}
        {isMobile && hasMultipleImages && isCentered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-1 left-0 right-0 z-50 flex items-center justify-center gap-1.5 pointer-events-none"
          >
            <Hand className="h-4 w-4 text-gray-700 animate-pulse" />
            <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">Desliza para ver más imágenes</span>
            <div className="flex gap-0.5 items-center">
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronLeft className="h-3.5 w-3.5 text-gray-700" />
              </motion.div>
              <motion.div
                animate={{ x: [0, -4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              >
                <ChevronRight className="h-3.5 w-3.5 text-gray-700" />
              </motion.div>
            </div>
          </motion.div>
        )}
        
        <div 
          className="relative h-40 sm:h-56 overflow-hidden group/image"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              {(() => {
                const img = allImages[currentImageIndex]
                const optimized = img.optimizedSources
                const src =
                  optimized?.w400 ||
                  optimized?.w800 ||
                  optimized?.w1600 ||
                  img.url
                return (
                  <Image
                    src={src}
                    alt={img.alt || route.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110 pointer-events-none"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                )
              })()}
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Rating Badge */}
          {hasRating && (
            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-gray-900 shadow z-10">
              <Star className="h-3.5 w-3.5 text-amber-500" fill="currentColor" strokeWidth={1.5} />
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

          {/* Dots Indicator - Solo visual, no interactivo */}
          {hasMultipleImages && (
            <div 
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2"
              aria-label={`Imagen ${currentImageIndex + 1} de ${allImages.length}`}
              role="status"
            >
              {allImages.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all pointer-events-none ${
                    index === currentImageIndex 
                      ? 'w-6 bg-white' 
                      : 'w-1.5 bg-white/60'
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
          )}

          {/* Difficulty/Grade Badge */}
          <div className="absolute bottom-2 left-2 z-10">
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

        <div className="p-4">
          <Link 
            href={`/${route.type === 'trekking' ? 'rutas' : 'vias-ferratas'}/${route.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation()
            }}
            className="block"
          >
            <h3 className="mb-1.5 text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors cursor-pointer hover:underline">
              {route.title}
            </h3>
          </Link>
          <p className="mb-3 line-clamp-2 text-sm text-gray-600">
            {route.summary}
          </p>

          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
            <div className="flex items-center">
              <MapPin className="mr-1 h-3.5 w-3.5" />
              {formatDistance(route.distance)}
            </div>
            <div className="flex items-center">
              <TrendingUp className="mr-1 h-3.5 w-3.5" />
              {formatElevation(route.elevation)}
            </div>
            <div className="flex items-center">
              <Clock className="mr-1 h-3.5 w-3.5" />
              {route.duration}
            </div>
          </div>

          <div className="mt-3 flex items-center text-xs text-gray-500">
            <MapPin className="mr-1 h-3.5 w-3.5" />
            {route.location.region}, {route.location.province}
          </div>
        </div>
    </motion.div>
  )
}

