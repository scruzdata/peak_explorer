import { Node, mergeAttributes } from '@tiptap/core'

export const ComparisonTableExtension = Node.create({
  name: 'comparisonTable',

  group: 'block',
  atom: true,

  addAttributes() {
    return {
      products: {
        default: [],
      },
      title: {
        default: 'Comparativa de productos recomendados',
      },
      buttonColor: {
        default: 'amber',
      },
      buttonText: {
        default: 'nombre',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'section[data-type="comparison-table"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    // Nodo hoja (atom): no debe tener "content hole" (0) en la spec de HTML
    return ['section', mergeAttributes(HTMLAttributes, { 'data-type': 'comparison-table' })]
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('section')
      dom.setAttribute('data-type', 'comparison-table')
      dom.className =
        'my-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm'

      const products = (node.attrs.products || []) as Array<{
        imageUrl: string
        name: string
        description?: string
        price: string
        affiliateUrl: string
      }>
      const title = node.attrs.title || 'Comparativa de productos recomendados'
      const buttonColor = node.attrs.buttonColor || 'amber'
      const buttonText = node.attrs.buttonText || 'nombre'

      if (!products.length) {
        dom.innerHTML =
          '<div class="p-4 text-sm text-gray-500">Añade productos a la tabla comparativa.</div>'
        return { dom }
      }

      // Mapear colores de botón
      const buttonColorClasses: Record<string, string> = {
        primary: 'bg-primary-600 hover:bg-primary-700',
        amber: 'bg-yellow-400 hover:bg-yellow-500',
        green: 'bg-green-600 hover:bg-green-700',
        blue: 'bg-blue-600 hover:bg-blue-700',
        red: 'bg-red-600 hover:bg-red-700',
        purple: 'bg-purple-600 hover:bg-purple-700',
        orange: 'bg-orange-600 hover:bg-orange-700',
      }
      const buttonClass = buttonColorClasses[buttonColor] || buttonColorClasses.primary
      const buttonTextColor = buttonColor === 'amber' ? 'text-black' : 'text-white'

      const headerRow = `
        <tr class="bg-gray-50">
          <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Producto</th>
          <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Descripción</th>
          <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Precio</th>
          <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Enlace</th>
        </tr>
      `

      // Utilidad simple para escapar HTML
      const escapeHtml = (str: string) =>
        str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;')

      // Soporta **negrita** y *cursiva*, y párrafos separados por líneas en blanco
      const markdownToHtml = (md: string): string => {
        const escaped = escapeHtml(md)
        const withBold = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        const withItalic = withBold.replace(/\*([^*]+)\*/g, '<em>$1</em>')
        const paragraphs = withItalic
          .split(/\n{2,}/)
          .map((p) => p.trim())
          .filter((p) => p.length > 0)

        if (!paragraphs.length) return ''

        return paragraphs.map((p) => `<p class="mb-1">${p.replace(/\n/g, '<br />')}</p>`).join('')
      }

      const rows = products
        .map((p) => {
          const descriptionHtml =
            p.description && p.description.trim().length
              ? markdownToHtml(p.description)
              : '<p class="text-xs text-gray-400">Añade una descripción del producto.</p>'

          return `
            <tr class="border-t border-gray-100">
              <td class="px-4 py-4 align-top">
                <div class="flex items-center gap-3">
                  ${
                    p.imageUrl
                      ? `<img src="${p.imageUrl}" alt="${p.name}" class="h-32 w-32 flex-shrink-0 rounded-lg object-contain bg-gray-50" />`
                      : '<div class="h-32 w-32 flex-shrink-0 rounded-lg bg-gray-100 text-xs flex items-center justify-center text-gray-400">Sin imagen</div>'
                  }
                  <div>
                    <p class="text-sm font-semibold text-gray-900">${p.name || 'Producto afiliado'}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 align-top">
                <div class="text-sm text-gray-700 space-y-1">
                  ${descriptionHtml}
                </div>
              </td>
              <td class="px-4 py-4 align-top">
                <p class="text-sm font-semibold text-primary-700">${
                  p.price && p.price.trim().length ? p.price : '€'
                }</p>
              </td>
              <td class="px-4 py-4 align-top">
                ${
                  p.affiliateUrl
                    ? `<a href="${p.affiliateUrl}" target="_blank" rel="nofollow noopener noreferrer" class="inline-flex items-center justify-center rounded-full ${buttonClass} px-4 py-2 text-sm font-medium ${buttonTextColor}">
                        ${buttonText}
                      </a>`
                    : '<span class="text-xs text-gray-400">Añade la URL de afiliado.</span>'
                }
              </td>
            </tr>
          `
        })
        .join('')

      dom.innerHTML = `
        <div class="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 text-sm font-medium text-white">
          ${title}
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead>
              ${headerRow}
            </thead>
            <tbody class="divide-y divide-gray-100">
              ${rows}
            </tbody>
          </table>
        </div>
      `

      return {
        dom,
      }
    }
  },
})

