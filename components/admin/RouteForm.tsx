'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import type { Components } from 'react-markdown'
import { Route, RouteType, Difficulty, FerrataGrade, Season, RouteStatus, RouteTypeShape, DogsAllowed, WebcamData } from '@/types'
import { createRouteInFirestore, updateRouteInFirestore } from '@/lib/routes'
import { saveTrackInFirestore } from '@/lib/firebase/tracks'
import { generateSlug } from '@/lib/utils'
import { 
  X, 
  Save, 
  Loader2, 
  Star, 
  FileText, 
  MapPin, 
  Car, 
  Utensils, 
  Award, 
  Search, 
  Image, 
  Images, 
  Route as RouteIcon, 
  Shield, 
  Video, 
  Hash, 
  Book 
} from 'lucide-react'
import { commonFeatures } from '@/lib/data'
import { AccordionItem } from './Accordion'

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
  // También excluir rutas temporales del GPX (empiezan con "temp-gpx-")
  const isFirestoreRoute = route ? !route.id.startsWith('route-') && !route.id.startsWith('temp-gpx-') : false
  const isEditing = !!route && isFirestoreRoute
  const [loading, setLoading] = useState(false)
  
  /**
   * Convierte webcams antiguas (string[]) al nuevo formato (WebcamData[])
   * Mantiene compatibilidad con datos existentes
   */
  const normalizeWebcams = (webcams: any): WebcamData[] => {
    if (!webcams || webcams.length === 0) return []
    
    // Si es un array de strings (formato antiguo), convertir a WebcamData[]
    if (typeof webcams[0] === 'string') {
      return webcams.map((url: string, index: number) => ({
        title: `Webcam ${index + 1}`,
        url: url,
      }))
    }
    
    // Si ya es WebcamData[], retornar tal cual
    return webcams
  }

  // Función para inicializar formData desde route
  const initializeFormData = useCallback((routeData?: Route): Partial<Route> => ({
    type: routeData?.type || 'trekking',
    title: routeData?.title || '',
    summary: routeData?.summary || '',
    difficulty: routeData?.difficulty || 'Moderada',
    ferrataGrade: routeData?.ferrataGrade,
    distance: routeData?.distance || 0,
    elevation: routeData?.elevation || 0,
    duration: routeData?.duration || '',
    approach: routeData?.approach || '',
    approachInfo: routeData?.approachInfo || '',
    return: routeData?.return || '',
    returnInfo: routeData?.returnInfo || '',
    features: routeData?.features || [],
    bestSeason: routeData?.bestSeason || [],
    bestSeasonInfo: routeData?.bestSeasonInfo || '',
    orientation: routeData?.orientation || '',
    orientationInfo: routeData?.orientationInfo || '',
    food: routeData?.food || '',
    foodInfo: routeData?.foodInfo || '',
    status: routeData?.status || 'Abierta',
    routeType: routeData?.routeType || 'Circular',
    dogs: routeData?.dogs || 'Atados',
    location: routeData?.location || {
      region: '',
      province: '',
      coordinates: { lat: 0, lng: 0 },
    },
    parking: routeData?.parking || [],
    restaurants: routeData?.restaurants || [],
    heroImage: routeData?.heroImage || {
      url: '',
      alt: '',
      width: 1200,
      height: 800,
    },
    gallery: routeData?.gallery || [],
    gpx: routeData?.gpx || undefined,
    equipment: routeData?.equipment || [],
    accommodations: routeData?.accommodations || [],
    safetyTips: routeData?.safetyTips || [],
    webcams: normalizeWebcams(routeData?.webcams),
    twitterHashtag: routeData?.twitterHashtag || '',
    storytelling: routeData?.storytelling || '',
    seo: routeData?.seo || {
      metaTitle: '',
      metaDescription: '',
      keywords: [],
    },
    views: routeData?.views || 0,
    downloads: routeData?.downloads || 0,
    rating: routeData?.rating ?? 0,
  }), [])

  const [formData, setFormData] = useState<Partial<Route>>(initializeFormData(route))

  // Actualizar formData cuando cambie la prop route (útil para datos del GPX)
  useEffect(() => {
    if (route) {
      setFormData(initializeFormData(route))
    }
  }, [route, initializeFormData])

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
          webcams: dataToSave.webcams || [],
          twitterHashtag: dataToSave.twitterHashtag || '',
          storytelling: dataToSave.storytelling || '',
          seo: dataToSave.seo || {
            metaTitle: '',
            metaDescription: '',
            keywords: [],
          },
          views: dataToSave.views || 0,
          downloads: dataToSave.downloads || 0,
          rating: dataToSave.rating ?? 0,
        }
        
        result = await createRouteInFirestore(fullRouteData)
        if (result) {
          console.log('✅ Ruta creada exitosamente con ID:', result)
        } else {
          throw new Error('No se pudo crear la ruta')
        }
      }
      
      // Guardar el track en Firestore si existe
      const trackToSave = dataToSave.track || route?.track
      if (trackToSave && Array.isArray(trackToSave) && trackToSave.length > 0) {
        try {
          const routeTitle = dataToSave.title || route?.title || 'Ruta sin título'
          const routeSlug = generateSlug(routeTitle)
          console.log(`📦 Intentando guardar track para ruta: ${routeSlug} (${trackToSave.length} puntos)`)
          await saveTrackInFirestore(routeSlug, trackToSave)
          console.log(`✅ Track guardado en Firestore para ruta: ${routeSlug} (${trackToSave.length} puntos)`)
        } catch (trackError: any) {
          // Si falla el guardado del track, registrar el error pero no fallar el proceso completo
          console.error('⚠️  Error guardando track en Firestore:', trackError)
          console.error('Detalles del error:', {
            message: trackError?.message,
            code: trackError?.code,
            stack: trackError?.stack,
          })
          console.error('La ruta se guardó correctamente pero el track no se pudo guardar')
        }
      } else {
        console.log('ℹ️  No hay track para guardar o el track está vacío')
        if (dataToSave.track) {
          console.log('Track en dataToSave:', Array.isArray(dataToSave.track), dataToSave.track?.length)
        }
        if (route?.track) {
          console.log('Track en route:', Array.isArray(route.track), route.track?.length)
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

  /**
   * Añade una nueva webcam al formulario
   */
  const addWebcam = () => {
    setFormData(prev => ({
      ...prev,
      webcams: [...(prev.webcams || []), { title: '', url: '' }],
    }))
  }

  /**
   * Actualiza el título de una webcam en el índice especificado
   */
  const updateWebcamTitle = (index: number, title: string) => {
    setFormData(prev => {
      const webcams = [...(prev.webcams || [])]
      webcams[index] = { ...webcams[index], title }
      return { ...prev, webcams }
    })
  }

  /**
   * Actualiza la URL de una webcam en el índice especificado
   */
  const updateWebcamUrl = (index: number, url: string) => {
    setFormData(prev => {
      const webcams = [...(prev.webcams || [])]
      webcams[index] = { ...webcams[index], url }
      return { ...prev, webcams }
    })
  }

  /**
   * Actualiza el código HTML de una webcam en el índice especificado
   */
  const updateWebcamHtml = (index: number, html: string) => {
    setFormData(prev => {
      const webcams = [...(prev.webcams || [])]
      webcams[index] = { ...webcams[index], html: html || undefined }
      return { ...prev, webcams }
    })
  }

  /**
   * Elimina una webcam del formulario
   */
  const removeWebcam = (index: number) => {
    setFormData(prev => {
      const webcams = [...(prev.webcams || [])]
      webcams.splice(index, 1)
      return { ...prev, webcams }
    })
  }

  const addParkingSpot = () => {
    setFormData(prev => ({
      ...prev,
      parking: [...(prev.parking || []), { lat: 0, lng: 0 }],
    }))
  }

  const updateParkingSpot = (index: number, field: 'lat' | 'lng', value: number) => {
    setFormData(prev => {
      const parking = [...(prev.parking || [])]
      parking[index] = { ...parking[index], [field]: value }
      return { ...prev, parking }
    })
  }

  const removeParkingSpot = (index: number) => {
    setFormData(prev => {
      const parking = [...(prev.parking || [])]
      parking.splice(index, 1)
      return { ...prev, parking }
    })
  }

  const addRestaurant = () => {
    setFormData(prev => ({
      ...prev,
      restaurants: [...(prev.restaurants || []), { lat: 0, lng: 0, name: '' }],
    }))
  }

  const updateRestaurant = (index: number, field: 'lat' | 'lng' | 'name', value: number | string) => {
    setFormData(prev => {
      const restaurants = [...(prev.restaurants || [])]
      restaurants[index] = { ...restaurants[index], [field]: value }
      return { ...prev, restaurants }
    })
  }

  const removeRestaurant = (index: number) => {
    setFormData(prev => {
      const restaurants = [...(prev.restaurants || [])]
      restaurants.splice(index, 1)
      return { ...prev, restaurants }
    })
  }

  const addGalleryImage = () => {
    setFormData(prev => ({
      ...prev,
      gallery: [
        ...(prev.gallery || []),
        {
          url: '',
          alt: '',
          width: 1200,
          height: 800,
        },
      ],
    }))
  }

  const updateGalleryImage = (index: number, field: keyof NonNullable<Route['gallery']>[number], value: string | number) => {
    setFormData(prev => {
      const gallery = [...(prev.gallery || [])]
      gallery[index] = { ...gallery[index], [field]: value }
      return { ...prev, gallery }
    })
  }

  const removeGalleryImage = (index: number) => {
    setFormData(prev => {
      const gallery = [...(prev.gallery || [])]
      gallery.splice(index, 1)
      return { ...prev, gallery }
    })
  }

  type MarkdownAction = 'bold' | 'italic' | 'heading' | 'list' | 'quote' | 'code' | 'break' | 'link'
  const storytellingRef = useRef<HTMLTextAreaElement>(null)

  const applyMarkdown = (action: MarkdownAction) => {
    const textarea = storytellingRef.current
    if (!textarea) return

    const value = formData.storytelling || ''
    const start = textarea.selectionStart ?? value.length
    const end = textarea.selectionEnd ?? value.length
    const selection = value.slice(start, end)

    const defaults: Record<MarkdownAction, string> = {
      bold: 'texto en negrita',
      italic: 'texto en cursiva',
      heading: 'Título de sección',
      list: 'Elemento de lista',
      quote: 'Cita o nota',
      code: 'console.log("hola")',
      break: '',
      link: 'enlace descriptivo',
    }

    const selectedText = selection || defaults[action]
    let replacement = ''

    switch (action) {
      case 'bold':
        replacement = `**${selectedText}**`
        break
      case 'italic':
        replacement = `*${selectedText}*`
        break
      case 'heading':
        replacement = `\n\n# ${selectedText}\n`
        break
      case 'list':
        replacement = `\n- ${selectedText}`
        break
      case 'quote':
        replacement = `\n> ${selectedText}`
        break
      case 'code':
        replacement = `\n\`\`\`\n${selectedText}\n\`\`\`\n`
        break
      case 'break':
        replacement = `\n\n${selectedText ? `${selectedText}\n\n` : ''}`
        break
      case 'link':
        replacement = `[${selectedText}](https://ejemplo.com)`
        break
      default:
        replacement = selectedText
    }

    const newValue = `${value.slice(0, start)}${replacement}${value.slice(end)}`
    updateField('storytelling', newValue)

    window.requestAnimationFrame(() => {
      const cursor = start + replacement.length
      textarea.focus()
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  const previewComponents: Components = {
    p: ({ ...props }) => (
      <p className="mb-3 whitespace-pre-line" {...props} />
    ),
    li: ({ ...props }) => (
      <li className="mb-1" {...props} />
    ),
  }

  // Helper para renderizar secciones con o sin acordeón
  const renderSection = (title: string, content: ReactNode, icon?: LucideIcon, defaultOpen: boolean = false) => {
    if (isEditing) {
      return (
        <AccordionItem title={title} icon={icon} defaultOpen={defaultOpen}>
          <div className="space-y-4">
            {content}
          </div>
        </AccordionItem>
      )
    }
    const IconComponent = icon
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
          {IconComponent && <IconComponent className="h-5 w-5 text-gray-600" />}
          {title}
        </h3>
        {content}
      </div>
    )
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
        <form onSubmit={handleSubmit} className={`p-6 ${isEditing ? 'space-y-2' : 'space-y-6'}`}>
          {/* Información Básica */}
          {renderSection('Información Básica', (
            <>
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

              <div>
                <label className="block text-sm font-medium mb-1">Rating</label>
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isActive = (formData.rating ?? 0) >= star
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => updateField('rating', star)}
                        className="focus:outline-none"
                        aria-label={`Asignar rating ${star}`}
                      >
                        <Star
                          className={`h-5 w-5 ${isActive ? 'text-amber-500' : 'text-gray-300'}`}
                          fill={isActive ? 'currentColor' : 'none'}
                          strokeWidth={1.5}
                        />
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => updateField('rating', undefined)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Limpiar
                  </button>
                </div>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={formData.rating ?? ''}
                  onChange={(e) => {
                    const value = e.target.value
                    updateField('rating', value === '' ? undefined : parseFloat(value))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            </>
          ), FileText, true)}

          {/* Ubicación */}
          {renderSection('Ubicación', (
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
          ), MapPin)}

        {/* Puntos de Parking */}
        {renderSection('Parking', (
          <>
            {(formData.parking || []).map((point, index) => (
            <div key={index} className="border border-gray-200 rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Parking #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeParkingSpot(index)}
                  className="text-red-600 text-sm hover:text-red-800"
                >
                  Eliminar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Latitud</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={point?.lat || 0}
                    onChange={(e) => updateParkingSpot(index, 'lat', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Longitud</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={point?.lng || 0}
                    onChange={(e) => updateParkingSpot(index, 'lng', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          ))}

            <button
              type="button"
              onClick={addParkingSpot}
              className="text-primary-600 hover:text-primary-800 text-sm"
            >
              + Añadir parking
            </button>
          </>
        ), Car)}

        {/* Restaurantes cercanos */}
        {renderSection('Restaurantes', (
          <>
            {(formData.restaurants || []).map((restaurant, index) => (
            <div key={index} className="border border-gray-200 rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Restaurante #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeRestaurant(index)}
                  className="text-red-600 text-sm hover:text-red-800"
                >
                  Eliminar
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  value={restaurant?.name || ''}
                  onChange={(e) => updateRestaurant(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Bar/Restaurante cercano"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Latitud</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={restaurant?.lat || 0}
                    onChange={(e) => updateRestaurant(index, 'lat', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Longitud</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={restaurant?.lng || 0}
                    onChange={(e) => updateRestaurant(index, 'lng', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          ))}

            <button
              type="button"
              onClick={addRestaurant}
              className="text-primary-600 hover:text-primary-800 text-sm"
            >
              + Añadir restaurante
            </button>
          </>
        ), Utensils)}

          {/* Características */}
          {renderSection('Características', (
            <>
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
            </>
          ), Award)}

          {/* SEO */}
          {renderSection('SEO', (
            <>
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
            </>
          ), Search)}

          {/* Imagen Hero */}
          {renderSection('Imagen Principal', (
            <>
              <div>
              <label className="block text-sm font-medium mb-1">URL de la imagen</label>
              <input
                type="url"
                value={formData.heroImage?.url || ''}
                onChange={(e) => updateNestedField('heroImage', 'url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
            </>
          ), Image)}

        {/* Galería */}
        {renderSection('Galería', (
          <>
            {(formData.gallery || []).map((image, index) => (
            <div key={index} className="border border-gray-200 rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Imagen #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeGalleryImage(index)}
                  className="text-red-600 text-sm hover:text-red-800"
                >
                  Eliminar
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <input
                  type="url"
                  value={image?.url || ''}
                  onChange={(e) => updateGalleryImage(index, 'url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Texto alternativo</label>
                <input
                  type="text"
                  value={image?.alt || ''}
                  onChange={(e) => updateGalleryImage(index, 'alt', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Descripción corta de la imagen"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fuente (Opcional)</label>
                <input
                  type="text"
                  value={image?.source || ''}
                  onChange={(e) => updateGalleryImage(index, 'source', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Ej: Wikiloc, AllTrails, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ancho (px)</label>
                  <input
                    type="number"
                    value={image?.width || 0}
                    onChange={(e) => updateGalleryImage(index, 'width', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Alto (px)</label>
                  <input
                    type="number"
                    value={image?.height || 0}
                    onChange={(e) => updateGalleryImage(index, 'height', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          ))}

            <button
              type="button"
              onClick={addGalleryImage}
              className="text-primary-600 hover:text-primary-800 text-sm"
            >
              + Añadir imagen
            </button>
          </>
        ), Images)}

          {/* GPX */}
          {renderSection('Archivo GPX (Opcional)', (
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
          ), RouteIcon)}

          {/* Consejos de Seguridad */}
          {renderSection('Consejos de Seguridad', (
            <>
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
            </>
          ), Shield)}

          {/* Webcams */}
          {renderSection('Webcams', (
            <>
              <p className="text-sm text-gray-600">
              Añade webcams con título y URL (iframe) o código HTML directamente. Si añades código HTML, se renderizará en lugar del iframe.
            </p>
            
            {formData.webcams?.map((webcam, index) => (
              <div key={index} className="space-y-2 p-4 border border-gray-200 rounded-lg">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={webcam.title || ''}
                    onChange={(e) => updateWebcamTitle(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Título de la webcam (ej: Webcam Pico Veleta)"
                  />
                  <button
                    type="button"
                    onClick={() => removeWebcam(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800 whitespace-nowrap"
                  >
                    Eliminar
                  </button>
                </div>
                <input
                  type="url"
                  value={webcam.url || ''}
                  onChange={(e) => updateWebcamUrl(index, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://ejemplo.com/webcam (para iframe)"
                />
                <textarea
                  value={webcam.html || ''}
                  onChange={(e) => updateWebcamHtml(index, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  placeholder="Código HTML opcional (ej: &lt;a href=&quot;...&quot;&gt;&lt;img src=&quot;...&quot;&gt;&lt;/a&gt;)"
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  Si añades código HTML, se usará en lugar de la URL. Deja vacío para usar el iframe con la URL.
                </p>
              </div>
            ))}
            
              <button
                type="button"
                onClick={addWebcam}
                className="text-primary-600 hover:text-primary-800 text-sm"
              >
                + Añadir webcam
              </button>
            </>
          ), Video)}

          {/* Twitter Hashtag */}
          {renderSection('Twitter Hashtag', (
            <>
              <p className="text-sm text-gray-600">
              Añade un hashtag de Twitter para mostrar un timeline con las noticias más recientes relacionadas con la ruta. Ejemplo: #PicoVeleta o #Mulhacen
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">Hashtag de Twitter</label>
              <input
                type="text"
                value={formData.twitterHashtag || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, twitterHashtag: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="#NombreRuta"
              />
              <p className="mt-1 text-xs text-gray-500">
                El hashtag se mostrará sin el símbolo # si lo incluyes. Ejemplo: escribe &quot;PicoVeleta&quot; o &quot;#PicoVeleta&quot;
              </p>
            </div>
            </>
          ), Hash)}

          {/* Storytelling */}
          {renderSection('Historia/Narrativa (Markdown)', (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">El panel inferior muestra una vista previa en tiempo real</span>
              </div>
              <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => applyMarkdown('bold')} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Negrita
                </button>
                <button type="button" onClick={() => applyMarkdown('italic')} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Cursiva
                </button>
                <button type="button" onClick={() => applyMarkdown('heading')} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Título
                </button>
                <button type="button" onClick={() => applyMarkdown('list')} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Lista
                </button>
                <button type="button" onClick={() => applyMarkdown('quote')} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Cita
                </button>
                <button type="button" onClick={() => applyMarkdown('code')} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Código
                </button>
                <button type="button" onClick={() => applyMarkdown('link')} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Enlace
                </button>
                <button type="button" onClick={() => applyMarkdown('break')} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Párrafo
                </button>
              </div>

              <textarea
                ref={storytellingRef}
                value={formData.storytelling || ''}
                onChange={(e) => updateField('storytelling', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                rows={12}
                placeholder="# Título&#10;&#10;Contenido en Markdown..."
              />
              <p className="text-xs text-gray-500">
                Usa Markdown para dar formato: títulos con <code>#</code>, listas con <code>-</code>, negritas <code>**texto**</code>, cursivas <code>*texto*</code> y respeta los saltos de línea para separar párrafos.
              </p>

              <div className="mt-4 border rounded-md p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Vista previa</h4>
                  <span className="text-xs text-gray-500">Así se mostrará en la ruta</span>
                </div>
                <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks] as any}
                    components={previewComponents}
                  >
                    {formData.storytelling || '*La vista previa aparecerá aquí cuando escribas contenido.*'}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
            </>
          ), Book)}

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

