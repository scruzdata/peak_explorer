import { Metadata } from 'next'
import { RouteList } from '@/components/routes/RouteList'
import { getTrekkingRoutesFresh } from '@/lib/routes'

// Forzar recarga dinámica para ver cambios en data.ts
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Rutas de Montaña - Trekking en España',
  description: 'Descubre las mejores rutas de trekking y senderismo en España. Guías completas con mapas GPX, fotos y consejos de seguridad.',
  keywords: ['rutas montaña', 'trekking españa', 'senderismo', 'rutas hiking'],
}

export default function RutasPage() {
  // Obtener rutas frescas en cada render para reflejar cambios en data.ts
  const allTrekkingRoutes = getTrekkingRoutesFresh()
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section 
        className="relative text-white py-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://pictures.altai-travel.com/1920x0/mount-everest-aerial-view-himalayas-istock-3745.jpg)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/80 to-primary-800/80"></div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl mb-4">
            Rutas de Montaña
          </h1>
          <p className="text-xl text-primary-100 max-w-2xl">
            Explora las mejores rutas de trekking y senderismo en España. Desde paseos familiares hasta desafíos de alta montaña.
          </p>
        </div>
      </section>

      {/* Routes List */}
      <RouteList routes={allTrekkingRoutes} type="trekking" />
    </div>
  )
}

