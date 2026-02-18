'use client'

import React, { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import Blockquote from '@tiptap/extension-blockquote'
import TextAlign from '@tiptap/extension-text-align'
import {
  Bold,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Link2,
  Table as TableIcon,
  ShoppingCart,
  Columns3,
  AlignLeft,
  AlignCenter as AlignCenterIcon,
  AlignRight,
  AlignJustify,
  Edit,
  X,
  Italic,
  List,
  Quote,
} from 'lucide-react'
import { uploadBlogImage } from '@/lib/firebase/storage'
import { generateSlug } from '@/lib/utils'
import type { BlogPost } from '@/types'
import { AffiliateProductExtension } from '@/components/editor/extensions/AffiliateProductExtension'
import { ComparisonTableExtension } from '@/components/editor/extensions/ComparisonTableExtension'
import { NodeSelection } from 'prosemirror-state'

export interface BlogEditorProps {
  blog?: BlogPost
  title: string
  initialContent?: any
  onChange: (json: any, plainText: string) => void
}

// Extensión de imagen con atributos adicionales: width, height, caption, alignment
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      caption: {
        default: null,
      },
      alignment: {
        default: 'center',
      },
    }
  },
  addNodeView() {
    return ({ node }) => {
      const { src, alt, width, height, caption, alignment } = node.attrs
      const container = document.createElement('figure')
      container.className = 'my-4'

      const img = document.createElement('img')
      img.src = src || ''
      img.alt = alt || ''

      // Base: siempre imagen responsive ocupando el ancho disponible
      // En escritorio aplicamos variaciones según la alineación
      let alignmentClasses = ''
      if (alignment === 'left') {
        // En móvil ocupa todo el ancho; en md+ se comporta como imagen flotante
        alignmentClasses = 'md:float-left md:mr-4 md:mb-4 md:max-w-[40%]'
      } else if (alignment === 'right') {
        alignmentClasses = 'md:float-right md:ml-4 md:mb-4 md:max-w-[40%]'
      } else {
        // Centrada, pero full‑width en móvil
        alignmentClasses = 'mx-auto'
      }

      img.className = `rounded-lg w-full h-auto max-w-full ${alignmentClasses}`

      // Si el usuario ha especificado un ancho máximo, lo respetamos solo como límite superior
      const styles: string[] = []
      if (width) {
        styles.push(`max-width:${width}px`)
      }
      // Siempre altura automática para mantener proporción
      styles.push('height:auto')

      img.style.cssText = styles.join(';')

      container.appendChild(img)

      if (caption) {
        const figcaption = document.createElement('figcaption')
        figcaption.className = 'text-sm text-gray-600 text-center mt-2 italic'
        figcaption.textContent = caption
        container.appendChild(figcaption)
      }

      return {
        dom: container,
      }
    }
  },
})

export function BlogEditor({ blog, title, initialContent, onChange }: BlogEditorProps) {
  const [showImageModal, setShowImageModal] = useState(false)
  const [isImageSelected, setIsImageSelected] = useState(false)
  const [imageAttrs, setImageAttrs] = useState<{
    src: string
    alt: string
    width: number | null
    height: number | null
    caption: string
    alignment: 'left' | 'center' | 'right'
  }>({
    src: '',
    alt: '',
    width: null,
    height: null,
    caption: '',
    alignment: 'center',
  })

  const [showAffiliateModal, setShowAffiliateModal] = useState(false)
  const [isAffiliateSelected, setIsAffiliateSelected] = useState(false)
  const [affiliateAttrs, setAffiliateAttrs] = useState<{
    imageUrl: string
    title: string
    description: string
    price: string
    affiliateUrl: string
    badge: string
  }>({
    imageUrl: '',
    title: '',
    description: '',
    price: '',
    affiliateUrl: '',
    badge: '',
  })

  const [showComparisonModal, setShowComparisonModal] = useState(false)
  const [isComparisonSelected, setIsComparisonSelected] = useState(false)
  const [comparisonAttrs, setComparisonAttrs] = useState<{
    products: Array<{
      imageUrl: string
      name: string
      description: string
      price: string
      affiliateUrl: string
    }>
    title: string
    buttonColor: string
    buttonText: string
  }>({
    products: [],
    title: 'Comparativa de productos recomendados',
    buttonColor: 'amber',
    buttonText: 'nombre',
  })

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bulletList: false,
        orderedList: false,
      }),
      BulletList,
      OrderedList,
      Blockquote,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        // En el editor queremos poder hacer clic en los enlaces para probarlos
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
      }),
      CustomImage.configure({
        inline: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      AffiliateProductExtension,
      ComparisonTableExtension,
    ],
    content: initialContent || undefined,
    autofocus: false,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      const text = editor.getText() // texto plano útil para extractos y tiempo de lectura
      // Asegurar que el JSON está completo y válido
      if (json && typeof json === 'object' && json.type === 'doc') {
        onChange(json, text)
      }
    },
    onSelectionUpdate: ({ editor }) => {
      // Detectar qué tipo de nodo está seleccionado (solo si es una NodeSelection)
      const { selection } = editor.state

      if (selection instanceof NodeSelection) {
        const node = selection.node

        if (node.type.name === 'image') {
        setIsImageSelected(true)
        setIsAffiliateSelected(false)
        setIsComparisonSelected(false)
        const attrs = node.attrs
        setImageAttrs({
          src: attrs.src || '',
          alt: attrs.alt || '',
          width: attrs.width || null,
          height: attrs.height || null,
          caption: attrs.caption || '',
          alignment: attrs.alignment || 'center',
        })
        return
      }

        if (node.type.name === 'affiliateProduct') {
        setIsImageSelected(false)
        setIsAffiliateSelected(true)
        setIsComparisonSelected(false)
        const attrs = node.attrs
        setAffiliateAttrs({
          imageUrl: attrs.imageUrl || '',
          title: attrs.title || '',
          description: attrs.description || '',
          price: attrs.price || '',
          affiliateUrl: attrs.affiliateUrl || '',
          badge: attrs.badge || '',
        })
        return
      }

        if (node.type.name === 'comparisonTable') {
        setIsImageSelected(false)
        setIsAffiliateSelected(false)
        setIsComparisonSelected(true)
        const attrs = node.attrs
        setComparisonAttrs({
          products: (attrs.products || []).map((p: any) => ({
            imageUrl: p.imageUrl || '',
            name: p.name || '',
            description: p.description || '',
            price: p.price || '',
            affiliateUrl: p.affiliateUrl || '',
          })),
          title: attrs.title || 'Comparativa de productos recomendados',
          buttonColor: attrs.buttonColor || 'amber',
          buttonText: attrs.buttonText || 'nombre',
        })
        return
      }
      }

      // Si no hay una NodeSelection o no es uno de nuestros nodos especiales, limpiar estado
      setIsImageSelected(false)
      setIsAffiliateSelected(false)
      setIsComparisonSelected(false)
    },
  })

  // Permitir actualizar el contenido desde fuera (por ejemplo, tras generar con IA)
  useEffect(() => {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent)
    }
  }, [editor, initialContent])

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen')
      return
    }

    try {
      const blogFolderName = blog?.slug || blog?.id || (title.trim() ? generateSlug(title.trim()) : undefined)
      const { url } = await uploadBlogImage(file, undefined, blogFolderName)
      
      // Obtener dimensiones de la imagen usando window.Image para evitar conflicto con la extensión Image de Tiptap
      const imgElement = new window.Image()
      imgElement.src = url
      await new Promise((resolve, reject) => {
        imgElement.onload = resolve
        imgElement.onerror = reject
      })

      editor
        ?.chain()
        .focus()
        .setImage({
          src: url,
          alt: file.name,
          width: imgElement.width,
          height: imgElement.height,
          caption: '',
          alignment: 'center',
        } as any)
        .run()
    } catch (error) {
      console.error('Error subiendo imagen al editor:', error)
      alert('Error al subir la imagen. Inténtalo de nuevo.')
    }
  }

  const insertImageFromUrl = () => {
    if (!editor) return
    const url = window.prompt('Introduce la URL de la imagen (https://...)')
    if (!url) return
    
    // Intentar obtener dimensiones usando window.Image para evitar conflicto con la extensión Image de Tiptap
    const imgElement = new window.Image()
    imgElement.src = url
    imgElement.onload = () => {
      editor
        .chain()
        .focus()
        .setImage({
          src: url,
          alt: '',
          width: imgElement.width,
          height: imgElement.height,
          caption: '',
          alignment: 'center',
        } as any)
        .run()
    }
    imgElement.onerror = () => {
      // Si falla cargar, insertar sin dimensiones
      editor
        .chain()
        .focus()
        .setImage({
          src: url,
          alt: '',
          width: null,
          height: null,
          caption: '',
          alignment: 'center',
        } as any)
        .run()
    }
  }

  const openImageEditor = () => {
    if (!editor || !isImageSelected) return
    setShowImageModal(true)
  }

  const saveImageChanges = () => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .updateAttributes('image', {
        src: imageAttrs.src,
        alt: imageAttrs.alt,
        width: imageAttrs.width || null,
        height: imageAttrs.height || null,
        caption: imageAttrs.caption,
        alignment: imageAttrs.alignment,
      })
      .run()
    setShowImageModal(false)
  }

  const openAffiliateEditor = () => {
    if (!editor || !isAffiliateSelected) return
    setShowAffiliateModal(true)
  }

  const saveAffiliateChanges = () => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .updateAttributes('affiliateProduct', {
        imageUrl: affiliateAttrs.imageUrl,
        title: affiliateAttrs.title,
        description: affiliateAttrs.description,
        price: affiliateAttrs.price,
        affiliateUrl: affiliateAttrs.affiliateUrl,
        badge: affiliateAttrs.badge,
      })
      .run()
    setShowAffiliateModal(false)
  }

  const openComparisonEditor = () => {
    if (!editor || !isComparisonSelected) return
    setShowComparisonModal(true)
  }

  const saveComparisonChanges = () => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .updateAttributes('comparisonTable', {
        products: comparisonAttrs.products,
        title: comparisonAttrs.title,
        buttonColor: comparisonAttrs.buttonColor,
        buttonText: comparisonAttrs.buttonText,
      })
      .run()
    setShowComparisonModal(false)
  }

  const addComparisonProduct = () => {
    const newProduct = {
      imageUrl: '',
      name: '',
      description: '',
      price: '',
      affiliateUrl: '',
    }
    setComparisonAttrs({
      ...comparisonAttrs,
      products: [...comparisonAttrs.products, newProduct],
    })
  }

  const removeComparisonProduct = (index: number) => {
    setComparisonAttrs({
      ...comparisonAttrs,
      products: comparisonAttrs.products.filter((_, i) => i !== index),
    })
  }

  const updateComparisonProduct = (index: number, field: string, value: any) => {
    const updated = [...comparisonAttrs.products]
    updated[index] = { ...updated[index], [field]: value }
    setComparisonAttrs({ ...comparisonAttrs, products: updated })
  }

  const insertAffiliateProduct = () => {
    if (!editor) return

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'affiliateProduct',
        attrs: {
          imageUrl: 'https://m.media-amazon.com/images/I/AAA.jpg',
          title: 'Nombre del producto afiliado',
          description: 'Breve descripción del producto, puntos fuertes y para quién es ideal.',
          price: '[Rango de precio orientativo]',
          affiliateUrl: 'https://www.amazon.es/...?tag=tu-id-afiliado',
          badge: 'Mejor opción',
        },
      })
      // Añadimos un párrafo vacío debajo para que puedas seguir escribiendo
      .insertContent({
        type: 'paragraph',
        content: [{ type: 'text', text: '' }],
      })
      .run()
  }

  const insertComparisonTable = () => {
    if (!editor) return

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'comparisonTable',
        attrs: {
          products: [
            {
              imageUrl: 'https://m.media-amazon.com/images/I/AAA.jpg',
              name: 'Producto 1',
              description:
                '**Lo mejor** de este producto es...\n\n*Ideal para*: personas que buscan...',
              price: '[€€€]',
              affiliateUrl: 'https://www.amazon.es/...?tag=tu-id-afiliado-1',
            },
            {
              imageUrl: 'https://m.media-amazon.com/images/I/BBB.jpg',
              name: 'Producto 2',
              description:
                '**Ventajas** principales...\n\n*Ideal para*: quienes quieren...',
              price: '[€€]',
              affiliateUrl: 'https://www.amazon.es/...?tag=tu-id-afiliado-2',
            },
            {
              imageUrl: 'https://m.media-amazon.com/images/I/CCC.jpg',
              name: 'Producto 3',
              description:
                '**Puntos fuertes** del modelo...\n\n*Ideal para*: si valoras...',
              price: '[€]',
              affiliateUrl: 'https://www.amazon.es/...?tag=tu-id-afiliado-3',
            },
          ],
          title: 'Comparativa de productos recomendados',
          buttonColor: 'amber',
          buttonText: 'nombre',
        },
      })
      // Añadimos un párrafo vacío debajo para que puedas seguir escribiendo
      .insertContent({
        type: 'paragraph',
        content: [{ type: 'text', text: '' }],
      })
      .run()
  }

  if (!editor) {
    return (
      <div className="rounded-md border border-gray-200 p-4 text-sm text-gray-500">
        Cargando editor...
      </div>
    )
  }

  return (
    <div className="space-y-2 relative">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 shadow-sm">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`flex items-center justify-center rounded px-2 py-1 text-sm ${
            editor.isActive('bold') ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Negrita"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`flex items-center justify-center rounded px-2 py-1 text-sm ${
            editor.isActive('italic') ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Cursiva"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`flex items-center justify-center rounded px-2 py-1 text-sm ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="H2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`flex items-center justify-center rounded px-2 py-1 text-sm ${
            editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="H3"
        >
          <Heading3 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`flex items-center justify-center rounded px-2 py-1 text-sm ${
            editor.isActive('bulletList') ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Lista con viñetas"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`flex items-center justify-center rounded px-2 py-1 text-sm ${
            editor.isActive('blockquote') ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Cita"
        >
          <Quote className="h-4 w-4" />
        </button>
        <div className="h-6 w-px bg-gray-300" />
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`flex items-center justify-center rounded px-2 py-1 text-sm ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Alinear a la izquierda"
          title="Alinear párrafo a la izquierda"
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`flex items-center justify-center rounded px-2 py-1 text-sm ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Centrar"
          title="Centrar párrafo"
        >
          <AlignCenterIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`flex items-center justify-center rounded px-2 py-1 text-sm ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Alinear a la derecha"
          title="Alinear párrafo a la derecha"
        >
          <AlignRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`flex items-center justify-center rounded px-2 py-1 text-sm ${
            editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Justificar"
          title="Justificar párrafo"
        >
          <AlignJustify className="h-4 w-4" />
        </button>
        <div className="h-6 w-px bg-gray-300" />
        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          className="flex items-center justify-center rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100"
          aria-label="Tabla"
        >
          <TableIcon className="h-4 w-4" />
        </button>
        <label className="flex cursor-pointer items-center justify-center rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100">
          <ImageIcon className="h-4 w-4" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                void handleImageUpload(file)
                e.target.value = ''
              }
            }}
          />
        </label>
        <button
          type="button"
          onClick={insertImageFromUrl}
          className="flex items-center justify-center rounded px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
          aria-label="Imagen por URL"
          title="Insertar imagen desde URL"
        >
          <ImageIcon className="h-3 w-3 mr-1" />
          URL
        </button>
        <button
          type="button"
          onClick={() => {
            if (!editor) return
            const previousUrl = editor.getAttributes('link').href as string | undefined
            const url = window.prompt('Introduce la URL del enlace', previousUrl || 'https://')

            // Si el usuario cancela, no hacemos nada
            if (url === null) return

            // Si deja la URL vacía, quitamos el enlace
            if (url === '') {
              editor.chain().focus().extendMarkRange('link').unsetLink().run()
              return
            }

            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
          }}
          className={`flex items-center justify-center rounded px-2 py-1 text-sm ${
            editor.isActive('link') ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Enlace"
        >
          <Link2 className="h-4 w-4" />
        </button>
        {/* Botón editar imagen (solo visible cuando hay imagen seleccionada) */}
        {isImageSelected && (
          <button
            type="button"
            onClick={openImageEditor}
            className="flex items-center justify-center rounded px-2 py-1 text-sm text-primary-600 hover:bg-primary-50"
            aria-label="Editar imagen"
            title="Editar imagen (tamaño, alineación, pie de foto)"
          >
            <Edit className="h-4 w-4" />
          </button>
        )}
        {/* Alineación de imagen (requiere tener una imagen seleccionada) */}
        {isImageSelected && (
          <>
            <button
              type="button"
              onClick={() =>
                editor
                  ?.chain()
                  .focus()
                  .updateAttributes('image', { alignment: 'left' })
                  .run()
              }
              className="flex items-center justify-center rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100"
              aria-label="Imagen a la izquierda"
              title="Alinear imagen a la izquierda"
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                editor
                  ?.chain()
                  .focus()
                  .updateAttributes('image', { alignment: 'center' })
                  .run()
              }
              className="flex items-center justify-center rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100"
              aria-label="Imagen centrada"
              title="Centrar imagen"
            >
              <AlignCenterIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                editor
                  ?.chain()
                  .focus()
                  .updateAttributes('image', { alignment: 'right' })
                  .run()
              }
              className="flex items-center justify-center rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100"
              aria-label="Imagen a la derecha"
              title="Alinear imagen a la derecha"
            >
              <AlignRight className="h-4 w-4" />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={insertAffiliateProduct}
          className="flex items-center justify-center rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100"
          aria-label="Producto afiliado"
          title="Insertar bloque de producto afiliado"
        >
          <ShoppingCart className="h-4 w-4" />
        </button>
        {isAffiliateSelected && (
          <button
            type="button"
            onClick={openAffiliateEditor}
            className="flex items-center justify-center rounded px-2 py-1 text-sm text-primary-600 hover:bg-primary-50"
            aria-label="Editar producto afiliado"
            title="Editar bloque de producto afiliado"
          >
            <Edit className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={insertComparisonTable}
          className="flex items-center justify-center rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100"
          aria-label="Tabla comparativa"
          title="Insertar bloque de tabla comparativa"
        >
          <Columns3 className="h-4 w-4" />
        </button>
        {isComparisonSelected && (
          <button
            type="button"
            onClick={openComparisonEditor}
            className="flex items-center justify-center rounded px-2 py-1 text-sm text-primary-600 hover:bg-primary-50"
            aria-label="Editar tabla comparativa"
            title="Editar bloque de tabla comparativa"
          >
            <Edit className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Editor */}
      <div className="min-h-[300px] rounded-md border border-gray-200 bg-white p-3">
        <EditorContent
          editor={editor}
          className="prose prose-sm sm:prose lg:prose-lg max-w-none 
                     [&_h2]:text-2xl [&_h2]:font-bold 
                     [&_h3]:text-xl [&_h3]:font-semibold 
                     [&_a]:text-primary-600 [&_a]:underline
                     [&_p]:mb-4 [&_p]:mt-0 [&_p+_p]:mt-4
                     [&_ul]:list-disc [&_ul]:pl-6
                     [&_ul]:my-4
                     [&_ul>li]:my-1
                     [&_ul>li>p]:m-0
                     [&_ol]:list-decimal [&_ol]:pl-6
                     [&_ol]:my-4
                     [&_ol>li]:my-1
                     [&_ol>li>p]:m-0
                     [&_blockquote]:border-l-4 [&_blockquote]:border-blue-400
                     [&_blockquote]:bg-blue-50 [&_blockquote]:pl-4 [&_blockquote]:pr-4
                     [&_blockquote]:py-3 [&_blockquote]:rounded-md
                     [&_blockquote]:italic [&_blockquote]:text-blue-900
                     [&_[style*='text-align:left']]:text-left
                     [&_[style*='text-align:center']]:text-center
                     [&_[style*='text-align:right']]:text-right
                     [&_[style*='text-align:justify']]:text-justify"
        />
      </div>

      {/* Modal de edición de imagen */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Editar imagen</h3>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="rounded-md p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de la imagen
                </label>
                <input
                  type="url"
                  value={imageAttrs.src}
                  onChange={(e) => setImageAttrs({ ...imageAttrs, src: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Texto alternativo (alt)
                </label>
                <input
                  type="text"
                  value={imageAttrs.alt}
                  onChange={(e) => setImageAttrs({ ...imageAttrs, alt: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Descripción de la imagen"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ancho (px)
                  </label>
                  <input
                    type="number"
                    value={imageAttrs.width || ''}
                    onChange={(e) =>
                      setImageAttrs({
                        ...imageAttrs,
                        width: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="Auto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alto (px)
                  </label>
                  <input
                    type="number"
                    value={imageAttrs.height || ''}
                    onChange={(e) =>
                      setImageAttrs({
                        ...imageAttrs,
                        height: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="Auto"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pie de foto (caption)
                </label>
                <input
                  type="text"
                  value={imageAttrs.caption}
                  onChange={(e) => setImageAttrs({ ...imageAttrs, caption: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Texto que aparecerá debajo de la imagen"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alineación
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setImageAttrs({ ...imageAttrs, alignment: 'left' })}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                      imageAttrs.alignment === 'left'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Izquierda
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageAttrs({ ...imageAttrs, alignment: 'center' })}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                      imageAttrs.alignment === 'center'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Centro
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageAttrs({ ...imageAttrs, alignment: 'right' })}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                      imageAttrs.alignment === 'right'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Derecha
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveImageChanges}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de producto afiliado */}
      {showAffiliateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Editar producto afiliado</h3>
              <button
                type="button"
                onClick={() => setShowAffiliateModal(false)}
                className="rounded-md p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de la imagen
                </label>
                <input
                  type="url"
                  value={affiliateAttrs.imageUrl}
                  onChange={(e) => setAffiliateAttrs({ ...affiliateAttrs, imageUrl: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título del producto
                </label>
                <input
                  type="text"
                  value={affiliateAttrs.title}
                  onChange={(e) => setAffiliateAttrs({ ...affiliateAttrs, title: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Nombre del producto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={affiliateAttrs.description}
                  onChange={(e) => setAffiliateAttrs({ ...affiliateAttrs, description: e.target.value })}
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Breve descripción del producto..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio
                </label>
                <input
                  type="text"
                  value={affiliateAttrs.price}
                  onChange={(e) => setAffiliateAttrs({ ...affiliateAttrs, price: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Ej: [€€€] o Rango de precio"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de afiliado
                </label>
                <input
                  type="url"
                  value={affiliateAttrs.affiliateUrl}
                  onChange={(e) => setAffiliateAttrs({ ...affiliateAttrs, affiliateUrl: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="https://www.amazon.es/...?tag=tu-id-afiliado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Badge (opcional)
                </label>
                <input
                  type="text"
                  value={affiliateAttrs.badge}
                  onChange={(e) => setAffiliateAttrs({ ...affiliateAttrs, badge: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Ej: Mejor opción, Recomendado..."
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAffiliateModal(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveAffiliateChanges}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de tabla comparativa */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Editar tabla comparativa</h3>
              <button
                type="button"
                onClick={() => setShowComparisonModal(false)}
                className="rounded-md p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Configuración general de la tabla */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Configuración de la tabla</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título de la tabla
                  </label>
                  <input
                    type="text"
                    value={comparisonAttrs.title}
                    onChange={(e) => setComparisonAttrs({ ...comparisonAttrs, title: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="Comparativa de productos recomendados"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color del botón de Amazon
                  </label>
                  <select
                    value={comparisonAttrs.buttonColor}
                    onChange={(e) => setComparisonAttrs({ ...comparisonAttrs, buttonColor: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="primary">Primario (azul)</option>
                    <option value="amber">Ámbar (amarillo/naranja)</option>
                    <option value="green">Verde</option>
                    <option value="blue">Azul</option>
                    <option value="red">Rojo</option>
                    <option value="purple">Morado</option>
                    <option value="orange">Naranja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Texto del botón
                  </label>
                  <input
                    type="text"
                    value={comparisonAttrs.buttonText}
                    onChange={(e) => setComparisonAttrs({ ...comparisonAttrs, buttonText: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="nombre"
                  />
                </div>
              </div>

              {/* Lista de productos */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Productos</h4>
                {comparisonAttrs.products.map((product, index) => (
                <div key={index} className="rounded-lg border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700">Producto #{index + 1}</h4>
                    {comparisonAttrs.products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeComparisonProduct(index)}
                        className="text-red-600 text-sm hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      URL de la imagen
                    </label>
                    <input
                      type="url"
                      value={product.imageUrl}
                      onChange={(e) => updateComparisonProduct(index, 'imageUrl', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Nombre del producto
                    </label>
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => updateComparisonProduct(index, 'name', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="Nombre del producto"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Descripción del producto
                      <span className="ml-1 text-[10px] text-gray-500">
                        (soporta **negrita** y *cursiva* con formato tipo Markdown)
                      </span>
                    </label>
                    <textarea
                      value={product.description || ''}
                      onChange={(e) => updateComparisonProduct(index, 'description', e.target.value)}
                      rows={5}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder={
                        'Ejemplo:\n**Lo mejor** de este producto es...\n\n*Ideal para*: personas que...'
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Precio
                    </label>
                    <input
                      type="text"
                      value={product.price}
                      onChange={(e) => updateComparisonProduct(index, 'price', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="Ej: [€€€]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      URL de afiliado
                    </label>
                    <input
                      type="url"
                      value={product.affiliateUrl}
                      onChange={(e) => updateComparisonProduct(index, 'affiliateUrl', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="https://www.amazon.es/...?tag=tu-id-afiliado"
                    />
                  </div>
                </div>
              ))}
              </div>

              <button
                type="button"
                onClick={addComparisonProduct}
                className="w-full rounded-md border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                + Añadir producto
              </button>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowComparisonModal(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveComparisonChanges}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

