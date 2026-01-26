'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { useState, useEffect, useMemo } from 'react'
import { Plus, Edit, Trash2, Eye, Loader2, Filter, FileText, Route as RouteIcon, Search } from 'lucide-react'
import { getAllRoutesForAdmin, deleteRouteFromFirestore } from '@/lib/routes'
import { Route, RouteType, Difficulty } from '@/types'
import { RouteForm } from './RouteForm'
import { GPXUploader } from './GPXUploader'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AdminPanel() {
  const { user, signInAsAdmin } = useAuth()
  const pathname = usePathname()
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRoute, setEditingRoute] = useState<Route | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Estados para los filtros
  const [filterType, setFilterType] = useState<RouteType | 'all'>('all')
  const [filterRegion, setFilterRegion] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'all'>('all')
  const [searchText, setSearchText] = useState<string>('')
  
  // Cargar rutas SOLO desde Firestore (sin fallback a datos estáticos)
  const loadRoutes = async () => {
    setLoading(true)
    try {
      console.log('🔄 Cargando rutas desde Firestore para admin...')
      // getAllRoutesForAdmin() SIEMPRE obtiene de Firestore, nunca usa datos estáticos
      const firestoreRoutes = await getAllRoutesForAdmin()
      console.log(`📦 Rutas obtenidas de Firestore: ${firestoreRoutes.length}`)
      
      if (firestoreRoutes.length > 0) {
        console.log('✅ IDs de rutas válidas:', firestoreRoutes.map(r => ({ id: r.id.substring(0, 20) + '...', title: r.title })))
      }
      
      setRoutes(firestoreRoutes)
      
      if (firestoreRoutes.length === 0) {
        console.log('ℹ️  No hay rutas en Firestore. Crea tu primera ruta usando el botón "Nueva Ruta"')
      }
    } catch (error) {
      console.error('❌ Error cargando rutas desde Firestore:', error)
      // Si hay error, mostrar array vacío (no hacer fallback)
      setRoutes([])
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadRoutes()
  }, [])
  
  const handleNewRoute = () => {
    setEditingRoute(undefined)
    setShowForm(true)
  }
  
  const handleEditRoute = (route: Route) => {
    console.log('✏️  Editando ruta:', route.id, route.title)
    setEditingRoute(route)
    setShowForm(true)
    console.log('✅ Formulario abierto para edición')
  }
  
  const handleDeleteRoute = async (id: string) => {
    console.log('🗑️  Intentando eliminar ruta con ID:', id)
    
    // Verificar si es un ID de datos estáticos
    if (id.startsWith('route-') && /^route-\d+$/.test(id)) {
      alert('Esta ruta es de datos estáticos y no puede ser eliminada desde Firestore.\n\nSi quieres eliminarla, debes hacerlo desde el código fuente (lib/data.ts).')
      console.warn('⚠️  Intento de eliminar ruta de datos estáticos:', id)
      return
    }
    
    if (!confirm('¿Estás seguro de que quieres eliminar esta ruta?')) {
      console.log('❌ Eliminación cancelada por el usuario')
      return
    }
    
    setDeletingId(id)
    try {
      console.log('🔄 Llamando a deleteRouteFromFirestore con ID:', id)
      const success = await deleteRouteFromFirestore(id)
      console.log('📊 Resultado de deleteRouteFromFirestore:', success)
      
      if (success) {
        console.log('✅ Ruta eliminada exitosamente, recargando lista...')
        await loadRoutes()
        console.log('✅ Lista recargada')
      } else {
        console.error('❌ Error: deleteRouteFromFirestore devolvió false')
        alert('Error al eliminar la ruta. Revisa la consola para más detalles.')
      }
    } catch (error) {
      console.error('Error eliminando ruta:', error)
      alert('Error al eliminar la ruta')
    } finally {
      setDeletingId(null)
    }
  }
  
  const handleFormClose = () => {
    setShowForm(false)
    setEditingRoute(undefined)
  }
  
  const handleFormSave = async () => {
    // Esperar un poco más para que Firestore se actualice
    console.log('🔄 Esperando actualización de Firestore...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Recargar rutas después de guardar
    console.log('🔄 Recargando rutas después de guardar...')
    await loadRoutes()
    console.log('✅ Rutas recargadas')
  }

  /**
   * Maneja el éxito del procesamiento de GPX
   * Crea una ruta temporal con los datos procesados y abre el formulario
   */
  const handleGPXSuccess = (routeData: Partial<Route>) => {
    // Crear una ruta temporal con los datos del GPX procesado
    const tempRoute: Route = {
      id: 'temp-gpx-' + Date.now(),
      slug: '',
      type: routeData.type || 'trekking',
      title: routeData.title || 'Nueva Ruta desde GPX',
      summary: routeData.summary || '',
      difficulty: routeData.difficulty || 'Moderada',
      ferrataGrade: routeData.ferrataGrade,
      distance: routeData.distance || 0,
      elevation: routeData.elevation || 0,
      duration: routeData.duration || '',
      approach: routeData.approach,
      approachInfo: routeData.approachInfo,
      return: routeData.return,
      returnInfo: routeData.returnInfo,
      features: routeData.features || [],
      bestSeason: routeData.bestSeason || [],
      bestSeasonInfo: routeData.bestSeasonInfo,
      orientation: routeData.orientation || '',
      orientationInfo: routeData.orientationInfo,
      food: routeData.food,
      foodInfo: routeData.foodInfo,
      status: routeData.status || 'Abierta',
      routeType: routeData.routeType,
      dogs: routeData.dogs,
      location: routeData.location || {
        region: '',
        province: '',
        coordinates: { lat: 0, lng: 0 },
      },
      parking: routeData.parking || [],
      restaurants: routeData.restaurants || [],
      track: routeData.track,
      heroImage: routeData.heroImage || {
        url: '',
        alt: '',
        width: 1200,
        height: 800,
      },
      gallery: routeData.gallery || [],
      gpx: routeData.gpx,
      equipment: routeData.equipment || [],
      accommodations: routeData.accommodations || [],
      safetyTips: routeData.safetyTips || [],
      storytelling: routeData.storytelling || '',
      seo: routeData.seo || {
        metaTitle: '',
        metaDescription: '',
        keywords: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      downloads: 0,
    }

    // Abrir el formulario con los datos del GPX
    setEditingRoute(tempRoute)
    setShowForm(true)
  }

  // Obtener valores únicos para los filtros
  const uniqueRegions = useMemo(() => {
    const regions = new Set(routes.map((r: Route) => r.location.region))
    return Array.from(regions).sort()
  }, [routes])

  const uniqueDifficulties = useMemo(() => {
    const difficulties = new Set(routes.map((r: Route) => r.difficulty))
    return Array.from(difficulties).sort()
  }, [routes])

  // Filtrar rutas según los filtros seleccionados
  const filteredRoutes = useMemo(() => {
    return routes.filter((route: Route) => {
      // Filtro por tipo
      if (filterType !== 'all' && route.type !== filterType) {
        return false
      }

      // Filtro por región
      if (filterRegion !== 'all' && route.location.region !== filterRegion) {
        return false
      }

      // Filtro por dificultad
      if (filterDifficulty !== 'all' && route.difficulty !== filterDifficulty) {
        return false
      }

      // Filtro por búsqueda de texto (solo título)
      if (searchText.trim() !== '') {
        const searchLower = searchText.toLowerCase().trim()
        const titleMatch = route.title.toLowerCase().includes(searchLower)
        
        if (!titleMatch) {
          return false
        }
      }

      return true
    })
  }, [routes, filterType, filterRegion, filterDifficulty, searchText])

  if (!user || user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-md max-w-md mx-auto">
          <h2 className="mb-4 text-2xl font-semibold text-gray-800">Acceso al Panel Admin</h2>
          
          {!user ? (
            <>
              <p className="mb-6 text-gray-600">
                Necesitas iniciar sesión como administrador para acceder a esta página.
              </p>
              <button
                onClick={signInAsAdmin}
                className="btn-primary w-full"
              >
                Iniciar Sesión como Admin
              </button>
              <p className="mt-4 text-xs text-gray-500">
                ⚠️ Solo para desarrollo. En producción usarás autenticación real.
              </p>
            </>
          ) : (
            <>
              <p className="mb-6 text-gray-600">
                No tienes permisos de administrador. Tu rol actual es: <strong>{user.role}</strong>
              </p>
              <button
                onClick={signInAsAdmin}
                className="btn-primary w-full"
              >
                Cambiar a Admin
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
          <p className="mt-4 text-gray-600">Cargando rutas...</p>
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
          <button 
            onClick={handleNewRoute}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Nueva Ruta</span>
          </button>
        </div>

        {/* Navegación entre secciones */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <Link
              href="/admin"
              className={`flex items-center space-x-2 border-b-2 px-1 py-4 text-sm font-medium ${
                pathname === '/admin'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <RouteIcon className="h-5 w-5" />
              <span>Rutas</span>
            </Link>
            <Link
              href="/admin/blog"
              className={`flex items-center space-x-2 border-b-2 px-1 py-4 text-sm font-medium ${
                pathname === '/admin/blog'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span>Blog</span>
            </Link>
          </nav>
        </div>

        {/* Componente de subida de GPX */}
        <div className="mb-6">
          <GPXUploader
            onSuccess={handleGPXSuccess}
            onError={(error) => {
              console.error('Error procesando GPX:', error)
            }}
          />
        </div>

        {/* Filtros */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Filtros</h2>
          </div>
          
          {/* Búsqueda de texto */}
          <div className="mb-4">
            <label htmlFor="search-text" className="mb-2 block text-sm font-medium text-gray-700">
              Buscar
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="search-text"
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Buscar por título..."
                className="w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Filtro por Tipo */}
            <div>
              <label htmlFor="filter-type" className="mb-2 block text-sm font-medium text-gray-700">
                Tipo
              </label>
              <select
                id="filter-type"
                value={filterType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value as RouteType | 'all')}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="all">Todos los tipos</option>
                <option value="trekking">Trekking</option>
                <option value="ferrata">Via Ferrata</option>
              </select>
            </div>

            {/* Filtro por Región */}
            <div>
              <label htmlFor="filter-region" className="mb-2 block text-sm font-medium text-gray-700">
                Región
              </label>
              <select
                id="filter-region"
                value={filterRegion}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterRegion(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="all">Todas las regiones</option>
                {uniqueRegions.map((region: string) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Dificultad */}
            <div>
              <label htmlFor="filter-difficulty" className="mb-2 block text-sm font-medium text-gray-700">
                Dificultad
              </label>
              <select
                id="filter-difficulty"
                value={filterDifficulty}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterDifficulty(e.target.value as Difficulty | 'all')}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="all">Todas las dificultades</option>
                {uniqueDifficulties.map((difficulty: Difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Botón para limpiar filtros */}
          {(filterType !== 'all' || filterRegion !== 'all' || filterDifficulty !== 'all' || searchText.trim() !== '') && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setFilterType('all')
                  setFilterRegion('all')
                  setFilterDifficulty('all')
                  setSearchText('')
                }}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="text-sm text-gray-600">Total Rutas {filteredRoutes.length !== routes.length && `(${filteredRoutes.length} filtradas)`}</div>
            <div className="mt-2 text-3xl font-bold">{filteredRoutes.length}</div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="text-sm text-gray-600">Rutas de Trekking</div>
            <div className="mt-2 text-3xl font-bold">
              {filteredRoutes.filter((r: Route) => r.type === 'trekking').length}
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="text-sm text-gray-600">Vías Ferratas</div>
            <div className="mt-2 text-3xl font-bold">
              {filteredRoutes.filter((r: Route) => r.type === 'ferrata').length}
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
                {filteredRoutes.map((route: Route) => (
                  <tr key={route.slug || route.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{route.title}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        route.type === 'ferrata' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-primary-100 text-primary-800'
                      }`}>
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
                        <Link
                          href={`/rutas/${route.slug}`}
                          className="text-primary-600 hover:text-primary-900"
                          title="Ver"
                          target="_blank"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('🖱️  Click en botón editar para ruta:', route.id)
                            handleEditRoute(route)
                          }}
                          className="text-blue-600 hover:text-blue-900 cursor-pointer"
                          title="Editar"
                          type="button"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('🖱️  Click en botón eliminar para ruta:', route.id)
                            handleDeleteRoute(route.id)
                          }}
                          className="text-red-600 hover:text-red-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Eliminar"
                          disabled={deletingId === route.id}
                          type="button"
                        >
                          {deletingId === route.id ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
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

      {/* Formulario de creación/edición */}
      {showForm && (
        <RouteForm
          route={editingRoute}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}
    </div>
  )
}

