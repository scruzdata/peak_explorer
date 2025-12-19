'use client'

import { useEffect, useState, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import es from 'date-fns/locale/es'

interface TwitterTimelineProps {
  hashtag: string
}

/**
 * Interfaz para un tweet formateado
 */
interface FormattedTweet {
  id: string
  text: string
  createdAt: string
  author: {
    name: string
    username: string
    profileImageUrl?: string
  }
  metrics: {
    retweets: number
    likes: number
    replies: number
  }
  url: string
}

/**
 * Componente que muestra tweets de Twitter usando la API v2
 * Muestra hasta 10 tweets recientes ordenados por fecha
 */
export function TwitterTimeline({ hashtag }: TwitterTimelineProps) {
  console.log('[TwitterTimeline] Componente renderizado, hashtag prop:', hashtag)
  
  const [tweets, setTweets] = useState<FormattedTweet[]>([])
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
     * Obtiene los tweets desde la API
     */
    const fetchTweets = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const apiUrl = `/api/twitter?hashtag=${encodeURIComponent(cleanHashtag)}`
        console.log('[TwitterTimeline] Llamando a:', apiUrl)
        
        const response = await fetch(apiUrl)
        console.log('[TwitterTimeline] Respuesta recibida, status:', response.status, response.statusText)
        
        // Verificar si la respuesta tiene contenido antes de parsear
        const responseText = await response.text()
        console.log('[TwitterTimeline] Response text length:', responseText.length)
        
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
          // Si es rate limit (429), intentar usar caché del navegador o mostrar mensaje
          if (response.status === 429) {
            // Verificar si hay datos en localStorage como fallback
            const cachedKey = `twitter_cache_${cleanHashtag}`
            const cachedData = localStorage.getItem(cachedKey)
            if (cachedData) {
              try {
                const parsed = JSON.parse(cachedData)
                const cacheAge = Date.now() - parsed.timestamp
                if (cacheAge < 5 * 60 * 1000) { // 5 minutos
                  console.log('[TwitterTimeline] Usando caché local debido a rate limit')
                  setTweets(parsed.tweets)
                  setIsLoading(false)
                  fetchingRef.current = false
                  return
                }
              } catch (e) {
                // Ignorar error de parseo
              }
            }
          }
          throw new Error(data.message || data.error || 'Error al obtener tweets')
        }

        if (data.success && data.tweets) {
          console.log('[TwitterTimeline] Tweets obtenidos:', data.tweets.length)
          setTweets(data.tweets)
          // Guardar en localStorage como fallback
          try {
            const cachedKey = `twitter_cache_${cleanHashtag}`
            localStorage.setItem(cachedKey, JSON.stringify({
              tweets: data.tweets,
              timestamp: Date.now()
            }))
          } catch (e) {
            // Ignorar errores de localStorage
          }
        } else {
          setTweets([])
        }
      } catch (err) {
        console.error('[TwitterTimeline] Error obteniendo tweets:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar tweets')
        setTweets([])
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
        fetchTweets().catch(err => {
          console.error('[TwitterTimeline] Error no capturado en fetchTweets:', err)
          setIsLoading(false)
          setError('Error al cargar tweets')
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
   * Formatea el texto del tweet para mostrar enlaces y hashtags
   */
  const formatTweetText = (text: string) => {
    // Reemplazar URLs con enlaces
    let formatted = text.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#1DA1F2] hover:underline">$1</a>'
    )
    
    // Reemplazar hashtags con enlaces
    formatted = formatted.replace(
      /#(\w+)/g,
      '<a href="https://twitter.com/hashtag/$1" target="_blank" rel="noopener noreferrer" class="text-[#1DA1F2] hover:underline">#$1</a>'
    )
    
    // Reemplazar menciones con enlaces
    formatted = formatted.replace(
      /@(\w+)/g,
      '<a href="https://twitter.com/$1" target="_blank" rel="noopener noreferrer" class="text-[#1DA1F2] hover:underline">@$1</a>'
    )
    
    return formatted
  }

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
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Noticias de Twitter</h3>
        <a
          href={`https://twitter.com/hashtag/${encodeURIComponent(cleanHashtag)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#1DA1F2] hover:underline flex items-center gap-1"
        >
          Ver más
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-gray-500">Cargando tweets...</div>
        </div>
      )}

      {error && (
        <div className={`p-4 rounded-lg border mb-4 ${
          error.includes('rate limit') || error.includes('Demasiadas solicitudes')
            ? 'bg-orange-50 border-orange-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <p className={`text-sm ${
            error.includes('rate limit') || error.includes('Demasiadas solicitudes')
              ? 'text-orange-800'
              : 'text-yellow-800'
          }`}>
            {error}
          </p>
          {!error.includes('rate limit') && !error.includes('Demasiadas solicitudes') && (
            <p className="text-xs text-yellow-700 mt-2">
              Asegúrate de configurar TWITTER_BEARER_TOKEN en .env.local
            </p>
          )}
        </div>
      )}

      {!isLoading && !error && tweets.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No se encontraron tweets para #{cleanHashtag}
        </div>
      )}

      {!isLoading && !error && tweets.length > 0 && (
        <div className="space-y-4">
          {tweets.map((tweet) => (
            <a
              key={tweet.id}
              href={tweet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border border-gray-200 rounded-lg hover:border-[#1DA1F2] hover:shadow-md transition-all"
            >
              <div className="flex gap-3">
                {/* Avatar del usuario */}
                <div className="flex-shrink-0">
                  {tweet.author.profileImageUrl ? (
                    <img
                      src={tweet.author.profileImageUrl}
                      alt={tweet.author.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Contenido del tweet */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{tweet.author.name}</span>
                    <span className="text-gray-500 text-sm">@{tweet.author.username}</span>
                    <span className="text-gray-400 text-sm">·</span>
                    <span className="text-gray-500 text-sm">{formatRelativeTime(tweet.createdAt)}</span>
                  </div>

                  <p
                    className="text-gray-900 mb-3 whitespace-pre-wrap break-words"
                    dangerouslySetInnerHTML={{ __html: formatTweetText(tweet.text) }}
                  />

                  {/* Métricas del tweet */}
                  <div className="flex items-center gap-4 text-gray-500 text-sm">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {tweet.metrics.replies}
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {tweet.metrics.retweets}
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {tweet.metrics.likes}
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
