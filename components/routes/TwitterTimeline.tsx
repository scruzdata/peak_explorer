'use client'

import { useEffect, useRef, useState } from 'react'

interface TwitterTimelineProps {
  hashtag: string
}

/**
 * Componente que muestra un timeline de Twitter incrustado basado en un hashtag
 * Carga el script de Twitter Widgets y renderiza el timeline
 */
export function TwitterTimeline({ hashtag }: TwitterTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Limpiar el hashtag (remover # si está presente)
    const cleanHashtag = hashtag.replace(/^#/, '').trim()
    
    if (!cleanHashtag || !containerRef.current) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    /**
     * Carga el script de Twitter Widgets
     */
    const loadTwitterScript = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Si ya está cargado y disponible
        if (window.twttr && window.twttr.ready) {
          window.twttr.ready(() => {
            if (window.twttr && window.twttr.widgets) {
              resolve()
            } else {
              reject(new Error('Twitter widgets no disponible'))
            }
          })
          return
        }

        // Si el script ya existe en el DOM, esperar a que se cargue
        const existingScript = document.querySelector('script[src*="platform.twitter.com/widgets"]')
        if (existingScript) {
          // Esperar a que twttr esté disponible
          const checkInterval = setInterval(() => {
            if (window.twttr && window.twttr.ready) {
              clearInterval(checkInterval)
              window.twttr.ready(() => {
                if (window.twttr && window.twttr.widgets) {
                  resolve()
                } else {
                  reject(new Error('Twitter widgets no disponible'))
                }
              })
            }
          }, 100)
          
          // Timeout después de 10 segundos
          setTimeout(() => {
            clearInterval(checkInterval)
            reject(new Error('Timeout esperando Twitter widgets'))
          }, 10000)
          return
        }

        // Crear y añadir el script
        const script = document.createElement('script')
        script.src = 'https://platform.twitter.com/widgets.js'
        script.async = true
        script.charset = 'utf-8'
        script.id = 'twitter-wjs'
        
        script.onload = () => {
          if (window.twttr && window.twttr.ready) {
            window.twttr.ready(() => {
              if (window.twttr && window.twttr.widgets) {
                resolve()
              } else {
                reject(new Error('Twitter widgets no disponible después de cargar'))
              }
            })
          } else {
            reject(new Error('Twitter twttr no disponible después de cargar'))
          }
        }
        
        script.onerror = () => {
          reject(new Error('Error cargando script de Twitter'))
        }
        
        document.head.appendChild(script)
      })
    }

    /**
     * Muestra una vista alternativa con iframe directo de Twitter
     */
    const showAlternativeView = (hashtag: string) => {
      if (!containerRef.current) return
      
      // Intentar usar iframe directo de Twitter
      containerRef.current.innerHTML = `
        <div class="w-full">
          <iframe
            src="https://syndication.twitter.com/srv/timeline-search/source/${encodeURIComponent(hashtag)}?embedId=twitter-widget-0&frame=false&hideCard=false&hideThread=false&lang=es&theme=light&widgetsVersion=2615f7e52b7e0%3A1702314776716&width=550px"
            class="w-full border-0 rounded-lg"
            style="height: 600px; min-height: 600px;"
            scrolling="no"
            allowtransparency="true"
            allow="encrypted-media"
            title="Timeline de Twitter para #${hashtag}"
            loading="lazy"
          ></iframe>
          <div class="mt-4 text-center">
            <a 
              href="https://twitter.com/hashtag/${encodeURIComponent(hashtag)}" 
              target="_blank" 
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm underline"
            >
              Ver más tweets sobre #${hashtag} en Twitter
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </a>
          </div>
        </div>
      `
      setIsLoading(false)
      
      // Verificar si el iframe se cargó correctamente después de un tiempo
      setTimeout(() => {
        const iframe = containerRef.current?.querySelector('iframe')
        if (iframe) {
          iframe.onerror = () => {
            // Si el iframe falla, mostrar enlace directo
            showDirectLink(hashtag)
          }
        }
      }, 3000)
    }

    /**
     * Muestra solo un enlace directo a Twitter (último recurso)
     */
    const showDirectLink = (hashtag: string) => {
      if (!containerRef.current) return
      
      containerRef.current.innerHTML = `
        <div class="w-full p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
          <p class="text-sm text-gray-700 mb-4">
            No se pudo cargar el timeline embebido. 
            Puedes ver los tweets directamente en Twitter:
          </p>
          <a 
            href="https://twitter.com/hashtag/${encodeURIComponent(hashtag)}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-6 py-3 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a8cd8] transition-colors font-medium"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Ver tweets sobre #${hashtag}
          </a>
        </div>
      `
      setIsLoading(false)
    }

    /**
     * Verifica si el widget se cargó correctamente
     */
    const checkWidgetLoaded = (): boolean => {
      if (!containerRef.current) return false
      
      // Buscar iframe de Twitter (método más confiable)
      const iframe = containerRef.current.querySelector('iframe[src*="twitter"], iframe[src*="syndication"]')
      if (iframe && iframe.offsetHeight > 0) {
        console.log('Widget detectado: iframe encontrado')
        return true
      }
      
      // Buscar elementos de Twitter renderizados
      const twitterElements = containerRef.current.querySelectorAll('[id*="twitter"], [class*="twitter-widget"]')
      for (const elem of Array.from(twitterElements)) {
        if (elem.children.length > 0 || elem.innerHTML.trim().length > 100) {
          console.log('Widget detectado: elemento de Twitter encontrado')
          return true
        }
      }
      
      // Verificar si hay contenido renderizado (no solo el enlace)
      const link = containerRef.current.querySelector('a.twitter-timeline')
      if (link && link.parentElement !== containerRef.current) {
        console.log('Widget detectado: enlace procesado')
        return true
      }
      
      return false
    }

    /**
     * Crea el timeline de Twitter usando el hashtag
     */
    const createTimeline = async () => {
      try {
        await loadTwitterScript()
        
        // Limpiar el contenedor antes de crear el nuevo timeline
        if (!containerRef.current) {
          return
        }
        
        containerRef.current.innerHTML = ''

        /**
         * Método principal: usar el enlace embebido (método recomendado por Twitter para hashtags)
         */
        function loadTimeline() {
          if (!containerRef.current) return
          
          // Crear el elemento del timeline usando HTML string
          const timelineHTML = `
            <a
              class="twitter-timeline"
              data-theme="light"
              data-height="600"
              data-chrome="noheader nofooter noborders"
              href="https://twitter.com/hashtag/${encodeURIComponent(cleanHashtag)}?src=hash"
            >
              Tweets sobre #${cleanHashtag}
            </a>
          `
          
          containerRef.current.innerHTML = timelineHTML
          
          // Cargar widgets de Twitter
          if (window.twttr && window.twttr.widgets) {
            setTimeout(() => {
              if (window.twttr && window.twttr.widgets && containerRef.current) {
                // Cargar el widget
                window.twttr.widgets.load(containerRef.current).then(() => {
                  console.log('Twitter widgets.load() completado')
                  
                  // Verificar múltiples veces si el widget se cargó
                  let attempts = 0
                  const maxAttempts = 15
                  
                  const checkInterval = setInterval(() => {
                    attempts++
                    
                    if (checkWidgetLoaded()) {
                      console.log('Widget de Twitter cargado correctamente')
                      clearInterval(checkInterval)
                      setIsLoading(false)
                    } else if (attempts >= maxAttempts) {
                      console.warn('Widget de Twitter no se cargó después de múltiples intentos')
                      clearInterval(checkInterval)
                      showAlternativeView(cleanHashtag)
                    }
                  }, 500) // Verificar cada 500ms
                  
                }).catch((err: any) => {
                  console.error('Error al cargar widget:', err)
                  showAlternativeView(cleanHashtag)
                })
              } else {
                showAlternativeView(cleanHashtag)
              }
            }, 300)
          } else {
            showAlternativeView(cleanHashtag)
          }
        }
        
        // Ejecutar la carga del timeline
        loadTimeline()
      } catch (error) {
        console.error('Error cargando timeline de Twitter:', error)
        // Intentar método alternativo
        showAlternativeView(cleanHashtag)
      }
    }

    createTimeline()

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [hashtag])

  if (!hashtag || !hashtag.trim()) {
    return null
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold">Noticias de Twitter</h3>
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-gray-500">Cargando timeline de Twitter...</div>
        </div>
      )}
      {error && (
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}
      <div 
        ref={containerRef}
        className="w-full flex justify-center"
        style={{ minHeight: isLoading ? '600px' : 'auto' }}
      />
    </div>
  )
}

// Extender Window para incluir twttr
declare global {
  interface Window {
    twttr?: {
      ready: (callback: () => void) => void
      widgets: {
        createTimeline: (options: any, container: HTMLElement, config: any) => Promise<any>
        load: (container?: HTMLElement) => Promise<void>
      }
    }
  }
}

