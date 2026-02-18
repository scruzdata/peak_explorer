import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import dynamicImport from 'next/dynamic'
import { getBlogBySlugFromFirestore, incrementBlogViews, getRecentBlogsFromFirestore } from '@/lib/firebase/blogs'
import { BlogPost } from '@/types'
import { Calendar, Clock, Tag } from 'lucide-react'
import { calculateReadingTime } from '@/lib/utils'

// OPTIMIZACIÓN: Lazy loading del renderer de Tiptap para contenido JSON
const BlogRenderer = dynamicImport(
  () => import('@/components/blog/renderers/BlogRenderer').then((mod) => ({ default: mod.BlogRenderer })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-3/4 rounded bg-gray-200"></div>
        <div className="h-4 rounded bg-gray-200"></div>
      </div>
    ),
  }
)

import { BlogFeaturedImage } from '@/components/blog/BlogFeaturedImage'

// OPTIMIZACIÓN: Lazy loading de RecentBlogsCarousel (usa componentes pesados)
const RecentBlogsCarousel = dynamicImport(
  () => import('@/components/blog/RecentBlogsCarousel').then((mod) => ({ default: mod.RecentBlogsCarousel })),
  { 
    ssr: true,
    loading: () => null // No mostrar nada mientras carga (está al final de la página)
  }
)

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const blog = await getBlogBySlugFromFirestore(params.slug, false)
  
  if (!blog) {
    return {
      title: 'Artículo no encontrado - Peak Explorer',
    }
  }

  return {
    title: blog.seo.metaTitle || blog.title,
    description: blog.seo.metaDescription || blog.excerpt,
    keywords: blog.seo.keywords,
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      images: blog.featuredImage ? [blog.featuredImage.url] : [],
      type: 'article',
      publishedTime: blog.publishedAt,
      modifiedTime: blog.updatedAt,
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const blog = await getBlogBySlugFromFirestore(params.slug, false)

  if (!blog) {
    notFound()
  }

  // Incrementar contador de visualizaciones (sin esperar)
  incrementBlogViews(blog.id).catch(console.error)

  // Obtener blogs recientes (excluyendo el actual)
  const recentBlogs = await getRecentBlogsFromFirestore(blog.id, 6)

  const readingTime = blog.readingTime || calculateReadingTime(blog.content)
  const publishedDate = blog.publishedAt 
    ? new Date(blog.publishedAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date(blog.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

  // Para entradas antiguas sin JSON, se puede mantener un fallback a contenido plano si lo deseas.

  return (
    <article className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      {blog.featuredImage?.url && (
        <BlogFeaturedImage
          image={blog.featuredImage}
          alt={blog.featuredImage.alt || blog.title}
          priority
          className="h-64 md:h-96"
        />
      )}

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          {/* Tags */}
          {blog.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {blog.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-800"
                >
                  <Tag className="mr-1 h-4 w-4" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            {blog.title}
          </h1>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
            {blog.author && (
              <div>
                <span className="font-medium">Por {blog.author.name}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{publishedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{readingTime} min lectura</span>
            </div>
            {blog.views !== undefined && (
              <div>
                <span>{blog.views} visualizaciones</span>
              </div>
            )}
          </div>
        </header>

        {/* Excerpt */}
        {blog.excerpt && (
          <div className="mb-8 rounded-lg border-l-4 border-primary-500 bg-primary-50 p-4">
            <p className="text-lg font-medium text-gray-800">{blog.excerpt}</p>
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          {blog.contentJson ? (
            <BlogRenderer contentJson={blog.contentJson} />
          ) : (
            <p className="whitespace-pre-wrap text-gray-800">{blog.content}</p>
          )}
        </div>
      </div>

      {/* Blogs Recientes */}
      {recentBlogs.length > 0 && (
        <RecentBlogsCarousel blogs={recentBlogs} />
      )}
    </article>
  )
}
