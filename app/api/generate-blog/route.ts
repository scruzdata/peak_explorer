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

  const systemPrompt = `You are an EXPERT BLOG WRITER specialized in mountaineering, hiking and via ferratas.

Your task is to create comprehensive, well-structured blog articles that will be stored and edited in a modern rich-text editor (Tiptap-like). The backend will convert a simple Markdown-style string into a structured JSON document, so you MUST keep the formatting simple and predictable.

LANGUAGE:
- All article content (title, excerpt, body, tags, SEO fields) MUST be written in SPANISH (Español).

BODY FORMAT (content field):
- The "content" field is a SINGLE STRING that uses ONLY these simple Markdown-like patterns:
  - Headings:
    - "## " for main section titles (H2)
    - "### " for subsection titles (H3)
  - Bullet lists:
    - Lines starting with "- " for bullet items
  - Numbered lists:
    - Lines starting with "1. ", "2. ", etc. for ordered items
  - Blockquotes:
    - Lines starting with "> " for tips and warnings
  - Inline formatting:
    - **bold** using **text**
    - *italic* using *text*
  - Paragraphs:
    - Separate paragraphs with ONE completely blank line between them

DO NOT USE:
- No markdown tables (no "|" table syntax)
- No images (no ![...](...))
- No code blocks (\`\`\`)
- No HTML
- No custom syntaxes like "![alt|center|30%](url)" or similar

CONTENT REQUIREMENTS:
- Topic: mountaineering / hiking / via ferratas (safety-focused, practical, and engaging).
- Minimum 900 words of useful, well-structured content.
- Include in the body:
  - An engaging introduction (2-3 short paragraphs) that hooks the reader.
  - Clear main sections with "##" headings and optional "###" subsections.
  - Short, scannable paragraphs (max ~3-4 sentences) with blank lines between them.
  - Bullet lists for equipment, tips, and key points.
  - Numbered lists for step-by-step processes.
  - Blockquotes for expert tips and safety warnings.
  - Safety focus and real-world, practical advice.
  - A conclusion that summarizes key ideas and invites the reader to action.

RESPONSE FORMAT:
You must respond ONLY with a single VALID and parseable JSON object, without additional text, without markdown code blocks, without explanations.

MANDATORY JSON STRUCTURE (keys and types):

{
  "title": "Título atractivo y envolvente en español",
  "excerpt": "Resumen breve y atractivo en español (2-3 frases que enganchen al lector).",
  "content": "Cuerpo completo del artículo en un solo string con el formato tipo Markdown sencillo descrito arriba.",
  "tags": ["tag1", "tag2", "tag3"],
  "seo": {
    "metaTitle": "Título SEO optimizado en español",
    "metaDescription": "Descripción SEO optimizada en español (150-160 caracteres).",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
}

CRITICAL JSON RULES:
- Escape quotes inside strings with \\"
- Do not include comments in the JSON
- Do not include markdown code blocks (\`\`\`) around the JSON
- Do not include any text outside the JSON object
- Ensure all text content (title, excerpt, content, seo fields, tags) is in SPANISH (Español)
- Arrays must be properly formatted without trailing commas
- The JSON must be complete and valid before sending`

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

    // Parsear JSON (o, si falla, extraer campos clave manualmente)
    let blogData
    try {
      blogData = JSON.parse(cleanedContent)
    } catch (parseError: any) {
      console.error('Error parseando JSON de Gemini:', parseError)
      console.error('Contenido que falló al parsear (primeros 500 chars):', cleanedContent.substring(0, 500))

      // Fallback robusto: extraer "title", "excerpt" y "content" sin depender de JSON válido
      const extractStringField = (key: string): string | undefined => {
        const keyPattern = `"${key}": "`
        const start = cleanedContent.indexOf(keyPattern)
        if (start === -1) return undefined
        const valueStart = start + keyPattern.length

        let i = valueStart
        let escaped = false

        while (i < cleanedContent.length) {
          const ch = cleanedContent[i]
          if (ch === '\\') {
            escaped = !escaped
          } else if (ch === '"' && !escaped) {
            const raw = cleanedContent.slice(valueStart, i)
            // Des-escapar secuencias típicas
            return raw.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
          } else {
            escaped = false
          }
          i++
        }

        return undefined
      }

      let fallbackTitle = extractStringField('title')
      let fallbackExcerpt = extractStringField('excerpt')
      let fallbackContent = extractStringField('content')

      // Si no se encuentran explícitamente, usar valores de respaldo
      if (!fallbackTitle) {
        fallbackTitle = `Artículo sobre ${prompt}`.trim()
      }
      if (!fallbackContent) {
        // Como último recurso, usar todo el contenido bruto como cuerpo del artículo
        fallbackContent = cleanedContent
      }

      console.warn('Usando extracción manual de campos debido a JSON inválido de Gemini.')

      blogData = {
        title: fallbackTitle,
        excerpt: fallbackExcerpt || '',
        content: fallbackContent,
        tags: [],
        seo: {
          metaTitle: fallbackTitle,
          metaDescription: fallbackExcerpt || '',
          keywords: [],
        },
      }
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
