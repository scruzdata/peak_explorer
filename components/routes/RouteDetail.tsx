'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Route, WebcamData } from '@/types'
import { formatDistance, formatElevation, getDifficultyColor, getFerrataGradeColor } from '@/lib/utils'
import { useUserProgress } from '@/components/providers/UserProgressProvider'
import { RouteMap } from './RouteMap'
import { RouteElevationProfile } from './RouteElevationProfile'
import { RouteStorytelling } from './RouteStorytelling'
import { ReadingProgress } from './ReadingProgress'
import { RouteGallery } from './RouteGallery'
import { RouteWeather } from './RouteWeather'
import { TwitterTimeline } from './TwitterTimeline'
import { RecentRoutesCarousel } from './RecentRoutesCarousel'
import { 
  Clock, 
  MapPin, 
  TrendingUp, 
  Bookmark, 
  BookmarkCheck, 
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  Info,
  X
} from 'lucide-react'
import confetti from 'canvas-confetti'

interface RouteDetailProps {
  route: Route
  recentRoutes?: Route[]
}

interface GoogleNewsMobilePanelProps {
  hashtag: string
}

/**
 * Panel lateral móvil desplegable para Google News
 */
function GoogleNewsMobilePanel({ hashtag }: GoogleNewsMobilePanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!hashtag || !hashtag.trim()) return null

  const cleanHashtag = hashtag.replace(/^#/, '').trim()

  return (
    <>
      {/* Pestaña flotante (solo móvil) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/3 z-40 flex items-center rounded-l-lg bg-white px-2 py-3 text-[10px] font-semibold text-[#4285F4] shadow-lg border border-r-0 border-gray-200 lg:hidden"
        aria-label="Abrir noticias relacionadas"
      >
        <span className="flex flex-col items-center leading-tight">
          <span>Google</span>
          <span>News</span>
        </span>
      </button>

      {/* Overlay oscuro cuando el panel está abierto */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Panel lateral deslizante (solo móvil) */}
      <div
        className={`fixed inset-y-0 right-0 z-40 w-full max-w-xs transform bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500">Noticias</span>
            <span className="text-sm font-bold text-gray-900 truncate">#{cleanHashtag}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            aria-label="Cerrar noticias"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="h-[calc(100%-48px)] overflow-y-auto p-4">
          <TwitterTimeline hashtag={hashtag} />
        </div>
      </div>
    </>
  )
}

export function RouteDetail({ route, recentRoutes = [] }: RouteDetailProps) {
  const { isBookmarked, addBookmark, removeBookmark, completeRoute, isCompleted, unlockBadge, progress } = useUserProgress()
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [hoveredTrackIndex, setHoveredTrackIndex] = useState<number | null>(null) // Desde el perfil de elevación
  const [mapHoveredTrackIndex, setMapHoveredTrackIndex] = useState<number | null>(null) // Desde el mapa
  const [selectedWaypoint, setSelectedWaypoint] = useState<number | null>(null) // Waypoint seleccionado desde el perfil de elevación
  const [showDogsInfo, setShowDogsInfo] = useState(false)
  const [showApproachInfo, setShowApproachInfo] = useState(false)
  const [showReturnInfo, setShowReturnInfo] = useState(false)
  const [showBestSeasonInfo, setShowBestSeasonInfo] = useState(false)
  const [showOrientationInfo, setShowOrientationInfo] = useState(false)
  const [showFoodInfo, setShowFoodInfo] = useState(false)
  const [selectedWebcamIndex, setSelectedWebcamIndex] = useState(0)
  const [showWebcamImageModal, setShowWebcamImageModal] = useState(false)
  
  // Refs para los botones de información
  const dogsInfoButtonRef = useRef<HTMLButtonElement>(null)
  const approachInfoButtonRef = useRef<HTMLButtonElement>(null)
  const returnInfoButtonRef = useRef<HTMLButtonElement>(null)
  const bestSeasonInfoButtonRef = useRef<HTMLButtonElement>(null)
  const orientationInfoButtonRef = useRef<HTMLButtonElement>(null)
  const foodInfoButtonRef = useRef<HTMLButtonElement>(null)
  
  // Estados para las posiciones de los tooltips
  const [tooltipPositions, setTooltipPositions] = useState<Record<string, { top: number; left: number; arrowLeft: number }>>({})
  
  // Función para calcular la posición del tooltip
  const calculateTooltipPosition = (buttonRef: React.RefObject<HTMLButtonElement>, key: string) => {
    if (!buttonRef.current || typeof window === 'undefined') return
    const rect = buttonRef.current.getBoundingClientRect()
    const tooltipWidth = 256 // w-64 = 256px
    const iconCenterX = rect.left + rect.width / 2
    const minLeft = tooltipWidth / 2 + 16 // Mitad del tooltip + margen
    const maxLeft = window.innerWidth - tooltipWidth / 2 - 16 // Mitad del tooltip desde la derecha + margen
    // El left será el centro del tooltip (porque usamos translateX(-50%))
    const tooltipCenterX = Math.max(minLeft, Math.min(iconCenterX, maxLeft))
    // Calcular la posición de la flecha relativa al tooltip (desde el centro)
    const arrowOffset = iconCenterX - tooltipCenterX
    setTooltipPositions(prev => ({
      ...prev,
      [key]: {
        top: rect.bottom + 8, // 8px debajo del botón
        left: tooltipCenterX,
        arrowLeft: arrowOffset // Offset desde el centro del tooltip
      }
    }))
  }
  const bookmarked = isBookmarked(route.id)
  const completed = isCompleted(route.id)

  /**
   * Normaliza webcams para manejar compatibilidad con formato antiguo (string[])
   */
  const normalizedWebcams: WebcamData[] = route.webcams && route.webcams.length > 0
    ? route.webcams.map((webcam: any, index: number) => {
        // Si es string (formato antiguo), convertir a WebcamData
        if (typeof webcam === 'string') {
          return { title: `Webcam ${index + 1}`, url: webcam }
        }
        // Si ya es WebcamData, usar tal cual
        return webcam
      })
    : []

  useEffect(() => {
    // Simular incremento de vistas
    // En producción, esto se haría en el servidor
  }, [route.id])

  /**
   * Resetea el índice de webcam seleccionada cuando cambia la ruta
   */
  useEffect(() => {
    setSelectedWebcamIndex(0)
  }, [route.id])

  const handleBookmark = () => {
    if (bookmarked) {
      removeBookmark(route.id)
    } else {
      addBookmark(route.id)
      // Badge por primer bookmark
      if (progress && progress.bookmarks.length === 0) {
        unlockBadge({
          id: 'first-bookmark',
          name: 'Primer Favorito',
          description: 'Has guardado tu primera ruta',
          icon: '⭐',
          unlockedAt: new Date().toISOString(),
          category: 'first',
        })
        confetti({ particleCount: 100, spread: 70 })
      }
    }
  }

  const handleComplete = () => {
    if (!completed) {
      completeRoute(route.id)
      setShowCompletionModal(true)
      
      // Badges por completar rutas
      const completedCount = progress?.completedRoutes.length || 0
      if (completedCount === 0) {
        unlockBadge({
          id: 'first-completion',
          name: 'Primera Ruta Completada',
          description: '¡Has completado tu primera ruta!',
          icon: '🏔️',
          unlockedAt: new Date().toISOString(),
          category: 'first',
        })
      } else if (completedCount === 2) {
        unlockBadge({
          id: 'three-routes',
          name: 'Tres Rutas Completadas',
          description: 'Has completado 3 rutas',
          icon: '🎯',
          unlockedAt: new Date().toISOString(),
          category: 'milestone',
        })
      }
      
      confetti({ particleCount: 200, spread: 70 })
    }
  }

  return (
    <>
      <ReadingProgress />
      
      <article className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[500px] overflow-hidden">
          <Image
            src={route.heroImage.url}
            alt={route.heroImage.alt}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
          
          <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-12 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className={`badge ${getDifficultyColor(route.difficulty)}`}>
                  {route.difficulty}
                </span>
                {route.ferrataGrade && (
                  <span className={`badge ${getFerrataGradeColor(route.ferrataGrade)}`}>
                    {route.ferrataGrade}
                  </span>
                )}
                <span className="badge bg-white/20 text-white backdrop-blur">
                  {route.location.region}
                </span>
              </div>
              <h1 className="mb-4 text-4xl font-bold text-white sm:text-5xl md:text-6xl">
                {route.title}
              </h1>
              <p className="text-xl text-gray-200">
                {route.summary}
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="mx-auto max-w-[95rem] px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Twitter Timeline - Left Sidebar */}
            {route.twitterHashtag && route.twitterHashtag.trim() && (
              <aside className="lg:col-span-3 order-1 lg:order-1 hidden lg:block">
                <div className="sticky top-24">
                  <TwitterTimeline hashtag={route.twitterHashtag} />
                </div>
              </aside>
            )}

            {/* Main Column */}
            <div className={`space-y-12 ${route.twitterHashtag && route.twitterHashtag.trim() ? 'lg:col-span-6 order-2 lg:order-2' : 'lg:col-span-7 order-2 lg:order-2'}`}>
              {/* Stats */}
              <section className="space-y-2">
                {/* Primera fila */}
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <div className="rounded-lg bg-gray-50 p-2">
                    <div className="mb-0.5 text-[10px] text-gray-600">Distancia</div>
                    <div className="text-sm font-bold text-gray-900">
                      {formatDistance(route.distance)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <div className="mb-0.5 text-[10px] text-gray-600">Desnivel</div>
                    <div className="text-sm font-bold text-gray-900">
                      {formatElevation(route.elevation)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <div className="mb-0.5 text-[10px] text-gray-600">Duración</div>
                    <div className="text-sm font-bold text-gray-900">
                      {route.duration}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <div className="mb-0.5 text-[10px] text-gray-600">Estado</div>
                    <div className="text-sm font-bold text-gray-900">
                      {route.status}
                    </div>
                  </div>
                </div>
                {/* Segunda fila */}
                {(route.routeType || route.dogs) && (
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {route.routeType && (
                      <div className="rounded-lg bg-gray-50 p-2">
                        <div className="mb-0.5 text-[10px] text-gray-600">Tipo de ruta</div>
                        <div className="text-sm font-bold text-gray-900">
                          {route.routeType}
                        </div>
                      </div>
                    )}
                    {route.dogs && (
                      <div className="rounded-lg bg-gray-50 p-2 relative">
                        <div className="mb-0.5 text-[10px] text-gray-600 flex items-center gap-1">
                          Perros
                          {route.dogs === 'Atados' && (
                            <div 
                              className="relative inline-block"
                              onMouseEnter={() => setShowDogsInfo(true)}
                              onMouseLeave={() => setShowDogsInfo(false)}
                            >
                              <button
                                ref={dogsInfoButtonRef}
                                onClick={() => {
                                  calculateTooltipPosition(dogsInfoButtonRef, 'dogs')
                                  setShowDogsInfo(!showDogsInfo)
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none flex items-center"
                                aria-label="Información sobre perros atados"
                              >
                                <Info className="h-3 w-3" />
                              </button>
                              {showDogsInfo && (
                                <>
                                  <div className="fixed inset-0 z-40 bg-black/20 sm:hidden" onClick={() => setShowDogsInfo(false)} />
                                  <div 
                                    className="fixed z-50 mx-auto max-w-64 rounded-lg bg-gray-900 text-white p-3 text-xs shadow-xl sm:absolute sm:left-0 sm:right-auto sm:top-5 sm:mx-0 sm:w-64 sm:translate-y-0"
                                    style={typeof window !== 'undefined' && window.innerWidth < 640 && tooltipPositions.dogs ? {
                                      top: `${tooltipPositions.dogs.top}px`,
                                      left: `${tooltipPositions.dogs.left}px`,
                                      transform: 'translateX(-50%)'
                                    } : undefined}
                                  >
                                    <p className="mb-1 font-semibold">Información importante:</p>
                                    <p>Hay animales sueltos en la ruta. Por favor, mantén a tu perro atado para evitar molestias o conflictos con el ganado.</p>
                                    <div 
                                      className="absolute -top-1 w-2 h-2 rotate-45 bg-gray-900 sm:left-4 sm:translate-x-0"
                                      style={typeof window !== 'undefined' && window.innerWidth < 640 && tooltipPositions.dogs?.arrowLeft !== undefined ? {
                                        left: `calc(50% + ${tooltipPositions.dogs.arrowLeft}px)`,
                                        transform: 'translateX(-50%) rotate(45deg)'
                                      } : undefined}
                                    ></div>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          {route.dogs}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Route Features - Only for Ferratas */}
              {route.type === 'ferrata' && route.features && route.features.length > 0 && (
                <section>
                  <h2 className="mb-4 text-2xl font-bold">Características de la ruta</h2>
                  <div className="flex flex-wrap gap-3">
                    {route.features.map((feature) => (
                      <div
                        key={feature.id}
                        className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2 border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-2xl" role="img" aria-label={feature.name}>
                          {feature.icon}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{feature.name}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Map and Elevation Profile */}
              <section>
                <h2 className="mb-4 text-2xl font-bold">Mapa y Track GPX</h2>
                <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
                  <RouteMap 
                    route={route} 
                    hoveredTrackIndex={hoveredTrackIndex}
                    onMapHoverTrackIndex={setMapHoveredTrackIndex}
                    selectedWaypoint={selectedWaypoint}
                    onWaypointSelect={setSelectedWaypoint}
                  />
                </div>
                <div className="mt-2">
                  <RouteElevationProfile 
                    route={route} 
                    onHoverTrackIndex={setHoveredTrackIndex}
                    highlightedTrackIndex={mapHoveredTrackIndex}
                    onWaypointClick={setSelectedWaypoint}
                  />
                </div>
              </section>

              {/* Storytelling */}
              <RouteStorytelling content={route.storytelling} />

              {/* Gallery */}
              {route.gallery && route.gallery.length > 0 && (
                <section className="mt-6">
                  <RouteGallery images={route.gallery} routeTitle={route.title} />
                </section>
              )}

              {/* Safety Tips */}
              {route.safetyTips.length > 0 && (
                <section>
                  <h2 className="mb-4 text-2xl font-bold flex items-center">
                    <AlertTriangle className="mr-2 h-6 w-6 text-accent-600" />
                    Consejos de Seguridad
                  </h2>
                  <ul className="space-y-2">
                    {route.safetyTips.map((tip, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2 text-accent-600">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* Right Sidebar */}
            <aside className={`space-y-6 ${route.twitterHashtag && route.twitterHashtag.trim() ? 'lg:col-span-3 order-3 lg:order-3' : 'lg:col-span-5 order-3 lg:order-3'}`}>
              {/* Info Card */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
                <h3 className="mb-4 text-lg font-semibold">Información</h3>
                <dl className="space-y-3 text-sm">
                  <div className="relative">
                    <dt className="font-medium text-gray-600 flex items-center gap-1">
                      Aproximación
                      {route.approachInfo && (
                        <div 
                          className="relative inline-block"
                          onMouseEnter={() => setShowApproachInfo(true)}
                          onMouseLeave={() => setShowApproachInfo(false)}
                        >
                          <button
                            ref={approachInfoButtonRef}
                            onClick={() => {
                              calculateTooltipPosition(approachInfoButtonRef, 'approach')
                              setShowApproachInfo(!showApproachInfo)
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none flex items-center"
                            aria-label="Información adicional sobre aproximación"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                          {showApproachInfo && (
                            <>
                              <div className="fixed inset-0 z-40 bg-black/20 sm:hidden" onClick={() => setShowApproachInfo(false)} />
                              <div 
                                className="fixed z-50 mx-auto max-w-64 rounded-lg bg-gray-900 text-white p-3 text-xs shadow-xl sm:absolute sm:left-0 sm:right-auto sm:top-5 sm:mx-0 sm:w-64 sm:translate-y-0"
                                style={typeof window !== 'undefined' && window.innerWidth < 640 && tooltipPositions.approach ? {
                                  top: `${tooltipPositions.approach.top}px`,
                                  left: `${tooltipPositions.approach.left}px`,
                                  transform: 'translateX(-50%)'
                                } : undefined}
                              >
                                <p>{route.approachInfo}</p>
                                <div 
                                  className="absolute -top-1 w-2 h-2 rotate-45 bg-gray-900 sm:left-4 sm:translate-x-0"
                                  style={typeof window !== 'undefined' && window.innerWidth < 640 && tooltipPositions.approach?.arrowLeft !== undefined ? {
                                    left: `calc(50% + ${tooltipPositions.approach.arrowLeft}px)`,
                                    transform: 'translateX(-50%) rotate(45deg)'
                                  } : undefined}
                                ></div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </dt>
                    <dd className="text-gray-900">{route.approach || 'No especificada'}</dd>
                  </div>
                  <div className="relative">
                    <dt className="font-medium text-gray-600 flex items-center gap-1">
                      Retorno
                      {route.returnInfo && (
                        <div 
                          className="relative inline-block"
                          onMouseEnter={() => setShowReturnInfo(true)}
                          onMouseLeave={() => setShowReturnInfo(false)}
                        >
                          <button
                            ref={returnInfoButtonRef}
                            onClick={() => {
                              calculateTooltipPosition(returnInfoButtonRef, 'return')
                              setShowReturnInfo(!showReturnInfo)
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none flex items-center"
                            aria-label="Información adicional sobre retorno"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                          {showReturnInfo && (
                            <>
                              <div className="fixed inset-0 z-40 bg-black/20 sm:hidden" onClick={() => setShowReturnInfo(false)} />
                              <div 
                                className="fixed z-50 mx-auto max-w-64 rounded-lg bg-gray-900 text-white p-3 text-xs shadow-xl sm:absolute sm:left-0 sm:right-auto sm:top-5 sm:mx-0 sm:w-64 sm:translate-y-0"
                                style={typeof window !== 'undefined' && window.innerWidth < 640 && tooltipPositions.return ? {
                                  top: `${tooltipPositions.return.top}px`,
                                  left: `${tooltipPositions.return.left}px`,
                                  transform: 'translateX(-50%)'
                                } : undefined}
                              >
                                <p>{route.returnInfo}</p>
                                <div 
                                  className="absolute -top-1 w-2 h-2 rotate-45 bg-gray-900 sm:left-4 sm:translate-x-0"
                                  style={typeof window !== 'undefined' && window.innerWidth < 640 && tooltipPositions.return?.arrowLeft !== undefined ? {
                                    left: `calc(50% + ${tooltipPositions.return.arrowLeft}px)`,
                                    transform: 'translateX(-50%) rotate(45deg)'
                                  } : undefined}
                                ></div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </dt>
                    <dd className="text-gray-900">{route.return || 'No especificado'}</dd>
                  </div>
                  <div className="relative">
                    <dt className="font-medium text-gray-600 flex items-center gap-1">
                      Mejor Época
                      {route.bestSeasonInfo && (
                        <div 
                          className="relative inline-block"
                          onMouseEnter={() => setShowBestSeasonInfo(true)}
                          onMouseLeave={() => setShowBestSeasonInfo(false)}
                        >
                          <button
                            ref={bestSeasonInfoButtonRef}
                            onClick={() => {
                              calculateTooltipPosition(bestSeasonInfoButtonRef, 'bestSeason')
                              setShowBestSeasonInfo(!showBestSeasonInfo)
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none flex items-center"
                            aria-label="Información adicional sobre mejor época"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                          {showBestSeasonInfo && (
                            <>
                              <div className="fixed inset-0 z-40 bg-black/20 sm:hidden" onClick={() => setShowBestSeasonInfo(false)} />
                              <div 
                                className="fixed z-50 mx-auto max-w-64 rounded-lg bg-gray-900 text-white p-3 text-xs shadow-xl sm:absolute sm:left-0 sm:right-auto sm:top-5 sm:mx-0 sm:w-64 sm:translate-y-0"
                                style={typeof window !== 'undefined' && window.innerWidth < 640 && tooltipPositions.bestSeason ? {
                                  top: `${tooltipPositions.bestSeason.top}px`,
                                  left: `${tooltipPositions.bestSeason.left}px`,
                                  transform: 'translateX(-50%)'
                                } : undefined}
                              >
                                <p>{route.bestSeasonInfo}</p>
                                <div 
                                  className="absolute -top-1 w-2 h-2 rotate-45 bg-gray-900 sm:left-4 sm:translate-x-0"
                                  style={typeof window !== 'undefined' && window.innerWidth < 640 && tooltipPositions.bestSeason?.arrowLeft !== undefined ? {
                                    left: `calc(50% + ${tooltipPositions.bestSeason.arrowLeft}px)`,
                                    transform: 'translateX(-50%) rotate(45deg)'
                                  } : undefined}
                                ></div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </dt>
                    <dd className="text-gray-900">{route.bestSeason.join(', ')}</dd>
                  </div>
                  <div className="relative">
                    <dt className="font-medium text-gray-600 flex items-center gap-1">
                      Orientación
                      {route.orientationInfo && (
                        <div 
                          className="relative inline-block"
                          onMouseEnter={() => setShowOrientationInfo(true)}
                          onMouseLeave={() => setShowOrientationInfo(false)}
                        >
                          <button
                            ref={orientationInfoButtonRef}
                            onClick={() => {
                              calculateTooltipPosition(orientationInfoButtonRef, 'orientation')
                              setShowOrientationInfo(!showOrientationInfo)
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none flex items-center"
                            aria-label="Información adicional sobre orientación"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                          {showOrientationInfo && (
                            <>
                              <div className="fixed inset-0 z-40 bg-black/20 sm:hidden" onClick={() => setShowOrientationInfo(false)} />
                              <div 
                                className="fixed z-50 mx-auto max-w-64 rounded-lg bg-gray-900 text-white p-3 text-xs shadow-xl sm:absolute sm:left-0 sm:right-auto sm:top-5 sm:mx-0 sm:w-64 sm:translate-y-0"
                                style={typeof window !== 'undefined' && window.innerWidth < 640 && tooltipPositions.orientation ? {
                                  top: `${tooltipPositions.orientation.top}px`,
                                  left: `${tooltipPositions.orientation.left}px`,
                                  transform: 'translateX(-50%)'
                                } : undefined}
                              >
                                <p>{route.orientationInfo}</p>
                                <div 
                                  className="absolute -top-1 w-2 h-2 rotate-45 bg-gray-900 sm:left-4 sm:translate-x-0"
                                  style={typeof window !== 'undefined' && window.innerWidth < 640 && tooltipPositions.orientation?.arrowLeft !== undefined ? {
                                    left: `calc(50% + ${tooltipPositions.orientation.arrowLeft}px)`,
                                    transform: 'translateX(-50%) rotate(45deg)'
                                  } : undefined}
                                ></div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </dt>
                    <dd className="text-gray-900">{route.orientation}</dd>
                  </div>
                  {route.food && (
                    <div className="relative">
                      <dt className="font-medium text-gray-600 flex items-center gap-1">
                        Comida
                        {route.foodInfo && (
                          <div 
                            className="relative inline-block"
                            onMouseEnter={() => setShowFoodInfo(true)}
                            onMouseLeave={() => setShowFoodInfo(false)}
                          >
                            <button
                              ref={foodInfoButtonRef}
                              onClick={() => {
                                calculateTooltipPosition(foodInfoButtonRef, 'food')
                                setShowFoodInfo(!showFoodInfo)
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none flex items-center"
                              aria-label="Información adicional sobre comida"
                            >
                              <Info className="h-4 w-4" />
                            </button>
                            {showFoodInfo && (
                              <>
                                <div className="fixed inset-0 z-40 bg-black/20 sm:hidden" onClick={() => setShowFoodInfo(false)} />
                                <div 
                                  className="fixed z-50 mx-auto max-w-64 rounded-lg bg-gray-900 text-white p-3 text-xs shadow-xl sm:absolute sm:left-0 sm:right-auto sm:top-5 sm:mx-0 sm:w-64 sm:translate-y-0"
                                  style={typeof window !== 'undefined' && window.innerWidth < 640 && tooltipPositions.food ? {
                                    top: `${tooltipPositions.food.top}px`,
                                    left: `${tooltipPositions.food.left}px`,
                                    transform: 'translateX(-50%)'
                                  } : undefined}
                                >
                                  <p>{route.foodInfo}</p>
                                  <div 
                                    className="absolute -top-1 w-2 h-2 rotate-45 bg-gray-900 sm:left-4 sm:translate-x-0"
                                    style={typeof window !== 'undefined' && window.innerWidth < 640 && tooltipPositions.food?.arrowLeft !== undefined ? {
                                      left: `calc(50% + ${tooltipPositions.food.arrowLeft}px)`,
                                      transform: 'translateX(-50%) rotate(45deg)'
                                    } : undefined}
                                  ></div>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </dt>
                      <dd className="text-gray-900">{route.food}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Weather */}
              <RouteWeather
                lat={route.location.coordinates.lat}
                lng={route.location.coordinates.lng}
                useIframe={false}
              />

              {/* Webcams */}
              {normalizedWebcams.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 text-lg font-semibold">Webcams</h3>
                  
                  {/* Lista de webcams para seleccionar */}
                  {normalizedWebcams.length > 1 && (
                    <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-200 pb-4">
                      {normalizedWebcams.map((webcam, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedWebcamIndex(index)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedWebcamIndex === index
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {webcam.title || `Webcam ${index + 1}`}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Contenido de la webcam seleccionada (HTML, imagen directa o iframe) */}
                  <div className="w-full">
                    {normalizedWebcams[selectedWebcamIndex] && (
                      <>
                        <h4 className="mb-2 text-sm font-medium text-gray-700">
                          {normalizedWebcams[selectedWebcamIndex].title || `Webcam ${selectedWebcamIndex + 1}`}
                        </h4>
                        {normalizedWebcams[selectedWebcamIndex].html ? (
                          // Renderizar código HTML directamente
                          <div
                            className="w-full rounded-lg border border-gray-200 p-4 webcam-html"
                            dangerouslySetInnerHTML={{ __html: normalizedWebcams[selectedWebcamIndex].html! }}
                          />
                        ) : (() => {
                          const url = normalizedWebcams[selectedWebcamIndex].url
                          const cleanUrl = url ? url.split('?')[0].toLowerCase() : ''
                          const isImage =
                            !!cleanUrl &&
                            (cleanUrl.endsWith('.jpg') ||
                              cleanUrl.endsWith('.jpeg') ||
                              cleanUrl.endsWith('.png') ||
                              cleanUrl.endsWith('.gif') ||
                              cleanUrl.endsWith('.webp') ||
                              cleanUrl.endsWith('.avif'))

                          if (isImage) {
                            // Renderizar imagen directa clicable para ver más grande
                            return (
                              <div className="w-full rounded-lg border border-gray-200 overflow-hidden">
                                <button
                                  type="button"
                                  className="w-full cursor-zoom-in"
                                  onClick={() => setShowWebcamImageModal(true)}
                                  aria-label="Ver imagen de la webcam más grande"
                                >
                                  <Image
                                    src={url}
                                    alt={normalizedWebcams[selectedWebcamIndex].title || `Webcam ${selectedWebcamIndex + 1}`}
                                    width={800}
                                    height={600}
                                    className="w-full h-auto block"
                                    unoptimized
                                  />
                                </button>
                              </div>
                            )
                          }

                          // Renderizar iframe con la URL para otros tipos de contenido
                          return (
                            <iframe
                              src={url}
                              className="w-full rounded-lg border border-gray-200"
                              style={{ height: '400px' }}
                              allow="camera; microphone"
                              loading="lazy"
                              title={normalizedWebcams[selectedWebcamIndex].title || `Webcam ${selectedWebcamIndex + 1}`}
                            />
                          )
                        })()}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Equipment */}
              {route.equipment.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 text-lg font-semibold">Equipamiento Recomendado</h3>
                  <ul className="space-y-2">
                    {route.equipment.map((item, index) => (
                      <li key={index}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          className="flex items-center justify-between text-sm text-primary-600 hover:text-primary-700"
                        >
                          <span>{item.title}</span>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        {item.description && (
                          <p className="text-xs text-gray-600">{item.description}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-gray-500">
                    * Enlaces de afiliados. Esto no afecta el precio que pagas.
                  </p>
                </div>
              )}

              {/* Accommodations */}
              {route.accommodations.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 text-lg font-semibold">Alojamientos</h3>
                  <ul className="space-y-2">
                    {route.accommodations.map((item, index) => (
                      <li key={index}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          className="flex items-center justify-between text-sm text-primary-600 hover:text-primary-700"
                        >
                          <span>{item.title}</span>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-gray-500">
                    * Enlaces de afiliados. Esto no afecta el precio que pagas.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </article>

      {/* Rutas Recientes */}
      {recentRoutes.length > 0 && (
        <RecentRoutesCarousel routes={recentRoutes} type={route.type} />
      )}

      {/* Panel móvil de Google News (pestaña lateral) */}
      {route.twitterHashtag && route.twitterHashtag.trim() && (
        <GoogleNewsMobilePanel hashtag={route.twitterHashtag} />
      )}

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md rounded-lg bg-white p-6 shadow-xl"
          >
            <h3 className="mb-4 text-xl font-bold">¡Ruta Completada! 🎉</h3>
            <p className="mb-6 text-gray-600">
              ¿Quieres añadir una foto o notas sobre tu experiencia?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCompletionModal(false)}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200"
              >
                Más tarde
              </button>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="flex-1 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700"
              >
                Añadir foto
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Webcam Image Modal */}
      {showWebcamImageModal && normalizedWebcams[selectedWebcamIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowWebcamImageModal(false)}
        >
          <div
            className="relative max-h-full max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black"
              aria-label="Cerrar imagen ampliada"
              onClick={() => setShowWebcamImageModal(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <Image
              src={normalizedWebcams[selectedWebcamIndex].url}
              alt={normalizedWebcams[selectedWebcamIndex].title || `Webcam ${selectedWebcamIndex + 1}`}
              width={1920}
              height={1080}
              className="mx-auto max-h-[80vh] w-auto rounded-lg shadow-2xl"
              unoptimized
            />
          </div>
        </div>
      )}
    </>
  )
}

