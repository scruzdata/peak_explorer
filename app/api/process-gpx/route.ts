import { NextRequest, NextResponse } from 'next/server'
import { processGPXFile } from '@/lib/gpxProcessor'

/**
 * Endpoint API para procesar archivos GPX
 * Recibe un archivo GPX, lo parsea y enriquece con metadatos usando IA
 * El track se guardará en Firestore cuando el usuario guarde la ruta desde el formulario
 */
export async function POST(request: NextRequest) {
  const logs: string[] = []
  
  // Interceptar console.log para capturar logs
  const originalLog = console.log
  const originalError = console.error
  const originalWarn = console.warn
  
  console.log = (...args: any[]) => {
    const logMessage = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')
    logs.push(logMessage)
    originalLog(...args)
  }
  
  console.error = (...args: any[]) => {
    const logMessage = '❌ ' + args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')
    logs.push(logMessage)
    originalError(...args)
  }
  
  console.warn = (...args: any[]) => {
    const logMessage = '⚠️  ' + args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')
    logs.push(logMessage)
    originalWarn(...args)
  }

  try {
    // Obtener el FormData del request
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    // Validar que sea un archivo GPX
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      return NextResponse.json(
        { error: 'El archivo debe ser un archivo GPX (.gpx)' },
        { status: 400 }
      )
    }

    // Validar tamaño del archivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 10MB' },
        { status: 400 }
      )
    }

    // Leer el contenido del archivo
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const gpxContent = buffer.toString('utf-8')

    // Procesar el GPX (parsing + enriquecimiento con IA)
    const routeData = await processGPXFile(gpxContent, file.name)

    // El track se guardará en Firestore solo cuando el usuario guarde la ruta desde el formulario
    if (routeData.track && routeData.track.length > 0) {
      console.log(`ℹ️  Track parseado correctamente (${routeData.track.length} puntos). Se guardará en Firestore al guardar la ruta.`)
    } else {
      console.log('ℹ️  No se encontró track en el archivo GPX o está vacío')
    }

    // Restaurar console original
    console.log = originalLog
    console.error = originalError
    console.warn = originalWarn

    // Devolver el objeto JSON completo con logs
    return NextResponse.json({
      success: true,
      data: routeData,
      logs: logs,
    })
  } catch (error) {
    // Restaurar console original antes de devolver error
    console.log = originalLog
    console.error = originalError
    console.warn = originalWarn
    
    console.error('Error procesando GPX:', error)
    return NextResponse.json(
      {
        error: 'Error al procesar el archivo GPX',
        message: error instanceof Error ? error.message : 'Error desconocido',
        logs: logs,
      },
      { status: 500 }
    )
  }
}

