import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BlogPost } from '@/types'
import { PostCard } from './PostCard'

interface RelatedPostsProps {
  posts: BlogPost[]
  title?: string
}

export function RelatedPosts({ posts, title = 'Artículos relacionados' }: RelatedPostsProps) {
  if (posts.length === 0) return null

  return (
    <section
      className="border-t border-slate-100 mt-16 pt-14"
      aria-labelledby="related-posts-heading"
    >
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="section-label">Seguir leyendo</p>
            <h2
              id="related-posts-heading"
              className="font-display font-bold text-3xl text-slate-900 tracking-tight"
            >
              {title}
            </h2>
          </div>
          <Link
            href="/blog"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold
                       text-primary-600 hover:text-primary-800 transition-colors duration-150"
          >
            Ver todo el blog
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Grid — 1 col mobile, 2 tablet, 3 desktop */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 3).map((post) => (
            <PostCard key={post.id} blog={post} variant="default" />
          ))}
        </div>

        {/* Mobile "ver todo" link */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold
                       text-primary-600 hover:text-primary-800 transition-colors duration-150"
          >
            Ver todo el blog
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
