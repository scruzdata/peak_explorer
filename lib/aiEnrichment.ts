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
  parking?: [{
    lat: number
    lng: number
  }]
  restaurants?: [{
    lat: number
    lng: number
    name?: string
  }],
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
  const providerEnv = process.env.AI_PROVIDER || 'gemini'
  const validProviders = ['openai', 'anthropic', 'gemini', 'custom'] as const
  const provider = (validProviders.includes(providerEnv as any) ? providerEnv : 'gemini') as 'openai' | 'anthropic' | 'gemini' | 'custom'
  let apiKey = process.env.GEMINI_API_KEY
  let model = process.env.AI_MODEL
  
  // Modelos por defecto según el proveedor
  if (!model) {
    switch (provider) {
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
- Image URLs: None.

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
  "parking": array of objects with lat and lng about available parking places to start the route,
  "restaurants": array of objects with lat, lng and name about available restaurants nearby the route,
  "safetyTips": ["safety tip 1", "safety tip 2"],
  "storytelling": "narrative description of the route in markdown",
  "heroImage": {
    "url": "",
    "alt": "description of the image",
    "width": 1200,
    "height": 800
  },
  "gallery": [
    {
      "url": "",
      "alt": "description of the image 1",
      "width": 800,
      "height": 600
    }
  ],
  "seo": {
    "metaTitle": "SEO title",
    "metaDescription": "SEO description",
    "keywords": ["keyword 1", "keyword 2"]
  }
}

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
 * Llama a un servicio de IA para enriquecer los metadatos de una ruta con datos de internet
 * Soporta OpenAI y Anthropic, con fallback a datos simulados si no hay API configurada
 */
export async function getRouteMetadataFromAI(
  routeTitle: string,
  coordinates?: { lat: number; lng: number }
): Promise<EnrichedMetadata> {
  const config = getAIConfig()

  try {
    console.log(`🤖 Llamando a API de IA (${config.provider}) para enriquecer metadatos de: "${routeTitle}"`)

    let result: EnrichedMetadata

    switch (config.provider) {
      case 'gemini':
        result = await callGemini(routeTitle, config)
        break
      default:
        throw new Error(`Proveedor de IA no soportado: ${config.provider}`)
    }

    console.log(`✅ Metadatos enriquecidos exitosamente con IA`)
    return result
  } catch (error) {
    console.error('❌ Error llamando a API de IA:', error)
    console.warn('⚠️  Usando datos simulados como fallback')
    // Retornar un objeto vacío como fallback
    return {}
  }
}


