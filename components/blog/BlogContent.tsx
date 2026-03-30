'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { TrendingUp, Compass, ArrowRight, BookOpen } from 'lucide-react'
import { BlogPost } from '@/types'
import { CategoryFilter } from './CategoryFilter'
import { PostCard } from './PostCard'

interface BlogContentProps {
  /** All blogs except the hero post */
  blogs: BlogPost[]
  /** Deduplicated tag list for filter chips */
  tags: string[]
}

export function BlogContent({ blogs, tags }: BlogContentProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!activeTag) return blogs
    return blogs.filter((b) => b.tags.includes(activeTag))
  }, [blogs, activeTag])

  // Sidebar: top 4 by views (fallback: first 4)
  const popular = useMemo(
    () => [...blogs].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 4),
    [blogs]
  )

  // Bento grid layout: first post is featured (col-span-2 on md), rest are default
  const [featuredPost, ...restPosts] = filtered

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* ── Category filter bar ── */}
      <div className="mb-8">
        <CategoryFilter tags={tags} activeTag={activeTag} onChange={setActiveTag} />
      </div>

      {/* ── Main grid + sidebar ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">

        {/* ── Posts bento grid ── */}
        <div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <BookOpen className="h-12 w-12 text-slate-200 mb-4" aria-hidden="true" />
              <p className="text-slate-500 font-medium">No hay artículos en esta categoría.</p>
              <button
                onClick={() => setActiveTag(null)}
                className="mt-4 text-sm text-primary-600 hover:underline cursor-pointer"
              >
                Ver todos los artículos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* First post: featured (full width on sm, spans 2 cols) */}
              {featuredPost && (
                <div className="sm:col-span-2">
                  <PostCard blog={featuredPost} variant="featured" priority />
                </div>
              )}

              {/* Remaining posts: 2-column grid */}
              {restPosts.map((blog, i) => (
                <PostCard key={blog.id} blog={blog} variant="default" priority={i < 2} />
              ))}
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-6">

          {/* Popular posts widget */}
          {popular.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <p className="section-label">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                Más leídos
              </p>
              <ul className="space-y-4" aria-label="Artículos más leídos">
                {popular.map((blog, index) => (
                  <li key={blog.id} className="flex items-start gap-3">
                    {/* Rank number */}
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full
                                 bg-editorial-100 text-xs font-bold text-slate-500 mt-0.5"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <PostCard blog={blog} variant="horizontal" />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Route explorer CTA */}
          <div className="rounded-2xl bg-gradient-to-br from-editorial-950 to-primary-900 p-6 text-white overflow-hidden relative">
            {/* Decorative circle */}
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/5" aria-hidden="true" />
            <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-cta-500/20" aria-hidden="true" />

            <div className="relative">
              <Compass className="h-8 w-8 text-cta-400 mb-3" aria-hidden="true" />
              <h3 className="font-display font-bold text-xl text-white mb-2 leading-tight">
                Explora las rutas
              </h3>
              <p className="text-sm text-white/65 mb-5 leading-relaxed">
                Más de 200 rutas de senderismo y vías ferratas en España. Encuentra tu próxima aventura.
              </p>
              <Link
                href="/rutas"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full
                           bg-cta-500 hover:bg-cta-400 px-5 py-2.5
                           text-sm font-bold text-white transition-colors duration-200"
              >
                Ver todas las rutas
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Tags cloud */}
          {tags.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <p className="section-label">Categorías</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150 cursor-pointer
                      ${activeTag === tag
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-primary-400 hover:text-primary-700'
                      }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
