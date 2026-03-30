'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { BlogPost } from '@/types'

export type PostCardVariant = 'default' | 'featured' | 'horizontal' | 'compact'

interface PostCardProps {
  blog: BlogPost
  variant?: PostCardVariant
  priority?: boolean
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ── Default card — standard grid cell ──────────────────────────────────────
function DefaultCard({ blog, priority }: { blog: BlogPost; priority?: boolean }) {
  const date = blog.publishedAt ? formatDate(blog.publishedAt) : formatDate(blog.createdAt)
  const readingTime = blog.readingTime ?? 5

  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="post-card group flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    >
      {/* Image */}
      <div className="relative h-48 shrink-0 overflow-hidden bg-gradient-to-br from-primary-400 to-primary-700">
        {blog.featuredImage?.url && (
          <Image
            src={blog.featuredImage.url}
            alt={blog.featuredImage.alt || blog.title}
            fill
            priority={priority}
            unoptimized={blog.featuredImage.url.includes('firebasestorage')}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
          />
        )}
        {/* Tag badge over image */}
        {blog.tags[0] && (
          <span className="absolute top-3 left-3 rounded-full bg-cta-500 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
            {blog.tags[0]}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display font-bold text-slate-900 leading-tight tracking-tight mb-2 line-clamp-2
                       text-xl group-hover:text-primary-700 transition-colors duration-200">
          {blog.title}
        </h3>
        {blog.excerpt && (
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-4 flex-1">
            {blog.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              {date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {readingTime} min
            </span>
          </div>
          <ArrowRight
            className="h-4 w-4 text-slate-300 transition-all duration-200 group-hover:text-primary-600 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </div>
      </div>
    </Link>
  )
}

// ── Featured card — tall, spans 2 cols in bento grid ──────────────────────
function FeaturedCard({ blog, priority }: { blog: BlogPost; priority?: boolean }) {
  const date = blog.publishedAt ? formatDate(blog.publishedAt) : formatDate(blog.createdAt)
  const readingTime = blog.readingTime ?? 5

  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="post-card group relative flex flex-col overflow-hidden min-h-[420px]
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      {/* Full-bleed image */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-700">
        {blog.featuredImage?.url && (
          <Image
            src={blog.featuredImage.url}
            alt={blog.featuredImage.alt || blog.title}
            fill
            priority={priority}
            unoptimized={blog.featuredImage.url.includes('firebasestorage')}
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 100vw, 60vw"
          />
        )}
      </div>

      {/* Gradient scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      {/* Content anchored to bottom */}
      <div className="relative mt-auto p-6">
        <div className="mb-3 flex flex-wrap gap-2">
          {blog.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/15 backdrop-blur-sm border border-white/20
                         px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-white"
            >
              {tag}
            </span>
          ))}
        </div>

        <h3 className="font-display font-bold text-white leading-none tracking-tight mb-3 text-balance
                       text-2xl sm:text-3xl group-hover:text-cta-400 transition-colors duration-200">
          {blog.title}
        </h3>
        {blog.excerpt && (
          <p className="text-sm text-white/70 line-clamp-2 mb-4">
            {blog.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              {date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {readingTime} min
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-cta-500
                           backdrop-blur-sm border border-white/20 px-4 py-1.5
                           text-xs font-bold text-white transition-all duration-200">
            Leer
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  )
}

// ── Horizontal card — image left, content right. Used in sidebar ───────────
function HorizontalCard({ blog }: { blog: BlogPost }) {
  const date = blog.publishedAt ? formatDate(blog.publishedAt) : formatDate(blog.createdAt)

  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="group flex items-start gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl"
    >
      {/* Thumbnail */}
      <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600">
        {blog.featuredImage?.url && (
          <Image
            src={blog.featuredImage.url}
            alt={blog.featuredImage.alt || blog.title}
            fill
            unoptimized={blog.featuredImage.url.includes('firebasestorage')}
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="64px"
          />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2
                      group-hover:text-primary-700 transition-colors duration-200">
          {blog.title}
        </p>
        <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
          <Calendar className="h-2.5 w-2.5" aria-hidden="true" />
          {date}
        </p>
      </div>
    </Link>
  )
}

// ── Compact card — minimal list item ──────────────────────────────────────
function CompactCard({ blog }: { blog: BlogPost }) {
  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="post-card group flex gap-4 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      {/* Thumbnail */}
      <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600">
        {blog.featuredImage?.url && (
          <Image
            src={blog.featuredImage.url}
            alt={blog.featuredImage.alt || blog.title}
            fill
            unoptimized={blog.featuredImage.url.includes('firebasestorage')}
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="80px"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col justify-center min-w-0">
        {blog.tags[0] && (
          <span className="text-xs font-bold uppercase tracking-wide text-primary-600 mb-1">
            {blog.tags[0]}
          </span>
        )}
        <h4 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2
                       group-hover:text-primary-700 transition-colors duration-200">
          {blog.title}
        </h4>
        {blog.readingTime && (
          <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" aria-hidden="true" />
            {blog.readingTime} min
          </p>
        )}
      </div>
    </Link>
  )
}

// ── Public export ──────────────────────────────────────────────────────────
export function PostCard({ blog, variant = 'default', priority }: PostCardProps) {
  switch (variant) {
    case 'featured':
      return <FeaturedCard blog={blog} priority={priority} />
    case 'horizontal':
      return <HorizontalCard blog={blog} />
    case 'compact':
      return <CompactCard blog={blog} />
    default:
      return <DefaultCard blog={blog} priority={priority} />
  }
}
