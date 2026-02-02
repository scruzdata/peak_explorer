'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ImageData } from '@/types'
import { X, ChevronLeft, ChevronRight, Hand } from 'lucide-react'

interface RouteGalleryProps {
  images: ImageData[]
  routeTitle: string
}

/**
 * Componente que muestra una galería de imágenes de la ruta
 * Incluye un lightbox para ver las imágenes en tamaño completo
 */
export function RouteGallery({ images, routeTitle }: RouteGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    /**
     * Verifica si se puede hacer scroll en el contenedor
     */
    const checkScrollability = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }

    // Verificar después de que las imágenes se carguen
    const timeoutId = setTimeout(checkScrollability, 100)
    
    checkScrollability()
    container.addEventListener('scroll', checkScrollability)
    window.addEventListener('resize', checkScrollability)

    return () => {
      clearTimeout(timeoutId)
      container.removeEventListener('scroll', checkScrollability)
      window.removeEventListener('resize', checkScrollability)
    }
  }, [images])

  /**
   * Desplaza el slider hacia la izquierda
   */
  const scrollLeft = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const firstImage = container.querySelector('button')
    const imageWidth = firstImage ? firstImage.offsetWidth + 16 : 208
    container.scrollBy({ left: -imageWidth, behavior: 'smooth' })
  }

  /**
   * Desplaza el slider hacia la derecha
   */
  const scrollRight = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const firstImage = container.querySelector('button')
    const imageWidth = firstImage ? firstImage.offsetWidth + 16 : 208
    container.scrollBy({ left: imageWidth, behavior: 'smooth' })
  }

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
  }

  const closeLightbox = () => {
    setSelectedIndex(null)
  }

  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + images.length) % images.length)
    }
  }

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % images.length)
    }
  }

  if (!images || images.length === 0) {
    return null
  }

  return (
    <>
      <section className="w-full">
        <h2 className="mb-4 text-2xl font-bold">Galería de Fotos</h2>
        
        {/* Indicador de deslizamiento para móvil */}
        <div className="mb-4 flex items-center justify-center gap-2 text-sm text-gray-500 sm:hidden">
          <Hand className="h-4 w-4 animate-pulse" />
          <span>Desliza para ver más</span>
          <div className="flex gap-1 items-center">
            <ChevronLeft className="h-4 w-4 animate-slide-horizontal" />
            <ChevronRight className="h-4 w-4 animate-slide-horizontal" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2">
          {/* Botón izquierdo */}
          <button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className="hidden sm:flex flex-shrink-0 rounded-full bg-white p-2 shadow-lg border border-gray-200 transition-all hover:bg-gray-50 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            aria-label="Desplazar izquierda"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>

          {/* Contenedor del slider */}
          <div
            ref={scrollContainerRef}
            className="flex-1 flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-2 sm:px-0"
          >
            {images.map((image, index) => (
              <motion.button
                key={index}
                onClick={() => openLightbox(index)}
                className="group relative flex-shrink-0 h-48 w-48 md:h-56 md:w-56 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {(() => {
                  const optimized = image.optimizedSources
                  const src =
                    optimized?.w400 ||
                    optimized?.w800 ||
                    optimized?.w1600 ||
                    image.url
                  return (
                    <Image
                      src={src}
                      alt={image.alt || `${routeTitle} - Foto ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      sizes="224px"
                    />
                  )
                })()}
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
              </motion.button>
            ))}
          </div>

          {/* Botón derecho */}
          <button
            onClick={scrollRight}
            disabled={!canScrollRight}
            className="hidden sm:flex flex-shrink-0 rounded-full bg-white p-2 shadow-lg border border-gray-200 transition-all hover:bg-gray-50 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            aria-label="Desplazar derecha"
          >
            <ChevronRight className="h-6 w-6 text-gray-700" />
          </button>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95"
            onClick={closeLightbox}
          >
            {/* Botón cerrar */}
            <button
              onClick={closeLightbox}
              className="absolute top-2 right-2 md:top-4 md:right-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/20"
              aria-label="Cerrar galería"
            >
              <X className="h-5 w-5 md:h-6 md:w-6" />
            </button>

            {/* Botón anterior */}
            {images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrevious()
                }}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/20"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            )}

            {/* Contenedor de imagen, numeración y pie de foto */}
            <div className="flex flex-col items-center justify-center gap-2 md:gap-4 w-full h-full px-2 md:px-4 py-16 md:py-4" onClick={(e) => e.stopPropagation()}>
              {/* Imagen */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full h-[calc(100vh-180px)] md:h-[85vh] flex items-center justify-center"
              >
                {(() => {
                  const img = images[selectedIndex]
                  const optimized = img.optimizedSources
                  // Para la imagen grande del lightbox priorizamos la mayor resolución disponible
                  const src =
                    optimized?.w1600 ||
                    optimized?.w800 ||
                    optimized?.w400 ||
                    img.url
                  return (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Image
                        src={src}
                        alt={img.alt || `${routeTitle} - Foto ${selectedIndex + 1}`}
                        fill
                        className="object-contain rounded-lg"
                        sizes="100vw"
                        priority
                      />
                    </div>
                  )
                })()}
                {/* Texto alternativo en desktop (esquina inferior derecha) */}
                {images[selectedIndex].alt && (
                  <div className="hidden md:block absolute bottom-4 right-4 px-3 py-2 bg-black/60 backdrop-blur-sm rounded text-white text-xs font-medium max-w-[80%] z-10">
                    {images[selectedIndex].alt}
                  </div>
                )}
              </motion.div>
              
              {/* Texto alternativo en móvil (debajo de la imagen) */}
              {images[selectedIndex].alt && (
                <div className="md:hidden text-center px-4 py-2 max-w-[95vw]">
                  <p className="text-white text-sm">
                    {images[selectedIndex].alt}
                  </p>
                </div>
              )}
              
              {/* Numeración debajo de la imagen */}
              {images.length > 1 && (
                <div className="rounded-full bg-black/50 px-4 py-2 text-sm text-white backdrop-blur">
                  {selectedIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Botón siguiente */}
            {images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/20"
                aria-label="Imagen siguiente"
              >
                <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

