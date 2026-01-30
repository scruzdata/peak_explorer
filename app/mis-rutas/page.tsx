import { Metadata } from 'next'
import dynamicImport from 'next/dynamic'

// OPTIMIZACIÓN: Lazy loading de MyRoutes (usa componentes pesados y Firebase)
const MyRoutes = dynamicImport(
  () => import('@/components/user/MyRoutes').then((mod) => ({ default: mod.MyRoutes })),
  { 
    ssr: false, // Componente de usuario, no crítico para SEO
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tus rutas...</p>
        </div>
      </div>
    )
  }
)

export const metadata: Metadata = {
  title: 'Mis Rutas - Peak Explorer',
  description: 'Tus rutas guardadas y completadas',
}

export default function MisRutasPage() {
  return <MyRoutes />
}

