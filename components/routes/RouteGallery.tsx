'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ImageData } from '@/types'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

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
        <div className="flex items-center gap-2">
          {/* Botón izquierdo */}
          <button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className="flex-shrink-0 rounded-full bg-white p-2 shadow-lg border border-gray-200 transition-all hover:bg-gray-50 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            aria-label="Desplazar izquierda"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>

          {/* Contenedor del slider */}
          <div
            ref={scrollContainerRef}
            className="flex-1 flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
          >
            {images.map((image, index) => (
              <motion.button
                key={index}
                onClick={() => openLightbox(index)}
                className="group relative flex-shrink-0 h-48 w-48 md:h-56 md:w-56 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Image
                  src={image.url}
                  alt={image.alt || `${routeTitle} - Foto ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  sizes="224px"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
                {image.source && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-white text-[10px] font-medium">
                    {image.source}
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          {/* Botón derecho */}
          <button
            onClick={scrollRight}
            disabled={!canScrollRight}
            className="flex-shrink-0 rounded-full bg-white p-2 shadow-lg border border-gray-200 transition-all hover:bg-gray-50 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
            onClick={closeLightbox}
          >
            {/* Botón cerrar */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/20"
              aria-label="Cerrar galería"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Botón anterior */}
            {images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrevious()
                }}
                className="absolute left-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/20"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Imagen */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-h-[90vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[selectedIndex].url}
                alt={images[selectedIndex].alt || `${routeTitle} - Foto ${selectedIndex + 1}`}
                width={images[selectedIndex].width}
                height={images[selectedIndex].height}
                className="max-h-[90vh] w-auto rounded-lg object-contain"
                sizes="90vw"
              />
              {images[selectedIndex].source && (
                <div className="absolute bottom-4 right-4 px-3 py-2 bg-black/60 backdrop-blur-sm rounded text-white text-xs font-medium">
                  {images[selectedIndex].source}
                </div>
              )}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white backdrop-blur">
                  {selectedIndex + 1} / {images.length}
                </div>
              )}
            </motion.div>

            {/* Botón siguiente */}
            {images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
                className="absolute right-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/20"
                aria-label="Imagen siguiente"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

