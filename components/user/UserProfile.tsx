'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { useUserProgress } from '@/components/providers/UserProgressProvider'
import { Trophy, Bookmark, MapPin, TrendingUp, Award } from 'lucide-react'
import { formatDistance, formatElevation } from '@/lib/utils'
import { BadgeDisplay } from './BadgeDisplay'
import { CompletedRoutesList } from './CompletedRoutesList'

export function UserProfile() {
  const { user } = useAuth()
  const { progress } = useUserProgress()

  if (!user || !progress) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-center text-gray-600">Por favor, inicia sesión para ver tu perfil.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold">Mi Perfil</h1>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-2 flex items-center text-gray-600">
              <MapPin className="mr-2 h-5 w-5" />
              <span className="text-sm font-medium">Distancia Total</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatDistance(progress.stats.totalDistance)}
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-2 flex items-center text-gray-600">
              <TrendingUp className="mr-2 h-5 w-5" />
              <span className="text-sm font-medium">Desnivel Acumulado</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatElevation(progress.stats.totalElevation)}
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-2 flex items-center text-gray-600">
              <Trophy className="mr-2 h-5 w-5" />
              <span className="text-sm font-medium">Rutas Completadas</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {progress.stats.routesCompleted}
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-2 flex items-center text-gray-600">
              <Bookmark className="mr-2 h-5 w-5" />
              <span className="text-sm font-medium">Rutas Guardadas</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {progress.bookmarks.length}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold flex items-center">
            <Award className="mr-2 h-6 w-6" />
            Badges
          </h2>
          <BadgeDisplay badges={progress.badges} />
        </div>

        {/* Completed Routes */}
        <div>
          <h2 className="mb-4 text-2xl font-bold">Rutas Completadas</h2>
          <CompletedRoutesList completedRoutes={progress.completedRoutes} />
        </div>
      </div>
    </div>
  )
}

