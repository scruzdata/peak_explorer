import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RouteDetail } from '@/components/routes/RouteDetail'
import { getRouteBySlugAsync } from '@/lib/routes'

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

  return <RouteDetail route={route} />
}

