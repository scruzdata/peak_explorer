import { Metadata } from 'next'
import { getAllBlogsFromFirestore } from '@/lib/firebase/blogs'
import { BlogHero } from '@/components/blog/BlogHero'
import { BlogContent } from '@/components/blog/BlogContent'

export const metadata: Metadata = {
  title: 'Blog de Montaña — Peak Explorer',
  description:
    'Consejos, guías y experiencias sobre senderismo, vías ferratas y aventuras en la montaña española.',
  openGraph: {
    title: 'Blog de Montaña — Peak Explorer',
    description:
      'Consejos, guías y experiencias sobre senderismo, vías ferratas y aventuras en la montaña española.',
    type: 'website',
  },
}

export default async function BlogPage() {
  const blogs = await getAllBlogsFromFirestore(false)

  // Sort newest first
  const sorted = [...blogs].sort((a, b) => {
    const aTime = new Date(a.publishedAt ?? a.createdAt).getTime()
    const bTime = new Date(b.publishedAt ?? b.createdAt).getTime()
    return bTime - aTime
  })

  // Featured hero = latest post; rest go into the grid
  const [featuredBlog, ...remainingBlogs] = sorted

  // Build deduplicated tag list from all blogs (preserves insertion order)
  const tags = Array.from(new Set(sorted.flatMap((b) => b.tags))).filter(Boolean)

  if (sorted.length === 0) {
    return (
      <main className="min-h-screen bg-editorial-50 flex items-center justify-center">
        <div className="text-center py-24 px-4">
          <p className="font-display text-2xl font-bold text-slate-400">
            Aún no hay artículos publicados.
          </p>
          <p className="text-slate-500 mt-2">Vuelve pronto para descubrir contenido sobre montaña.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-editorial-50">
      {/* ── Page header ── */}
      <div className="bg-editorial-950 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-0.5">
              Peak Explorer
            </p>
            <h1 className="font-display font-bold text-white text-2xl sm:text-3xl tracking-tight leading-none">
              Blog de Montaña
            </h1>
          </div>
          <p className="hidden sm:block text-sm text-white/40">
            {sorted.length} {sorted.length === 1 ? 'artículo' : 'artículos'}
          </p>
        </div>
      </div>

      {/* ── Hero ── */}
      {featuredBlog && <BlogHero blog={featuredBlog} />}

      {/* ── Blog grid + sidebar ── */}
      <BlogContent blogs={remainingBlogs} tags={tags} />
    </main>
  )
}
