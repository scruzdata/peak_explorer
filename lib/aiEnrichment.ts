import { Route } from '@/types'

/**
 * Interfaz para los metadatos enriquecidos por IA
 */
export interface EnrichedMetadata {
  type?: 'trekking' | 'ferrata'
  summary?: string
  difficulty?: 'Fácil' | 'Moderada' | 'Difícil' | 'Muy Difícil' | 'Extrema'
  duration?: string
  location?: {
    region: string
    province: string
  }
  approach?: string
  approachInfo?: string
  return?: string
  returnInfo?: string
  food?: string
  foodInfo?: string
  orientation?: string
  orientationInfo?: string
  bestSeason?: ('Primavera' | 'Verano' | 'Otoño' | 'Invierno' | 'Todo el año')[]
  bestSeasonInfo?: string
  routeType?: 'Circular' | 'Inicio-Fin'
  dogs?: 'Sí' | 'No' | 'Sueltos' | 'Atados'
  safetyTips?: string[]
  storytelling?: string
  heroImage?: {
    url: string
    alt: string
    width?: number
    height?: number
  }
  gallery?: Array<{
    url: string
    alt: string
    width?: number
    height?: number
  }>
  seo?: {
    metaTitle?: string
    metaDescription?: string
    keywords?: string[]
  }
}

/**
 * Configuración de la API de IA
 */
interface AIConfig {
  provider: 'openai' | 'anthropic' | 'gemini' | 'custom'
  apiKey?: string
  model?: string
  baseURL?: string
}

/**
 * Obtiene la configuración de la API de IA desde variables de entorno
 */
function getAIConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER || 'openai') as 'openai' | 'anthropic' | 'gemini' | 'custom'
  let apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY
  let model = process.env.AI_MODEL
  
  // Modelos por defecto según el proveedor
  if (!model) {
    switch (provider) {
      case 'openai':
        model = 'gpt-4o-mini'
        break
      case 'anthropic':
        model = 'claude-3-haiku-20240307'
        break
      case 'gemini':
        model = 'gemini-pro'
        break
      default:
        model = 'gpt-4o-mini'
    }
  }
  
  const baseURL = process.env.AI_BASE_URL

  return {
    provider,
    apiKey,
    model,
    baseURL,
  }
}

/**
 * Llama a la API de OpenAI para obtener metadatos enriquecidos
 */
async function callOpenAI(routeTitle: string, config: AIConfig): Promise<EnrichedMetadata> {
  if (!config.apiKey) {
    throw new Error('AI_API_KEY o OPENAI_API_KEY no está configurada en las variables de entorno')
  }

  const baseURL = config.baseURL || 'https://api.openai.com/v1'
  const model = config.model || 'gpt-4o-mini'

  const systemPrompt = `Eres un experto en rutas de senderismo y vías ferratas en España. Tu tarea es buscar información real sobre rutas en internet y proporcionar metadatos estructurados en formato JSON.

Debes buscar información sobre la ruta en sitios como Wikiloc, AllTrails, o fuentes oficiales de turismo. Proporciona información precisa y real basada en datos disponibles en internet.

Responde SOLO con un objeto JSON válido, sin texto adicional, con la siguiente estructura:
{
  "type": "trekking" | "ferrata",
  "summary": "descripción breve de la ruta",
  "difficulty": "Fácil" | "Moderada" | "Difícil" | "Muy Difícil" | "Extrema",
  "duration": "duración estimada (ej: '4-5 horas')",
  "location": {
    "region": "nombre de la comunidad autónoma",
    "province": "nombre de la provincia"
  },
  "approach": "información sobre cómo llegar al inicio",
  "approachInfo": "información adicional sobre la aproximación",
  "return": "información sobre el retorno",
  "returnInfo": "información adicional sobre el retorno",
  "food": "información sobre comida/restaurantes",
  "foodInfo": "información adicional sobre comida",
  "orientation": "información sobre señalización/orientación",
  "orientationInfo": "información adicional sobre orientación",
  "bestSeason": ["Primavera", "Verano", "Otoño", "Invierno"] (array con las mejores épocas),
  "bestSeasonInfo": "información sobre las mejores épocas",
  "routeType": "Circular" | "Inicio-Fin",
  "dogs": "Sí" | "No" | "Sueltos" | "Atados",
  "safetyTips": ["consejo 1", "consejo 2"] (array de strings),
  "storytelling": "texto narrativo en markdown sobre la ruta",
  "heroImage": {
    "url": "URL directa de imagen de Google Place Photos (ejemplo: https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photo_reference=PHOTO_REFERENCE&key=API_KEY). Obtén el photo_reference usando Google Places API.",
    "alt": "descripción de la imagen",
    "width": 1600,
    "height": 1200
  },
  "gallery": [
    {
      "url": "URL directa de Google Place Photos o Google Maps Static",
      "alt": "descripción imagen 1",
      "width": 800,
      "height": 600
    },
    {
      "url": "URL directa de Google Place Photos o Google Maps Static",
      "alt": "descripción imagen 2",
      "width": 800,
      "height": 600
    }
  ] (array con 5-6 imágenes de la ruta),
  "seo": {
    "metaTitle": "título SEO",
    "metaDescription": "descripción SEO",
    "keywords": ["palabra1", "palabra2"] (array de strings)
  }
}`

  const userPrompt = `Busca información real en internet sobre la ruta de senderismo o vía ferrata llamada: "${routeTitle}".

Necesito información sobre:
- Tipo de actividad (trekking o ferrata)
- Dificultad real
- Duración estimada
- Ubicación (región y provincia en España)
- Información logística (parking, cómo llegar, retorno)
- Información sobre comida/restaurantes cercanos
- Señalización y orientación
- Mejores épocas para hacerla
- Consejos de seguridad
- Una descripción narrativa atractiva
- URLs de imágenes: una imagen principal (heroImage) y 5-6 imágenes adicionales (gallery) de la ruta. 
  CRÍTICO: Usa SOLO URLs directas de Google Place Photos obtenidas mediante Google Places API.
  PROCEDIMIENTO OBLIGATORIO:
  1. Busca el lugar con Google Places API (Text Search, Find Place, o Nearby Search)
  2. Identifica resultados con campo "photos"
  3. Extrae "photo_reference" del primer elemento del arreglo "photos"
  4. Construye URL con formato exacto: https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photo_reference=PHOTO_REFERENCE&key=API_KEY
  Formato Google Place Photos: https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photo_reference=PHOTO_REFERENCE&key=API_KEY
  NO inventes URLs ni photo_reference. Solo usa photo_reference reales obtenidos de Google Places API.
  Las URLs deben ser accesibles directamente y mostrar imágenes reales del lugar.

Responde SOLO con el objeto JSON, sin explicaciones adicionales.`

  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `Error en API de OpenAI: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No se recibió contenido de la API de OpenAI')
    }

    // Parsear el JSON de la respuesta
    const parsed = JSON.parse(content) as EnrichedMetadata
    return parsed
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Error parseando respuesta JSON de OpenAI: ${error.message}`)
    }
    throw error
  }
}

/**
 * Llama a la API de Anthropic (Claude) para obtener metadatos enriquecidos
 */
async function callAnthropic(routeTitle: string, config: AIConfig): Promise<EnrichedMetadata> {
  if (!config.apiKey) {
    throw new Error('AI_API_KEY no está configurada en las variables de entorno')
  }

  const baseURL = config.baseURL || 'https://api.anthropic.com/v1'
  const model = config.model || 'claude-3-haiku-20240307'

  const systemPrompt = `Eres un experto en rutas de senderismo y vías ferratas en España. Busca información real sobre rutas en internet y proporciona metadatos estructurados en formato JSON.

Debes buscar información sobre la ruta en sitios como Wikiloc, AllTrails, o fuentes oficiales de turismo. Proporciona información precisa y real basada en datos disponibles en internet.

Responde SOLO con un objeto JSON válido, sin texto adicional.`

  const userPrompt = `Busca información real en internet sobre la ruta llamada: "${routeTitle}".

Proporciona un objeto JSON con: type, summary, difficulty, duration, location (region, province), approach, approachInfo, return, returnInfo, food, foodInfo, orientation, orientationInfo, bestSeason (array), bestSeasonInfo, routeType, dogs, safetyTips (array), storytelling (markdown), heroImage (url, alt, width, height), gallery (array con 5-6 imágenes con url, alt, width, height), seo (metaTitle, metaDescription, keywords array).

IMPORTANTE SOBRE IMÁGENES: 
- Usa SOLO URLs directas y accesibles de Google Place Photos obtenidas mediante Google Places API.
- PROCEDIMIENTO OBLIGATORIO:
  1. Busca el lugar con Google Places API (Text Search, Find Place, o Nearby Search)
  2. Identifica resultados con campo "photos"
  3. Extrae "photo_reference" del primer elemento del arreglo "photos"
  4. Construye URL con formato exacto: https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photo_reference=PHOTO_REFERENCE&key=API_KEY
- Formato Google Place Photos: https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photo_reference=PHOTO_REFERENCE&key=API_KEY
- NO inventes URLs ni photo_reference. Solo usa photo_reference reales obtenidos de Google Places API.
- heroImage debe ser una imagen característica principal (1600x1200), y gallery debe tener 5-6 imágenes adicionales (1600x1200).

Responde SOLO con el JSON, sin explicaciones.`

  try {
    const response = await fetch(`${baseURL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `Error en API de Anthropic: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      )
    }

    const data = await response.json()
    const content = data.content?.[0]?.text

    if (!content) {
      throw new Error('No se recibió contenido de la API de Anthropic')
    }

    // Extraer JSON del contenido (puede venir con texto adicional)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No se encontró JSON válido en la respuesta')
    }

    const parsed = JSON.parse(jsonMatch[0]) as EnrichedMetadata
    return parsed
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Error parseando respuesta JSON de Anthropic: ${error.message}`)
    }
    throw error
  }
}

/**
 * Llama a la API de Google Gemini para obtener metadatos enriquecidos
 */
async function callGemini(routeTitle: string, config: AIConfig): Promise<EnrichedMetadata> {
  if (!config.apiKey) {
    throw new Error('GEMINI_API_KEY o AI_API_KEY no está configurada en las variables de entorno')
  }

  // Usar gemini-pro como modelo por defecto (más compatible)
  // gemini-1.5-flash y gemini-1.5-pro pueden requerir acceso especial o estar en v1
  const model = config.model || 'gemini-pro'
  const apiKey = config.apiKey

  const prompt = `You are an expert in hiking routes and via ferratas in Spain. Your task is to search for real information about routes on the internet and provide structured metadata in JSON format.

You must search for information about the route on sites like Wikiloc, AllTrails, or official tourism sources. Provide accurate and real information based on data available on the internet.

Search for real information on the internet about the hiking route or via ferrata named: "${routeTitle}".

I need information about:
- Activity type (trekking or ferrata)
- Real difficulty
- Estimated duration
- Location (region and province in Spain)
- Logistics information (parking, how to get there, return)
- Information about food/restaurants nearby
- Signage and orientation
- Best seasons to do it
- Safety tips
- An attractive narrative description
- Image URLs: one main image (heroImage) and 5-6 additional images (gallery) of the route.
  CRITICAL: Use ONLY direct URLs from Google Place Photos obtained via Google Places API.
  MANDATORY PROCEDURE:
  1. Search for the place using Google Places API (Text Search, Find Place, or Nearby Search)
  2. Identify results with "photos" field
  3. Extract "photo_reference" from the first element of the "photos" array
  4. Build URL with exact format: https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photo_reference=PHOTO_REFERENCE&key=API_KEY
  Google Place Photos format: https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photo_reference=PHOTO_REFERENCE&key=API_KEY
  DO NOT invent URLs or photo_reference. Only use real photo_reference obtained from Google Places API.
  URLs must be directly accessible and show real images of the place.

Respond ONLY with a valid JSON object, without additional text, with the following structure. IMPORTANT: All text content in the response must be in Spanish (Español), including all descriptions, summaries, and narrative content:
{
  "type": "trekking" | "ferrata",
  "summary": "short description of the route",
  "difficulty": "Fácil" | "Moderada" | "Difícil" | "Muy Difícil" | "Extrema",
  "duration": "estimate duration of the route (ej: '4-5 hours')",
  "location": {
    "region": "name of the autonomous community",
    "province": "name of the province"
  },
  "approach": "information about how to get to the start",
  "approachInfo": "additional information about the approach",
  "return": "information about the return",
  "returnInfo": "additional information about the return",
  "food": "information about food/restaurants",
  "foodInfo": "additional information about food",
  "orientation": "information about signage/orientation",
  "orientationInfo": "additional information about orientation",
  "bestSeason": ["Spring", "Summer", "Autumn", "Winter"],
  "bestSeasonInfo": "information about the best seasons",
  "routeType": "Circular" | "Inicio-Fin",
  "dogs": "Sí" | "No" | "Sueltos" | "Atados",
  "safetyTips": ["safety tip 1", "safety tip 2"],
  "storytelling": "narrative description of the route in markdown",
  "heroImage": {
    "url": "direct URL from Google Place Photos (example: https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photo_reference=PHOTO_REFERENCE&key=API_KEY). Obtain photo_reference using Google Places API.",
    "alt": "description of the image",
    "width": 1600,
    "height": 1200
  },
  "gallery": [
    {
      "url": "direct URL from Google Place Photos (obtain photo_reference using Google Places API)",
      "alt": "description of the image 1",
      "width": 1600,
      "height": 1200
    },
    {
      "url": "direct URL from Google Place Photos (obtain photo_reference using Google Places API)",
      "alt": "description of the image 2",
      "width": 1600,
      "height": 1200
    }
  ],
  "seo": {
    "metaTitle": "SEO title",
    "metaDescription": "SEO description",
    "keywords": ["keyword 1", "keyword 2"]
  }
}

IMPORTANT ABOUT IMAGES: 
- Use ONLY direct and accessible URLs from Google Place Photos obtained via Google Places API of the specific route named: "${routeTitle}".
- MANDATORY PROCEDURE:
  1. Search for the place using Google Places API (Text Search, Find Place, or Nearby Search)
  2. Identify results with "photos" field
  3. Extract "photo_reference" from the first element of the "photos" array
  4. Build URL with exact format: https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photo_reference=PHOTO_REFERENCE&key=API_KEY
- Google Place Photos format: https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photo_reference=PHOTO_REFERENCE&key=API_KEY
- DO NOT invent URLs or photo_reference. Only use real photo_reference obtained from Google Places API.
- heroImage must be a main characteristic image (1600x1200), and gallery must have 5-6 additional images (1600x1200) showing different aspects of the route.

IMPORTANT ABOUT JSON:
- Make sure all quotes inside strings are properly escaped (use \" for quotes inside strings).
- JSON must be valid and parseable. Do not include additional text outside the JSON object.
- If a field contains quotes, escape them with \".
- Arrays must be properly formatted: use commas between elements, no trailing commas before closing bracket.
- Example of correct array: ["item1", "item2", "item3"]
- Example of incorrect array: ["item1", "item2", "item3",] (no trailing comma)
- Make sure all arrays are properly closed with ] and all objects are properly closed with }.

CRITICAL: All text content in your response (summary, descriptions, storytelling, etc.) must be written in Spanish (Español). Only respond with the valid JSON object, without additional explanations, without markdown, without code blocks. Ensure the JSON is complete and valid before sending.`

  try {
    // Intentar primero con v1beta, si falla probar con v1
    let baseURL = config.baseURL || 'https://generativelanguage.googleapis.com/v1beta'
    let url = `${baseURL}/models/${model}:generateContent?key=${apiKey}`
    
    // Si el modelo contiene "1.5", usar v1 en lugar de v1beta
    if (model.includes('1.5') && !config.baseURL) {
      baseURL = 'https://generativelanguage.googleapis.com/v1'
      url = `${baseURL}/models/${model}:generateContent?key=${apiKey}`
    }

    let content: string | undefined

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3, // Reducir temperatura para respuestas más consistentes y JSON más válido
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192, // Aumentar límite para respuestas más largas
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData?.error?.message || JSON.stringify(errorData)
      
      // Si el modelo no está disponible en v1beta, intentar con v1
      if (response.status === 404 && model.includes('1.5') && baseURL.includes('v1beta')) {
        console.log(`⚠️  Modelo ${model} no disponible en v1beta, intentando con v1...`)
        baseURL = 'https://generativelanguage.googleapis.com/v1'
        url = `${baseURL}/models/${model}:generateContent?key=${apiKey}`
        
        const retryResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.3, // Reducir temperatura para respuestas más consistentes y JSON más válido
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4000,
              responseMimeType: 'application/json',
            },
          }),
        })
        
        if (!retryResponse.ok) {
          const retryErrorData = await retryResponse.json().catch(() => ({}))
          throw new Error(
            `Error en API de Gemini: ${retryResponse.status} ${retryResponse.statusText}. ${JSON.stringify(retryErrorData)}`
          )
        }
        
        // Continuar con la respuesta del retry
        const retryData = await retryResponse.json()
        
        // Log de depuración
        console.log('📥 Respuesta de retry de Gemini:', JSON.stringify(retryData, null, 2).substring(0, 500))
        
        // Verificar candidatos
        if (!retryData.candidates || retryData.candidates.length === 0) {
          console.error('❌ No hay candidatos en la respuesta de retry')
          throw new Error('No se recibieron candidatos de la API de Gemini en el retry.')
        }
        
        const retryCandidate = retryData.candidates[0]
        
        // Verificar bloqueos de seguridad
        if (retryCandidate.finishReason === 'SAFETY' || retryCandidate.finishReason === 'RECITATION') {
          console.error('❌ Respuesta bloqueada por seguridad en retry:', retryCandidate.finishReason)
          throw new Error(`La respuesta fue bloqueada por filtros de seguridad (${retryCandidate.finishReason}).`)
        }
        
        content = retryCandidate.content?.parts?.[0]?.text || retryCandidate.text || retryCandidate.output
        
        // Si no hay contenido, intentar obtener de todos los parts
        if (!content && retryCandidate.content?.parts) {
          for (const part of retryCandidate.content.parts) {
            if (part.text) {
              content = part.text
              break
            }
          }
        }
        
        // Manejar MAX_TOKENS en retry
        if (!content && retryCandidate.finishReason === 'MAX_TOKENS') {
          const partialContent = retryCandidate.content?.parts?.find((p: any) => p.text)?.text
          if (partialContent) {
            console.warn('⚠️  Respuesta truncada por MAX_TOKENS en retry, usando contenido parcial')
            content = partialContent
          }
        }
        
        if (!content) {
          console.error('❌ No se encontró contenido en el retry')
          console.error('Estructura del candidato:', JSON.stringify(retryCandidate, null, 2))
          throw new Error('No se recibió contenido de la API de Gemini en el retry.')
        }
      } else {
        throw new Error(
          `Error en API de Gemini: ${response.status} ${response.statusText}. ${errorMessage}`
        )
      }
    } else {
      // Respuesta exitosa, obtener contenido
      const data = await response.json()
      
      // Log de depuración para ver la estructura de la respuesta
      console.log('📥 Respuesta de Gemini recibida:', JSON.stringify(data, null, 2).substring(0, 500))
      
      // Verificar si hay candidatos
      if (!data.candidates || data.candidates.length === 0) {
        console.error('❌ No hay candidatos en la respuesta de Gemini')
        console.error('Respuesta completa:', JSON.stringify(data, null, 2))
        throw new Error('No se recibieron candidatos de la API de Gemini. La respuesta puede haber sido bloqueada por filtros de seguridad.')
      }
      
      const candidate = data.candidates[0]
      
      // Verificar si el candidato fue bloqueado por seguridad
      if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION') {
        console.error('❌ Respuesta bloqueada por seguridad:', candidate.finishReason)
        if (candidate.safetyRatings) {
          console.error('Razones de seguridad:', candidate.safetyRatings)
        }
        throw new Error(`La respuesta fue bloqueada por filtros de seguridad (${candidate.finishReason}). Intenta con un prompt diferente.`)
      }
      
      // Obtener el contenido
      content = candidate.content?.parts?.[0]?.text
      
      // Si no hay texto, intentar obtener de otras formas
      if (!content) {
        // Intentar obtener de la estructura alternativa
        content = candidate.text || candidate.output || candidate.content?.text
        
        // Verificar si hay contenido en parts pero sin text
        if (!content && candidate.content?.parts) {
          // Intentar obtener de todos los parts
          for (const part of candidate.content.parts) {
            if (part.text) {
              content = part.text
              break
            }
          }
        }
        
        // Si aún no hay contenido, verificar si hay finishReason
        if (!content && candidate.finishReason) {
          console.warn(`⚠️  Finish reason: ${candidate.finishReason}`)
          if (candidate.finishReason === 'MAX_TOKENS') {
            // Intentar obtener contenido parcial si existe
            const partialContent = candidate.content?.parts?.find((p: any) => p.text)?.text
            if (partialContent) {
              console.warn('⚠️  Respuesta truncada por MAX_TOKENS, usando contenido parcial')
              content = partialContent
            } else {
              // Si no hay contenido y es MAX_TOKENS, el modelo usó todos los tokens en "thoughts"
              // Intentar hacer una nueva llamada con un prompt más corto o aumentar tokens
              console.error('❌ MAX_TOKENS sin contenido. El modelo usó tokens en "thoughts" internos.')
              console.error('Metadata de uso:', data.usageMetadata)
              throw new Error('La respuesta excedió el límite de tokens. El modelo Gemini 2.5 está usando demasiados tokens para "pensar" internamente. Intenta con un modelo diferente (gemini-pro) o simplifica el prompt.')
            }
          } else if (candidate.finishReason === 'STOP') {
            // STOP es normal, pero debería haber contenido
            console.warn('Finish reason STOP sin contenido')
          }
        }
      }

      if (!content) {
        console.error('❌ No se encontró contenido en la respuesta')
        console.error('Estructura del candidato:', JSON.stringify(candidate, null, 2))
        throw new Error('No se recibió contenido de la API de Gemini. Verifica la estructura de la respuesta.')
      }
    }

    // Parsear el JSON de la respuesta
    // Gemini puede devolver el JSON directamente o con markdown code blocks
    let jsonContent = content.trim()
    
    // Si viene envuelto en markdown code blocks, extraerlo
    const jsonMatch = jsonContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || jsonContent.match(/(\{[\s\S]*\})/)
    if (jsonMatch) {
      jsonContent = jsonMatch[1] || jsonMatch[0]
    }

    // Función helper para intentar reparar JSON mal formateado
    const tryRepairJson = (jsonStr: string): string | null => {
      try {
        // Intentar parsear directamente
        JSON.parse(jsonStr)
        return jsonStr
      } catch (firstError) {
        // Intentar reparaciones comunes
        
        // 1. Eliminar trailing commas en arrays y objetos
        let repaired = jsonStr
          .replace(/,(\s*[}\]])/g, '$1') // Eliminar comas antes de ] o }
          .replace(/,(\s*,)/g, ',') // Eliminar comas duplicadas
        
        // 2. Reparar casos donde falta coma después de un valor
        // Patrón común: "key": "value" "key2" -> "key": "value", "key2"
        repaired = repaired.replace(/"\s+"([^"]+)":/g, '", "$1":') // "value" "key": -> "value", "key":
        repaired = repaired.replace(/"\s*}/g, '"}') // "value" } -> "value"}
        repaired = repaired.replace(/"\s*]/g, '"]') // "value" ] -> "value"]
        
        // Reparar números, booleanos y null seguidos de llave sin coma
        repaired = repaired.replace(/(\d+)\s+"([^"]+)":/g, '$1, "$2":') // 123 "key": -> 123, "key":
        repaired = repaired.replace(/(\btrue\b|\bfalse\b|\bnull\b)\s+"([^"]+)":/g, '$1, "$2":')
        repaired = repaired.replace(/(\d+|\btrue\b|\bfalse\b|\bnull\b)\s*}/g, '$1}') // 123 } -> 123}
        repaired = repaired.replace(/(\d+|\btrue\b|\bfalse\b|\bnull\b)\s*]/g, '$1]') // 123 ] -> 123]
        
        // Reparar objetos/arrays seguidos de llave sin coma
        repaired = repaired.replace(/}\s+"([^"]+)":/g, '}, "$1":') // } "key": -> }, "key":
        repaired = repaired.replace(/]\s+"([^"]+)":/g, '], "$1":') // ] "key": -> ], "key":
        
        // Reparación específica para el error "Expected ',' or '}' after property value"
        // Buscar patrones donde un valor termina pero no hay coma ni llave de cierre
        
        // Reparar casos donde un string termina y sigue otro string sin coma
        repaired = repaired.replace(/"([^"]*)"\s+"([^"]+)":/g, '"$1", "$2":')
        
        // Reparar casos donde un número/booleano termina y sigue un string sin coma
        repaired = repaired.replace(/(\d+|\btrue\b|\bfalse\b|\bnull\b)\s+"([^"]+)":/g, '$1, "$2":')
        
        // Reparar casos donde un objeto termina y sigue otro objeto/string sin coma
        repaired = repaired.replace(/}\s+"([^"]+)":/g, '}, "$1":')
        repaired = repaired.replace(/}\s+}/g, '},}')
        
        // Reparar casos donde un array termina y sigue otro array/string sin coma
        repaired = repaired.replace(/]\s+"([^"]+)":/g, '], "$1":')
        repaired = repaired.replace(/]\s+]/g, '],]')
        
        // Reparar casos donde un valor (string, número, booleano, null) termina y sigue } sin coma
        // Pero solo si no hay coma antes
        repaired = repaired.replace(/([^,\s])\s*}/g, (match, p1) => {
          // Si p1 no es } ni ] ni , ni : ni { ni [, añadir coma
          if (!/[,\[\]{}:]/.test(p1)) {
            return p1 + ',}'
          }
          return match
        })
        
        // Reparar casos donde un valor termina y sigue ] sin coma
        repaired = repaired.replace(/([^,\s])\s*]/g, (match, p1) => {
          // Si p1 no es } ni ] ni , ni : ni { ni [, añadir coma
          if (!/[,\[\]{}:]/.test(p1)) {
            return p1 + ',]'
          }
          return match
        })
        
        // Reparar casos específicos: "key": "value" seguido de "key2" sin coma
        repaired = repaired.replace(/":\s*"([^"]+)"\s+"([^"]+)":/g, '": "$1", "$2":')
        
        // Reparar casos donde un objeto anidado termina y sigue una propiedad sin coma
        repaired = repaired.replace(/}\s+"([^"]+)":/g, '}, "$1":')
        
        // Reparar casos donde un array anidado termina y sigue una propiedad sin coma
        repaired = repaired.replace(/]\s+"([^"]+)":/g, '], "$1":')
        
        // 3. Intentar encontrar y cerrar arrays/objetos abiertos
        let depth = 0
        let arrayDepth = 0
        let inString = false
        let escapeNext = false
        let lastValidPos = 0
        
        for (let i = 0; i < repaired.length; i++) {
          const char = repaired[i]
          
          if (escapeNext) {
            escapeNext = false
            continue
          }
          
          if (char === '\\') {
            escapeNext = true
            continue
          }
          
          if (char === '"' && !escapeNext) {
            inString = !inString
            continue
          }
          
          if (!inString) {
            if (char === '{') {
              depth++
            } else if (char === '}') {
              depth--
              if (depth === 0 && arrayDepth === 0) {
                lastValidPos = i + 1
              }
            } else if (char === '[') {
              arrayDepth++
            } else if (char === ']') {
              arrayDepth--
              if (depth === 0 && arrayDepth === 0) {
                lastValidPos = i + 1
              }
            }
          }
        }
        
        // Si encontramos una posición válida, truncar ahí
        if (lastValidPos > 0 && lastValidPos < repaired.length) {
          repaired = repaired.substring(0, lastValidPos)
        }
        
        // 4. Cerrar estructuras abiertas
        if (depth > 0) {
          repaired += '}'.repeat(depth)
        }
        if (arrayDepth > 0) {
          repaired += ']'.repeat(arrayDepth)
        }
        
        // 5. Intentar parsear el JSON reparado
        try {
          JSON.parse(repaired)
          return repaired
        } catch {
          // 7. Último intento: buscar el objeto JSON más grande válido
          const jsonMatch = repaired.match(/(\{[\s\S]*\})/)
          if (jsonMatch) {
            const extracted = jsonMatch[1]
            try {
              // Intentar cerrar el objeto si está abierto
              let testJson = extracted
              let openBraces = (testJson.match(/\{/g) || []).length
              let closeBraces = (testJson.match(/\}/g) || []).length
              let openBrackets = (testJson.match(/\[/g) || []).length
              let closeBrackets = (testJson.match(/\]/g) || []).length
              
              if (openBrackets > closeBrackets) {
                testJson += ']'.repeat(openBrackets - closeBrackets)
              }
              if (openBraces > closeBraces) {
                testJson += '}'.repeat(openBraces - closeBraces)
              }
              
              JSON.parse(testJson)
              return testJson
            } catch {
              // No se pudo reparar
            }
          }
        }
      }
      
      return null
    }

    // Intentar parsear el JSON con manejo mejorado de errores
    try {
      const parsed = JSON.parse(jsonContent) as EnrichedMetadata
      return parsed
    } catch (parseError) {
      // Si falla el parsing, intentar reparar el JSON
      console.warn('⚠️  Error parseando JSON de Gemini, intentando reparar...')
      const errorMessage = parseError instanceof Error ? parseError.message : 'Error desconocido'
      console.warn(`Error: ${errorMessage}`)
      
      // Mostrar más contexto alrededor del error si es posible
      if (parseError instanceof SyntaxError) {
        const errorPos = (parseError as any).position
        if (errorPos !== undefined && errorPos < jsonContent.length) {
          const start = Math.max(0, errorPos - 300)
          const end = Math.min(jsonContent.length, errorPos + 300)
          const context = jsonContent.substring(start, end)
          console.warn(`Contexto del error (posición ${errorPos}):`, context)
          
          // Intentar reparación específica en la posición del error
          if (errorPos > 0 && errorPos < jsonContent.length) {
            const beforeError = jsonContent.substring(Math.max(0, errorPos - 50), errorPos)
            const afterError = jsonContent.substring(errorPos, Math.min(jsonContent.length, errorPos + 50))
            
            // Si después del error hay una comilla o llave, probablemente falta una coma antes
            if (afterError.trim().startsWith('"') || afterError.trim().startsWith('}')) {
              // Intentar insertar una coma antes del error
              const repairedAtPos = jsonContent.substring(0, errorPos) + ',' + jsonContent.substring(errorPos)
              try {
                JSON.parse(repairedAtPos)
                console.log('✅ JSON reparado insertando coma en posición del error')
                jsonContent = repairedAtPos
              } catch {
                // No se pudo reparar con este método
              }
            }
          }
        }
      }
      
      console.warn('Contenido recibido (primeros 1000 caracteres):', jsonContent.substring(0, 1000))
      
      const repairedJson = tryRepairJson(jsonContent)
      
      if (repairedJson) {
        try {
          const parsed = JSON.parse(repairedJson) as EnrichedMetadata
          console.log('✅ JSON reparado exitosamente')
          return parsed
        } catch (secondError) {
          console.warn('⚠️  JSON reparado aún no es válido:', secondError instanceof Error ? secondError.message : 'Error desconocido')
          // Intentar una reparación más agresiva
          const moreRepaired = tryRepairJson(repairedJson)
          if (moreRepaired) {
            try {
              const parsed = JSON.parse(moreRepaired) as EnrichedMetadata
              console.log('✅ JSON reparado en segundo intento')
              return parsed
            } catch {
              // No se pudo reparar
            }
          }
        }
      }
      
      // Si todo falla, lanzar error con más información
      const errorPos = parseError instanceof SyntaxError ? (parseError as any).position : undefined
      const errorInfo = errorPos !== undefined 
        ? `Posición del error: ${errorPos}. Contexto: ${jsonContent.substring(Math.max(0, errorPos - 100), Math.min(jsonContent.length, errorPos + 100))}`
        : `Contenido recibido (primeros 1000 caracteres): ${jsonContent.substring(0, 1000)}...`
      
      throw new Error(
        `Error parseando respuesta JSON de Gemini: ${errorMessage}. ${errorInfo}`
      )
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Error parseando respuesta JSON de Gemini: ${error.message}`)
    }
    throw error
  }
}

/**
 * Función fallback que usa datos simulados cuando la IA no está disponible
 */
/**
 * Obtiene la API key de Google Maps desde las variables de entorno
 */
function getGoogleMapsApiKey(): string | undefined {
  return process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
}

/**
 * Obtiene información de imagen de un lugar usando Google Places API
 * Sigue el procedimiento paso a paso para extraer photo_reference y construir URL
 */
async function getPlaceImageInfo(
  query: string,
  coordinates?: { lat: number; lng: number }
): Promise<{ lugar: string; photo_reference: string; url_imagen: string } | null> {
  const apiKey = getGoogleMapsApiKey()
  if (!apiKey) {
    return null
  }

  try {
    // Paso 1: Realizar búsqueda de lugar con Google Places API (Text Search)
    let searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&language=es`
    
    // Si hay coordenadas, añadir locationbias para mejorar resultados
    if (coordinates) {
      searchUrl += `&location=${coordinates.lat},${coordinates.lng}&radius=50000`
    }

    const searchResponse = await fetch(searchUrl)
    if (!searchResponse.ok) {
      console.warn('⚠️  Error buscando lugares en Places API')
      return null
    }

    const searchData = await searchResponse.json()
    
    // Verificar que la respuesta sea exitosa
    if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
      console.warn(`⚠️  Places API retornó status: ${searchData.status}`)
      return null
    }

    if (!searchData.results || searchData.results.length === 0) {
      return null
    }

    // Paso 2: Identificar resultados que contengan el campo "photos"
    for (const place of searchData.results) {
      // Verificar que el lugar tenga el campo "photos"
      if (place.photos && Array.isArray(place.photos) && place.photos.length > 0) {
        // Paso 3: Extraer el valor "photo_reference" del primer elemento del arreglo "photos"
        const firstPhoto = place.photos[0]
        if (firstPhoto && firstPhoto.photo_reference) {
          const photoReference = firstPhoto.photo_reference
          
          // Paso 4: Construir la URL final usando el formato exacto especificado
          const urlImagen = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photo_reference=${photoReference}&key=${apiKey}`
          
          // Paso 5: Devolver nombre del lugar, photo_reference y url_final_de_la_imagen
          return {
            lugar: place.name || query,
            photo_reference: photoReference,
            url_imagen: urlImagen
          }
        }
      }
    }

    // Si ningún lugar tiene fotos, retornar null
    return null
  } catch (error) {
    console.warn('⚠️  Error obteniendo información de imagen de Places API:', error)
    return null
  }
}

/**
 * Busca lugares cercanos usando Places API y obtiene fotos
 * Usa getPlaceImageInfo para seguir el procedimiento paso a paso correcto
 */
async function getPlacePhotos(
  query: string,
  coordinates?: { lat: number; lng: number },
  maxPhotos: number = 6
): Promise<Array<{ url: string; alt: string; width: number; height: number }>> {
  const apiKey = getGoogleMapsApiKey()
  if (!apiKey) {
    return []
  }

  try {
    // Buscar lugares usando Text Search API
    let searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&language=es`
    
    // Si hay coordenadas, añadir locationbias para mejorar resultados
    if (coordinates) {
      searchUrl += `&location=${coordinates.lat},${coordinates.lng}&radius=50000`
    }

    const searchResponse = await fetch(searchUrl)
    if (!searchResponse.ok) {
      console.warn('⚠️  Error buscando lugares en Places API')
      return []
    }

    const searchData = await searchResponse.json()
    if (searchData.status !== 'OK' || !searchData.results || searchData.results.length === 0) {
      return []
    }

    const photos: Array<{ url: string; alt: string; width: number; height: number }> = []
    
    // Recorrer resultados y obtener fotos siguiendo el procedimiento paso a paso
    for (const place of searchData.results.slice(0, 3)) { // Máximo 3 lugares
      // Paso 2: Identificar resultados que contengan el campo "photos"
      if (place.photos && Array.isArray(place.photos) && place.photos.length > 0) {
        // Paso 3: Extraer photo_reference del primer elemento (y siguientes si es necesario)
        for (const photo of place.photos.slice(0, 2)) { // Máximo 2 fotos por lugar
          if (photos.length >= maxPhotos) break
          
          // Verificar que tenga photo_reference válido
          if (photo && photo.photo_reference) {
            // Paso 4: Construir URL usando el formato exacto: maxwidth=1600
            const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photo_reference=${photo.photo_reference}&key=${apiKey}`
            
            photos.push({
              url: photoUrl,
              alt: photo.html_attributions?.[0] || place.name || query,
              width: 1600,
              height: 1200,
            })
          }
        }
      }
      if (photos.length >= maxPhotos) break
    }

    return photos
  } catch (error) {
    console.warn('⚠️  Error obteniendo fotos de Places API:', error)
    return []
  }
}

/**
 * Valida y corrige URLs de imágenes para asegurar que sean accesibles
 * Solo acepta URLs de Google Place Photos o Google Maps Static
 * Si la URL no es válida, genera una URL válida de Google Maps
 */
async function validateAndFixImageUrl(
  url: string | undefined,
  alt: string,
  width: number = 1600,
  height: number = 1200,
  keywords: string[] = ['mountain', 'hiking', 'trail'],
  coordinates?: { lat: number; lng: number },
  routeTitle?: string
): Promise<{ url: string; alt: string; width: number; height: number }> {
  // Si no hay URL, generar una válida de Google Maps
  if (!url) {
    const query = routeTitle || keywords.join(' ')
    return await generateValidGoogleMapsUrl(alt, width, height, coordinates, query)
  }
  
  // Verificar que sea una URL válida
  try {
    const urlObj = new URL(url)
    
    // URLs válidas solo de Google Maps/Place Photos
    const isValidGoogle = 
      urlObj.hostname.includes('googleapis.com') || 
      urlObj.hostname.includes('google.com') ||
      urlObj.hostname.includes('maps.googleapis.com')
    
    if (isValidGoogle) {
      // Asegurar que tenga los parámetros correctos para Google Maps/Place Photos
      const apiKey = getGoogleMapsApiKey()
      if (apiKey) {
        urlObj.searchParams.set('key', apiKey)
      }
      
      if (urlObj.pathname.includes('/place/photo')) {
        // Place Photos API - verificar que tenga photo_reference válido
        const photoRef = urlObj.searchParams.get('photo_reference')
        if (!photoRef || photoRef.trim() === '' || photoRef === 'PHOTO_REFERENCE' || photoRef === 'PHOTO_REF_AQUI') {
          // Si no hay photo_reference válido, intentar obtener uno real usando el procedimiento paso a paso
          console.warn('⚠️  URL de Place Photos sin photo_reference válido, intentando obtener uno real')
          const query = routeTitle || keywords.join(' ')
          const imageInfo = await getPlaceImageInfo(query, coordinates)
          if (imageInfo && imageInfo.url_imagen) {
            return {
              url: imageInfo.url_imagen,
              alt: imageInfo.lugar || alt,
              width: 1600,
              height: 1200,
            }
          }
          // Si no se puede obtener, usar Google Maps Static en su lugar
          return await generateValidGoogleMapsUrl(alt, width, height, coordinates, query)
        }
        // Asegurar que use maxwidth=1600 según el formato especificado
        urlObj.searchParams.set('maxwidth', '1600')
        // Asegurar que tenga la API key
        if (!urlObj.searchParams.has('key')) {
          const apiKey = getGoogleMapsApiKey()
          if (apiKey) {
            urlObj.searchParams.set('key', apiKey)
          } else {
            console.warn('⚠️  No hay API key de Google Maps, usando Google Maps Static')
            const query = routeTitle || keywords.join(' ')
            return await generateValidGoogleMapsUrl(alt, width, height, coordinates, query)
          }
        }
      } else if (urlObj.pathname.includes('/staticmap')) {
        // Static Maps API
        urlObj.searchParams.set('size', `${width}x${height}`)
        if (!urlObj.searchParams.has('maptype')) {
          urlObj.searchParams.set('maptype', 'satellite')
        }
        // Asegurar que tenga la API key
        if (!urlObj.searchParams.has('key')) {
          const apiKey = getGoogleMapsApiKey()
          if (apiKey) {
            urlObj.searchParams.set('key', apiKey)
          } else {
            console.warn('⚠️  No hay API key de Google Maps para Static Map')
          }
        }
      }
      return { url: urlObj.toString(), alt, width, height }
    }
    
    // Si no es Google, rechazar y generar una URL válida de Google Maps
    console.warn(`⚠️  URL de imagen no válida (${urlObj.hostname}), rechazando y usando fallback de Google Maps`)
    const query = routeTitle || keywords.join(' ')
    return await generateValidGoogleMapsUrl(alt, width, height, coordinates, query)
  } catch (error) {
    // Si la URL no es válida, generar una de Google Maps
    console.warn(`⚠️  URL de imagen inválida (${url}), usando fallback de Google Maps`)
    const query = routeTitle || keywords.join(' ')
    return await generateValidGoogleMapsUrl(alt, width, height, coordinates, query)
  }
}

/**
 * Genera una URL válida de Google Maps usando coordenadas o ubicación por defecto
 * Intenta usar Place Photos siguiendo el procedimiento paso a paso, sino usa Static Maps
 */
async function generateValidGoogleMapsUrl(
  alt: string,
  width: number,
  height: number,
  coordinates?: { lat: number; lng: number },
  query?: string
): Promise<{ url: string; alt: string; width: number; height: number }> {
  const apiKey = getGoogleMapsApiKey()
  
  // Si hay query, intentar obtener Place Photos usando el procedimiento paso a paso
  if (query && apiKey) {
    const imageInfo = await getPlaceImageInfo(query, coordinates)
    if (imageInfo && imageInfo.url_imagen) {
      return {
        url: imageInfo.url_imagen,
        alt: imageInfo.lugar || alt,
        width: 1600,
        height: 1200,
      }
    }
  }
  
  // Fallback: usar Google Maps Static
  const lat = coordinates?.lat || 40.4168 // Madrid por defecto
  const lng = coordinates?.lng || -3.7038
  let staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=12&size=${width}x${height}&maptype=satellite&markers=color:red|${lat},${lng}`
  if (apiKey) {
    staticMapUrl += `&key=${apiKey}`
  }
  
  return {
    url: staticMapUrl,
    alt,
    width,
    height,
  }
}

/**
 * Valida y corrige todas las imágenes en los metadatos enriquecidos
 */
async function validateAndFixImages(
  metadata: EnrichedMetadata,
  routeTitle: string,
  coordinates?: { lat: number; lng: number }
): Promise<EnrichedMetadata> {
  const keywords = [
    routeTitle.toLowerCase(),
    'hiking',
    'mountain',
    'trail',
    'spain',
    metadata.location?.region?.toLowerCase() || '',
  ].filter(Boolean)
  
  // Validar heroImage
  if (metadata.heroImage) {
    metadata.heroImage = await validateAndFixImageUrl(
      metadata.heroImage.url,
      metadata.heroImage.alt || `Imagen de ${routeTitle}`,
      metadata.heroImage.width || 1600,
      metadata.heroImage.height || 1200,
      keywords,
      coordinates,
      routeTitle
    )
  }
  
  // Validar gallery
  if (metadata.gallery && Array.isArray(metadata.gallery)) {
    const galleryPromises = metadata.gallery.map(async (img, index) => {
      if (!img || !img.url) {
        // Generar imagen de fallback si falta
        return await validateAndFixImageUrl(
          undefined,
          img?.alt || `Imagen ${index + 1} de ${routeTitle}`,
          img?.width || 1600,
          img?.height || 1200,
          keywords,
          coordinates,
          routeTitle
        )
      }
      return await validateAndFixImageUrl(
        img.url,
        img.alt || `Imagen ${index + 1} de ${routeTitle}`,
        img.width || 1600,
        img.height || 1200,
        keywords,
        coordinates,
        routeTitle
      )
    })
    metadata.gallery = await Promise.all(galleryPromises)
  }
  
  return metadata
}

async function getFallbackMetadata(
  routeTitle: string,
  coordinates?: { lat: number; lng: number }
): Promise<EnrichedMetadata> {
  // Simular delay
  const titleLower = routeTitle.toLowerCase()
  
  // Detectar tipo de ruta
  let type: 'trekking' | 'ferrata' = 'trekking'
  if (titleLower.includes('ferrata') || titleLower.includes('vía ferrata') || titleLower.includes('via ferrata')) {
    type = 'ferrata'
  }

  // Detectar región basándose en palabras clave comunes
  let region = 'España'
  let province = ''
  
  if (titleLower.includes('asturias') || titleLower.includes('picos de europa') || titleLower.includes('covadonga') || titleLower.includes('cares')) {
    region = 'Asturias'
    province = 'Asturias'
  } else if (titleLower.includes('cataluña') || titleLower.includes('montserrat') || titleLower.includes('costa brava')) {
    region = 'Cataluña'
    province = titleLower.includes('barcelona') ? 'Barcelona' : titleLower.includes('girona') ? 'Girona' : 'Barcelona'
  } else if (titleLower.includes('aragón') || titleLower.includes('huesca') || titleLower.includes('ordesa') || titleLower.includes('riglos') || titleLower.includes('pirineo')) {
    region = 'Aragón'
    province = 'Huesca'
  } else if (titleLower.includes('andalucía') || titleLower.includes('málaga') || titleLower.includes('granada') || titleLower.includes('cádiz') || titleLower.includes('caminito del rey') || titleLower.includes('mulhacén')) {
    region = 'Andalucía'
    if (titleLower.includes('málaga') || titleLower.includes('caminito')) {
      province = 'Málaga'
    } else if (titleLower.includes('granada') || titleLower.includes('mulhacén')) {
      province = 'Granada'
    } else if (titleLower.includes('cádiz')) {
      province = 'Cádiz'
    } else {
      province = 'Málaga'
    }
  } else if (titleLower.includes('madrid') || titleLower.includes('pedriza')) {
    region = 'Madrid'
    province = 'Madrid'
  } else if (titleLower.includes('castilla') || titleLower.includes('ávila') || titleLower.includes('gredos')) {
    region = 'Castilla y León'
    province = 'Ávila'
  }

  // Detectar dificultad basándose en palabras clave
  let difficulty: 'Fácil' | 'Moderada' | 'Difícil' | 'Muy Difícil' | 'Extrema' = 'Moderada'
  if (titleLower.includes('fácil') || titleLower.includes('facil') || titleLower.includes('iniciación')) {
    difficulty = 'Fácil'
  } else if (titleLower.includes('difícil') || titleLower.includes('dificil') || titleLower.includes('técnica') || titleLower.includes('tecnica') || titleLower.includes('k4') || titleLower.includes('k5')) {
    difficulty = type === 'ferrata' ? 'Difícil' : 'Difícil'
  } else if (titleLower.includes('muy difícil') || titleLower.includes('muy dificil') || titleLower.includes('k5') || titleLower.includes('k6')) {
    difficulty = 'Muy Difícil'
  } else if (titleLower.includes('extrema') || titleLower.includes('k6')) {
    difficulty = 'Extrema'
  }

  // Generar resumen basado en el título
  const summary = type === 'ferrata' 
    ? `Vía ferrata ${difficulty.toLowerCase()} con vistas panorámicas. ${titleLower.includes('técnica') || titleLower.includes('tecnica') ? 'Ruta técnica que requiere experiencia previa.' : 'Ideal para iniciarse en vías ferratas.'}`
    : `Ruta de ${difficulty.toLowerCase()} por ${region}. ${titleLower.includes('circular') ? 'Ruta circular que regresa al punto de inicio.' : 'Ruta lineal con inicio y fin en puntos diferentes.'}`

  return {
    type,
    summary,
    difficulty,
    duration: '4-5 horas',
    location: {
      region,
      province: province || region,
    },
    approach: region === 'Asturias' 
      ? 'Parking en el punto de inicio (gratuito en temporada baja)'
      : region === 'Cataluña'
      ? 'Parking en el punto de acceso principal'
      : 'Parking disponible en el punto de inicio',
    approachInfo: 'El parking puede llenarse en temporada alta. Se recomienda llegar temprano o considerar usar transporte público.',
    return: titleLower.includes('circular') ? 'Circular' : 'Mismo punto',
    returnInfo: titleLower.includes('circular')
      ? 'Ruta circular que regresa al punto de inicio.'
      : 'Transporte disponible desde el punto final. Consultar horarios y disponibilidad.',
    food: 'Restaurantes disponibles en los pueblos cercanos',
    foodInfo: 'Lleva siempre agua y algo de comida para el camino. En temporada alta, los restaurantes pueden estar muy concurridos.',
    orientation: type === 'ferrata'
      ? 'Bien equipada, seguir las marcas y anclajes'
      : 'Bien señalizada con marcas de sendero',
    orientationInfo: type === 'ferrata'
      ? 'La vía está equipada con cable de vida y anclajes. Seguir siempre el cable y nunca desengancharse completamente.'
      : 'El sendero está bien marcado. En caso de niebla, extremar precaución y usar GPS.',
    bestSeason: type === 'ferrata' 
      ? ['Primavera', 'Verano', 'Otoño']
      : region === 'Asturias' || region === 'Aragón'
      ? ['Primavera', 'Verano', 'Otoño']
      : ['Primavera', 'Verano', 'Otoño', 'Invierno'],
    bestSeasonInfo: type === 'ferrata'
      ? 'En invierno puede haber hielo y condiciones peligrosas. Evitar días de lluvia.'
      : region === 'Asturias' || region === 'Aragón'
      ? 'En invierno puede haber nieve y hielo, haciendo la ruta peligrosa. En verano es muy transitada, especialmente los fines de semana.'
      : 'En verano puede hacer mucho calor. Primavera y otoño ofrecen el mejor equilibrio entre buen tiempo y menor afluencia.',
    routeType: titleLower.includes('circular') ? 'Circular' : 'Inicio-Fin',
    dogs: 'Atados',
    safetyTips: type === 'ferrata'
      ? [
          'Equipo de vía ferrata obligatorio',
          'Nunca desengancharse completamente',
          'Respetar el orden en la vía',
          'Revisar el estado de los anclajes',
        ]
      : [
          'Llevar suficiente agua (mínimo 2L por persona)',
          'Protección solar obligatoria y/o gorra',
          'No salirse de los senderos marcados',
          'En caso de lluvia, el sendero puede ser resbaladizo',
        ],
    storytelling: `# ${routeTitle}

${summary}

Esta ruta ofrece una experiencia única en ${region}, combinando naturaleza y aventura. ${type === 'ferrata' ? 'La vía ferrata te permitirá escalar de forma segura mientras disfrutas de vistas espectaculares.' : 'El sendero te llevará por paisajes impresionantes y te permitirá conectar con la naturaleza.'}

A lo largo del camino, cada paso revela nuevas perspectivas del entorno. Esta ruta no es solo un sendero, es una experiencia que conecta con la naturaleza en su estado más puro.`,
    heroImage: await generateValidGoogleMapsUrl(
      `Vista de ${routeTitle}`,
      1600,
      1200,
      coordinates,
      routeTitle
    ),
    gallery: [
      await generateValidGoogleMapsUrl(
        `Paisaje de ${region}`,
        1600,
        1200,
        coordinates,
        `${routeTitle} ${region}`
      ),
      await generateValidGoogleMapsUrl(
        `Sendero en ${region}`,
        1600,
        1200,
        coordinates,
        `sendero ${region}`
      ),
      await generateValidGoogleMapsUrl(
        `Vista panorámica de ${region}`,
        1600,
        1200,
        coordinates,
        `vista ${region}`
      ),
      await generateValidGoogleMapsUrl(
        `Naturaleza en ${region}`,
        1600,
        1200,
        coordinates,
        `naturaleza ${region}`
      ),
      await generateValidGoogleMapsUrl(
        `Montaña en ${region}`,
        1600,
        1200,
        coordinates,
        `montaña ${region}`
      ),
    ],
    seo: {
      metaTitle: `${routeTitle} | Peak Explorer`,
      metaDescription: `${summary} Ruta de ${difficulty.toLowerCase()} en ${region}.`,
      keywords: [
        routeTitle.toLowerCase(),
        region.toLowerCase(),
        province.toLowerCase(),
        type,
        difficulty.toLowerCase(),
      ].filter(Boolean),
    },
  }
}

/**
 * Llama a un servicio de IA para enriquecer los metadatos de una ruta con datos de internet
 * Soporta OpenAI y Anthropic, con fallback a datos simulados si no hay API configurada
 */
export async function getRouteMetadataFromAI(
  routeTitle: string,
  coordinates?: { lat: number; lng: number }
): Promise<EnrichedMetadata> {
  const config = getAIConfig()

  // Si no hay API key configurada, usar fallback
  if (!config.apiKey) {
    console.warn('⚠️  No hay API key de IA configurada. Usando datos simulados como fallback.')
    console.warn('   Para usar IA real, configura AI_API_KEY, OPENAI_API_KEY o GEMINI_API_KEY en .env.local')
    return await getFallbackMetadata(routeTitle, coordinates)
  }

  try {
    console.log(`🤖 Llamando a API de IA (${config.provider}) para enriquecer metadatos de: "${routeTitle}"`)

    let result: EnrichedMetadata

    switch (config.provider) {
      case 'openai':
        result = await callOpenAI(routeTitle, config)
        break
      case 'anthropic':
        result = await callAnthropic(routeTitle, config)
        break
      case 'gemini':
        result = await callGemini(routeTitle, config)
        break
      default:
        throw new Error(`Proveedor de IA no soportado: ${config.provider}`)
    }

    // Validar y corregir imágenes con coordenadas
    result = await validateAndFixImages(result, routeTitle, coordinates)

    console.log(`✅ Metadatos enriquecidos exitosamente con IA`)
    return result
  } catch (error) {
    console.error('❌ Error llamando a API de IA:', error)
    console.warn('⚠️  Usando datos simulados como fallback')
    
    // En caso de error, usar fallback
    return await getFallbackMetadata(routeTitle, coordinates)
  }
}


