import { MetadataRoute } from 'next'
import { getAllRoutesFresh } from '@/lib/routes'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://peak-explorer.com'

  // Obtener rutas frescas para reflejar cambios en data.ts
  const allRoutes = getAllRoutesFresh()
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
}

