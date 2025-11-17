import { Metadata } from 'next'
import { RouteList } from '@/components/routes/RouteList'
import { getFerratasFresh } from '@/lib/routes'

// Forzar recarga dinámica para ver cambios en data.ts
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Vías Ferratas - Escalada en España',
  description: 'Descubre las mejores vías ferratas de España, desde K2 hasta K6. Guías completas con mapas GPX y consejos de seguridad.',
  keywords: ['vías ferratas', 'ferrata españa', 'escalada', 'k2 k3 k4 k5 k6'],
}

export default function ViasFerratasPage() {
  // Obtener rutas frescas en cada render para reflejar cambios en data.ts
  const allFerratas = getFerratasFresh()
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-accent-600 to-accent-800 text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl mb-4">
            Vías Ferratas
          </h1>
          <p className="text-xl text-accent-100 max-w-2xl">
            Experiencias verticales de K2 a K6. Vías ferratas equipadas para todos los niveles en las montañas de España.
          </p>
        </div>
      </section>

      {/* Routes List */}
      <RouteList routes={allFerratas} type="ferrata" />
    </div>
  )
}

