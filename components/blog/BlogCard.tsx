'use client'

import { BlogPost } from '@/types'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, Tag } from 'lucide-react'
import { calculateReadingTime } from '@/lib/utils'

export function BlogCard({ blog, openInNewTab = false }: { blog: BlogPost; openInNewTab?: boolean }) {
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

  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="group block overflow-hidden rounded-lg bg-white shadow-md transition-all duration-300 hover:shadow-xl"
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noopener noreferrer" : undefined}
    >
      {/* Imagen destacada */}
      {blog.featuredImage?.url ? (
        <div className="relative h-48 w-full overflow-hidden bg-gray-200">
          {/* Optimización: lazy loading explícito para imágenes de blog (siempre below the fold) */}
          <Image
            src={blog.featuredImage.url}
            alt={blog.featuredImage.alt || blog.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy" // Lazy loading para mejorar LCP (blogs están below the fold)
            unoptimized={blog.featuredImage.url.includes('firebasestorage') || blog.featuredImage.url.includes('firebase')}
            onError={(e) => {
              console.error('Error cargando imagen del blog:', {
                url: blog.featuredImage?.url,
                blogId: blog.id,
                blogTitle: blog.title,
              })
              // Mostrar placeholder en lugar de ocultar
              const target = e.target as HTMLImageElement
              if (target.parentElement) {
                target.parentElement.innerHTML = '<div class="h-full w-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center"><span class="text-white/50 text-sm">Error cargando imagen</span></div>'
              }
            }}
          />
        </div>
      ) : (
        <div className="h-48 w-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
          <span className="text-white/50 text-sm">Sin imagen</span>
        </div>
      )}

      {/* Contenido */}
      <div className="p-6">
        {/* Tags */}
        {blog.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {blog.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800"
              >
                <Tag className="mr-1 h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Título */}
        <h2 className="mb-2 text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
          {blog.title}
        </h2>

        {/* Extracto */}
        <p className="mb-4 line-clamp-3 text-sm text-gray-600">
          {blog.excerpt}
        </p>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{publishedDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{readingTime} min lectura</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
