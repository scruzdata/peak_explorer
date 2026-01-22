'use client'

import React from 'react'
import Link from 'next/link'
import { useCookieConsent } from './CookieConsentProvider'
import { Cookie, X } from 'lucide-react'

export function CookieBanner() {
  const { showBanner, acceptAll, rejectAll, setShowSettings } = useCookieConsent()

  if (!showBanner) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-description"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icono y texto */}
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <h3
                id="cookie-banner-title"
                className="text-sm font-semibold text-gray-900 mb-1"
              >
                Uso de cookies
              </h3>
              <p
                id="cookie-banner-description"
                className="text-sm text-gray-600"
              >
                Utilizamos cookies para mejorar tu experiencia, analizar el tráfico del sitio y personalizar el contenido.{' '}
                <Link
                  href="/cookies"
                  className="text-primary-600 hover:text-primary-700 underline font-medium"
                >
                  Más información
                </Link>
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={rejectAll}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              aria-label="Rechazar cookies no esenciales"
            >
              Rechazar
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              aria-label="Configurar cookies"
            >
              Configurar
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              aria-label="Aceptar todas las cookies"
            >
              Aceptar todas
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
