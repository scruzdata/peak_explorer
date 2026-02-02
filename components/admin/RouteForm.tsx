'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import NextImage from 'next/image'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'
import type { Components } from 'react-markdown'
import { Route, RouteType, Difficulty, FerrataGrade, Season, RouteStatus, RouteTypeShape, DogsAllowed, WebcamData } from '@/types'
import { createRouteInFirestore, updateRouteInFirestore } from '@/lib/routes'
import { saveTrackInFirestore } from '@/lib/firebase/tracks'
import { generateSlug } from '@/lib/utils'
import { uploadRouteImage, uploadFerrataImage, deleteStorageFileByUrl, uploadOptimizedRouteImageSet, UploadProgressState } from '@/lib/firebase/storage'
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
  Image as ImageIcon, 
  Route as RouteIcon, 
  Shield, 
  Video, 
  Hash, 
  Book,
  Bold,
  Italic,
  List,
  Quote,
  Code2,
  Link2,
  Heading,
  AlignCenter,
  Pilcrow
} from 'lucide-react'
import { commonFeatures } from '@/lib/data'
import { AccordionItem } from './Accordion'
import { GPXUploader } from './GPXUploader'

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
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  
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
    track: routeData?.track,
    waypoints: routeData?.waypoints,
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
        // Eliminar el campo 'track' de dataToSave antes de actualizar la ruta
        // porque el track se guarda en la colección 'tracks' separada
        const { track, ...routeDataWithoutTrack } = dataToSave
        result = await updateRouteInFirestore(route.id, routeDataWithoutTrack as Partial<Route>)
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
          // track NO se guarda aquí, se guarda en la colección 'tracks' separada
          waypoints: dataToSave.waypoints,
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
          // Si estamos editando, usar el slug de la ruta existente
          // Si no, generar uno nuevo basado en el título
          const routeSlug = isEditing && route?.slug 
            ? route.slug 
            : generateSlug(dataToSave.title || route?.title || 'Ruta sin título')
          
          console.log(`📦 Intentando guardar track para ruta: ${routeSlug} (${trackToSave.length} puntos)`)
          if (isEditing) {
            console.log(`🔄 Actualizando track existente para ruta: ${routeSlug}`)
          } else {
            console.log(`✨ Creando nuevo track para ruta: ${routeSlug}`)
          }
          await saveTrackInFirestore(routeSlug, trackToSave)
          console.log(`✅ Track guardado en Firestore para ruta: ${routeSlug} (${trackToSave.length} puntos)`)
          
          // Si hay waypoints, también se guardan en la ruta (ya están en dataToSave.waypoints)
          if (dataToSave.waypoints && dataToSave.waypoints.length > 0) {
            console.log(`✅ Waypoints guardados: ${dataToSave.waypoints.length} puntos de interés`)
          }
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

  /**
   * Maneja el éxito de la carga de un nuevo GPX cuando se edita una ruta
   * Actualiza el track y waypoints con los nuevos datos del GPX
   */
  const handleGPXUploadSuccess = (routeData: Partial<Route>) => {
    setFormData(prev => ({
      ...prev,
      // Actualizar datos básicos del track si vienen del GPX
      distance: routeData.distance ?? prev.distance,
      elevation: routeData.elevation ?? prev.elevation,
      duration: routeData.duration || prev.duration,
      routeType: routeData.routeType || prev.routeType,
      // Reemplazar completamente el track y waypoints
      track: routeData.track,
      waypoints: routeData.waypoints,
      // Actualizar SOLO las coordenadas si vienen del GPX, manteniendo región y provincia
      location:
        routeData.location?.coordinates && prev.location
          ? {
              ...prev.location,
              coordinates: routeData.location.coordinates,
            }
          : prev.location,
    }))
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

  const handleRemoveGalleryImage = async (index: number) => {
    const image = formData.gallery?.[index]
    if (!image) return

    // Intentar borrar también del Storage si las URLs pertenecen a nuestro bucket
    const urlsToDelete = new Set<string>()
    if (image.url) urlsToDelete.add(image.url)
    if (image.optimizedSources?.w400) urlsToDelete.add(image.optimizedSources.w400)
    if (image.optimizedSources?.w800) urlsToDelete.add(image.optimizedSources.w800)
    if (image.optimizedSources?.w1600) urlsToDelete.add(image.optimizedSources.w1600)

    for (const url of urlsToDelete) {
      try {
        await deleteStorageFileByUrl(url)
      } catch (error) {
        console.error('Error eliminando imagen de Storage:', error)
        // No bloqueamos la eliminación en el formulario si falla Storage
      }
    }

    removeGalleryImage(index)
  }

  const handleImageUpload = async (file: File, type: 'gallery' | 'hero' = 'gallery') => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen')
      return
    }

    setUploadingImage(true)
    setUploadProgress(0)
    try {
      // Generar el nombre de la carpeta: usar slug si existe, o generar uno del título
      const routeFolderName = route?.slug || route?.id || (formData.title?.trim() ? generateSlug(formData.title.trim()) : undefined)
      if (!routeFolderName) {
        throw new Error('No se pudo determinar la carpeta de la ruta para subir la imagen')
      }

      // Subir versiones optimizadas en función del tipo de ruta
      const onProgress = (state: UploadProgressState) => {
        setUploadProgress(Math.round(state.progress))
      }

      const isFerrata = formData.type === 'ferrata'
      const optimizedSet = await uploadOptimizedRouteImageSet(
        file,
        routeFolderName,
        type === 'hero' ? 'hero' : 'gallery',
        onProgress,
        isFerrata ? 'Vias_ferratas' : 'Rutas'
      )

      const sortedVariants = [...optimizedSet.variants].sort((a, b) => a.width - b.width)
      const w400 = sortedVariants.find((v) => v.width <= 450)
      const w800 = sortedVariants.find((v) => v.width > 450 && v.width <= 1000) || sortedVariants[0]
      const w1600 = sortedVariants[sortedVariants.length - 1]

      const imageData = {
        url: w800?.url || optimizedSet.base.url,
        alt: file.name,
        width: optimizedSet.base.width,
        height: optimizedSet.base.height,
        aspectRatio: optimizedSet.aspectRatio,
        optimizedSources: {
          w400: w400?.url,
          w800: w800?.url,
          w1600: w1600?.url,
        },
      }

      if (type === 'hero') {
        // Actualizar la imagen principal
        setFormData(prev => ({
          ...prev,
          heroImage: imageData,
        }))
        alert('✅ Imagen principal optimizada y subida correctamente')
      } else {
        // Añadir la imagen a la galería
        setFormData(prev => ({
          ...prev,
          gallery: [
            ...(prev.gallery || []),
            imageData,
          ],
        }))
        alert('✅ Imagen optimizada subida correctamente y añadida a la galería')
      }
    } catch (error) {
      console.error('Error subiendo imagen:', error)
      alert('Error al subir la imagen. Inténtalo de nuevo.')
    } finally {
      setUploadingImage(false)
      setUploadProgress(null)
    }
  }

  type MarkdownAction = 'bold' | 'italic' | 'heading' | 'list' | 'quote' | 'code' | 'break' | 'link' | 'center' | 'imageLeft' | 'imageRight'
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
      link: 'enlace descriptiva',
      center: 'Contenido centrado',
      imageLeft: 'https://ejemplo.com/imagen.jpg',
      imageRight: 'https://ejemplo.com/imagen.jpg',
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
      case 'center':
        // Usamos un contenedor flex para centrar iframes/imágenes incluso con estilos de .prose
        // y un div interno con text-align:center para centrar también texto.
        replacement = `\n<div style="display:flex;justify-content:center"><div style="text-align:center">\n${selectedText}\n</div></div>\n`
        break
      case 'imageLeft':
        // Imagen flotante a la izquierda con ancho editable (porcentaje) y texto fluyendo a la derecha
        replacement = `\n<div style="float:left; margin:0 1rem 1rem 0; width:40%; max-width:320px;">\n  <img src="${selectedText}" alt="Descripción de la imagen" style="width:100%; height:auto; border-radius:8px;" />\n  <small style="display:block; font-size:12px; color:#6b7280;">Pie de foto opcional</small>\n</div>\n`
        break
      case 'imageRight':
        // Imagen flotante a la derecha con ancho editable (porcentaje) y texto fluyendo a la izquierda
        replacement = `\n<div style="float:right; margin:0 0 1rem 1rem; width:40%; max-width:320px;">\n  <img src="${selectedText}" alt="Descripción de la imagen" style="width:100%; height:auto; border-radius:8px;" />\n  <small style="display:block; font-size:12px; color:#6b7280;">Pie de foto opcional</small>\n</div>\n`
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
              <div className="mb-4">
                <label className="flex cursor-pointer items-center justify-center space-x-2 rounded-md border-2 border-dashed border-primary-300 bg-primary-50 px-4 py-3 text-sm text-primary-700 hover:border-primary-400 hover:bg-primary-100">
                  {uploadingImage ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>
                        Subiendo imagen principal
                        {uploadProgress !== null ? ` (${uploadProgress}%)` : '...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-5 w-5" />
                      <span>Subir Imagen Principal</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file, 'hero')
                      // Resetear el input para permitir subir la misma imagen de nuevo
                      e.target.value = ''
                    }}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
                <p className="mt-2 text-xs text-gray-500">
                  O introduce manualmente la URL de la imagen
                </p>
              </div>

              <div>
              <label className="block text-sm font-medium mb-1">URL de la imagen</label>
              <input
                type="url"
                value={formData.heroImage?.url || ''}
                onChange={(e) => updateNestedField('heroImage', 'url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Texto alternativo</label>
              <input
                type="text"
                value={formData.heroImage?.alt || ''}
                onChange={(e) => updateNestedField('heroImage', 'alt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Descripción de la imagen principal"
              />
            </div>
            </>
          ), ImageIcon)}

        {/* Galería */}
        {renderSection('Galería', (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">Añade imágenes a la galería de la ruta</p>
              <label className="flex cursor-pointer items-center space-x-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                {uploadingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      Subiendo
                      {uploadProgress !== null ? ` (${uploadProgress}%)` : '...'}
                    </span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4" />
                    <span>Subir Imagen</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, 'gallery')
                    // Resetear el input para permitir subir la misma imagen de nuevo
                    e.target.value = ''
                  }}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
            </div>
            {(formData.gallery || []).map((image, index) => (
            <div key={index} className="border border-gray-200 rounded-md p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">Imagen #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveGalleryImage(index)}
                  className="text-red-600 text-xs hover:text-red-800"
                >
                  Eliminar
                </button>
              </div>

              <div className="flex gap-3">
                {/* Miniatura */}
                <div className="flex-shrink-0">
                  <div className="relative h-24 w-32 overflow-hidden rounded border border-gray-200 bg-gray-50">
                    {image?.url ? (
                      <NextImage
                        src={image.url}
                        alt={image.alt || `Imagen ${index + 1}`}
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                        Sin imagen
                      </div>
                    )}
                  </div>
                </div>

                {/* Datos de la imagen */}
                <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-medium mb-0.5">URL</label>
                    <input
                      type="url"
                      value={image?.url || ''}
                      onChange={(e) => updateGalleryImage(index, 'url', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] font-medium mb-0.5">Texto alternativo</label>
                    <input
                      type="text"
                      value={image?.alt || ''}
                      onChange={(e) => updateGalleryImage(index, 'alt', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
                      placeholder="Descripción corta"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] font-medium mb-0.5">Fuente (Opcional)</label>
                    <input
                      type="text"
                      value={image?.source || ''}
                      onChange={(e) => updateGalleryImage(index, 'source', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
                      placeholder="Ej: Wikiloc, AllTrails..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium mb-0.5">Ancho (px)</label>
                    <input
                      type="number"
                      value={image?.width || 0}
                      onChange={(e) => updateGalleryImage(index, 'width', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-0.5">Alto (px)</label>
                    <input
                      type="number"
                      value={image?.height || 0}
                      onChange={(e) => updateGalleryImage(index, 'height', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
                    />
                  </div>
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
        ), ImageIcon)}

          {/* GPX */}
          {renderSection('Archivo GPX (Opcional)', (
            <div className="space-y-4">
              {/* Si estamos editando, mostrar el uploader de GPX */}
              {isEditing && (
                <div className="rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">
                    Actualizar Track desde GPX
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">
                    Sube un nuevo archivo GPX para reemplazar el track actual y los waypoints. 
                    El track antiguo se eliminará y se creará uno nuevo.
                  </p>
                  <GPXUploader 
                    onSuccess={handleGPXUploadSuccess}
                    onError={(error) => {
                      console.error('Error al procesar GPX:', error)
                      alert(`Error al procesar el archivo GPX: ${error}`)
                    }}
                    skipAI={true}
                  />
                </div>
              )}
              
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
              
              {/* Mostrar información del track actual si existe */}
              {formData.track && formData.track.length > 0 && (
                <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
                  <p className="font-medium mb-1">Track actual:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>{formData.track.length} puntos de track</li>
                    {formData.waypoints && formData.waypoints.length > 0 && (
                      <li>{formData.waypoints.length} waypoints (puntos de interés)</li>
                    )}
                    <li>Distancia: {formData.distance?.toFixed(2) || 0} km</li>
                    <li>Elevación: {formData.elevation || 0} m</li>
                  </ul>
                </div>
              )}
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

          {/* Google News Hashtag */}
          {renderSection('Google News Hashtag', (
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
                <button
                  type="button"
                  onClick={() => applyMarkdown('bold')}
                  className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center justify-center"
                  aria-label="Negrita"
                  title="Negrita"
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyMarkdown('italic')}
                  className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center justify-center"
                  aria-label="Cursiva"
                  title="Cursiva"
                >
                  <Italic className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyMarkdown('heading')}
                  className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center justify-center"
                  aria-label="Título"
                  title="Título"
                >
                  <Heading className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyMarkdown('list')}
                  className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center justify-center"
                  aria-label="Lista"
                  title="Lista"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyMarkdown('quote')}
                  className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center justify-center"
                  aria-label="Cita"
                  title="Cita"
                >
                  <Quote className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyMarkdown('code')}
                  className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center justify-center"
                  aria-label="Código"
                  title="Código"
                >
                  <Code2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyMarkdown('link')}
                  className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center justify-center"
                  aria-label="Enlace"
                  title="Enlace"
                >
                  <Link2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyMarkdown('break')}
                  className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center justify-center"
                  aria-label="Nuevo párrafo"
                  title="Nuevo párrafo"
                >
                  <Pilcrow className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyMarkdown('center')}
                  className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center justify-center"
                  aria-label="Centrar"
                  title="Centrar"
                >
                  <AlignCenter className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyMarkdown('imageLeft')}
                  className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center justify-center"
                  aria-label="Imagen flotante izquierda"
                  title="Imagen flotante izquierda"
                >
                  <ImageIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyMarkdown('imageRight')}
                  className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center justify-center"
                  aria-label="Imagen flotante derecha"
                  title="Imagen flotante derecha"
                >
                  <ImageIcon className="h-4 w-4" />
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
                    rehypePlugins={[rehypeRaw] as any}
                    // Permitimos HTML crudo para poder incrustar iframes de YouTube u otros embeds.
                    // Este contenido solo lo editas tú desde el panel, así que el riesgo es controlado.
                    skipHtml={false}
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

