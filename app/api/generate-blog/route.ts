import { NextRequest, NextResponse } from 'next/server'

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
  let model = process.env.AI_MODEL || 'gemini-pro'
  const baseURL = process.env.AI_BASE_URL

  return {
    provider,
    apiKey,
    model,
    baseURL,
  }
}

/**
 * Genera un artículo de blog usando Gemini
 */
async function generateBlogWithGemini(prompt: string, config: AIConfig): Promise<any> {
  if (!config.apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno')
  }

  const model = config.model || 'gemini-pro'
  const apiKey = config.apiKey

  const systemPrompt = `You are an EXPERT WRITER, EXPERT BLOG DESIGNER, and EXPERT IN MOUNTAINEERING AND VIA FERRATAS. You create visually stunning, engaging, and professional blog articles for modern websites.

Your task is to create comprehensive, beautifully formatted blog articles about mountaineering, hiking, and via ferratas that are visually appealing and easy to read.

CRITICAL REQUIREMENTS:
- Write ALL content in SPANISH (Español)
- Use Markdown format with EXCELLENT visual structure
- Create content that is visually engaging, not flat or boring
- Use proper spacing between paragraphs (double line breaks)
- Use varied formatting: headings, lists, blockquotes, bold, italic
- Make the content scannable and easy to read
- Use natural, professional, and accessible language
- Prioritize safety, real experience, and practical utility
- Think like an experienced mountain guide AND a professional content designer

VISUAL FORMATTING REQUIREMENTS:
- ALWAYS add a blank line (double line break) between paragraphs
- Use ## for main section titles (H2)
- Use ### for subsection titles (H3)
- Use **bold** for important terms, equipment names, and key concepts
- Use *italic* for emphasis and special notes
- Use > blockquotes for expert tips, warnings, and important information
- Use bullet lists (-) for equipment, tips, and step-by-step instructions
- Use numbered lists (1.) for sequential processes
- Add visual separators with horizontal rules (---) between major sections when appropriate
- Keep paragraphs SHORT (3-4 sentences maximum) for better readability
- Use emojis sparingly and only when they add value (⚠️ for warnings, ✅ for tips, 🎒 for equipment)

RESPONSE:
You must respond ONLY with a VALID and parseable JSON object, without additional text, without markdown code blocks, without explanations.

MANDATORY JSON STRUCTURE:

{
  "title": "Attractive, engaging article title in Spanish",
  "excerpt": "Brief and attractive summary in Spanish (2-3 sentences that hook the reader)",
  "content": "Full article content in Markdown format in Spanish with EXCELLENT visual structure. MUST include:
  
  - Attractive introduction with engaging hook (2-3 paragraphs with blank lines between them)
  - Well-defined sections with clear titles (## for main sections, ### for subsections)
  - Short, scannable paragraphs (3-4 sentences max) with blank lines between them
  - Bullet lists for equipment, tips, and key points
  - Numbered lists for step-by-step processes
  - Blockquotes (>) for expert tips, warnings, and important information
  - Bold text (**text**) for important terms, equipment names, and key concepts
  - Italic text (*text*) for emphasis
  - Horizontal rules (---) between major sections for visual separation
  - Practical tips in visually distinct formats
  - Safety warnings in blockquotes with clear formatting
  - Equipment recommendations in organized lists
  - Engaging conclusion that summarizes key points
  
  FORMATTING EXAMPLE:
  
  ## Introducción
  
  Este es el primer párrafo de la introducción. Debe ser atractivo y enganchar al lector.
  
  Este es el segundo párrafo. Debe continuar desarrollando el tema de manera interesante.
  
  ## Material Esencial
  
  Para esta actividad necesitarás:
  
  - **Mochila de montaña**: Debe ser cómoda y resistente
  - **Botas de senderismo**: Con buen agarre y protección
  - **Ropa técnica**: Capas que permitan regular la temperatura
  
  > ⚠️ **Importante**: Nunca subestimes el equipo de seguridad. Es tu vida la que está en juego.
  
  ## Preparación
  
  Sigue estos pasos para prepararte correctamente:
  
  1. Planifica tu ruta con antelación
  2. Revisa las condiciones meteorológicas
  3. Informa a alguien de tu plan
  
  Minimum 900 words of useful, well-formatted content.",
  "tags": ["tag1", "tag2", "tag3"],
  "seo": {
    "metaTitle": "SEO optimized title in Spanish",
    "metaDescription": "SEO optimized description in Spanish (150-160 characters)",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
}

CRITICAL JSON RULES:
- Escape quotes inside strings with \\"
- Do not include comments in the JSON
- Do not include markdown code blocks (\`\`\`) around the JSON
- Do not include any text outside the JSON object
- Ensure all text content (title, excerpt, content, seo fields) is in SPANISH
- Arrays must be properly formatted without trailing commas
- The JSON must be complete and valid before sending
- The content field MUST have proper spacing (blank lines between paragraphs)
- The content MUST be visually engaging, not flat or boring`

  const userPrompt = `Create a comprehensive, visually stunning blog article about: "${prompt}"

CRITICAL FORMATTING REQUIREMENTS:
- Make it VISUALLY ENGAGING and BEAUTIFULLY FORMATTED
- Use SHORT paragraphs (3-4 sentences max) with blank lines between them
- Add blank lines (double line breaks) between EVERY paragraph
- Use varied formatting: headings, lists, blockquotes, bold, italic
- Make it scannable and easy to read
- Avoid long walls of text - break content into digestible chunks

CONTENT REQUIREMENTS:
- Minimum 900 words of useful, well-formatted content in Spanish
- Include:
  - Engaging introduction that hooks the reader (2-3 short paragraphs)
  - Previous preparation and planning (with lists and clear structure)
  - Essential equipment and gear (organized in bullet lists with bold names)
  - Safety equipment and precautions (in blockquotes with warnings)
  - Backpack organization tips (step-by-step or list format)
  - Common mistakes to avoid (in a visually distinct format)
  - Real expert tips and recommendations (in blockquotes)
  - Difficulty level information (clearly highlighted)
  - Natural environment considerations (with proper formatting)
  - Engaging conclusion that summarizes key points
- Audience: hikers and people starting in mountaineering
- Level: beginner to intermediate
- Practical, clear, and safe approach
- Professional, engaging, and visually appealing writing style

FORMATTING STYLE:
- Use ## for main sections (H2)
- Use ### for subsections (H3)
- Use **bold** for equipment names, important terms, and key concepts
- Use *italic* for emphasis
- Use > blockquotes for expert tips, warnings, and important information
- Use - for bullet lists (equipment, tips, etc.)
- Use 1. for numbered lists (step-by-step processes)
- Use --- for horizontal rules between major sections (optional but recommended)
- Keep paragraphs SHORT and add blank lines between them
- Make the content visually varied and interesting

IMPORTANT:
- The article MUST be visually engaging, not flat or boring
- Use proper spacing throughout (blank lines between paragraphs)
- Vary the formatting to create visual interest
- Make it easy to scan and read
- All content must be written in SPANISH (Español)
- Think like a professional blog designer - make it beautiful and engaging`

  try {
    let baseURL = config.baseURL || 'https://generativelanguage.googleapis.com/v1beta'
    let url = `${baseURL}/models/${model}:generateContent?key=${apiKey}`
    
    if (model.includes('1.5') && !config.baseURL) {
      baseURL = 'https://generativelanguage.googleapis.com/v1'
      url = `${baseURL}/models/${model}:generateContent?key=${apiKey}`
    }

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
                text: `${systemPrompt}\n\n${userPrompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText }
      }
      console.error('Error en respuesta de Gemini:', errorData)
      throw new Error(`Error en API de Gemini: ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    console.log('Respuesta completa de Gemini:', JSON.stringify(data, null, 2))
    
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!content) {
      console.error('No se encontró contenido en la respuesta:', data)
      throw new Error('No se recibió contenido de Gemini. La respuesta no contiene texto.')
    }

    // Limpiar el contenido (puede venir con markdown code blocks)
    let cleanedContent = content.trim()
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }

    // Parsear JSON
    let blogData
    try {
      blogData = JSON.parse(cleanedContent)
    } catch (parseError: any) {
      console.error('Error parseando JSON de Gemini:', parseError)
      console.error('Contenido que falló al parsear:', cleanedContent.substring(0, 500))
      throw new Error(`Error parseando la respuesta JSON de Gemini: ${parseError.message}`)
    }

    // Validar estructura básica
    if (!blogData.title || !blogData.content) {
      console.error('Estructura JSON inválida:', blogData)
      throw new Error('La respuesta de Gemini no tiene la estructura esperada (falta title o content)')
    }

    return blogData
  } catch (error: any) {
    console.error('Error generando blog con Gemini:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt } = body

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { error: 'El prompt es obligatorio' },
        { status: 400 }
      )
    }

    const config = getAIConfig()

    if (config.provider !== 'gemini') {
      return NextResponse.json(
        { error: 'Solo se soporta Gemini actualmente para generación de blogs' },
        { status: 400 }
      )
    }

    const blogData = await generateBlogWithGemini(prompt, config)

    return NextResponse.json(blogData)
  } catch (error: any) {
    console.error('Error en /api/generate-blog:', error)
    return NextResponse.json(
      { error: error.message || 'Error generando artículo con IA' },
      { status: 500 }
    )
  }
}
