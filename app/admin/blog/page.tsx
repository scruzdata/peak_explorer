import { Metadata } from 'next'
import dynamicImport from 'next/dynamic'

// OPTIMIZACIÓN: Lazy loading del panel de blog de admin para separar su bundle
// del bundle público. De este modo, todo el código de administración (incluyendo
// Firebase, editores markdown, etc.) SOLO se descarga cuando se visita /admin/blog.
const AdminProtected = dynamicImport(
  () => import('@/components/admin/AdminProtected').then((mod) => ({ default: mod.AdminProtected })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel de blog...</p>
        </div>
      </div>
    ),
  }
)

const AdminBlogPanel = dynamicImport(
  () => import('@/components/admin/AdminBlogPanel').then((mod) => ({ default: mod.AdminBlogPanel })),
  {
    ssr: false,
    loading: () => null, // AdminProtected ya muestra un loader a pantalla completa
  }
)

export const metadata: Metadata = {
  title: 'Gestión de Blog - Panel de Administración',
  description: 'Gestiona artículos del blog',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminBlogPage() {
  return (
    <AdminProtected>
      <AdminBlogPanel />
    </AdminProtected>
  )
}
