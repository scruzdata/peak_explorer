import { NextRequest, NextResponse } from 'next/server'
import { parseStringPromise } from 'xml2js'

/**
 * Caché simple en memoria para evitar múltiples llamadas a la API de Google News
 * Se limpia después de 10 minutos
 */
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutos

export interface NewsArticle {
  id: string
  title: string
  description: string
  publishedAt: string
  url: string
  source?: string
}

interface GoogleNewsRSSItem {
  title: string[]
  description: string[]
  link: string[]
  pubDate: string[]
  source?: Array<{ _: string; url?: string }>
}

interface GoogleNewsRSS {
  rss: {
    channel: Array<{
      item: GoogleNewsRSSItem[]
    }>
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query') || searchParams.get('hashtag')

    if (!query) {
      return NextResponse.json(
        { error: 'El parámetro query o hashtag es requerido' },
        { status: 400 }
      )
    }

    const cleanQuery = query.replace(/^#/, '').trim()

    if (!cleanQuery) {
      return NextResponse.json(
        { error: 'La búsqueda no puede estar vacía' },
        { status: 400 }
      )
    }

    // Verificar caché
    const cacheKey = cleanQuery.toLowerCase()
    const cached = cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`[Google News API] Cache hit para query: ${cleanQuery}`)
      // Limpiar caché antiguo periódicamente
      if (Math.random() < 0.1) { // 10% de probabilidad
        for (const [key, value] of cache.entries()) {
          if (Date.now() - value.timestamp >= CACHE_DURATION) {
            cache.delete(key)
          }
        }
      }
      
      return NextResponse.json(cached.data)
    }

    console.log(`[Google News API] Llamada a Google News RSS para query: ${cleanQuery} (cache miss)`)

    // Construir URL del RSS feed de Google News
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(cleanQuery)}&hl=es&gl=ES&ceid=ES:es`
    
    const response = await fetch(rssUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: 'Error al obtener noticias de Google News',
          message: `Error ${response.status}: ${response.statusText}`
        },
        { status: response.status }
      )
    }

    const xmlText = await response.text()
    
    if (!xmlText || xmlText.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Respuesta vacía de Google News',
          message: 'Google News no devolvió datos.'
        },
        { status: 500 }
      )
    }

    let parsedData: GoogleNewsRSS
    try {
      parsedData = await parseStringPromise(xmlText)
    } catch (parseError) {
      console.error('Error parseando RSS de Google News:', parseError)
      return NextResponse.json(
        { 
          error: 'Error parseando respuesta de Google News',
          message: 'La respuesta no es un XML válido.'
        },
        { status: 500 }
      )
    }

    const items = parsedData.rss?.channel?.[0]?.item || []

    if (items.length === 0) {
      const responseData = {
        success: true,
        articles: [],
        count: 0
      }
      
      // Guardar en caché incluso si está vacío
      cache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now()
      })
      
      return NextResponse.json(responseData)
    }

    const formattedArticles: NewsArticle[] = items
      .map((item, index) => {
        const title = item.title?.[0] || 'Sin título'
        const description = item.description?.[0] || ''
        const link = item.link?.[0] || ''
        const pubDate = item.pubDate?.[0] || new Date().toISOString()
        const source = item.source?.[0]?._ || item.source?.[0]?.url || ''

        // Limpiar el título (Google News a veces incluye el nombre del sitio)
        const cleanTitle = title.replace(/\s*-\s*[^-]+$/, '').trim()

        return {
          id: `news-${index}-${Date.now()}`,
          title: cleanTitle,
          description: description.replace(/<[^>]*>/g, '').trim(), // Remover HTML
          publishedAt: pubDate,
          url: link,
          source: source
        }
      })
      .filter(article => article.title && article.url) // Filtrar artículos inválidos
      .sort((a, b) => {
        // Ordenar por fecha más reciente primero
        const dateA = new Date(a.publishedAt).getTime()
        const dateB = new Date(b.publishedAt).getTime()
        return dateB - dateA
      })
      .slice(0, 10) // Limitar a 10 noticias

    const responseData = {
      success: true,
      articles: formattedArticles,
      count: formattedArticles.length
    }

    // Guardar en caché
    cache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    })

    console.log(`[Google News API] Noticias obtenidas y guardadas en caché: ${formattedArticles.length} artículos para query: ${cleanQuery}`)

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error en API de Google News:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
