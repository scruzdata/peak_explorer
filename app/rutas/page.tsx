import { Metadata } from 'next'
import { RouteList } from '@/components/routes/RouteList'
import { getTrekkingRoutesAsync } from '@/lib/routes'

// Forzar recarga dinámica para obtener datos frescos de Firestore
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Rutas de Montaña - Trekking en España',
  description: 'Descubre las mejores rutas de trekking y senderismo en España. Guías completas con mapas GPX, fotos y consejos de seguridad.',
  keywords: ['rutas montaña', 'trekking españa', 'senderismo', 'rutas hiking'],
}

export default async function RutasPage() {
  // Obtener rutas desde Firestore (solo datos estáticos si Firestore no está configurado)
  const allTrekkingRoutes = await getTrekkingRoutesAsync()
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Routes List */}
      <RouteList routes={allTrekkingRoutes} type="trekking" />
    </div>
  )
}

