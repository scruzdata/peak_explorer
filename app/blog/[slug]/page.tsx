import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import dynamicImport from 'next/dynamic'
import { Calendar, Clock, Eye, Tag, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import {
  getBlogBySlugFromFirestore,
  incrementBlogViews,
  getRecentBlogsFromFirestore,
} from '@/lib/firebase/blogs'
import { calculateReadingTime } from '@/lib/utils'
import { BlogFeaturedImage } from '@/components/blog/BlogFeaturedImage'
import { RelatedPosts } from '@/components/blog/RelatedPosts'
import { TableOfContents } from '@/components/blog/TableOfContents'
import { extractHeadingsFromJson } from '@/lib/blogHeadings'

// Heavy Tiptap renderer — lazy loaded, client only
const BlogRenderer = dynamicImport(
  () =>
    import('@/components/blog/renderers/BlogRenderer').then((m) => ({
      default: m.BlogRenderer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4 py-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-4 rounded bg-slate-200"
            style={{ width: `${75 + (i % 3) * 10}%` }}
          />
        ))}
      </div>
    ),
  }
)

interface BlogPostPageProps {
  params: { slug: string }
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const blog = await getBlogBySlugFromFirestore(params.slug, false)
  if (!blog) return { title: 'Artículo no encontrado — Peak Explorer' }

  return {
    title: blog.seo.metaTitle || `${blog.title} — Peak Explorer`,
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
  if (!blog) notFound()

  // Fire-and-forget view increment
  incrementBlogViews(blog.id).catch(console.error)

  // Parallel data: related posts + heading extraction
  const recentBlogs = await getRecentBlogsFromFirestore(blog.id, 3)
  const readingTime = blog.readingTime ?? calculateReadingTime(blog.content)
  const headings = blog.contentJson ? extractHeadingsFromJson(blog.contentJson) : []

  const publishedDate = new Date(
    blog.publishedAt ?? blog.createdAt
  ).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <article className="min-h-screen bg-editorial-50">

      {/* ── Hero image — full width, no container ── */}
      {blog.featuredImage?.url ? (
        <div className="relative h-72 sm:h-96 lg:h-[480px] w-full overflow-hidden">
          <BlogFeaturedImage
            image={blog.featuredImage}
            alt={blog.featuredImage.alt || blog.title}
            priority
            className="h-full"
          />
          {/* Bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-editorial-50/80 via-transparent to-transparent pointer-events-none" />
        </div>
      ) : (
        <div className="h-16 bg-editorial-950" />
      )}

      {/* ── Article header ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Back nav */}
        <div className="pt-6 pb-2">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-700
                       transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al blog
          </Link>
        </div>

        {/* Tags */}
        {blog.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {blog.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1
                           text-xs font-bold uppercase tracking-wide text-primary-800"
              >
                <Tag className="h-3 w-3" aria-hidden="true" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1
          className="mt-4 font-display font-bold text-slate-900 leading-none tracking-tight text-balance
                     text-3xl sm:text-4xl lg:text-5xl xl:text-6xl max-w-4xl"
        >
          {blog.title}
        </h1>

        {/* Meta row */}
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 border-b border-slate-200 pb-6">
          {blog.author?.name && (
            <span className="font-semibold text-slate-700">{blog.author.name}</span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
            {publishedDate}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
            {readingTime} min lectura
          </span>
          {blog.views !== undefined && (
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
              {blog.views.toLocaleString('es-ES')} lecturas
            </span>
          )}
        </div>
      </div>

      {/* ── Two-column layout: content + sidebar ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_300px]">

          {/* ── Main content column ── */}
          <div className="min-w-0">

            {/* Excerpt lede */}
            {blog.excerpt && (
              <p className="text-xl font-medium text-slate-600 leading-relaxed mb-8 border-l-4 border-cta-500 pl-5">
                {blog.excerpt}
              </p>
            )}

            {/* ToC — mobile only (desktop is in sticky sidebar) */}
            {headings.length > 0 && (
              <div className="mb-8 lg:hidden">
                <TableOfContents headings={headings} />
              </div>
            )}

            {/* Article body */}
            <div
              data-blog-content
              className="prose prose-slate prose-lg max-w-none
                         prose-headings:font-display prose-headings:tracking-tight prose-headings:text-slate-900
                         prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4
                         prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                         prose-p:text-slate-600 prose-p:leading-relaxed
                         prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline
                         prose-strong:text-slate-800
                         prose-blockquote:border-l-cta-500 prose-blockquote:bg-cta-50 prose-blockquote:rounded-r-xl prose-blockquote:py-1
                         prose-code:bg-slate-100 prose-code:rounded prose-code:px-1.5 prose-code:text-sm
                         prose-img:rounded-2xl prose-img:shadow-md"
            >
              {blog.contentJson ? (
                <BlogRenderer contentJson={blog.contentJson} />
              ) : (
                <p className="whitespace-pre-wrap text-slate-700">{blog.content}</p>
              )}
            </div>

            {/* Tags footer */}
            {blog.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-slate-100 flex flex-wrap gap-2">
                {blog.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white border border-slate-200 px-3 py-1
                               text-xs font-medium text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Sticky sidebar ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Table of contents */}
              {headings.length > 0 && (
                <TableOfContents headings={headings} />
              )}

              {/* Author card */}
              {blog.author?.name && (
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <p className="section-label">Autor</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 font-display font-bold text-primary-700 text-lg shrink-0">
                      {blog.author.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-800">
                        {blog.author.name}
                      </p>
                      <p className="text-xs text-slate-400">Peak Explorer</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </aside>
        </div>
      </div>

      {/* ── Related posts ── */}
      {recentBlogs.length > 0 && (
        <RelatedPosts posts={recentBlogs} />
      )}
    </article>
  )
}
