import { NextRequest, NextResponse } from 'next/server'

/**
 * Caché simple en memoria para evitar múltiples llamadas a la API de Twitter
 * Se limpia después de 5 minutos
 */
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

interface TwitterTweet {
  id: string
  text: string
  created_at: string
  author_id?: string
  public_metrics?: {
    retweet_count: number
    like_count: number
    reply_count: number
    quote_count: number
  }
}

interface TwitterUser {
  id: string
  name: string
  username: string
  profile_image_url?: string
}

interface TwitterApiResponse {
  data?: TwitterTweet[]
  includes?: {
    users?: TwitterUser[]
  }
  meta?: {
    result_count: number
  }
  errors?: Array<{ message: string; code: number }>
}

export interface FormattedTweet {
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const hashtag = searchParams.get('hashtag')

    if (!hashtag) {
      return NextResponse.json(
        { error: 'El parámetro hashtag es requerido' },
        { status: 400 }
      )
    }

    const cleanHashtag = hashtag.replace(/^#/, '').trim()

    if (!cleanHashtag) {
      return NextResponse.json(
        { error: 'El hashtag no puede estar vacío' },
        { status: 400 }
      )
    }

    // Verificar caché
    const cacheKey = cleanHashtag.toLowerCase()
    const cached = cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`[Twitter API] Cache hit para hashtag: ${cleanHashtag}`)
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

    console.log(`[Twitter API] Llamada a Twitter API para hashtag: ${cleanHashtag} (cache miss)`)

    let bearerToken = process.env.TWITTER_BEARER_TOKEN

    if (!bearerToken) {
      return NextResponse.json(
        { 
          error: 'Configuración de API de Twitter no disponible',
          message: 'Por favor, configura TWITTER_BEARER_TOKEN en .env.local'
        },
        { status: 500 }
      )
    }

    try {
      bearerToken = decodeURIComponent(bearerToken)
    } catch {
      // Si falla la decodificación, usar el token original
    }

    const query = `#${cleanHashtag} -is:retweet lang:es`
    
    const params = new URLSearchParams({
      query: query,
      max_results: '10',
      'tweet.fields': 'created_at,author_id,public_metrics',
      'user.fields': 'name,username,profile_image_url',
      expansions: 'author_id',
      sort_order: 'recency'
    })

    const apiUrl = `https://api.twitter.com/2/tweets/search/recent?${params.toString()}`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
    })

    const responseText = await response.text()
    
    if (!responseText || responseText.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Respuesta vacía de Twitter API',
          message: 'La API de Twitter no devolvió datos. Verifica tu Bearer Token.'
        },
        { status: 500 }
      )
    }

    let data: TwitterApiResponse
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      return NextResponse.json(
        { 
          error: 'Error parseando respuesta de Twitter',
          message: 'La respuesta no es un JSON válido. Verifica tu Bearer Token.'
        },
        { status: 500 }
      )
    }

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { 
            error: 'Error de autenticación con Twitter API',
            message: 'El Bearer Token no es válido o ha expirado.'
          },
          { status: 401 }
        )
      }
      
      if (response.status === 429) {
        console.error(`[Twitter API] Rate limit alcanzado para hashtag: ${cleanHashtag}`)
        // Intentar devolver datos del caché si están disponibles
        const cached = cache.get(cacheKey)
        if (cached) {
          console.log(`[Twitter API] Devolviendo datos del caché debido a rate limit`)
          return NextResponse.json({
            ...cached.data,
            cached: true,
            warning: 'Mostrando datos en caché debido a límite de rate limit'
          })
        }
        
        return NextResponse.json(
          { 
            error: 'Límite de rate limit excedido',
            message: 'Demasiadas solicitudes a la API de Twitter. Los tweets se actualizarán automáticamente en unos minutos. Por favor, espera antes de recargar la página.'
          },
          { status: 429 }
        )
      }

      const errorMessage = (data as any).detail || (data as any).title || (data as any).message || `Error ${response.status}`
      
      return NextResponse.json(
        { 
          error: 'Error al obtener tweets de Twitter',
          message: errorMessage
        },
        { status: response.status }
      )
    }

    if (data.errors && data.errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Error en la respuesta de Twitter',
          message: data.errors.map(e => e.message).join(', ')
        },
        { status: 400 }
      )
    }

    if (!data.data || data.data.length === 0) {
      return NextResponse.json({
        success: true,
        tweets: [],
        count: 0
      })
    }

    const usersMap = new Map<string, TwitterUser>()
    if (data.includes?.users) {
      data.includes.users.forEach(user => {
        usersMap.set(user.id, user)
      })
    }

    const formattedTweets: FormattedTweet[] = data.data.map(tweet => {
      const author = usersMap.get(tweet.author_id || '') || {
        id: tweet.author_id || '',
        name: 'Usuario desconocido',
        username: 'unknown'
      }

      return {
        id: tweet.id,
        text: tweet.text,
        createdAt: tweet.created_at,
        author: {
          name: author.name,
          username: author.username,
          profileImageUrl: author.profile_image_url
        },
        metrics: {
          retweets: tweet.public_metrics?.retweet_count || 0,
          likes: tweet.public_metrics?.like_count || 0,
          replies: tweet.public_metrics?.reply_count || 0
        },
        url: `https://twitter.com/${author.username}/status/${tweet.id}`
      }
    })

    const responseData = {
      success: true,
      tweets: formattedTweets,
      count: formattedTweets.length
    }

    // Guardar en caché
    cache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    })

    console.log(`[Twitter API] Tweets obtenidos y guardados en caché: ${formattedTweets.length} tweets para hashtag: ${cleanHashtag}`)

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error en API de Twitter:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
