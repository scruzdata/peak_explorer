import { Metadata } from 'next'
import { RouteList } from '@/components/routes/RouteList'
import { getFerratasAsync } from '@/lib/routes'

// Forzar recarga dinámica para obtener datos frescos de Firestore
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Vías Ferratas - Escalada en España',
  description: 'Descubre las mejores vías ferratas de España, desde K2 hasta K6. Guías completas con mapas GPX y consejos de seguridad.',
  keywords: ['vías ferratas', 'ferrata españa', 'escalada', 'k2 k3 k4 k5 k6'],
}

export default async function ViasFerratasPage() {
  // Obtener rutas desde Firestore (solo datos estáticos si Firestore no está configurado)
  const allFerratas = await getFerratasAsync()
  
  // Ordenar rutas por createdAt (más recientes primero)
  const sortedRoutes = [...allFerratas].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return bTime - aTime // Más reciente primero
  })
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Routes List */}
      <RouteList routes={sortedRoutes} type="ferrata" />
    </div>
  )
}

