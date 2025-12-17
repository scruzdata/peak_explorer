'use client'

import { useState, useEffect } from 'react'
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
import { 
  Clock, 
  MapPin, 
  TrendingUp, 
  Bookmark, 
  BookmarkCheck, 
  Download, 
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  Info
} from 'lucide-react'
import confetti from 'canvas-confetti'

interface RouteDetailProps {
  route: Route
}

export function RouteDetail({ route }: RouteDetailProps) {
  const { isBookmarked, addBookmark, removeBookmark, completeRoute, isCompleted, unlockBadge, progress } = useUserProgress()
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [hoveredTrackIndex, setHoveredTrackIndex] = useState<number | null>(null)
  const [showDogsInfo, setShowDogsInfo] = useState(false)
  const [showApproachInfo, setShowApproachInfo] = useState(false)
  const [showReturnInfo, setShowReturnInfo] = useState(false)
  const [showBestSeasonInfo, setShowBestSeasonInfo] = useState(false)
  const [showOrientationInfo, setShowOrientationInfo] = useState(false)
  const [showFoodInfo, setShowFoodInfo] = useState(false)
  const [selectedWebcamIndex, setSelectedWebcamIndex] = useState(0)
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

  const handleDownloadGPX = () => {
    // Verificar que existe el GPX antes de descargar
    if (!route.gpx?.url) {
      console.warn('No hay archivo GPX disponible para esta ruta')
      return
    }
    
    // Simular descarga
    const link = document.createElement('a')
    link.href = route.gpx.url
    link.download = route.gpx.filename || 'ruta.gpx'
    link.click()
    
    // Badge por primer GPX descargado
    if (progress && progress.stats.gpxDownloads === 0) {
      unlockBadge({
        id: 'first-gpx',
        name: 'Primer GPX Descargado',
        description: 'Has descargado tu primer track GPS',
        icon: '📥',
        unlockedAt: new Date().toISOString(),
        category: 'first',
      })
      confetti({ particleCount: 100, spread: 70 })
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

        {/* Action Buttons */}
        <div className="sticky top-16 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-4">
              {route.gpx?.url && (
                <button
                  onClick={handleDownloadGPX}
                  className="flex items-center space-x-2 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700 transition-colors"
                >
                  <Download className="h-5 w-5" />
                  <span>Descargar GPX</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-12">
              {/* Stats */}
              <section className="space-y-3">
                {/* Primera fila */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="mb-0.5 text-xs text-gray-600">Distancia</div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatDistance(route.distance)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="mb-0.5 text-xs text-gray-600">Desnivel</div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatElevation(route.elevation)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="mb-0.5 text-xs text-gray-600">Duración</div>
                    <div className="text-lg font-bold text-gray-900">
                      {route.duration}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="mb-0.5 text-xs text-gray-600">Estado</div>
                    <div className="text-lg font-bold text-gray-900">
                      {route.status}
                    </div>
                  </div>
                </div>
                {/* Segunda fila */}
                {(route.routeType || route.dogs) && (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {route.routeType && (
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="mb-0.5 text-xs text-gray-600">Tipo de ruta</div>
                        <div className="text-lg font-bold text-gray-900">
                          {route.routeType}
                        </div>
                      </div>
                    )}
                    {route.dogs && (
                      <div className="rounded-lg bg-gray-50 p-3 relative">
                        <div className="mb-0.5 text-xs text-gray-600 flex items-center gap-1">
                          Perros
                          {route.dogs === 'Atados' && (
                            <div 
                              className="relative inline-block"
                              onMouseEnter={() => setShowDogsInfo(true)}
                              onMouseLeave={() => setShowDogsInfo(false)}
                            >
                              <button
                                onClick={() => setShowDogsInfo(!showDogsInfo)}
                                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none flex items-center"
                                aria-label="Información sobre perros atados"
                              >
                                <Info className="h-4 w-4" />
                              </button>
                              {showDogsInfo && (
                                <div className="absolute left-0 top-5 z-50 w-64 rounded-lg bg-gray-900 text-white p-3 text-xs shadow-xl">
                                  <p className="mb-1 font-semibold">Información importante:</p>
                                  <p>Hay animales sueltos en la ruta. Por favor, mantén a tu perro atado para evitar molestias o conflictos con el ganado.</p>
                                  <div className="absolute -top-1 left-4 w-2 h-2 rotate-45 bg-gray-900"></div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {route.dogs}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Map */}
              <section>
                <h2 className="mb-4 text-2xl font-bold">Mapa y Track GPX</h2>
                <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
                  <RouteMap route={route} hoveredTrackIndex={hoveredTrackIndex} />
                </div>
              </section>

              {/* Elevation Profile */}
              <section className="mt-6">
                <RouteElevationProfile 
                  route={route} 
                  onHoverTrackIndex={setHoveredTrackIndex}
                />
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

            {/* Sidebar */}
            <aside className="space-y-6">
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
                            onClick={() => setShowApproachInfo(!showApproachInfo)}
                            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none flex items-center"
                            aria-label="Información adicional sobre aproximación"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                          {showApproachInfo && (
                            <div className="absolute left-0 top-5 z-50 w-64 rounded-lg bg-gray-900 text-white p-3 text-xs shadow-xl">
                              <p>{route.approachInfo}</p>
                              <div className="absolute -top-1 left-4 w-2 h-2 rotate-45 bg-gray-900"></div>
                            </div>
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
                            onClick={() => setShowReturnInfo(!showReturnInfo)}
                            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none flex items-center"
                            aria-label="Información adicional sobre retorno"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                          {showReturnInfo && (
                            <div className="absolute left-0 top-5 z-50 w-64 rounded-lg bg-gray-900 text-white p-3 text-xs shadow-xl">
                              <p>{route.returnInfo}</p>
                              <div className="absolute -top-1 left-4 w-2 h-2 rotate-45 bg-gray-900"></div>
                            </div>
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
                            onClick={() => setShowBestSeasonInfo(!showBestSeasonInfo)}
                            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none flex items-center"
                            aria-label="Información adicional sobre mejor época"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                          {showBestSeasonInfo && (
                            <div className="absolute left-0 top-5 z-50 w-64 rounded-lg bg-gray-900 text-white p-3 text-xs shadow-xl">
                              <p>{route.bestSeasonInfo}</p>
                              <div className="absolute -top-1 left-4 w-2 h-2 rotate-45 bg-gray-900"></div>
                            </div>
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
                            onClick={() => setShowOrientationInfo(!showOrientationInfo)}
                            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none flex items-center"
                            aria-label="Información adicional sobre orientación"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                          {showOrientationInfo && (
                            <div className="absolute left-0 top-5 z-50 w-64 rounded-lg bg-gray-900 text-white p-3 text-xs shadow-xl">
                              <p>{route.orientationInfo}</p>
                              <div className="absolute -top-1 left-4 w-2 h-2 rotate-45 bg-gray-900"></div>
                            </div>
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
                              onClick={() => setShowFoodInfo(!showFoodInfo)}
                              className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none flex items-center"
                              aria-label="Información adicional sobre comida"
                            >
                              <Info className="h-4 w-4" />
                            </button>
                            {showFoodInfo && (
                              <div className="absolute left-0 top-5 z-50 w-64 rounded-lg bg-gray-900 text-white p-3 text-xs shadow-xl">
                                <p>{route.foodInfo}</p>
                                <div className="absolute -top-1 left-4 w-2 h-2 rotate-45 bg-gray-900"></div>
                              </div>
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
                  
                  {/* Iframe de la webcam seleccionada */}
                  <div className="w-full">
                    {normalizedWebcams[selectedWebcamIndex] && (
                      <>
                        <h4 className="mb-2 text-sm font-medium text-gray-700">
                          {normalizedWebcams[selectedWebcamIndex].title || `Webcam ${selectedWebcamIndex + 1}`}
                        </h4>
                        <iframe
                          src={normalizedWebcams[selectedWebcamIndex].url}
                          className="w-full rounded-lg border border-gray-200"
                          style={{ height: '400px' }}
                          allow="camera; microphone"
                          loading="lazy"
                          title={normalizedWebcams[selectedWebcamIndex].title || `Webcam ${selectedWebcamIndex + 1}`}
                        />
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Twitter Timeline */}
              {route.twitterHashtag && route.twitterHashtag.trim() && (
                <TwitterTimeline hashtag={route.twitterHashtag} />
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
    </>
  )
}

