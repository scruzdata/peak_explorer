'use client'

import { useEffect, useRef, useState } from 'react'

interface VideoHeroProps {
  src: string
  className?: string
}

/**
 * Componente de video optimizado para hero sections
 * - Carga el video solo cuando está visible o cerca del viewport
 * - Pausa automáticamente cuando sale del viewport para ahorrar recursos
 * - Usa Intersection Observer para detección eficiente
 * - Mejora el rendimiento y reduce el uso de ancho de banda
 */
export function VideoHero({ src, className = '' }: VideoHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Cargar y reproducir el video inmediatamente (optimizado para hero sections)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Mostrar el video tan pronto como tenga datos suficientes
    const handleLoadedMetadata = () => {
      // Mostrar el video incluso si aún no puede reproducir completamente
      setIsLoaded(true)
    }

    const handleCanPlay = () => {
      setIsLoaded(true)
      if (!isPaused) {
        video.play().catch(() => {
          // Ignorar errores de autoplay
        })
      }
    }

    const handleLoadedData = () => {
      setIsLoaded(true)
      if (!isPaused) {
        video.play().catch(() => {
          // Ignorar errores de autoplay
        })
      }
    }

    // Usar múltiples eventos para detectar cuando mostrar el video
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('loadeddata', handleLoadedData)

    // Si el video ya tiene datos, mostrar inmediatamente
    if (video.readyState >= 1) {
      setIsLoaded(true)
    }
    
    // Intentar reproducir si ya tiene suficientes datos
    if (video.readyState >= 2 && !isPaused) {
      video.play().catch(() => {})
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('loadeddata', handleLoadedData)
    }
  }, [isPaused])

  // Intersection Observer para pausar cuando sale del viewport
  useEffect(() => {
    const container = containerRef.current
    const video = videoRef.current

    if (!container || !video) return

    // Configurar Intersection Observer para pausar cuando sale del viewport
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isIntersecting = entry.isIntersecting || entry.intersectionRatio > 0

          if (!isIntersecting && !isPaused) {
            // Video salió del viewport - pausar para ahorrar recursos
            setIsPaused(true)
            video.pause()
          } else if (isIntersecting && isPaused) {
            // Video volvió al viewport - reanudar
            setIsPaused(false)
            video.play().catch(() => {
              // Ignorar errores de autoplay
            })
          }
        })
      },
      {
        threshold: 0.1,
      }
    )

    observerRef.current.observe(container)

    // Limpiar observer al desmontar
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [isPaused])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Fallback visual mientras carga */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 animate-pulse" />
      )}
      
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
        onLoadedMetadata={() => setIsLoaded(true)}
        onCanPlay={() => setIsLoaded(true)}
      >
        <source src={src} type="video/webm" />
      </video>
    </div>
  )
}
