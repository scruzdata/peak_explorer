import React from 'react'

export interface AffiliateProductBlockProps {
  imageUrl: string
  title: string
  description: string
  price: string
  affiliateUrl: string
  badge?: string
}

export function AffiliateProductBlock({
  imageUrl,
  title,
  description,
  price,
  affiliateUrl,
  badge,
}: AffiliateProductBlockProps) {
  return (
    <div className="my-8 flex flex-col gap-4 overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-5 sm:flex-row">
      <div className="flex w-full items-center justify-center sm:w-56">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title || 'Producto afiliado'}
            className="h-48 w-48 rounded-xl bg-white object-contain shadow-sm"
          />
        ) : (
          <div className="flex h-48 w-48 items-center justify-center rounded-xl bg-white/70 text-xs text-gray-400">
            Sin imagen
          </div>
        )}
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">{title || 'Producto recomendado'}</h3>
          {badge && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              {badge}
            </span>
          )}
        </div>
        {description && <p className="text-sm text-gray-700">{description}</p>}
        {price && <p className="text-base font-semibold text-primary-700">Precio orientativo: {price}</p>}
        {affiliateUrl ? (
          <a
            href={affiliateUrl}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-yellow-400 px-4 py-2 text-sm font-medium text-black hover:bg-yellow-500"
          >
            Ver en Amazon
          </a>
        ) : (
          <p className="text-xs text-gray-400">Añade la URL de afiliado para activar el botón.</p>
        )}
      </div>
    </div>
  )
}

