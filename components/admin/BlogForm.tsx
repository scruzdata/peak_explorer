'use client'

import { useState, useEffect, useRef } from 'react'
import NextImage from 'next/image'
import { 
  X, 
  Save, 
  Eye, 
  Loader2, 
  Upload, 
  Sparkles, 
  Image as ImageIcon, 
  Calendar, 
  Clock, 
  Tag, 
  FileText, 
  Layers, 
  Search,
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
import type { LucideIcon } from 'lucide-react'
import { BlogPost, BlogStatus, ImageData } from '@/types'
import { createBlogInFirestore, updateBlogInFirestore } from '@/lib/firebase/blogs'
import { uploadBlogImage, deleteStorageFileByUrl } from '@/lib/firebase/storage'
import { calculateReadingTime, generateSlug } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'
import type { Components } from 'react-markdown'
import { AccordionItem } from './Accordion'

interface BlogFormProps {
  blog?: BlogPost
  onClose: () => void
  onSave: () => void
}

export function BlogForm({ blog, onClose, onSave }: BlogFormProps) {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showInteractivePreview, setShowInteractivePreview] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [promptText, setPromptText] = useState('')

  // Estados del formulario
  const [title, setTitle] = useState(blog?.title || '')
  const [excerpt, setExcerpt] = useState(blog?.excerpt || '')
  const [content, setContent] = useState(blog?.content || '')
  const [tags, setTags] = useState<string[]>(blog?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [status, setStatus] = useState<BlogStatus>(blog?.status || 'draft')
  const [featuredImage, setFeaturedImage] = useState<ImageData | undefined>(blog?.featuredImage)
  const [images, setImages] = useState<ImageData[]>(blog?.images || [])
  const [seoTitle, setSeoTitle] = useState(blog?.seo.metaTitle || '')
  const [seoDescription, setSeoDescription] = useState(blog?.seo.metaDescription || '')
  const [seoKeywords, setSeoKeywords] = useState<string[]>(blog?.seo.keywords || [])
  const [keywordInput, setKeywordInput] = useState('')
  const contentRef = useRef<HTMLTextAreaElement>(null)

  // Generar SEO automáticamente si no está definido
  useEffect(() => {
    if (!blog && title && !seoTitle) {
      setSeoTitle(title)
    }
    if (!blog && excerpt && !seoDescription) {
      setSeoDescription(excerpt)
    }
  }, [title, excerpt, blog, seoTitle, seoDescription])

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !seoKeywords.includes(keywordInput.trim())) {
      setSeoKeywords([...seoKeywords, keywordInput.trim()])
      setKeywordInput('')
    }
  }

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setSeoKeywords(seoKeywords.filter((keyword) => keyword !== keywordToRemove))
  }

  const handleImageUpload = async (file: File, type: 'featured' | 'content') => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen')
      return
    }

    setUploadingImage(true)
    try {
      // Generar el nombre de la carpeta del blog: usar slug si existe, o generar uno del título
      const blogFolderName = blog?.slug || blog?.id || (title.trim() ? generateSlug(title.trim()) : undefined)
      const { url } = await uploadBlogImage(file, undefined, blogFolderName)
      
      // Obtener dimensiones de la imagen
      const img = new Image()
      img.src = url
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const imageData: ImageData = {
        url,
        alt: file.name,
        width: img.width,
        height: img.height,
      }

      if (type === 'featured') {
        setFeaturedImage(imageData)
        alert('✅ Imagen principal subida correctamente')
      } else {
        // Insertar imagen en el contenido (markdown) en la posición del cursor o al final
        const textarea = document.querySelector('textarea[placeholder*="Markdown"]') as HTMLTextAreaElement
        let insertPosition = content.length
        
        if (textarea) {
          insertPosition = textarea.selectionStart || content.length
        }
        
        const imageMarkdown = `![${imageData.alt}](${imageData.url})`
        const beforeCursor = content.substring(0, insertPosition)
        const afterCursor = content.substring(insertPosition)
        
        // Insertar con saltos de línea para mejor formato
        const newContent = beforeCursor + (beforeCursor && !beforeCursor.endsWith('\n') ? '\n\n' : '\n') + imageMarkdown + (afterCursor && !afterCursor.startsWith('\n') ? '\n\n' : '\n') + afterCursor
        
        setContent(newContent)
        
        // Restaurar el foco en el textarea y mover el cursor después de la imagen insertada
        setTimeout(() => {
          if (textarea) {
            textarea.focus()
            const newPosition = insertPosition + imageMarkdown.length + 2
            textarea.setSelectionRange(newPosition, newPosition)
          }
        }, 0)
        
        // No mostrar alerta, el editor mostrará la imagen automáticamente
      }
    } catch (error) {
      console.error('Error subiendo imagen:', error)
      alert('Error al subir la imagen. Inténtalo de nuevo.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleGenerateWithAI = () => {
    setShowPromptModal(true)
    setPromptText('')
  }

  const handleConfirmGenerate = async () => {
    if (!promptText.trim()) {
      alert('Por favor introduce un prompt para generar el artículo')
      return
    }

    setShowPromptModal(false)
    setGenerating(true)
    try {
      const response = await fetch('/api/generate-blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: promptText.trim() }),
      })

      if (!response.ok) {
        throw new Error('Error generando artículo con IA')
      }

      const data = await response.json()
      
      // Rellenar el formulario con el contenido generado
      if (data.title) setTitle(data.title)
      if (data.excerpt) setExcerpt(data.excerpt)
      if (data.content) setContent(data.content)
      if (data.tags && Array.isArray(data.tags)) setTags(data.tags)
      if (data.seo) {
        if (data.seo.metaTitle) setSeoTitle(data.seo.metaTitle)
        if (data.seo.metaDescription) setSeoDescription(data.seo.metaDescription)
        if (data.seo.keywords && Array.isArray(data.seo.keywords)) setSeoKeywords(data.seo.keywords)
      }
    } catch (error) {
      console.error('Error generando artículo:', error)
      alert('Error al generar el artículo con IA. Inténtalo de nuevo.')
    } finally {
      setGenerating(false)
      setPromptText('')
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      alert('El título es obligatorio')
      return
    }

    if (!excerpt.trim()) {
      alert('El extracto es obligatorio')
      return
    }

    if (!content.trim()) {
      alert('El contenido es obligatorio')
      return
    }

    if (!featuredImage || !featuredImage.url) {
      const confirm = window.confirm('⚠️ No has añadido una imagen principal. ¿Quieres continuar sin imagen? La imagen principal aparecerá en el grid de blogs.')
      if (!confirm) {
        return
      }
    }

    setLoading(true)
    try {
      const readingTime = calculateReadingTime(content)
      
      // Asegurar que featuredImage tenga todos los campos requeridos si existe
      const finalFeaturedImage = featuredImage && featuredImage.url ? {
        url: featuredImage.url,
        alt: featuredImage.alt || title.trim(),
        width: featuredImage.width || 1200,
        height: featuredImage.height || 800,
        ...(featuredImage.lqip && { lqip: featuredImage.lqip }),
        ...(featuredImage.source && { source: featuredImage.source }),
      } : undefined
      
      // Log para depuración
      console.log('💾 Guardando blog con imagen destacada:', {
        hasFeaturedImage: !!finalFeaturedImage,
        featuredImage: finalFeaturedImage,
      })
      
      const blogData: Omit<BlogPost, 'id' | 'slug' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        tags,
        status,
        featuredImage: finalFeaturedImage,
        images,
        seo: {
          metaTitle: seoTitle.trim() || title.trim(),
          metaDescription: seoDescription.trim() || excerpt.trim(),
          keywords: seoKeywords,
        },
        readingTime,
        author: {
          name: 'Peak Explorer',
        },
      }

      if (blog) {
        // Actualizar blog existente
        await updateBlogInFirestore(blog.id, blogData)
      } else {
        // Crear nuevo blog
        await createBlogInFirestore(blogData)
      }

      onSave()
      onClose()
    } catch (error) {
      console.error('Error guardando blog:', error)
      alert('Error al guardar el artículo. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Componentes personalizados para el renderizado de Markdown (igual que en la página publicada)
  const markdownComponents: Components = {
    p: ({ ...props }) => (
      <p className="mb-6 leading-7 text-gray-700" {...props} />
    ),
    h2: ({ ...props }) => (
      <h2 className="mb-4 mt-8 text-3xl font-bold text-gray-900 first:mt-0" {...props} />
    ),
    h3: ({ ...props }) => (
      <h3 className="mb-3 mt-6 text-2xl font-semibold text-gray-900" {...props} />
    ),
    ul: ({ ...props }) => (
      <ul className="mb-6 ml-6 list-disc space-y-2 text-gray-700" {...props} />
    ),
    ol: ({ ...props }) => (
      <ol className="mb-6 ml-6 list-decimal space-y-2 text-gray-700" {...props} />
    ),
    li: ({ ...props }) => (
      <li className="leading-7" {...props} />
    ),
    blockquote: ({ ...props }) => (
      <blockquote className="my-6 border-l-4 border-primary-500 bg-primary-50 py-4 pl-6 pr-4 italic text-gray-800" {...props} />
    ),
    strong: ({ ...props }) => (
      <strong className="font-bold text-gray-900" {...props} />
    ),
    em: ({ ...props }) => (
      <em className="italic text-gray-800" {...props} />
    ),
    hr: ({ ...props }) => (
      <hr className="my-8 border-gray-300" {...props} />
    ),
    a: ({ ...props }) => (
      <a className="text-primary-600 underline hover:text-primary-700" {...props} />
    ),
    img: (props) => {
      const imgProps = props as any
      // Detectar alineación del alt text: ![alt|alignment](url)
      const altText = imgProps.alt || ''
      const alignmentMatch = altText.match(/\|(left|right|center|full)$/)
      const alignment = alignmentMatch ? (alignmentMatch[1] as 'left' | 'center' | 'right' | 'full') : 'full'
      const cleanAlt = altText.replace(/\|(left|right|center|full)$/, '')
      
      const alignmentClasses = {
        left: 'float-left mr-4 mb-4 max-w-xs',
        right: 'float-right ml-4 mb-4 max-w-xs',
        center: 'mx-auto my-6 max-w-md block',
        full: 'my-6 w-full'
      }
      
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          className={`rounded-lg ${alignmentClasses[alignment]}`} 
          alt={cleanAlt} 
          {...imgProps} 
        />
      )
    },
  }

  type MarkdownAction = 'bold' | 'italic' | 'heading' | 'list' | 'quote' | 'code' | 'break' | 'link' | 'imageLeft' | 'imageRight' | 'imageCenter'

  // Función auxiliar para obtener dimensiones de una imagen desde su URL
  const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height })
      }
      img.onerror = () => {
        // Si falla, usar dimensiones por defecto
        resolve({ width: 400, height: 300 })
      }
      img.src = url
      // Timeout de seguridad
      setTimeout(() => {
        if (!img.complete) {
          resolve({ width: 400, height: 300 })
        }
      }, 5000)
    })
  }

  const applyMarkdown = async (action: MarkdownAction) => {
    const textarea = contentRef.current
    if (!textarea) return

    const value = content || ''
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
      imageLeft: 'https://ejemplo.com/imagen.jpg',
      imageRight: 'https://ejemplo.com/imagen.jpg',
      imageCenter: 'https://ejemplo.com/imagen.jpg',
    }

    const selectedText = selection || defaults[action]
    let replacement = ''

    // Detectar si la selección es una URL de imagen
    const isImageUrl = (text: string): boolean => {
      const trimmed = text.trim()
      return (
        (trimmed.startsWith('http://') || trimmed.startsWith('https://')) &&
        (trimmed.match(/\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/i) !== null || 
         trimmed.includes('firebasestorage.googleapis.com') ||
         trimmed.includes('storage.googleapis.com'))
      )
    }

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
      case 'imageLeft': {
        const url = selection.trim() || defaults.imageLeft
        if (isImageUrl(url)) {
          // Obtener dimensiones de la imagen
          const { width, height } = await getImageDimensions(url)
          // Insertar HTML con float y tamaño
          replacement = `\n\n<div style="float:left; margin:0 1rem 1rem 0; width:${Math.min(width, 400)}px; max-width:40%;">
  <img src="${url}" alt="Descripción imagen" style="width:100%; height:auto; border-radius:8px;" />
  <small style="display:block; font-size:12px; color:#6b7280;">Pie de foto opcional</small>
</div>\n\n`
        } else {
          // Si no es URL de imagen, usar Markdown tradicional
          replacement = `\n\n![Descripción imagen|left](${url})\n\n`
        }
        break
      }
      case 'imageRight': {
        const url = selection.trim() || defaults.imageRight
        if (isImageUrl(url)) {
          // Obtener dimensiones de la imagen
          const { width, height } = await getImageDimensions(url)
          // Insertar HTML con float y tamaño
          replacement = `\n\n<div style="float:right; margin:0 0 1rem 1rem; width:${Math.min(width, 400)}px; max-width:40%;">
  <img src="${url}" alt="Descripción imagen" style="width:100%; height:auto; border-radius:8px;" />
  <small style="display:block; font-size:12px; color:#6b7280;">Pie de foto opcional</small>
</div>\n\n`
        } else {
          // Si no es URL de imagen, usar Markdown tradicional
          replacement = `\n\n![Descripción imagen|right](${url})\n\n`
        }
        break
      }
      case 'imageCenter': {
        const url = selection.trim() || defaults.imageCenter
        if (isImageUrl(url)) {
          // Obtener dimensiones de la imagen
          const { width, height } = await getImageDimensions(url)
          // Insertar HTML centrado con tamaño
          replacement = `\n\n<div style="display:flex; justify-content:center; margin:1rem 0;">
  <div style="text-align:center; max-width:${Math.min(width, 600)}px; width:100%;">
    <img src="${url}" alt="Descripción imagen" style="width:100%; height:auto; border-radius:8px;" />
    <small style="display:block; font-size:12px; color:#6b7280; margin-top:0.5rem;">Pie de foto opcional</small>
  </div>
</div>\n\n`
        } else {
          // Si no es URL de imagen, usar Markdown tradicional
          replacement = `\n\n![Descripción imagen|center](${url})\n\n`
        }
        break
      }
      default:
        replacement = selectedText
    }

    const newValue = `${value.slice(0, start)}${replacement}${value.slice(end)}`
    setContent(newValue)

    window.requestAnimationFrame(() => {
      const cursor = start + replacement.length
      textarea.focus()
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  // Helpers para galería de imágenes (sección separada)
  const addGalleryImage = () => {
    setImages(prev => [
      ...prev,
      {
        url: '',
        alt: '',
        width: 1200,
        height: 800,
      },
    ])
  }

  const updateGalleryImage = (index: number, field: keyof ImageData, value: string | number) => {
    setImages(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value } as ImageData
      return next
    })
  }

  const removeGalleryImage = (index: number) => {
    setImages(prev => {
      const next = [...prev]
      next.splice(index, 1)
      return next
    })
  }

  const handleRemoveGalleryImage = async (index: number) => {
    const image = images[index]
    if (!image) return

    if (image.url) {
      try {
        await deleteStorageFileByUrl(image.url)
      } catch (error) {
        console.error('Error eliminando imagen de Storage del blog:', error)
        // No bloqueamos la eliminación local
      }
    }

    removeGalleryImage(index)
  }

  // Helper para secciones tipo acordeón (similar a rutas)
  const renderSection = (title: string, content: React.ReactNode, icon?: LucideIcon, defaultOpen: boolean = false) => {
    const Icon = icon
    return (
      <AccordionItem title={title} icon={Icon} defaultOpen={defaultOpen}>
        <div className="space-y-4">
          {content}
        </div>
      </AccordionItem>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-6xl rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
            <h2 className="text-xl font-bold">
              {blog ? 'Editar Artículo' : 'Nuevo Artículo'}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Eye className="h-4 w-4" />
                <span>{showPreview ? 'Editar' : 'Vista Previa'}</span>
              </button>
              <button
                onClick={onClose}
                className="rounded-md p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
            {showPreview ? (
              <div className="bg-gray-50 min-h-screen">
                {/* Hero Image */}
                {featuredImage && (
                  <div className="mb-8">
                    <NextImage
                      src={featuredImage.url}
                      alt={featuredImage.alt || title}
                      width={featuredImage.width || 1200}
                      height={featuredImage.height || 800}
                      className="h-64 md:h-96 w-full object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                  {/* Header */}
                  <header className="mb-8">
                    {/* Tags */}
                    {tags.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-800"
                          >
                            <Tag className="mr-1 h-4 w-4" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Title */}
                    <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                      {title || 'Sin título'}
                    </h1>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Por Peak Explorer</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date().toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{calculateReadingTime(content || '')} min lectura</span>
                      </div>
                    </div>
                  </header>

                  {/* Excerpt */}
                  {excerpt && (
                    <div className="mb-8 rounded-lg border-l-4 border-primary-500 bg-primary-50 p-4">
                      <p className="text-lg font-medium text-gray-800">{excerpt}</p>
                    </div>
                  )}

                  {/* Content */}
                  <div className="prose prose-lg max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks] as any}
                      rehypePlugins={[rehypeRaw] as any}
                      components={markdownComponents}
                    >
                      {content || '*Sin contenido*'}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Opciones de creación (solo nuevo) */}
                {!blog && (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        ¿Cómo quieres crear este artículo?
                      </h3>
                      <div className="mt-4 flex justify-center gap-4">
                        <button
                          onClick={handleGenerateWithAI}
                          disabled={generating}
                          className="flex items-center space-x-2 rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
                        >
                          {generating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          <span>{generating ? 'Generando...' : 'Generar con IA'}</span>
                        </button>
                      </div>
                      {generating && (
                        <p className="mt-2 text-sm text-gray-600">
                          La IA está generando tu artículo. Esto puede tardar unos segundos...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Información básica */}
                {renderSection(
                  'Información Básica',
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título *
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="Título del artículo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Extracto *
                      </label>
                      <textarea
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="Breve descripción del artículo"
                      />
                    </div>
                  </>,
                  FileText,
                  true
                )}

                {/* Imagen destacada */}
                {renderSection(
                  'Imagen Principal / Destacada',
                  <>
                    <p className="mb-3 text-xs text-gray-500">
                      Esta imagen aparecerá en el grid de blogs y en el header del artículo. Se recomienda una imagen de al menos 1200x800px.
                    </p>
                    {featuredImage ? (
                      <div className="relative rounded-lg border-2 border-gray-200 overflow-hidden">
                        <NextImage
                          src={featuredImage.url}
                          alt={featuredImage.alt || title}
                          width={featuredImage.width || 1200}
                          height={featuredImage.height || 800}
                          className="h-64 w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="opacity-0 hover:opacity-100 transition-opacity flex gap-2">
                            <label className="cursor-pointer rounded-md bg-white/90 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-white">
                              <span>Cambiar</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleImageUpload(file, 'featured')
                                }}
                                className="hidden"
                                disabled={uploadingImage}
                              />
                            </label>
                            <button
                              onClick={() => setFeaturedImage(undefined)}
                              className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs">
                          {featuredImage.width} x {featuredImage.height}px
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 p-8 hover:border-primary-400 transition-colors">
                        <label className="flex cursor-pointer flex-col items-center">
                          {uploadingImage ? (
                            <>
                              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                              <span className="mt-2 text-sm text-primary-700">Subiendo imagen...</span>
                            </>
                          ) : (
                            <>
                              <ImageIcon className="h-10 w-10 text-primary-600" />
                              <span className="mt-2 text-sm font-medium text-primary-700">Haz clic para subir imagen principal</span>
                              <span className="mt-1 text-xs text-primary-600">Recomendado: 1200x800px o superior</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleImageUpload(file, 'featured')
                                }}
                                className="hidden"
                                disabled={uploadingImage}
                              />
                            </>
                          )}
                        </label>
                      </div>
                    )}
                  </>,
                  ImageIcon,
                  true
                )}

                {/* Galería de imágenes */}
                {renderSection(
                  'Galería',
                  <>
                    <p className="text-xs text-gray-500 mb-2">
                      Imágenes adicionales que quieres asociar al artículo. Se guardan en la carpeta del blog en Firebase Storage.
                    </p>
                    <div className="mb-3">
                      <label className="inline-flex cursor-pointer items-center space-x-1 rounded-md border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50">
                        <Upload className="h-3 w-3" />
                        <span>{uploadingImage ? 'Subiendo...' : 'Añadir imagen a galería'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            try {
                              setUploadingImage(true)
                              const blogFolderName = blog?.slug || blog?.id || (title.trim() ? generateSlug(title.trim()) : undefined)
                              const { url } = await uploadBlogImage(file, undefined, blogFolderName)

                              const img = new Image()
                              img.src = url
                              await new Promise((resolve, reject) => {
                                img.onload = resolve
                                img.onerror = reject
                              })

                              const imageData: ImageData = {
                                url,
                                alt: file.name,
                                width: img.width,
                                height: img.height,
                              }

                              setImages(prev => [...prev, imageData])
                            } catch (error) {
                              console.error('Error subiendo imagen de galería:', error)
                              alert('Error al subir la imagen de galería. Inténtalo de nuevo.')
                            } finally {
                              setUploadingImage(false)
                              e.target.value = ''
                            }
                          }}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>

                    <div className="space-y-3">
                      {images.map((image, index) => (
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
                            <div className="flex-shrink-0">
                              <div className="relative h-20 w-28 overflow-hidden rounded border border-gray-200 bg-gray-50">
                                {image?.url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={image.url}
                                    alt={image.alt || `Imagen ${index + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                                    Sin imagen
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                              <div className="col-span-2">
                                <label className="block text-[11px] font-medium mb-0.5">URL</label>
                                <input
                                  type="url"
                                  value={image?.url || ''}
                                  onChange={(e) => updateGalleryImage(index, 'url', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
                                  placeholder="https://..."
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
                                <label className="block text-[11px] font-medium mb-0.5">Fuente (opcional)</label>
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

                      {images.length === 0 && (
                        <p className="text-xs text-gray-400">
                          Aún no has añadido imágenes a la galería.
                        </p>
                      )}
                    </div>
                  </>,
                  Layers
                )}

                {/* Contenido */}
                {renderSection(
                  'Contenido (Markdown)',
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Contenido (Markdown) *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowInteractivePreview(!showInteractivePreview)}
                        className="flex items-center space-x-1 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                        title={showInteractivePreview ? 'Ocultar vista previa' : 'Mostrar vista previa'}
                      >
                        <Eye className="h-4 w-4" />
                        <span>{showInteractivePreview ? 'Ocultar vista previa' : 'Vista previa'}</span>
                      </button>
                    </div>

                    {/* Barra de herramientas estilo rutas */}
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
                          onClick={() => applyMarkdown('imageLeft')}
                          className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center justify-center"
                          aria-label="Imagen izquierda"
                          title="Imagen izquierda"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => applyMarkdown('imageRight')}
                          className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center justify-center"
                          aria-label="Imagen derecha"
                          title="Imagen derecha"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => applyMarkdown('imageCenter')}
                          className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center justify-center"
                          aria-label="Imagen centrada"
                          title="Imagen centrada"
                        >
                          <AlignCenter className="h-4 w-4" />
                        </button>
                      </div>

                      <textarea
                        ref={contentRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                        rows={14}
                        placeholder="# Título\n\nContenido en Markdown..."
                      />
                      <p className="text-xs text-gray-500">
                        Usa Markdown para dar formato: títulos con <code>#</code>, listas con <code>-</code>, negritas <code>**texto**</code>, cursivas <code>*texto*</code>, e imágenes con sintaxis <code>![alt|left](url)</code>, <code>![alt|right](url)</code> o <code>![alt|center](url)</code>.
                      </p>

                      {showInteractivePreview && (
                        <div className="mt-4 border rounded-md p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-700">Vista previa</h4>
                            <span className="text-xs text-gray-500">Así se mostrará el contenido en el blog</span>
                          </div>
                          <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkBreaks] as any}
                              rehypePlugins={[rehypeRaw] as any}
                              components={markdownComponents}
                            >
                              {content || '*La vista previa aparecerá aquí cuando escribas contenido.*'}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </>,
                  FileText,
                  true
                )}

                {/* Tags */}
                {renderSection(
                  'Etiquetas',
                  <>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-800"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-2 text-primary-600 hover:text-primary-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddTag()
                          }
                        }}
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="Añadir etiqueta"
                      />
                      <button
                        onClick={handleAddTag}
                        className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
                      >
                        Añadir
                      </button>
                    </div>
                  </>,
                  Tag
                )}

                {/* SEO */}
                {renderSection(
                  'SEO',
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Título
                      </label>
                      <input
                        type="text"
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="Título para SEO"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Descripción
                      </label>
                      <textarea
                        value={seoDescription}
                        onChange={(e) => setSeoDescription(e.target.value)}
                        rows={2}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="Descripción para SEO"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Palabras Clave
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {seoKeywords.map((keyword) => (
                          <span
                            key={keyword}
                            className="inline-flex items-center rounded-full bg-gray-200 px-3 py-1 text-sm text-gray-800"
                          >
                            {keyword}
                            <button
                              onClick={() => handleRemoveKeyword(keyword)}
                              className="ml-2 text-gray-600 hover:text-gray-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddKeyword()
                            }
                          }}
                          className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          placeholder="Añadir palabra clave"
                        />
                        <button
                          onClick={handleAddKeyword}
                          className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
                        >
                          Añadir
                        </button>
                      </div>
                    </div>
                  </>,
                  Search
                )}

                {/* Estado */}
                {renderSection(
                  'Estado',
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado *
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as BlogStatus)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="draft">Borrador (no visible públicamente)</option>
                        <option value="published">Publicado (visible en /blog)</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        {status === 'draft'
                          ? '⚠️ Este artículo está guardado como borrador y no será visible en la sección pública del blog.'
                          : '✅ Este artículo será visible públicamente en /blog'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex items-center justify-end space-x-4 border-t border-gray-200 bg-white px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !title.trim() || !excerpt.trim() || !content.trim()}
              className="flex items-center space-x-2 rounded-md bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{loading ? 'Guardando...' : 'Guardar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal para el prompt de IA */}
      {showPromptModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70">
          <div className="relative w-full max-w-3xl rounded-lg bg-white shadow-xl mx-4">
            {/* Header del modal */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Generar Artículo con IA
              </h3>
              <button
                onClick={() => {
                  setShowPromptModal(false)
                  setPromptText('')
                }}
                className="rounded-md p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Introduce el tema o prompt para generar el artículo:
              </label>
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                rows={12}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none font-mono text-sm"
                placeholder="Ejemplo:&#10;&#10;Tema: Guía completa de senderismo en los Pirineos&#10;&#10;Requisitos:&#10;- Incluir información sobre rutas populares&#10;- Consejos de seguridad&#10;- Equipamiento necesario&#10;- Mejores épocas para visitar&#10;&#10;Tono: Informativo y amigable"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                Puedes estructurar tu prompt con múltiples líneas, listas y especificaciones detalladas.
              </p>
            </div>

            {/* Footer del modal */}
            <div className="flex items-center justify-end space-x-4 border-t border-gray-200 bg-white px-6 py-4">
              <button
                onClick={() => {
                  setShowPromptModal(false)
                  setPromptText('')
                }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmGenerate}
                disabled={!promptText.trim() || generating}
                className="flex items-center space-x-2 rounded-md bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generar Artículo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
