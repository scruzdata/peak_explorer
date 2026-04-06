import { MetadataRoute } from 'next'
import { getAllRoutesAsync } from '@/lib/routes'

async function getBlogsForSitemap() {
  try {
    const { getAllBlogsFromFirestore } = await import('@/lib/firebase/blogs')
    return await getAllBlogsFromFirestore(true) // published only
  } catch {
    return []
  }
}

function safeDate(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback
  const d = new Date(value)
  return isNaN(d.getTime()) ? fallback : d
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.peakexplorer.es'

  const staticLastMod = new Date('2026-02-01')

  try {
    const [allRoutes, allBlogs] = await Promise.all([
      getAllRoutesAsync(),
      getBlogsForSitemap(),
    ])

    const now = new Date()

    const routeEntries = allRoutes
      .filter((route) => route.slug)
      .map((route) => ({
        url: `${baseUrl}/${route.type === 'trekking' ? 'rutas' : 'vias-ferratas'}/${route.slug}`,
        lastModified: safeDate(route.updatedAt, now),
        ...(route.heroImage?.url ? { images: [route.heroImage.url] } : {}),
      }))

    const blogEntries = allBlogs
      .filter((blog) => blog.slug)
      .map((blog) => ({
        url: `${baseUrl}/blog/${blog.slug}`,
        lastModified: safeDate(blog.updatedAt, now),
        ...(blog.featuredImage?.url ? { images: [blog.featuredImage.url] } : {}),
      }))

    return [
      { url: baseUrl, lastModified: staticLastMod },
      { url: `${baseUrl}/rutas`, lastModified: staticLastMod },
      { url: `${baseUrl}/vias-ferratas`, lastModified: staticLastMod },
      { url: `${baseUrl}/blog`, lastModified: staticLastMod },
      ...routeEntries,
      ...blogEntries,
    ]
  } catch (error) {
    console.error('Error generando sitemap:', error)
    return [
      { url: baseUrl, lastModified: staticLastMod },
      { url: `${baseUrl}/rutas`, lastModified: staticLastMod },
      { url: `${baseUrl}/vias-ferratas`, lastModified: staticLastMod },
      { url: `${baseUrl}/blog`, lastModified: staticLastMod },
    ]
  }
}

