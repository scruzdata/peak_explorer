import { Metadata } from 'next'
import dynamicImport from 'next/dynamic'

// OPTIMIZACIÓN: Lazy loading de UserProfile (usa componentes pesados y Firebase)
const UserProfile = dynamicImport(
  () => import('@/components/user/UserProfile').then((mod) => ({ default: mod.UserProfile })),
  { 
    ssr: false, // Componente de usuario, no crítico para SEO
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }
)

export const metadata: Metadata = {
  title: 'Mi Perfil - Peak Explorer',
  description: 'Gestiona tus rutas, badges y estadísticas en Peak Explorer',
}

export default function PerfilPage() {
  return <UserProfile />
}

