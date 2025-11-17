'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import { getAllRoutesFresh } from '@/lib/routes'
import { Route } from '@/types'

export function AdminPanel() {
  const { user } = useAuth()
  // Obtener rutas frescas y recargarlas periódicamente para reflejar cambios en data.ts
  const [routes, setRoutes] = useState<Route[]>(getAllRoutesFresh())
  
  useEffect(() => {
    // Recargar rutas cada vez que el componente se monte o se actualice
    setRoutes(getAllRoutesFresh())
  }, [])

  if (!user || user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="mb-2 text-xl font-semibold text-red-800">Acceso Denegado</h2>
          <p className="text-red-600">No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Panel de Administración</h1>
            <p className="mt-2 text-gray-600">Gestiona rutas y contenido</p>
          </div>
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Nueva Ruta</span>
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="text-sm text-gray-600">Total Rutas</div>
            <div className="mt-2 text-3xl font-bold">{routes.length}</div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="text-sm text-gray-600">Rutas de Trekking</div>
            <div className="mt-2 text-3xl font-bold">
              {routes.filter(r => r.type === 'trekking').length}
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="text-sm text-gray-600">Vías Ferratas</div>
            <div className="mt-2 text-3xl font-bold">
              {routes.filter(r => r.type === 'ferrata').length}
            </div>
          </div>
        </div>

        {/* Routes Table */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Dificultad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Región
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {routes.map((route) => (
                  <tr key={route.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{route.title}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-primary-100 text-primary-800">
                        {route.type === 'trekking' ? 'Trekking' : 'Ferrata'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {route.difficulty}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {route.location.region}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          className="text-primary-600 hover:text-primary-900"
                          title="Ver"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

