'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { useUserProgress } from '@/components/providers/UserProgressProvider'
import { getAllRoutesAsync } from '@/lib/routes'
import { RouteCard } from '@/components/routes/RouteCard'
import { Bookmark, CheckCircle2, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Route } from '@/types'

export function MyRoutes() {
  const { user } = useAuth()
  const { progress } = useUserProgress()
  const [allRoutes, setAllRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Cargar rutas desde Firestore
    const loadRoutes = async () => {
      try {
        const routes = await getAllRoutesAsync()
        setAllRoutes(routes)
      } catch (error) {
        console.error('Error cargando rutas:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (user && progress) {
      loadRoutes()
    } else {
      setLoading(false)
    }
  }, [user, progress])

  if (!user || !progress) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-center text-gray-600">Por favor, inicia sesión para ver tus rutas.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </div>
    )
  }

  const bookmarkedRoutes = allRoutes.filter(r => progress.bookmarks.includes(r.id))
  const completedRoutes = allRoutes.filter(r => 
    progress.completedRoutes.some(cr => cr.routeId === r.id)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold">Mis Rutas</h1>

        {/* Bookmarked Routes */}
        <section className="mb-12">
          <div className="mb-6 flex items-center space-x-2">
            <Bookmark className="h-6 w-6 text-primary-600" />
            <h2 className="text-2xl font-bold">Rutas Guardadas</h2>
            <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-medium">
              {bookmarkedRoutes.length}
            </span>
          </div>
          {bookmarkedRoutes.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {bookmarkedRoutes.map((route) => (
                <RouteCard key={route.id} route={route} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
              <p className="text-gray-600">Aún no has guardado ninguna ruta.</p>
            </div>
          )}
        </section>

        {/* Completed Routes */}
        <section>
          <div className="mb-6 flex items-center space-x-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold">Rutas Completadas</h2>
            <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-medium">
              {completedRoutes.length}
            </span>
          </div>
          {completedRoutes.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {completedRoutes.map((route) => (
                <RouteCard key={route.id} route={route} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
              <p className="text-gray-600">Aún no has completado ninguna ruta.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

