'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Route, RouteType } from '@/types'
import { RouteCard } from './RouteCard'

interface RecentRoutesCarouselProps {
  routes: Route[]
  type: RouteType
  title?: string
}

/**
 * Componente que muestra un carrusel horizontal con cards de rutas recientes
 */
export function RecentRoutesCarousel({ routes, type, title }: RecentRoutesCarouselProps) {
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

    // Verificar después de que el contenido se cargue
    const timeoutId = setTimeout(checkScrollability, 100)
    
    checkScrollability()
    container.addEventListener('scroll', checkScrollability)
    window.addEventListener('resize', checkScrollability)

    return () => {
      clearTimeout(timeoutId)
      container.removeEventListener('scroll', checkScrollability)
      window.removeEventListener('resize', checkScrollability)
    }
  }, [routes])

  /**
   * Desplaza el carrusel hacia la izquierda
   */
  const scrollLeft = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const firstCard = container.querySelector('div[class*="flex-shrink-0"]')
    const cardWidth = firstCard ? firstCard.getBoundingClientRect().width + 32 : 400 // 32px es el gap
    container.scrollBy({ left: -cardWidth, behavior: 'smooth' })
  }

  /**
   * Desplaza el carrusel hacia la derecha
   */
  const scrollRight = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const firstCard = container.querySelector('div[class*="flex-shrink-0"]')
    const cardWidth = firstCard ? firstCard.getBoundingClientRect().width + 32 : 400 // 32px es el gap
    container.scrollBy({ left: cardWidth, behavior: 'smooth' })
  }

  if (routes.length === 0) {
    return null
  }

  const defaultTitle = type === 'ferrata' 
    ? 'Otras Vías Ferratas' 
    : 'Otras Rutas de Senderismo'

  return (
    <section className="py-12 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Título */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            {title || defaultTitle}
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            {type === 'ferrata' 
              ? 'Descubre más vías ferratas para tu próxima aventura vertical'
              : 'Explora más rutas de senderismo y aventuras en la montaña'}
          </p>
        </div>

        {/* Carrusel */}
        <div className="relative flex items-center gap-4">
          {/* Botón izquierdo */}
          <button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className="flex-shrink-0 rounded-full bg-white p-3 shadow-lg border border-gray-200 transition-all hover:bg-gray-50 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 z-10"
            aria-label="Desplazar izquierda"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>

          {/* Contenedor del carrusel */}
          <div
            ref={scrollContainerRef}
            className="flex-1 flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          >
            {routes.map((route) => (
              <div
                key={route.id}
                className="flex-shrink-0 w-full sm:w-80 lg:w-96"
              >
                <RouteCard route={route} type={type} />
              </div>
            ))}
          </div>

          {/* Botón derecho */}
          <button
            onClick={scrollRight}
            disabled={!canScrollRight}
            className="flex-shrink-0 rounded-full bg-white p-3 shadow-lg border border-gray-200 transition-all hover:bg-gray-50 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 z-10"
            aria-label="Desplazar derecha"
          >
            <ChevronRight className="h-6 w-6 text-gray-700" />
          </button>
        </div>
      </div>
    </section>
  )
}
