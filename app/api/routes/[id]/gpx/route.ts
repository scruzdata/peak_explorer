import { NextRequest, NextResponse } from 'next/server'
import { getRouteByIdFromFirestore } from '@/lib/firebase/routes'
import { getTrackByRouteSlug } from '@/lib/firebase/tracks'
import { generateGPX } from '@/lib/gpxGenerator'

/**
 * Endpoint para descargar el GPX de una ruta
 * GET /api/routes/[id]/gpx
 * 
 * Flujo:
 * 1. Obtener la ruta por ID desde Firestore
 * 2. Obtener el track JSON desde Firestore
 * 3. Generar el GPX dinámicamente
 * 4. Devolver el GPX al cliente
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const routeId = params.id

    if (!routeId) {
      return NextResponse.json(
        { error: 'ID de ruta no proporcionado' },
        { status: 400 }
      )
    }

    // Obtener la ruta desde Firestore usando Client SDK
    const route = await getRouteByIdFromFirestore(routeId)

    if (!route) {
      return NextResponse.json(
        { error: 'Ruta no encontrada' },
        { status: 404 }
      )
    }

    // Obtener el track desde Firestore usando Client SDK
    const trackPoints = await getTrackByRouteSlug(route.slug)

    if (!trackPoints || trackPoints.length === 0) {
      return NextResponse.json(
        { error: 'Track no encontrado o vacío para esta ruta' },
        { status: 404 }
      )
    }

    // Generar el GPX dinámicamente
    const gpxContent = generateGPX({
      name: route.title,
      description: route.summary || undefined,
      trackPoints: trackPoints,
      waypoints: route.waypoints || [],
    })

    // Devolver el GPX generado
    return new NextResponse(gpxContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/gpx+xml',
        'Content-Disposition': `attachment; filename="ruta-${route.slug}.gpx"`,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error generando GPX:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}
