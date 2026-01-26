'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Edit, Trash2, Eye, Loader2, FileText, Route as RouteIcon, Search } from 'lucide-react'
import { getAllBlogsFromFirestore, deleteBlogFromFirestore } from '@/lib/firebase/blogs'
import { BlogPost, BlogStatus } from '@/types'
import { BlogForm } from './BlogForm'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AdminBlogPanel() {
  const pathname = usePathname()
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBlog, setEditingBlog] = useState<BlogPost | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | BlogStatus>('all')
  const [searchText, setSearchText] = useState<string>('')

  // Cargar blogs desde Firestore (incluyendo borradores)
  const loadBlogs = async () => {
    setLoading(true)
    try {
      console.log('🔄 Cargando blogs desde Firestore para admin...')
      const firestoreBlogs = await getAllBlogsFromFirestore(true) // Incluir borradores
      console.log(`📦 Blogs obtenidos de Firestore: ${firestoreBlogs.length}`)
      if (firestoreBlogs.length > 0) {
        console.log('📝 Blogs encontrados:', firestoreBlogs.map(b => ({ id: b.id, title: b.title, status: b.status })))
      }
      setBlogs(firestoreBlogs)
    } catch (error) {
      console.error('❌ Error cargando blogs desde Firestore:', error)
      setBlogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBlogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleNewBlog = () => {
    setEditingBlog(undefined)
    setShowForm(true)
  }

  const handleEditBlog = (blog: BlogPost) => {
    console.log('✏️  Editando blog:', blog.id, blog.title)
    setEditingBlog(blog)
    setShowForm(true)
  }

  const handleDeleteBlog = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este artículo?')) {
      return
    }

    setDeletingId(id)
    try {
      const success = await deleteBlogFromFirestore(id)
      if (success) {
        await loadBlogs()
      } else {
        alert('Error al eliminar el artículo. Revisa la consola para más detalles.')
      }
    } catch (error) {
      console.error('Error eliminando blog:', error)
      alert('Error al eliminar el artículo')
    } finally {
      setDeletingId(null)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingBlog(undefined)
  }

  const handleFormSave = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    await loadBlogs()
  }

  // Filtrar y ordenar blogs según el estado
  const filteredBlogs = useMemo(() => {
    const filtered = blogs.filter((blog) => {
      // Filtro por estado
      if (filterStatus !== 'all' && blog.status !== filterStatus) {
        return false
      }

      // Filtro por búsqueda de texto (solo título)
      if (searchText.trim() !== '') {
        const searchLower = searchText.toLowerCase().trim()
        const titleMatch = blog.title.toLowerCase().includes(searchLower)
        
        if (!titleMatch) {
          return false
        }
      }

      return true
    })
    
    // Ordenar: publicados primero (por publishedAt descendente), luego borradores (por createdAt descendente)
    const sorted = [...filtered].sort((a, b) => {
      // Si ambos están publicados, ordenar por publishedAt
      if (a.status === 'published' && b.status === 'published') {
        const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
        const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
        return bDate - aDate
      }
      // Si solo uno está publicado, el publicado va primero
      if (a.status === 'published' && b.status !== 'published') return -1
      if (a.status !== 'published' && b.status === 'published') return 1
      // Si ambos son borradores, ordenar por createdAt
      const aDate = new Date(a.createdAt).getTime()
      const bDate = new Date(b.createdAt).getTime()
      return bDate - aDate
    })
    
    console.log(`🔍 Filtro activo: "${filterStatus}", Búsqueda: "${searchText}", Blogs filtrados: ${sorted.length} de ${blogs.length} totales`)
    if (blogs.length > 0 && sorted.length === 0) {
      console.log('⚠️ No hay blogs que coincidan con el filtro. Estados disponibles:', [...new Set(blogs.map(b => b.status))])
    }
    return sorted
  }, [blogs, filterStatus, searchText])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
          <p className="mt-4 text-gray-600">Cargando blogs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Blog</h1>
            <p className="mt-2 text-gray-600">Gestiona artículos del blog</p>
          </div>
          <button
            onClick={handleNewBlog}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Nuevo Artículo</span>
          </button>
        </div>

        {/* Navegación entre secciones */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <Link
              href="/admin"
              className={`flex items-center space-x-2 border-b-2 px-1 py-4 text-sm font-medium ${
                pathname === '/admin'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <RouteIcon className="h-5 w-5" />
              <span>Rutas</span>
            </Link>
            <Link
              href="/admin/blog"
              className={`flex items-center space-x-2 border-b-2 px-1 py-4 text-sm font-medium ${
                pathname === '/admin/blog'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span>Blog</span>
            </Link>
          </nav>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="text-sm text-gray-600">Total Artículos</div>
            <div className="mt-2 text-3xl font-bold">{filteredBlogs.length}</div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="text-sm text-gray-600">Publicados</div>
            <div className="mt-2 text-3xl font-bold">
              {blogs.filter((b) => b.status === 'published').length}
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="text-sm text-gray-600">Borradores</div>
            <div className="mt-2 text-3xl font-bold">
              {blogs.filter((b) => b.status === 'draft').length}
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <div className="space-y-4">
            {/* Búsqueda de texto */}
            <div>
              <label htmlFor="search-text" className="mb-2 block text-sm font-medium text-gray-700">
                Buscar
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="search-text"
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Buscar por título..."
                  className="w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Filtro por estado */}
            <div className="flex items-center space-x-4">
              <label htmlFor="filter-status" className="text-sm font-medium text-gray-700">
                Estado:
              </label>
              <select
                id="filter-status"
                value={filterStatus}
                onChange={(e) => {
                  const value = e.target.value
                  setFilterStatus(value === 'all' ? 'all' : (value as BlogStatus))
                }}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="all">Todos</option>
                <option value="published">Publicados</option>
                <option value="draft">Borradores</option>
              </select>
            </div>

            {/* Botón para limpiar filtros */}
            {(filterStatus !== 'all' || searchText.trim() !== '') && (
              <div>
                <button
                  onClick={() => {
                    setFilterStatus('all')
                    setSearchText('')
                  }}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Blogs Table */}
        {filteredBlogs.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-md">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-600">
              {filterStatus === 'all' 
                ? 'No hay artículos. Crea tu primer artículo usando el botón &quot;Nuevo Artículo&quot;.'
                : filterStatus === 'published'
                ? 'No hay artículos publicados. Los artículos guardados como &quot;Borrador&quot; no aparecen aquí. Cambia el filtro a &quot;Todos&quot; o &quot;Borradores&quot; para verlos.'
                : 'No hay borradores.'}
            </p>
            {filterStatus === 'published' && blogs.length > 0 && (
              <p className="mt-2 text-sm text-gray-500">
                💡 Tip: Para publicar un artículo, edítalo y cambia su estado de &quot;Borrador&quot; a &quot;Publicado&quot;.
              </p>
            )}
            <button
              onClick={handleNewBlog}
              className="mt-4 btn-primary"
            >
              {filterStatus === 'all' ? 'Crear primer artículo' : 'Crear nuevo artículo'}
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Título
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Tags
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredBlogs.map((blog) => (
                    <tr key={blog.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{blog.title}</div>
                        <div className="text-xs text-gray-500 line-clamp-1">{blog.excerpt}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            blog.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {blog.status === 'published' ? 'Publicado' : 'Borrador'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {blog.publishedAt
                          ? new Date(blog.publishedAt).toLocaleDateString('es-ES')
                          : new Date(blog.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {blog.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex rounded-full bg-gray-100 px-2 text-xs text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                          {blog.tags.length > 2 && (
                            <span className="text-xs text-gray-500">+{blog.tags.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {blog.status === 'published' && (
                            <Link
                              href={`/blog/${blog.slug}`}
                              className="text-primary-600 hover:text-primary-900"
                              title="Ver"
                              target="_blank"
                            >
                              <Eye className="h-5 w-5" />
                            </Link>
                          )}
                          <button
                            onClick={() => handleEditBlog(blog)}
                            className="text-blue-600 hover:text-blue-900 cursor-pointer"
                            title="Editar"
                            type="button"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBlog(blog.id)}
                            className="text-red-600 hover:text-red-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Eliminar"
                            disabled={deletingId === blog.id}
                            type="button"
                          >
                            {deletingId === blog.id ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Trash2 className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Formulario de creación/edición */}
      {showForm && (
        <BlogForm
          blog={editingBlog}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}
    </div>
  )
}
