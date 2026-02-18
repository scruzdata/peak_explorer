'use client'

import React from 'react'
import { createRoot } from 'react-dom/client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TextAlign from '@tiptap/extension-text-align'
import { AffiliateProductExtension } from '@/components/editor/extensions/AffiliateProductExtension'
import { ComparisonTableExtension } from '@/components/editor/extensions/ComparisonTableExtension'
import { AffiliateProductBlock } from './AffiliateProductBlock'
import { ComparisonTableBlock } from './ComparisonTableBlock'

// Extensión de imagen compartida con el editor:
// permite width, height, caption y alignment, y aplica los mismos estilos
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
      img.className = 'rounded-lg'

      const styles: string[] = []

      if (width) {
        styles.push(`width:${width}px`)
        styles.push('max-width:100%')
      }
      if (height) {
        styles.push(`height:${height}px`)
      } else {
        styles.push('height:auto')
      }

      if (alignment === 'left') {
        styles.push('float:left', 'margin:0 1rem 1rem 0', 'max-width:40%')
      } else if (alignment === 'right') {
        styles.push('float:right', 'margin:0 0 1rem 1rem', 'max-width:40%')
      } else {
        styles.push('display:block', 'margin:1rem auto', 'max-width:80%')
      }

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

export interface BlogRendererProps {
  contentJson: any
}

export function BlogRenderer({ contentJson }: BlogRendererProps) {
  // Log para depuración
  if (contentJson) {
    console.log('📄 BlogRenderer recibió contentJson:', {
      type: contentJson.type,
      hasContent: !!contentJson.content,
      contentLength: contentJson.content?.length,
      jsonString: JSON.stringify(contentJson).substring(0, 200),
    })
  }

  const editor = useEditor({
    editable: false,
    content: contentJson,
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        // En el renderer público dejamos que el navegador maneje el click normalmente
        // (sin lógica extra de Tiptap) para que los enlaces funcionen como <a> estándar.
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer nofollow',
        },
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
      AffiliateProductExtension.extend({
        addNodeView() {
          return ({ node }) => {
            const dom = document.createElement('div')
            const { imageUrl, title, description, price, affiliateUrl, badge } = node.attrs

            dom.className = 'my-6'

            const reactElement = (
              <AffiliateProductBlock
                imageUrl={imageUrl}
                title={title}
                description={description}
                price={price}
                affiliateUrl={affiliateUrl}
                badge={badge}
              />
            )

            const rootElement = document.createElement('div')
            dom.appendChild(rootElement)
            const root = createRoot(rootElement)
            root.render(reactElement)

            return { dom }
          }
        },
      }),
      ComparisonTableExtension.extend({
        addNodeView() {
          return ({ node }) => {
            const dom = document.createElement('div')
            const { products, title, buttonColor, buttonText } = node.attrs

            dom.className = 'my-6'

            const reactElement = (
              <ComparisonTableBlock
                products={products || []}
                title={title}
                buttonColor={buttonColor}
                buttonText={buttonText}
              />
            )
            const rootElement = document.createElement('div')
            dom.appendChild(rootElement)
            const root = createRoot(rootElement)
            root.render(reactElement)

            return { dom }
          }
        },
      }),
    ],
  })

  if (!contentJson) {
    return <p className="text-gray-500 text-sm">Sin contenido.</p>
  }

  if (!editor) {
    return <div className="h-24 animate-pulse rounded-md bg-gray-100" />
  }

  return (
    <div className="prose prose-lg max-w-none">
      <EditorContent
        editor={editor}
        className="prose prose-lg max-w-none 
                   [&_h2]:text-3xl [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:font-bold 
                   [&_h3]:text-2xl [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:font-semibold 
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
  )
}

