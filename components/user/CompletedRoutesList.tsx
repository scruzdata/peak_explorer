'use client'

import { UserProgress } from '@/types'
import { format } from 'date-fns'
import { Calendar, MapPin } from 'lucide-react'

interface CompletedRoutesListProps {
  completedRoutes: UserProgress['completedRoutes']
}

export function CompletedRoutesList({ completedRoutes }: CompletedRoutesListProps) {
  if (completedRoutes.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">Aún no has completado ninguna ruta.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {completedRoutes.map((route) => (
        <div
          key={route.routeId}
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="mb-2 text-lg font-semibold">Ruta {route.routeId}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  {format(new Date(route.completedAt), "d 'de' MMMM 'de' yyyy")}
                </div>
              </div>
              {route.notes && (
                <p className="mt-2 text-sm text-gray-700">{route.notes}</p>
              )}
            </div>
            {route.photo && (
              <div className="ml-4">
                <img
                  src={route.photo}
                  alt="Foto de la ruta"
                  className="h-20 w-20 rounded-lg object-cover"
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

