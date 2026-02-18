'use client'

import React from 'react'

export interface ComparisonProduct {
  imageUrl: string
  name: string
  description?: string
  price: string
  affiliateUrl: string
}

export interface ComparisonTableBlockProps {
  products: ComparisonProduct[]
  title?: string
  buttonColor?: string
  buttonText?: string
}

// Renderiza la descripción con soporte básico de **negrita**, *cursiva* y párrafos
function DescriptionRenderer({ description }: { description?: string }) {
  if (!description || !description.trim().length) {
    return <div className="text-xs text-gray-400">Añade una descripción del producto.</div>
  }

  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

  const toParagraphHtml = (md: string): string[] => {
    const escaped = escapeHtml(md)
    const withBold = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    const withItalic = withBold.replace(/\*([^*]+)\*/g, '<em>$1</em>')

    const rawParagraphs = withItalic
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0)

    if (!rawParagraphs.length) return []

    return rawParagraphs.map((p) => p.replace(/\n/g, '<br />'))
  }

  const paragraphs = toParagraphHtml(description)

  if (!paragraphs.length) {
    return <div className="text-xs text-gray-400">Añade una descripción del producto.</div>
  }

  return (
    <div className="text-sm text-gray-700 space-y-1">
      {paragraphs.map((html, idx) => (
        // eslint-disable-next-line react/no-danger
        <p key={idx} className="mb-1" dangerouslySetInnerHTML={{ __html: html }} />
      ))}
    </div>
  )
}

export function ComparisonTableBlock({ products, title = 'Comparativa de productos recomendados', buttonColor = 'amber', buttonText = 'nombre' }: ComparisonTableBlockProps) {
  if (!products || products.length === 0) {
    return (
      <div className="my-6 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
        Añade productos a la tabla comparativa.
      </div>
    )
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

  return (
    <section className="my-10 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 text-sm font-medium text-white">
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Producto
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Descripción
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Precio
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Enlace
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {products.map((p, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-4 align-top">
                  <div className="flex items-center gap-3">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="h-32 w-32 flex-shrink-0 rounded-lg bg-gray-50 object-contain"
                      />
                    ) : (
                      <div className="flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                        Sin imagen
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{p.name || 'Producto afiliado'}</p>
                    </div>
                  </div>
                </td>
              <td className="px-4 py-4 align-top">
                  <DescriptionRenderer description={p.description} />
                </td>
                <td className="px-4 py-4 align-top">
                  <p className="text-sm font-semibold text-primary-700">
                    {p.price && p.price.trim().length ? p.price : '€'}
                  </p>
                </td>
                <td className="px-4 py-4 align-top">
                  {p.affiliateUrl ? (
                    <a
                      href={p.affiliateUrl}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className={`inline-flex items-center justify-center rounded-full ${buttonClass} px-4 py-2 text-sm font-medium ${buttonColor === 'amber' ? 'text-black' : 'text-white'}`}
                    >
                      {buttonText}
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Añade la URL de afiliado.</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

