import { Node, mergeAttributes } from '@tiptap/core'

export const AffiliateProductExtension = Node.create({
  name: 'affiliateProduct',

  group: 'block',
  atom: true,

  addAttributes() {
    return {
      imageUrl: { default: '' },
      title: { default: '' },
      description: { default: '' },
      price: { default: '' },
      affiliateUrl: { default: '' },
      badge: { default: '' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="affiliate-product"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    // Nodo hoja (atom): no debe tener "content hole" (0) en la spec de HTML
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'affiliate-product' })]
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div')
      dom.setAttribute('data-type', 'affiliate-product')
      dom.className =
        'my-6 flex flex-col overflow-hidden rounded-xl border border-primary-100 bg-primary-50 p-4 sm:flex-row gap-4'

      const { imageUrl, title, description, price, affiliateUrl, badge } = node.attrs

      dom.innerHTML = `
        <div class="w-full sm:w-40 flex-shrink-0 flex items-center justify-center">
          ${
            imageUrl
              ? `<img src="${imageUrl}" alt="${title || 'Producto afiliado'}" class="h-32 w-32 object-contain rounded-lg bg-white" />`
              : `<div class="h-32 w-32 rounded-lg bg-white/60 flex items-center justify-center text-xs text-gray-400">Sin imagen</div>`
          }
        </div>
        <div class="flex-1 space-y-2">
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-semibold text-gray-900">${title || 'Producto afiliado'}</h3>
            ${
              badge
                ? `<span class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">${badge}</span>`
                : ''
            }
          </div>
          ${
            description
              ? `<p class="text-sm text-gray-700">${description}</p>`
              : '<p class="text-sm text-gray-400">Añade una descripción del producto.</p>'
          }
          ${
            price
              ? `<p class="text-base font-semibold text-primary-700">Precio orientativo: ${price}</p>`
              : ''
          }
          ${
            affiliateUrl
              ? `<a href="${affiliateUrl}" target="_blank" rel="nofollow noopener noreferrer" class="inline-flex items-center justify-center rounded-full bg-yellow-400 px-4 py-2 text-sm font-medium text-black hover:bg-yellow-500">
                  Ver en Amazon
                </a>`
              : '<p class="text-xs text-gray-400">Añade la URL de afiliado para el botón.</p>'
          }
        </div>
      `

      return {
        dom,
      }
    }
  },
})

