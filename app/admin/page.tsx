import { Metadata } from 'next'
import dynamicImport from 'next/dynamic'

// OPTIMIZACIÓN: Lazy loading completo del admin para separar completamente su bundle
// El admin contiene componentes pesados (editores, formularios, etc.) que no deben cargarse en la landing
const AdminProtected = dynamicImport(
  () => import('@/components/admin/AdminProtected').then((mod) => ({ default: mod.AdminProtected })),
  { 
    ssr: false, // Admin no necesita SSR
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }
)

const AdminPanel = dynamicImport(
  () => import('@/components/admin/AdminPanel').then((mod) => ({ default: mod.AdminPanel })),
  { 
    ssr: false, // Admin no necesita SSR
    loading: () => null // AdminProtected ya muestra loading
  }
)

export const metadata: Metadata = {
  title: 'Panel de Administración - Peak Explorer',
  description: 'Gestiona rutas, contenido y configuración',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminPage() {
  return (
    <AdminProtected>
      <AdminPanel />
    </AdminProtected>
  )
}

