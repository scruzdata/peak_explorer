'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { GripVertical, AlignLeft, AlignCenter, AlignRight, Maximize2, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Plus, Minus } from 'lucide-react'
import NextImage from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import type { Components } from 'react-markdown'

interface ImageBlock {
  id: string
  markdown: string
  url: string
  alt: string
  alignment: 'left' | 'center' | 'right' | 'full'
  startIndex: number
  endIndex: number
}

interface MarkdownImageEditorProps {
  content: string
  onChange: (content: string) => void
  onImageUpload?: (file: File) => Promise<string>
  showPreview?: boolean
}

export function MarkdownImageEditor({ content, onChange, onImageUpload, showPreview = false }: MarkdownImageEditorProps) {
  const [imageBlocks, setImageBlocks] = useState<ImageBlock[]>([])
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [previewDragTarget, setPreviewDragTarget] = useState<number | null>(null)
  const [imageSizes, setImageSizes] = useState<Record<string, number>>({}) // Tamaño de cada imagen (porcentaje)
  const [editingImageId, setEditingImageId] = useState<string | null>(null)
  const [dropIndicator, setDropIndicator] = useState<{ top: number; visible: boolean } | null>(null)
  const dropIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const editableRef = useRef<HTMLDivElement>(null)

  // Regex para encontrar imágenes en markdown: 
  // ![alt](url) o ![alt|alignment](url) o ![alt|alignment|size%](url) o ![alt|size%](url)
  const imageRegex = /!\[([^\|]*)(?:\|([^\|]+))?(?:\|(\d+)%)?\]\(([^)]+)(?:\s+"([^"]+)")?\)/g

  // Parsear imágenes del contenido
  const parseImages = useCallback((text: string): ImageBlock[] => {
    const images: ImageBlock[] = []
    let match
    let idCounter = 0

    // Resetear regex
    imageRegex.lastIndex = 0

    while ((match = imageRegex.exec(text)) !== null) {
      const fullMatch = match[0]
      const alt = match[1] || ''
      const alignmentOrSize = match[2] || ''
      const sizePercent = match[3] ? parseInt(match[3]) : null
      const url = match[4]
      const startIndex = match.index
      const endIndex = startIndex + fullMatch.length

      // Determinar alineación
      // El formato puede ser: ![alt|alignment] o ![alt|alignment|size%] o ![alt|size%]
      let alignment: 'left' | 'center' | 'right' | 'full' = 'full'
      
      // Si hay un tamaño en el grupo 3, el grupo 2 puede ser alineación o tamaño
      if (sizePercent) {
        // Si hay tamaño en grupo 3, el grupo 2 es la alineación
        if (alignmentOrSize && (alignmentOrSize === 'left' || alignmentOrSize === 'right' || alignmentOrSize === 'center' || alignmentOrSize === 'full')) {
          alignment = alignmentOrSize as 'left' | 'center' | 'right' | 'full'
        } else {
          // Si no hay alineación explícita, es full
          alignment = 'full'
        }
      } else if (alignmentOrSize) {
        // Si no hay tamaño, verificar si el grupo 2 es alineación o tamaño
        if (alignmentOrSize === 'left' || alignmentOrSize === 'right' || alignmentOrSize === 'center' || alignmentOrSize === 'full') {
          alignment = alignmentOrSize as 'left' | 'center' | 'right' | 'full'
        } else if (alignmentOrSize.match(/^\d+%$/)) {
          // Si el grupo 2 es un tamaño (formato antiguo o error), mantener full
          alignment = 'full'
        }
      }

      const imageId = `img-${idCounter++}`

      images.push({
        id: imageId,
        markdown: fullMatch,
        url,
        alt,
        alignment,
        startIndex,
        endIndex,
      })
    }
    
    // Ordenar por posición en el texto
    return images.sort((a, b) => a.startIndex - b.startIndex)
  }, [])

  // Actualizar tamaños de imágenes cuando se parsean
  useEffect(() => {
    const blocks = parseImages(content)
    const newSizes: Record<string, number> = {}
    
    // Usar los IDs reales de las imágenes parseadas
    blocks.forEach((image) => {
      // Extraer tamaño del markdown si existe
      const sizeMatch = image.markdown.match(/\|(\d+)%/)
      if (sizeMatch) {
        const parsedSize = parseInt(sizeMatch[1])
        if (!isNaN(parsedSize)) {
          newSizes[image.id] = parsedSize
        }
      }
    })
    
    // Solo actualizar tamaños que están en el markdown, preservar los que ya están en el estado
    // Esto evita sobrescribir cambios en tiempo real
    setImageSizes(prev => {
      const updated = { ...prev }
      // Actualizar solo los tamaños que están en el nuevo parseo
      Object.keys(newSizes).forEach(id => {
        updated[id] = newSizes[id]
      })
      return updated
    })
  }, [content, parseImages])

  // Actualizar bloques de imágenes cuando cambia el contenido
  useEffect(() => {
    const blocks = parseImages(content)
    setImageBlocks(blocks)
    // Ajustar el índice actual si es necesario
    setCurrentImageIndex((prev) => {
      if (prev >= blocks.length && blocks.length > 0) {
        return blocks.length - 1
      } else if (blocks.length === 0) {
        return 0
      }
      return prev
    })
  }, [content, parseImages])

  // Navegación del carrusel
  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : imageBlocks.length - 1))
  }

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev < imageBlocks.length - 1 ? prev + 1 : 0))
  }

  const goToImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  // Generar markdown con alineación y tamaño usando formato especial en el alt text
  const generateImageMarkdown = (url: string, alt: string, alignment: 'left' | 'center' | 'right' | 'full', size?: number): string => {
    let altPart = alt
    // Si hay tamaño, siempre incluir la alineación para mantener consistencia en el formato
    if (size && size !== 100) {
      altPart += `|${alignment}|${size}%`
    } else if (alignment !== 'full') {
      altPart += `|${alignment}`
    }
    return `![${altPart}](${url})`
  }

  // Actualizar alineación de una imagen
  const updateImageAlignment = (imageId: string, alignment: 'left' | 'center' | 'right' | 'full') => {
    const image = imageBlocks.find(img => img.id === imageId)
    if (!image) return

    const beforeImage = content.substring(0, image.startIndex)
    const afterImage = content.substring(image.endIndex)
    
    const currentSize = imageSizes[imageId] || 100
    
    // Limpiar el alt text (remover alineación y tamaño anteriores)
    let cleanAlt = image.alt
    cleanAlt = cleanAlt.replace(/\|(left|right|center|full)/g, '')
    cleanAlt = cleanAlt.replace(/\|\d+%/g, '')
    
    const newMarkdown = generateImageMarkdown(image.url, cleanAlt, alignment, currentSize)
    let newContent = beforeImage + newMarkdown + afterImage
    
    // Limpiar saltos de línea extra alrededor
    newContent = newContent.replace(/\n{3,}/g, '\n\n')

    onChange(newContent)
  }

  // Mover imagen arrastrándola
  const handleDragStart = (e: React.DragEvent, imageId: string) => {
    setDraggedId(imageId)
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const handleDragOver = (e: React.DragEvent, imageId: string) => {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
    if (draggedId && draggedId !== imageId) {
      setDragOverId(imageId)
    }
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
  }

  const handleDrop = (e: React.DragEvent, targetImageId: string) => {
    e.preventDefault()
    
    if (!draggedId || draggedId === targetImageId) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }

    const draggedImage = imageBlocks.find(img => img.id === draggedId)
    const targetImage = imageBlocks.find(img => img.id === targetImageId)

    if (!draggedImage || !targetImage) return

    // Remover la imagen arrastrada
    const withoutDragged = content.substring(0, draggedImage.startIndex) + 
                          content.substring(draggedImage.endIndex)

    // Encontrar la nueva posición (antes de la imagen objetivo)
    const targetIndex = withoutDragged.indexOf(targetImage.markdown)
    
    if (targetIndex === -1) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }

    // Insertar la imagen arrastrada antes de la objetivo
    const beforeTarget = withoutDragged.substring(0, targetIndex)
    const afterTarget = withoutDragged.substring(targetIndex)
    
    const newContent = beforeTarget + draggedImage.markdown + '\n\n' + afterTarget
    onChange(newContent)

    setDraggedId(null)
    setDragOverId(null)
  }

  // Insertar imagen en el contenido
  const insertImage = (url: string, alt: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart || content.length
    const beforeCursor = content.substring(0, cursorPos)
    const afterCursor = content.substring(cursorPos)

    const imageMarkdown = `![${alt}](${url})`
    const newContent = beforeCursor + 
                      (beforeCursor && !beforeCursor.endsWith('\n') ? '\n\n' : '') + 
                      imageMarkdown + 
                      (afterCursor && !afterCursor.startsWith('\n') ? '\n\n' : '') + 
                      afterCursor

    onChange(newContent)

    // Restaurar cursor
    setTimeout(() => {
      if (textarea) {
        textarea.focus()
        const newPosition = cursorPos + imageMarkdown.length + 2
        textarea.setSelectionRange(newPosition, newPosition)
      }
    }, 0)
  }

  // Eliminar imagen
  const removeImage = (imageId: string) => {
    const image = imageBlocks.find(img => img.id === imageId)
    if (!image) return

    const beforeImage = content.substring(0, image.startIndex)
    const afterImage = content.substring(image.endIndex)
    
    // Limpiar saltos de línea extra
    let newContent = beforeImage.trimEnd() + '\n\n' + afterImage.trimStart()
    newContent = newContent.replace(/\n{3,}/g, '\n\n')

    onChange(newContent)
  }

  // Actualizar tamaño de imagen (función base)
  const updateImageSize = useCallback((imageId: string, newSize: number) => {
    // Buscar la imagen por ID
    let image = imageBlocks.find(img => img.id === imageId)
    
    // Si no se encuentra por ID, intentar buscar por el índice actual (fallback)
    if (!image && imageBlocks.length > 0) {
      // Esto es un fallback, idealmente siempre debería encontrarse por ID
      console.warn('updateImageSize: Imagen no encontrada por ID, usando fallback', imageId)
    }
    
    if (!image) {
      console.error('updateImageSize: Imagen no encontrada', imageId, 'imageBlocks:', imageBlocks)
      return
    }

    // Actualizar el estado del tamaño inmediatamente para feedback visual
    setImageSizes(prev => ({ ...prev, [imageId]: newSize }))
    
    // Actualizar el markdown con el tamaño
    const beforeImage = content.substring(0, image.startIndex)
    const afterImage = content.substring(image.endIndex)
    
    // Usar la alineación que ya está guardada en el objeto image
    const alignment = image.alignment
    
    // Extraer el alt text limpio (sin alineación ni tamaño)
    let cleanAlt = image.alt
    // Remover alineación si existe
    cleanAlt = cleanAlt.replace(/\|(left|right|center|full)/g, '')
    // Remover tamaño anterior si existe
    cleanAlt = cleanAlt.replace(/\|\d+%/g, '')
    
    // Crear nuevo markdown con tamaño y alineación (manteniendo la alineación original)
    const newMarkdown = generateImageMarkdown(image.url, cleanAlt, alignment, newSize)
    
    const newContent = beforeImage + newMarkdown + afterImage
    
    // Solo actualizar si el contenido realmente cambió
    if (newContent !== content) {
      onChange(newContent)
    }
  }, [content, imageBlocks, onChange])

  // Redimensionar imagen (usado por botones)
  const resizeImage = (imageId: string, sizeChange: number) => {
    const image = imageBlocks.find(img => img.id === imageId)
    if (!image) return

    const currentSize = imageSizes[imageId] || 100
    const newSize = Math.max(20, Math.min(200, currentSize + sizeChange))
    updateImageSize(imageId, newSize)
  }

  // Manejar redimensionamiento con el mouse (arrastrando desde las esquinas)
  const [resizingImageId, setResizingImageId] = useState<string | null>(null)
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; initialSize: number } | null>(null)
  const [tempImageSizes, setTempImageSizes] = useState<Record<string, number>>({})

  const handleResizeStart = (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation()
    e.preventDefault()
    const image = imageBlocks.find(img => img.id === imageId)
    if (!image) return

    const currentSize = imageSizes[imageId] || 100
    
    setResizingImageId(imageId)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      initialSize: currentSize
    })
    // Inicializar el tamaño temporal
    setTempImageSizes({ [imageId]: currentSize })
  }

  useEffect(() => {
    if (!resizingImageId || !resizeStart) return

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      // Calcular el movimiento total (diagonal)
      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y
      // Usar la distancia diagonal para un redimensionamiento más natural
      const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      // Determinar si es aumento o reducción basado en la dirección
      const direction = (deltaX + deltaY) > 0 ? 1 : -1
      
      // Convertir píxeles a porcentaje (ajustar sensibilidad: 2px = 1%)
      const sizeChange = (delta * direction) * 0.5
      const newSize = Math.max(20, Math.min(200, Math.round(resizeStart.initialSize + sizeChange)))
      
      // Actualizar el tamaño temporal para mostrar el cambio en tiempo real
      setTempImageSizes({ [resizingImageId]: newSize })
    }

    const handleMouseUp = () => {
      // Cuando se suelta el mouse, actualizar el markdown con el tamaño final
      if (resizingImageId) {
        const finalSize = tempImageSizes[resizingImageId] || resizeStart.initialSize
        updateImageSize(resizingImageId, finalSize)
      }
      setResizingImageId(null)
      setResizeStart(null)
      setTempImageSizes({})
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: false })
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingImageId, resizeStart, tempImageSizes, updateImageSize])

  // Manejar cambios en el contenido editable
  const handleEditableChange = () => {
    if (!editableRef.current) return
    
    // Convertir el HTML editado de vuelta a markdown
    // Esta es una simplificación - en producción necesitarías una librería como turndown
    const html = editableRef.current.innerHTML
    
    // Por ahora, solo actualizamos si hay cambios significativos
    // Una implementación completa requeriría convertir HTML a Markdown
  }

  // Añadir espacio/párrafo
  const addSpace = () => {
    if (!editableRef.current) return
    
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    
    const range = selection.getRangeAt(0)
    const p = document.createElement('p')
    p.innerHTML = '<br>'
    p.className = 'mb-4'
    
    range.insertNode(p)
    range.setStartAfter(p)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
    
    handleEditableChange()
  }

  // Mover imagen a una posición específica en el texto (para vista previa)
  const moveImageToPosition = (imageId: string, targetPosition: number) => {
    const image = imageBlocks.find(img => img.id === imageId)
    if (!image) {
      console.warn('Imagen no encontrada:', imageId)
      return
    }

    try {
      // Remover la imagen de su posición actual
      const beforeImage = content.substring(0, image.startIndex)
      const afterImage = content.substring(image.endIndex)
      const withoutImage = beforeImage + afterImage

      // Encontrar la posición de inserción en el texto sin la imagen
      let insertPosition = targetPosition
      if (targetPosition > image.startIndex) {
        // Ajustar la posición porque removimos la imagen
        insertPosition = targetPosition - (image.endIndex - image.startIndex)
      }

      // Asegurar que la posición esté dentro de los límites
      insertPosition = Math.max(0, Math.min(insertPosition, withoutImage.length))

      // Insertar la imagen en la nueva posición
      const beforeInsert = withoutImage.substring(0, insertPosition)
      const afterInsert = withoutImage.substring(insertPosition)
      
      // Añadir saltos de línea si es necesario
      const needsNewlineBefore = beforeInsert.trim() && !beforeInsert.endsWith('\n')
      const needsNewlineAfter = afterInsert.trim() && !afterInsert.startsWith('\n')
      
      let newContent = beforeInsert + 
                      (needsNewlineBefore ? '\n\n' : '') + 
                      image.markdown + 
                      (needsNewlineAfter ? '\n\n' : '') + 
                      afterInsert
      
      // Limpiar saltos de línea extra
      newContent = newContent.replace(/\n{3,}/g, '\n\n')

      // Verificar que el contenido cambió
      if (newContent !== content) {
        onChange(newContent)
      } else {
        console.warn('El contenido no cambió, la imagen puede estar en la misma posición')
      }
    } catch (error) {
      console.error('Error moviendo imagen:', error)
    }
  }

  // Obtener la posición aproximada en el markdown basada en la posición en el texto renderizado
  const getMarkdownPositionFromPreview = (e: React.DragEvent): number => {
    if (!previewRef.current) return content.length

    const previewElement = previewRef.current
    const rect = previewElement.getBoundingClientRect()
    const y = e.clientY - rect.top
    const x = e.clientX - rect.left

    // Dividir el contenido en párrafos y encontrar en cuál estamos
    const paragraphs = content.split(/\n\n+/)
    let currentY = 0
    let markdownPosition = 0

    // Esta es una aproximación - en una implementación real necesitarías
    // medir la altura real de cada elemento renderizado
    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i]
      // Aproximación: cada párrafo tiene ~30px de altura
      const paraHeight = 30
      
      if (y >= currentY && y < currentY + paraHeight) {
        // Estamos en este párrafo, calcular posición aproximada
        const relativeY = y - currentY
        const charsPerLine = 80 // Aproximación
        const lines = Math.floor(relativeY / 20) // ~20px por línea
        markdownPosition = markdownPosition + (lines * charsPerLine)
        break
      }
      
      markdownPosition += para.length + 2 // +2 para los \n\n
      currentY += paraHeight
    }

    return Math.max(0, Math.min(markdownPosition, content.length))
  }

  // Manejar drop en la vista previa
  const handlePreviewDrop = (e: React.DragEvent) => {
    e.preventDefault()
    
    if (!draggedId) return

    const targetPosition = getMarkdownPositionFromPreview(e)
    moveImageToPosition(draggedId, targetPosition)

    setDraggedId(null)
    setPreviewDragTarget(null)
  }

  // Manejar drag over en la vista previa
  const handlePreviewDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
    
    if (draggedId) {
      const targetPosition = getMarkdownPositionFromPreview(e)
      setPreviewDragTarget(targetPosition)
    }
  }

  return (
    <div className="space-y-4">
      {/* Carrusel de imágenes */}
      {imageBlocks.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">
              Imágenes en el contenido ({imageBlocks.length})
            </h4>
            <div className="text-xs text-gray-500">
              {currentImageIndex + 1} / {imageBlocks.length}
            </div>
          </div>

          {/* Carrusel principal */}
          <div className="relative mb-4">
            {imageBlocks.map((image, index) => (
              <div
                key={image.id}
                className={`transition-all duration-300 ${
                  index === currentImageIndex ? 'block' : 'hidden'
                }`}
              >
                <div className="group relative rounded-lg border-2 border-gray-200 bg-white p-4">
                  {/* Controles de arrastre */}
                  <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <div 
                      className="cursor-move rounded bg-white/90 p-1 text-gray-400 shadow-sm hover:bg-white hover:text-gray-600"
                      draggable
                      onDragStart={(e) => handleDragStart(e, image.id)}
                      title="Arrastrar para reordenar"
                    >
                      <GripVertical className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Imagen principal */}
                  <div className="mb-4 flex justify-center">
                    <div className="relative max-h-96 w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                      <NextImage
                        src={image.url}
                        alt={image.alt}
                        width={800}
                        height={600}
                        className="h-auto w-full object-contain"
                        unoptimized={image.url.includes('firebasestorage') || image.url.includes('firebase')}
                      />
                    </div>
                  </div>

                  {/* Alt text */}
                  {image.alt && (
                    <p className="mb-4 text-center text-sm text-gray-600">{image.alt}</p>
                  )}

                  {/* Controles de alineación */}
                  <div className="mb-3 flex items-center justify-between border-t border-gray-200 pt-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-600">Alineación:</span>
                      <button
                        onClick={() => updateImageAlignment(image.id, 'left')}
                        className={`rounded p-1.5 transition-colors ${
                          image.alignment === 'left'
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                        }`}
                        title="Izquierda (texto fluye a la derecha)"
                      >
                        <AlignLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateImageAlignment(image.id, 'center')}
                        className={`rounded p-1.5 transition-colors ${
                          image.alignment === 'center'
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                        }`}
                        title="Centro"
                      >
                        <AlignCenter className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateImageAlignment(image.id, 'right')}
                        className={`rounded p-1.5 transition-colors ${
                          image.alignment === 'right'
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                        }`}
                        title="Derecha (texto fluye a la izquierda)"
                      >
                        <AlignRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateImageAlignment(image.id, 'full')}
                        className={`rounded p-1.5 transition-colors ${
                          image.alignment === 'full'
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                        }`}
                        title="Ancho completo"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeImage(image.id)}
                      className="rounded p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                      title="Eliminar imagen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Botones de navegación */}
            {imageBlocks.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg transition-all hover:bg-white hover:shadow-xl"
                  title="Imagen anterior"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-700" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg transition-all hover:bg-white hover:shadow-xl"
                  title="Imagen siguiente"
                >
                  <ChevronRight className="h-5 w-5 text-gray-700" />
                </button>
              </>
            )}
          </div>

          {/* Miniaturas */}
          {imageBlocks.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {imageBlocks.map((image, index) => (
                <div
                  key={image.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, image.id)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    if (draggedId && draggedId !== image.id) {
                      setDragOverId(image.id)
                    }
                  }}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, image.id)}
                  className={`relative flex-shrink-0 transition-all ${
                    draggedId === image.id
                      ? 'opacity-50'
                      : dragOverId === image.id
                      ? 'scale-110'
                      : ''
                  }`}
                >
                  <button
                    onClick={() => goToImage(index)}
                    className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 transition-all ${
                      index === currentImageIndex
                        ? 'border-primary-500 ring-2 ring-primary-200'
                        : dragOverId === image.id
                        ? 'border-primary-400 border-dashed'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={`Ver imagen ${index + 1}`}
                  >
                    <NextImage
                      src={image.url}
                      alt={image.alt}
                      fill
                      className="object-cover"
                      unoptimized={image.url.includes('firebasestorage') || image.url.includes('firebase')}
                    />
                    {index === currentImageIndex && (
                      <div className="absolute inset-0 bg-primary-500/20" />
                    )}
                    {dragOverId === image.id && draggedId !== image.id && (
                      <div className="absolute inset-0 bg-primary-400/30" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="mt-3 text-xs text-gray-500">
            💡 Usa las flechas o las miniaturas para navegar. Arrastra el icono de arrastre para reordenar. Usa los botones de alineación para que el texto fluya alrededor.
          </p>
        </div>
      )}

      {/* Vista previa interactiva o Editor de texto */}
      {showPreview ? (
        <div className="space-y-2">
          {/* Barra de herramientas */}
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
            <button
              type="button"
              onClick={addSpace}
              className="flex items-center gap-1 rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-200"
              title="Añadir espacio/párrafo"
            >
              <Plus className="h-4 w-4" />
              <span>Espacio</span>
            </button>
            <div className="h-4 w-px bg-gray-300" />
            <span className="text-xs text-gray-500">Haz clic en el texto para editarlo</span>
          </div>

          <div 
            ref={previewRef}
            className="relative min-h-[400px] rounded-lg border border-gray-300 bg-white p-4"
          >
            <div 
              ref={editableRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditableChange}
              className="prose prose-sm max-w-none overflow-hidden focus:outline-none"
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (e.dataTransfer) {
                  e.dataTransfer.dropEffect = 'move'
                }
                
                if (draggedId && editableRef.current) {
                  // Usar la API de Selection para obtener la posición exacta del cursor
                  try {
                    // Obtener el punto donde está el mouse
                    const range = document.caretRangeFromPoint?.(e.clientX, e.clientY)
                    
                    if (range && editableRef.current.contains(range.commonAncestorContainer)) {
                      // Crear un marcador visual en la posición del cursor
                      const rect = range.getBoundingClientRect()
                      const editableRect = editableRef.current.getBoundingClientRect()
                      const indicatorY = rect.top - editableRect.top
                      
                      // Actualizar indicador sin throttle para respuesta inmediata
                      setDropIndicator({ top: Math.max(0, indicatorY), visible: true })
                    } else {
                      // Fallback: usar posición Y aproximada
                      const rect = editableRef.current.getBoundingClientRect()
                      const y = e.clientY - rect.top
                      
                      // Encontrar elemento más cercano
                      const elements = Array.from(editableRef.current.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote'))
                      let closestY = y
                      let minDist = Infinity
                      
                      elements.forEach((el) => {
                        const elRect = el.getBoundingClientRect()
                        const elTop = elRect.top - rect.top
                        const elBottom = elTop + elRect.height
                        const elCenter = elTop + (elRect.height / 2)
                        
                        const dist = Math.abs(y - elCenter)
                        if (dist < minDist) {
                          minDist = dist
                          closestY = y < elCenter ? elTop : elBottom
                        }
                      })
                      
                      setDropIndicator({ top: Math.max(0, closestY), visible: true })
                    }
                  } catch (error) {
                    // Fallback si caretRangeFromPoint no está disponible
                    const rect = editableRef.current.getBoundingClientRect()
                    const y = e.clientY - rect.top
                    setDropIndicator({ top: Math.max(0, y), visible: true })
                  }
                }
              }}
              onDragLeave={(e) => {
                // Solo ocultar si realmente salimos
                if (!editableRef.current?.contains(e.relatedTarget as Node)) {
                  setDropIndicator(null)
                }
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                
                if (!draggedId || !editableRef.current) {
                  setDraggedId(null)
                  setDropIndicator(null)
                  return
                }

                try {
                  // Usar la API de Selection para obtener la posición exacta
                  const range = document.caretRangeFromPoint?.(e.clientX, e.clientY)
                  let markdownPosition = content.length
                  
                  if (range && editableRef.current.contains(range.commonAncestorContainer)) {
                    // Encontrar la posición en el markdown basada en el nodo de texto
                    const textNode = range.startContainer
                    if (textNode.nodeType === Node.TEXT_NODE) {
                      // Obtener todo el texto hasta este punto
                      const walker = document.createTreeWalker(
                        editableRef.current,
                        NodeFilter.SHOW_TEXT,
                        null
                      )
                      
                      let charCount = 0
                      let node: Node | null
                      
                      while ((node = walker.nextNode())) {
                        if (node === textNode) {
                          charCount += range.startOffset
                          break
                        }
                        charCount += node.textContent?.length || 0
                      }
                      
                      // Mapear caracteres del HTML renderizado al markdown original
                      // Esto es una aproximación - necesitamos mapear mejor
                      markdownPosition = Math.min(charCount, content.length)
                    }
                  }
                  
                  // Si no pudimos obtener la posición exacta, usar método alternativo
                  if (markdownPosition === content.length || markdownPosition === 0) {
                    const rect = editableRef.current.getBoundingClientRect()
                    const y = e.clientY - rect.top
                    
                    // Dividir contenido en bloques y encontrar el bloque correspondiente
                    const blocks = content.split(/\n\n+/)
                    let accumulatedHeight = 0
                    let pos = 0
                    
                    for (let i = 0; i < blocks.length; i++) {
                      const block = blocks[i]
                      const lines = Math.max(1, block.split('\n').length)
                      const blockHeight = Math.max(40, lines * 25)
                      
                      if (y >= accumulatedHeight && y < accumulatedHeight + blockHeight) {
                        const blockStart = content.indexOf(block, pos)
                        if (blockStart !== -1) {
                          const relativeY = y - accumulatedHeight
                          if (relativeY < blockHeight / 2) {
                            markdownPosition = blockStart
                          } else {
                            markdownPosition = blockStart + block.length
                            // Buscar siguiente bloque
                            if (i < blocks.length - 1) {
                              const nextStart = content.indexOf(blocks[i + 1], markdownPosition)
                              if (nextStart !== -1) {
                                markdownPosition = nextStart
                              }
                            }
                          }
                        }
                        break
                      }
                      
                      accumulatedHeight += blockHeight
                      const blockStart = content.indexOf(block, pos)
                      if (blockStart !== -1) {
                        pos = blockStart + block.length
                      }
                    }
                  }
                  
                  // Asegurar posición válida
                  markdownPosition = Math.max(0, Math.min(markdownPosition, content.length))
                  
                  // Mover la imagen
                  moveImageToPosition(draggedId, markdownPosition)
                  
                } catch (error) {
                  console.error('Error en onDrop:', error)
                } finally {
                  setDraggedId(null)
                  setDropIndicator(null)
                }
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks] as any}
                components={{
                  ...markdownComponents,
                  img: (props: any) => {
                    const imgProps = props
                    const altText = imgProps.alt || ''
                    const alignmentMatch = altText.match(/\|(left|right|center|full)/)
                    const sizeMatch = altText.match(/\|(\d+)%/)
                    const alignment = alignmentMatch ? (alignmentMatch[1] as 'left' | 'center' | 'right' | 'full') : 'full'
                    const size = sizeMatch ? parseInt(sizeMatch[1]) : 100
                    const cleanAlt = altText.replace(/\|(left|right|center|full)/g, '').replace(/\|\d+%/g, '')
                    
                    // Encontrar la imagen correspondiente
                    const image = imageBlocks.find(img => img.url === imgProps.src)
                    
                    // Usar la alineación del objeto image si está disponible (más confiable)
                    const finalAlignment = image?.alignment || alignment
                    // Usar tamaño temporal si está redimensionando, sino el tamaño guardado o el parseado
                    const finalSize = image 
                      ? (resizingImageId === image.id && tempImageSizes[image.id] 
                          ? tempImageSizes[image.id] 
                          : (imageSizes[image.id] !== undefined ? imageSizes[image.id] : size))
                      : size
                    
                    // Clases para el contenedor según la alineación
                    const containerClasses = {
                      left: 'float-left mr-4 mb-4',
                      right: 'float-right ml-4 mb-4',
                      center: 'mx-auto my-6 block',
                      full: 'my-6 w-full block'
                    }
                    
                    const maxWidthClasses = {
                      left: 'max-w-xs',
                      right: 'max-w-xs',
                      center: 'max-w-md',
                      full: 'max-w-full'
                    }
                    
                    return (
                      <div 
                        className={`group relative ${containerClasses[finalAlignment]} ${maxWidthClasses[finalAlignment]}`}
                        style={{ width: finalSize !== 100 ? `${finalSize}%` : undefined }}
                        draggable={!!image}
                        onDragStart={(e) => {
                          if (image && e.dataTransfer) {
                            handleDragStart(e as any, image.id)
                            // Añadir datos al drag para mejor compatibilidad
                            e.dataTransfer.setData('text/plain', image.id)
                            e.dataTransfer.effectAllowed = 'move'
                          }
                        }}
                        onMouseEnter={() => image && setEditingImageId(image.id)}
                        onMouseLeave={() => setEditingImageId(null)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          className="rounded-lg cursor-move w-full h-auto" 
                          alt={cleanAlt} 
                          {...imgProps} 
                        />
                        {image && (
                          <>
                            {/* Barra de controles flotante */}
                            <div className="absolute inset-x-0 top-0 flex items-center justify-center gap-2 rounded-t-lg bg-black/80 p-2 opacity-0 transition-opacity group-hover:opacity-100 z-30">
                              {/* Botón para mover */}
                              <button
                                onMouseDown={(e) => {
                                  e.stopPropagation()
                                  if (image) {
                                    handleDragStart(e as any, image.id)
                                  }
                                }}
                                className="flex items-center gap-1 rounded bg-white/20 px-2 py-1 text-xs text-white hover:bg-white/30"
                                title="Arrastra para mover la imagen"
                              >
                                <GripVertical className="h-3 w-3" />
                                <span>Mover</span>
                              </button>
                              
                              {/* Control de tamaño con slider */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    resizeImage(image.id, -5)
                                  }}
                                  className="rounded bg-white/20 p-1 text-white hover:bg-white/30"
                                  title="Reducir tamaño"
                                >
                                  <ZoomOut className="h-3 w-3" />
                                </button>
                                
                                <div className="flex items-center gap-1">
                                  <input
                                    type="range"
                                    min="20"
                                    max="200"
                                    step="1"
                                    value={finalSize}
                                    onChange={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      if (!image) {
                                        console.warn('No se puede actualizar tamaño: imagen no encontrada')
                                        return
                                      }
                                      const newSize = parseInt(e.target.value)
                                      if (!isNaN(newSize) && newSize >= 20 && newSize <= 200) {
                                        updateImageSize(image.id, newSize)
                                      }
                                    }}
                                    onInput={(e) => {
                                      // También manejar onInput para mejor respuesta en tiempo real
                                      e.stopPropagation()
                                      if (!image) return
                                      const target = e.target as HTMLInputElement
                                      const newSize = parseInt(target.value)
                                      if (!isNaN(newSize) && newSize >= 20 && newSize <= 200) {
                                        updateImageSize(image.id, newSize)
                                      }
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="h-2 w-24 cursor-pointer appearance-none rounded-lg bg-white/20 accent-primary-500"
                                    style={{
                                      background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${((finalSize - 20) / 180) * 100}%, rgba(255,255,255,0.2) ${((finalSize - 20) / 180) * 100}%, rgba(255,255,255,0.2) 100%)`
                                    }}
                                    title={`Tamaño: ${finalSize}%`}
                                  />
                                  <span className="min-w-[3rem] text-xs text-white">{finalSize}%</span>
                                </div>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    resizeImage(image.id, 5)
                                  }}
                                  className="rounded bg-white/20 p-1 text-white hover:bg-white/30"
                                  title="Aumentar tamaño"
                                >
                                  <ZoomIn className="h-3 w-3" />
                                </button>
                              </div>
                              
                              {/* Controles de alineación */}
                              <div className="flex items-center gap-1 border-l border-white/20 pl-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateImageAlignment(image.id, 'left')
                                  }}
                                  className={`rounded p-1 text-white transition-colors ${
                                    finalAlignment === 'left' ? 'bg-primary-500' : 'bg-white/20 hover:bg-white/30'
                                  }`}
                                  title="Alinear izquierda"
                                >
                                  <AlignLeft className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateImageAlignment(image.id, 'center')
                                  }}
                                  className={`rounded p-1 text-white transition-colors ${
                                    finalAlignment === 'center' ? 'bg-primary-500' : 'bg-white/20 hover:bg-white/30'
                                  }`}
                                  title="Centrar"
                                >
                                  <AlignCenter className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateImageAlignment(image.id, 'right')
                                  }}
                                  className={`rounded p-1 text-white transition-colors ${
                                    finalAlignment === 'right' ? 'bg-primary-500' : 'bg-white/20 hover:bg-white/30'
                                  }`}
                                  title="Alinear derecha"
                                >
                                  <AlignRight className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateImageAlignment(image.id, 'full')
                                  }}
                                  className={`rounded p-1 text-white transition-colors ${
                                    finalAlignment === 'full' ? 'bg-primary-500' : 'bg-white/20 hover:bg-white/30'
                                  }`}
                                  title="Ancho completo"
                                >
                                  <Maximize2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  }
                }}
              >
                {content || '*Sin contenido*'}
              </ReactMarkdown>
            </div>
            
            {/* Indicador de posición de inserción (estilo Word) */}
            {dropIndicator && dropIndicator.visible && draggedId && (
              <div
                className="absolute left-0 right-0 z-50 pointer-events-none"
                style={{ 
                  top: `${dropIndicator.top}px`,
                  transition: 'top 0.05s linear'
                }}
              >
                {/* Línea vertical como cursor de texto */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary-500"
                  style={{ transform: 'translateY(-50%)' }}
                />
                {/* Cursor parpadeante */}
                <div 
                  className="absolute left-0 top-0 w-2 h-4 bg-primary-500 animate-pulse"
                  style={{ transform: 'translate(-50%, -50%)' }}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          rows={20}
          className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          placeholder="Escribe el contenido del artículo en Markdown..."
        />
      )}
    </div>
  )
}

// Componentes de markdown para la vista previa
const markdownComponents: Components = {
  p: ({ ...props }) => (
    <p className="mb-4 leading-7 text-gray-700" {...props} />
  ),
  h2: ({ ...props }) => (
    <h2 className="mb-3 mt-6 text-2xl font-bold text-gray-900 first:mt-0" {...props} />
  ),
  h3: ({ ...props }) => (
    <h3 className="mb-2 mt-4 text-xl font-semibold text-gray-900" {...props} />
  ),
  ul: ({ ...props }) => (
    <ul className="mb-4 ml-6 list-disc space-y-2 text-gray-700" {...props} />
  ),
  ol: ({ ...props }) => (
    <ol className="mb-4 ml-6 list-decimal space-y-2 text-gray-700" {...props} />
  ),
  li: ({ ...props }) => (
    <li className="leading-7" {...props} />
  ),
  blockquote: ({ ...props }) => (
    <blockquote className="my-4 border-l-4 border-primary-500 bg-primary-50 py-2 pl-4 pr-2 italic text-gray-800" {...props} />
  ),
  strong: ({ ...props }) => (
    <strong className="font-bold text-gray-900" {...props} />
  ),
  em: ({ ...props }) => (
    <em className="italic text-gray-800" {...props} />
  ),
  hr: ({ ...props }) => (
    <hr className="my-6 border-gray-300" {...props} />
  ),
  a: ({ ...props }) => (
    <a className="text-primary-600 underline hover:text-primary-700" {...props} />
  ),
}
