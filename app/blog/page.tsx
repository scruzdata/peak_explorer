import { Metadata } from 'next'
import { getAllBlogsFromFirestore } from '@/lib/firebase/blogs'
import { BlogPost } from '@/types'
import { BlogCard } from '@/components/blog/BlogCard'

export const metadata: Metadata = {
  title: 'Blog - Peak Explorer',
  description: 'Artículos sobre montaña, rutas de senderismo y vías ferratas',
}

export default async function BlogPage() {
  // Obtener solo blogs publicados
  const blogs = await getAllBlogsFromFirestore(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Blog de Montaña
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-primary-100">
            Descubre consejos, experiencias y guías sobre rutas de senderismo, vías ferratas y aventuras en la montaña.
          </p>
        </div>
      </div>

      {/* Blog List */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {blogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Aún no hay artículos publicados.</p>
            <p className="text-gray-500 mt-2">Vuelve pronto para descubrir contenido sobre montaña.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
