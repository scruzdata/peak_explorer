'use client'

import { useState, useEffect } from 'react'
import { X, Save, Eye, Loader2, Upload, Sparkles, Image as ImageIcon, Calendar, Clock, Tag } from 'lucide-react'
import { BlogPost, BlogStatus, ImageData } from '@/types'
import { createBlogInFirestore, updateBlogInFirestore } from '@/lib/firebase/blogs'
import { uploadBlogImage } from '@/lib/firebase/storage'
import { calculateReadingTime } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import type { Components } from 'react-markdown'

interface BlogFormProps {
  blog?: BlogPost
  onClose: () => void
  onSave: () => void
}

export function BlogForm({ blog, onClose, onSave }: BlogFormProps) {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Estados del formulario
  const [title, setTitle] = useState(blog?.title || '')
  const [excerpt, setExcerpt] = useState(blog?.excerpt || '')
  const [content, setContent] = useState(blog?.content || '')
  const [tags, setTags] = useState<string[]>(blog?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [status, setStatus] = useState<BlogStatus>(blog?.status || 'draft')
  const [featuredImage, setFeaturedImage] = useState<ImageData | undefined>(blog?.featuredImage)
  const [seoTitle, setSeoTitle] = useState(blog?.seo.metaTitle || '')
  const [seoDescription, setSeoDescription] = useState(blog?.seo.metaDescription || '')
  const [seoKeywords, setSeoKeywords] = useState<string[]>(blog?.seo.keywords || [])
  const [keywordInput, setKeywordInput] = useState('')

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
      const { url } = await uploadBlogImage(file)
      
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
        
        alert('✅ Imagen añadida al contenido. Puedes mover el código Markdown a donde quieras.')
      }
    } catch (error) {
      console.error('Error subiendo imagen:', error)
      alert('Error al subir la imagen. Inténtalo de nuevo.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleGenerateWithAI = async () => {
    const userPrompt = window.prompt('Introduce el tema o prompt para generar el artículo:')
    if (!userPrompt || !userPrompt.trim()) {
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/generate-blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userPrompt }),
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
    img: ({ ...props }) => (
      <img className="my-6 w-full rounded-lg" {...props} />
    ),
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
                    <img
                      src={featuredImage.url}
                      alt={featuredImage.alt || title}
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
                      components={markdownComponents}
                    >
                      {content || '*Sin contenido*'}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Opciones de creación */}
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

                {/* Título */}
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

                {/* Extracto */}
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

                {/* Imagen destacada */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagen Principal / Destacada *
                  </label>
                  <p className="mb-3 text-xs text-gray-500">
                    Esta imagen aparecerá en el grid de blogs y en el header del artículo. Se recomienda una imagen de al menos 1200x800px.
                  </p>
                  {featuredImage ? (
                    <div className="relative rounded-lg border-2 border-gray-200 overflow-hidden">
                      <img
                        src={featuredImage.url}
                        alt={featuredImage.alt}
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
                </div>

                {/* Contenido */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Contenido (Markdown) *
                    </label>
                    <div className="flex items-center space-x-2">
                      <label className="flex cursor-pointer items-center space-x-1 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50">
                        <Upload className="h-4 w-4" />
                        <span>Insertar Imagenes</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(file, 'content')
                          }}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={20}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="Escribe el contenido del artículo en Markdown..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Puedes usar Markdown para formatear el texto. Usa el botón &quot;Insertar Imagen&quot; para añadir imágenes.
                  </p>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etiquetas
                  </label>
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
                </div>

                {/* SEO */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h3 className="mb-4 text-sm font-semibold text-gray-900">SEO</h3>
                  <div className="space-y-4">
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
                  </div>
                </div>

                {/* Estado */}
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
    </div>
  )
}
