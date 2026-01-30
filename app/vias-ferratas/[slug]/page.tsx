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

// Forzar recarga dinámica para obtener datos frescos de Firestore
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    openGraph: {
      title: route.seo.metaTitle,
      description: route.seo.metaDescription,
      images: [route.heroImage.url],
      type: 'article',
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

  // Obtener vías ferratas más cercanas por distancia (excluyendo la actual)
  const recentRoutes = await getClosestRoutesAsync(route, 6)

  return <RouteDetail route={route} recentRoutes={recentRoutes} />
}

