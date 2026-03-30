import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import dynamicImport from 'next/dynamic'
import { getRouteBySlugAsync, getClosestRoutesAsync } from '@/lib/routes'

// OPTIMIZACIÓN: Lazy loading de RouteDetail que contiene mapas pesados (Mapbox ~200KB)
// Solo cargar cuando el usuario visita una página de detalle
const RouteDetail = dynamicImport(
  () => import('@/components/routes/RouteDetail').then((mod) => ({ default: mod.RouteDetail })),
  { 
    ssr: true, // Mantener SSR para SEO
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando vía ferrata...</p>
        </div>
      </div>
    )
  }
)

export const revalidate = 60

interface PageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const route = await getRouteBySlugAsync(params.slug, 'ferrata')
  
  if (!route) {
    return {
      title: 'Vía Ferrata no encontrada',
    }
  }

  return {
    title: route.seo.metaTitle,
    description: route.seo.metaDescription,
    keywords: route.seo.keywords,
    alternates: {
      canonical: `https://www.peakexplorer.es/vias-ferratas/${params.slug}`,
    },
    openGraph: {
      title: route.seo.metaTitle,
      description: route.seo.metaDescription,
      images: [{ url: route.heroImage.url, alt: route.title }],
      type: 'article',
      url: `https://www.peakexplorer.es/vias-ferratas/${params.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: route.seo.metaTitle,
      description: route.seo.metaDescription,
      images: [route.heroImage.url],
    },
  }
}

export default async function FerrataPage({ params }: PageProps) {
  const route = await getRouteBySlugAsync(params.slug, 'ferrata')

  if (!route) {
    notFound()
  }

  const recentRoutes = await getClosestRoutesAsync(route, 6)

  const pageUrl = `https://www.peakexplorer.es/vias-ferratas/${params.slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SportsActivity',
        '@id': `${pageUrl}#activity`,
        name: route.title,
        description: route.seo.metaDescription || route.summary,
        url: pageUrl,
        image: route.heroImage.url,
        location: {
          '@type': 'Place',
          name: route.location.region,
          address: {
            '@type': 'PostalAddress',
            addressRegion: route.location.province,
            addressCountry: 'ES',
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: route.location.coordinates.lat,
            longitude: route.location.coordinates.lng,
          },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.peakexplorer.es' },
          { '@type': 'ListItem', position: 2, name: 'Vías Ferratas', item: 'https://www.peakexplorer.es/vias-ferratas' },
          { '@type': 'ListItem', position: 3, name: route.title, item: pageUrl },
        ],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RouteDetail route={route} recentRoutes={recentRoutes} />
    </>
  )
}

