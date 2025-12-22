import { MetadataRoute } from 'next'
import { getAllRoutesAsync } from '@/lib/routes'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://peak-explorer.com'

  try {
    // Obtener rutas desde Firestore (con fallback a datos estáticos si no está configurado)
    const allRoutes = await getAllRoutesAsync()
    const routes = allRoutes.map((route) => ({
      url: `${baseUrl}/${route.type === 'trekking' ? 'rutas' : 'vias-ferratas'}/${route.slug}`,
      lastModified: new Date(route.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/rutas`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/vias-ferratas`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      ...routes,
    ]
  } catch (error) {
    console.error('Error generando sitemap:', error)
    // Devolver sitemap básico si hay error
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/rutas`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/vias-ferratas`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      },
    ]
  }
}

