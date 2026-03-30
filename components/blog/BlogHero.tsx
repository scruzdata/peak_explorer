import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { BlogPost } from '@/types'

interface BlogHeroProps {
  blog: BlogPost
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function BlogHero({ blog }: BlogHeroProps) {
  const date = blog.publishedAt
    ? formatDate(blog.publishedAt)
    : formatDate(blog.createdAt)
  const readingTime = blog.readingTime ?? 5
  const primaryTag = blog.tags[0]

  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="group relative block overflow-hidden h-[480px] sm:h-[560px] lg:h-[640px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500"
      aria-label={`Leer artículo destacado: ${blog.title}`}
    >
      {/* Background image */}
      {blog.featuredImage?.url ? (
        <Image
          src={blog.featuredImage.url}
          alt={blog.featuredImage.alt || blog.title}
          fill
          priority
          unoptimized={blog.featuredImage.url.includes('firebasestorage')}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-editorial-950 via-primary-900 to-slate-800" />
      )}

      {/* Cinematic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end px-6 py-10 sm:px-10 lg:px-16 lg:py-14">
        {/* Badges row */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-cta-500 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-sm">
            Destacado
          </span>
          {primaryTag && (
            <span className="rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white/90">
              {primaryTag}
            </span>
          )}
        </div>

        {/* Title — Barlow Condensed, editorial scale */}
        <h2 className="font-display font-bold text-white leading-none tracking-tight mb-4 text-balance
                       text-4xl sm:text-5xl lg:text-6xl xl:text-7xl max-w-4xl">
          {blog.title}
        </h2>

        {/* Excerpt */}
        {blog.excerpt && (
          <p className="text-base sm:text-lg text-white/75 max-w-2xl mb-7 leading-relaxed line-clamp-2">
            {blog.excerpt}
          </p>
        )}

        {/* Meta + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-white/55">
            {blog.author?.name && (
              <span className="font-semibold text-white/80">{blog.author.name}</span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {readingTime} min lectura
            </span>
          </div>

          {/* CTA pill */}
          <span
            className="inline-flex items-center gap-2 self-start sm:ml-auto
                       rounded-full bg-white px-6 py-2.5 text-sm font-bold text-slate-900
                       transition-all duration-200
                       group-hover:bg-cta-500 group-hover:text-white group-hover:shadow-lg"
          >
            Leer artículo
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>

      {/* Corner accent line */}
      <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-cta-500 transition-all duration-500 group-hover:w-full" />
    </Link>
  )
}
