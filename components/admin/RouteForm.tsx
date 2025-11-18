'use client'

import { useState, useEffect } from 'react'
import { Route, RouteType, Difficulty, FerrataGrade, Season, RouteStatus, RouteTypeShape, DogsAllowed } from '@/types'
import { createRouteInFirestore, updateRouteInFirestore } from '@/lib/routes'
import { X, Save, Loader2 } from 'lucide-react'
import { commonFeatures } from '@/lib/data'

interface RouteFormProps {
  route?: Route
  onClose: () => void
  onSave: () => void
}

/**
 * Formulario para crear o editar rutas
 */
export function RouteForm({ route, onClose, onSave }: RouteFormProps) {
  // Verificar si es una ruta de Firestore (IDs de Firestore no empiezan con "route-")
  const isFirestoreRoute = route ? !route.id.startsWith('route-') : false
  const isEditing = !!route && isFirestoreRoute
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Route>>({
    type: route?.type || 'trekking',
    title: route?.title || '',
    summary: route?.summary || '',
    difficulty: route?.difficulty || 'Moderada',
    ferrataGrade: route?.ferrataGrade,
    distance: route?.distance || 0,
    elevation: route?.elevation || 0,
    duration: route?.duration || '',
    approach: route?.approach || '',
    approachInfo: route?.approachInfo || '',
    return: route?.return || '',
    returnInfo: route?.returnInfo || '',
    features: route?.features || [],
    bestSeason: route?.bestSeason || [],
    bestSeasonInfo: route?.bestSeasonInfo || '',
    orientation: route?.orientation || '',
    orientationInfo: route?.orientationInfo || '',
    food: route?.food || '',
    foodInfo: route?.foodInfo || '',
    status: route?.status || 'Abierta',
    routeType: route?.routeType || 'Circular',
    dogs: route?.dogs || 'Atados',
    location: route?.location || {
      region: '',
      province: '',
      coordinates: { lat: 0, lng: 0 },
    },
    parking: route?.parking || [],
    restaurants: route?.restaurants || [],
    heroImage: route?.heroImage || {
      url: '',
      alt: '',
      width: 1200,
      height: 800,
    },
    gallery: route?.gallery || [],
    gpx: route?.gpx || undefined,
    equipment: route?.equipment || [],
    accommodations: route?.accommodations || [],
    safetyTips: route?.safetyTips || [],
    storytelling: route?.storytelling || '',
    seo: route?.seo || {
      metaTitle: '',
      metaDescription: '',
      keywords: [],
    },
    views: route?.views || 0,
    downloads: route?.downloads || 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Preparar datos para guardar
      const dataToSave = { ...formData }
      
      // Si el GPX no tiene URL, eliminarlo o establecerlo como undefined
      if (!dataToSave.gpx?.url || dataToSave.gpx.url.trim() === '') {
        dataToSave.gpx = undefined
      } else {
        // Asegurar que el GPX tenga valores por defecto si falta algo
        dataToSave.gpx = {
          url: dataToSave.gpx.url,
          filename: dataToSave.gpx.filename || 'ruta.gpx',
          size: dataToSave.gpx.size || 0,
        }
      }
      
      let result: string | boolean | null = null
      
      // Si estamos editando una ruta de Firestore, actualizar
      if (isEditing && route?.id && isFirestoreRoute) {
        console.log('Actualizando ruta de Firestore:', route.id)
        result = await updateRouteInFirestore(route.id, dataToSave as Partial<Route>)
        if (result) {
          console.log('✅ Ruta actualizada exitosamente')
        } else {
          throw new Error('No se pudo actualizar la ruta')
        }
      } else {
        // Crear nueva ruta (ya sea nueva o migrando desde datos estáticos)
        if (route && !isFirestoreRoute) {
          console.log('⚠️  Migrando ruta de datos estáticos a Firestore...')
        } else {
          console.log('Creando nueva ruta...')
        }
        
        // Asegurar que tenemos todos los campos requeridos
        const fullRouteData: Omit<Route, 'id' | 'slug' | 'createdAt' | 'updatedAt'> = {
          type: dataToSave.type || 'trekking',
          title: dataToSave.title || '',
          summary: dataToSave.summary || '',
          difficulty: dataToSave.difficulty || 'Moderada',
          ferrataGrade: dataToSave.ferrataGrade,
          distance: dataToSave.distance || 0,
          elevation: dataToSave.elevation || 0,
          duration: dataToSave.duration || '',
          approach: dataToSave.approach,
          approachInfo: dataToSave.approachInfo,
          return: dataToSave.return,
          returnInfo: dataToSave.returnInfo,
          features: dataToSave.features || [],
          bestSeason: dataToSave.bestSeason || [],
          bestSeasonInfo: dataToSave.bestSeasonInfo,
          orientation: dataToSave.orientation || '',
          orientationInfo: dataToSave.orientationInfo,
          food: dataToSave.food,
          foodInfo: dataToSave.foodInfo,
          status: dataToSave.status || 'Abierta',
          routeType: dataToSave.routeType,
          dogs: dataToSave.dogs,
          location: dataToSave.location || {
            region: '',
            province: '',
            coordinates: { lat: 0, lng: 0 },
          },
          parking: dataToSave.parking,
          restaurants: dataToSave.restaurants,
          heroImage: dataToSave.heroImage || {
            url: '',
            alt: '',
            width: 1200,
            height: 800,
          },
          gallery: dataToSave.gallery || [],
          gpx: dataToSave.gpx,
          equipment: dataToSave.equipment || [],
          accommodations: dataToSave.accommodations || [],
          safetyTips: dataToSave.safetyTips || [],
          storytelling: dataToSave.storytelling || '',
          seo: dataToSave.seo || {
            metaTitle: '',
            metaDescription: '',
            keywords: [],
          },
          views: dataToSave.views || 0,
          downloads: dataToSave.downloads || 0,
        }
        
        result = await createRouteInFirestore(fullRouteData)
        if (result) {
          console.log('✅ Ruta creada exitosamente con ID:', result)
        } else {
          throw new Error('No se pudo crear la ruta')
        }
      }
      
      // Esperar un momento para que Firestore se actualice
      await new Promise(resolve => setTimeout(resolve, 500))
      
      onSave()
      onClose()
    } catch (error: any) {
      console.error('Error guardando ruta:', error)
      const errorMessage = error?.message || 'Error desconocido'
      const errorCode = error?.code || 'unknown'
      
      let userMessage = 'Error al guardar la ruta. Por favor, intenta de nuevo.'
      
      if (errorCode === 'permission-denied') {
        userMessage = 'Error de permisos. Verifica las reglas de seguridad de Firestore.'
      } else if (errorCode === 'invalid-argument') {
        userMessage = 'Error de datos inválidos. Verifica que todos los campos requeridos estén completos.'
      } else if (errorMessage.includes('undefined')) {
        userMessage = 'Error: Hay campos con valores inválidos. Por favor, revisa el formulario.'
      }
      
      alert(`${userMessage}\n\nDetalles: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateNestedField = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...(prev[parent as keyof Route] as any), [field]: value },
    }))
  }

  const toggleFeature = (featureId: string) => {
    const feature = commonFeatures.find(f => f.id === featureId)
    if (!feature) return

    setFormData(prev => {
      const currentFeatures = prev.features || []
      const exists = currentFeatures.some(f => f.id === featureId)
      
      return {
        ...prev,
        features: exists
          ? currentFeatures.filter(f => f.id !== featureId)
          : [...currentFeatures, feature],
      }
    })
  }

  const toggleSeason = (season: Season) => {
    setFormData(prev => {
      const currentSeasons = prev.bestSeason || []
      const exists = currentSeasons.includes(season)
      
      return {
        ...prev,
        bestSeason: exists
          ? currentSeasons.filter(s => s !== season)
          : [...currentSeasons, season],
      }
    })
  }

  const addSafetyTip = () => {
    setFormData(prev => ({
      ...prev,
      safetyTips: [...(prev.safetyTips || []), ''],
    }))
  }

  const updateSafetyTip = (index: number, value: string) => {
    setFormData(prev => {
      const tips = [...(prev.safetyTips || [])]
      tips[index] = value
      return { ...prev, safetyTips: tips }
    })
  }

  const removeSafetyTip = (index: number) => {
    setFormData(prev => {
      const tips = [...(prev.safetyTips || [])]
      tips.splice(index, 1)
      return { ...prev, safetyTips: tips }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {isEditing ? 'Editar Ruta' : 'Nueva Ruta'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Información Básica</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => updateField('type', e.target.value as RouteType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="trekking">Trekking</option>
                  <option value="ferrata">Vía Ferrata</option>
                </select>
              </div>

              {formData.type === 'ferrata' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Grado Ferrata</label>
                  <select
                    value={formData.ferrataGrade || 'K1'}
                    onChange={(e) => updateField('ferrataGrade', e.target.value as FerrataGrade)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="K1">K1</option>
                    <option value="K2">K2</option>
                    <option value="K3">K3</option>
                    <option value="K4">K4</option>
                    <option value="K5">K5</option>
                    <option value="K6">K6</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Dificultad</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => updateField('difficulty', e.target.value as Difficulty)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="Fácil">Fácil</option>
                  <option value="Moderada">Moderada</option>
                  <option value="Difícil">Difícil</option>
                  <option value="Muy Difícil">Muy Difícil</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value as RouteStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="Abierta">Abierta</option>
                  <option value="Cerrada">Cerrada</option>
                  <option value="Condicional">Condicional</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Título *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Resumen *</label>
              <textarea
                value={formData.summary}
                onChange={(e) => updateField('summary', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Distancia (km) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.distance}
                  onChange={(e) => updateField('distance', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Desnivel (m) *</label>
                <input
                  type="number"
                  value={formData.elevation}
                  onChange={(e) => updateField('elevation', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Duración *</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => updateField('duration', e.target.value)}
                  placeholder="4-5 horas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Ubicación</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Región *</label>
                <input
                  type="text"
                  value={formData.location?.region || ''}
                  onChange={(e) => updateNestedField('location', 'region', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Provincia *</label>
                <input
                  type="text"
                  value={formData.location?.province || ''}
                  onChange={(e) => updateNestedField('location', 'province', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Latitud *</label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.location?.coordinates?.lat || 0}
                  onChange={(e) => updateNestedField('location', 'coordinates', {
                    ...formData.location?.coordinates,
                    lat: parseFloat(e.target.value),
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Longitud *</label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.location?.coordinates?.lng || 0}
                  onChange={(e) => updateNestedField('location', 'coordinates', {
                    ...formData.location?.coordinates,
                    lng: parseFloat(e.target.value),
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
          </div>

          {/* Características */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Características</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">Características de la ruta</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {commonFeatures.map((feature) => (
                  <label key={feature.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.features?.some(f => f.id === feature.id) || false}
                      onChange={() => toggleFeature(feature.id)}
                      className="rounded"
                    />
                    <span>{feature.icon} {feature.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mejor época</label>
              <div className="flex flex-wrap gap-2">
                {(['Primavera', 'Verano', 'Otoño', 'Invierno'] as Season[]).map((season) => (
                  <label key={season} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.bestSeason?.includes(season) || false}
                      onChange={() => toggleSeason(season)}
                      className="rounded"
                    />
                    <span>{season}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">SEO</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">Meta Título</label>
              <input
                type="text"
                value={formData.seo?.metaTitle || ''}
                onChange={(e) => updateNestedField('seo', 'metaTitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Meta Descripción</label>
              <textarea
                value={formData.seo?.metaDescription || ''}
                onChange={(e) => updateNestedField('seo', 'metaDescription', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={2}
              />
            </div>
          </div>

          {/* Imagen Hero */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Imagen Principal</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">URL de la imagen *</label>
              <input
                type="url"
                value={formData.heroImage?.url || ''}
                onChange={(e) => updateNestedField('heroImage', 'url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Texto alternativo</label>
              <input
                type="text"
                value={formData.heroImage?.alt || ''}
                onChange={(e) => updateNestedField('heroImage', 'alt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* GPX */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Archivo GPX (Opcional)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">URL del GPX</label>
                <input
                  type="url"
                  value={formData.gpx?.url || ''}
                  onChange={(e) => updateNestedField('gpx', 'url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://ejemplo.com/ruta.gpx"
                />
                <p className="mt-1 text-xs text-gray-500">Opcional: Dejar vacío si no hay archivo GPX</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nombre del archivo</label>
                <input
                  type="text"
                  value={formData.gpx?.filename || ''}
                  onChange={(e) => updateNestedField('gpx', 'filename', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="ruta.gpx"
                />
              </div>
            </div>
          </div>

          {/* Consejos de Seguridad */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Consejos de Seguridad</h3>
            
            {formData.safetyTips?.map((tip, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={tip}
                  onChange={(e) => updateSafetyTip(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Consejo de seguridad"
                />
                <button
                  type="button"
                  onClick={() => removeSafetyTip(index)}
                  className="px-3 py-2 text-red-600 hover:text-red-800"
                >
                  Eliminar
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addSafetyTip}
              className="text-primary-600 hover:text-primary-800 text-sm"
            >
              + Añadir consejo
            </button>
          </div>

          {/* Storytelling */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Historia/Narrativa (Markdown)</h3>
            
            <textarea
              value={formData.storytelling || ''}
              onChange={(e) => updateField('storytelling', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              rows={10}
              placeholder="# Título&#10;&#10;Contenido en Markdown..."
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center space-x-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>{isEditing ? 'Actualizar' : 'Crear'} Ruta</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

