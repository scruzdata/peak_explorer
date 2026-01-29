'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowRight, Hand } from 'lucide-react'
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
    ? 'Vías Ferratas Cercanas' 
    : 'Rutas de Senderismo Cercanas'

  const defaultDescription = type === 'ferrata' 
    ? 'Descubre vías ferratas cercanas para tu próxima aventura vertical'
    : 'Explora rutas de senderismo cercanas y aventuras en la montaña'

  const viewAllUrl = type === 'ferrata' 
    ? '/vias-ferratas' 
    : '/rutas'

  return (
    <section className="py-12 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Título */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              {title || defaultTitle}
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              {defaultDescription}
            </p>
          </div>
          <Link
            href={viewAllUrl}
            className="hidden sm:flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            Ver todas
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>

        {/* Indicador de deslizamiento para móvil */}
        <div className="mb-4 flex items-center justify-center gap-2 text-sm text-gray-500 sm:hidden">
          <Hand className="h-4 w-4 animate-pulse" />
          <span>Desliza para ver más</span>
          <div className="flex gap-1 items-center">
            <ChevronLeft className="h-4 w-4 animate-slide-horizontal" />
            <ChevronRight className="h-4 w-4 animate-slide-horizontal" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>

        {/* Carrusel */}
        <div className="relative flex items-center gap-2 sm:gap-4">
          {/* Botón izquierdo */}
          <button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className="hidden sm:flex flex-shrink-0 rounded-full bg-white p-3 shadow-lg border border-gray-200 transition-all hover:bg-gray-50 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 z-10"
            aria-label="Desplazar izquierda"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>

          {/* Contenedor del carrusel */}
          <div
            ref={scrollContainerRef}
            className="flex-1 flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-2 sm:px-0"
          >
            {routes.map((route) => (
              <div
                key={route.id}
                className="flex-shrink-0 w-[280px] sm:w-64 lg:w-72"
              >
                <RouteCard route={route} type={type} />
              </div>
            ))}
          </div>

          {/* Botón derecho */}
          <button
            onClick={scrollRight}
            disabled={!canScrollRight}
            className="hidden sm:flex flex-shrink-0 rounded-full bg-white p-3 shadow-lg border border-gray-200 transition-all hover:bg-gray-50 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 z-10"
            aria-label="Desplazar derecha"
          >
            <ChevronRight className="h-6 w-6 text-gray-700" />
          </button>
        </div>
      </div>
    </section>
  )
}
