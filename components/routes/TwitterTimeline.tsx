'use client'

import { useEffect, useState, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import es from 'date-fns/locale/es'

interface TwitterTimelineProps {
  hashtag: string
}

/**
 * Interfaz para una noticia de Google News
 */
interface NewsArticle {
  id: string
  title: string
  description: string
  publishedAt: string
  url: string
  source?: string
}

/**
 * Componente que muestra noticias de Google News
 * Muestra hasta 10 noticias recientes ordenadas por fecha
 */
export function TwitterTimeline({ hashtag }: TwitterTimelineProps) {
  console.log('[GoogleNewsTimeline] Componente renderizado, hashtag prop:', hashtag)
  
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)
  const mountedRef = useRef(false)

  useEffect(() => {
    // Limpiar el hashtag (remover # si está presente)
    const cleanHashtag = hashtag?.replace(/^#/, '').trim() || ''
    
    if (!cleanHashtag) {
      setIsLoading(false)
      fetchingRef.current = false
      return
    }

    // Evitar múltiples llamadas simultáneas - usar un timeout para agrupar llamadas
    if (fetchingRef.current) {
      console.log('[TwitterTimeline] Ya hay una solicitud en curso, ignorando...')
      return
    }
    
    /**
     * Obtiene las noticias desde la API
     */
    const fetchNews = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const apiUrl = `/api/news?hashtag=${encodeURIComponent(cleanHashtag)}`
        console.log('[GoogleNewsTimeline] Llamando a:', apiUrl)
        
        const response = await fetch(apiUrl)
        console.log('[GoogleNewsTimeline] Respuesta recibida, status:', response.status, response.statusText)
        
        // Verificar si la respuesta tiene contenido antes de parsear
        const responseText = await response.text()
        console.log('[GoogleNewsTimeline] Response text length:', responseText.length)
        
        if (!responseText || responseText.trim() === '') {
          throw new Error('La respuesta del servidor está vacía')
        }

        let data
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error('Error parseando respuesta:', parseError)
          console.error('Respuesta recibida:', responseText.substring(0, 200))
          throw new Error('Error al procesar la respuesta del servidor')
        }

        if (!response.ok) {
          // Verificar si hay datos en localStorage como fallback
          const cachedKey = `news_cache_${cleanHashtag}`
          const cachedData = localStorage.getItem(cachedKey)
          if (cachedData) {
            try {
              const parsed = JSON.parse(cachedData)
              const cacheAge = Date.now() - parsed.timestamp
              if (cacheAge < 10 * 60 * 1000) { // 10 minutos
                console.log('[GoogleNewsTimeline] Usando caché local debido a error')
                setArticles(parsed.articles)
                setIsLoading(false)
                fetchingRef.current = false
                return
              }
            } catch (e) {
              // Ignorar error de parseo
            }
          }
          throw new Error(data.message || data.error || 'Error al obtener noticias')
        }

        if (data.success && data.articles) {
          console.log('[GoogleNewsTimeline] Noticias obtenidas:', data.articles.length)
          setArticles(data.articles)
          // Guardar en localStorage como fallback
          try {
            const cachedKey = `news_cache_${cleanHashtag}`
            localStorage.setItem(cachedKey, JSON.stringify({
              articles: data.articles,
              timestamp: Date.now()
            }))
          } catch (e) {
            // Ignorar errores de localStorage
          }
        } else {
          setArticles([])
        }
      } catch (err) {
        console.error('[GoogleNewsTimeline] Error obteniendo noticias:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar noticias')
        setArticles([])
      } finally {
        setIsLoading(false)
        fetchingRef.current = false
      }
    }

    // En desarrollo, React Strict Mode ejecuta efectos dos veces
    // Usar un pequeño delay para agrupar las llamadas y evitar múltiples solicitudes
    const timeoutId = setTimeout(() => {
      if (!mountedRef.current) {
        mountedRef.current = true
        fetchingRef.current = true
        fetchNews().catch(err => {
          console.error('[GoogleNewsTimeline] Error no capturado en fetchNews:', err)
          setIsLoading(false)
          setError('Error al cargar noticias')
          fetchingRef.current = false
        })
      }
    }, 100) // Pequeño delay para agrupar llamadas de React Strict Mode

    // Limpiar el flag si el componente se desmonta
    return () => {
      clearTimeout(timeoutId)
      fetchingRef.current = false
      mountedRef.current = false
    }
  }, [hashtag])

  /**
   * Formatea la fecha relativa (hace X minutos/horas/días)
   */
  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true, locale: es })
    } catch {
      return dateString
    }
  }

  if (!hashtag || !hashtag.trim()) {
    return null
  }

  const cleanHashtag = hashtag.replace(/^#/, '').trim()

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold flex items-center gap-2">
          {/* Logo de Google News */}
          <span className="flex items-center gap-0.5 font-normal">
            <span className="text-[#4285F4]">G</span>
            <span className="text-[#EA4335]">o</span>
            <span className="text-[#FBBC05]">o</span>
            <span className="text-[#4285F4]">g</span>
            <span className="text-[#34A853]">l</span>
            <span className="text-[#EA4335]">e</span>
            <span className="text-gray-700 ml-1">News</span>
          </span>
        </h3>
        <a
          href={`https://news.google.com/search?q=${encodeURIComponent(cleanHashtag)}&hl=es&gl=ES&ceid=ES:es`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#4285F4] hover:underline flex items-center gap-1"
        >
          Ver más
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <div className="text-xs text-gray-500">Cargando noticias...</div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg border mb-3 bg-yellow-50 border-yellow-200">
          <p className="text-xs text-yellow-800">
            {error}
          </p>
        </div>
      )}

      {!isLoading && !error && articles.length === 0 && (
        <div className="text-center py-6 text-gray-500 text-xs">
          No se encontraron noticias para #{cleanHashtag}
        </div>
      )}

      {!isLoading && !error && articles.length > 0 && (
        <div 
          className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 #f1f5f9'
          }}
        >
          <div className="space-y-3">
            {articles.map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 border border-gray-200 rounded-lg hover:border-[#4285F4] hover:shadow-md transition-all"
              >
                <div className="flex gap-3">
                  {/* Contenido de la noticia */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1.5">
                      {/* Icono de Google News pequeño */}
                      <svg className="w-4 h-4 text-[#4285F4] flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 4v10h16V8H4zm2 2h12v2H6v-2zm0 4h8v2H6v-2z"/>
                      </svg>
                      <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 flex-1">
                        {article.title}
                      </h4>
                    </div>

                    {article.description && (
                      <p className="text-gray-600 mb-2 text-xs leading-relaxed line-clamp-2">
                        {article.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-gray-500 text-[10px]">
                      {article.source && (
                        <>
                          <span className="truncate">{article.source}</span>
                          <span className="text-gray-400">·</span>
                        </>
                      )}
                      <span>{formatRelativeTime(article.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
