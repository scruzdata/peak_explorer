'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCookieConsent } from './CookieConsentProvider'
import { X, Cookie, BarChart3, Target, Settings } from 'lucide-react'
import type { CookieCategory } from '@/lib/cookies'

interface CookieCategoryInfo {
  id: CookieCategory
  name: string
  description: string
  icon: React.ReactNode
  required?: boolean
}

const cookieCategories: CookieCategoryInfo[] = [
  {
    id: 'necessary',
    name: 'Cookies necesarias',
    description: 'Estas cookies son esenciales para el funcionamiento del sitio web. No se pueden desactivar.',
    icon: <Cookie className="w-5 h-5" />,
    required: true,
  },
  {
    id: 'analytics',
    name: 'Cookies de análisis',
    description: 'Nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web recopilando información de forma anónima.',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    id: 'preferences',
    name: 'Cookies de preferencias',
    description: 'Permiten que el sitio web recuerde información que cambia la forma en que se comporta o se ve el sitio.',
    icon: <Settings className="w-5 h-5" />,
  },
  {
    id: 'marketing',
    name: 'Cookies de marketing',
    description: 'Se utilizan para hacer un seguimiento de los visitantes a través de diferentes sitios web con la intención de mostrar anuncios relevantes.',
    icon: <Target className="w-5 h-5" />,
  },
]

export function CookieSettings() {
  const { showSettings, setShowSettings, consent, updateConsent } = useCookieConsent()
  const [localConsent, setLocalConsent] = useState({
    analytics: false,
    preferences: false,
    marketing: false,
  })

  useEffect(() => {
    if (showSettings && consent) {
      setLocalConsent({
        analytics: consent.analytics,
        preferences: consent.preferences,
        marketing: consent.marketing,
      })
    }
  }, [showSettings, consent])

  if (!showSettings) return null

  const handleToggle = (category: CookieCategory) => {
    if (category === 'necessary') return // No se puede desactivar

    setLocalConsent((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  const handleSave = () => {
    updateConsent(localConsent)
  }

  const handleAcceptAll = () => {
    updateConsent({
      analytics: true,
      preferences: true,
      marketing: true,
    })
  }

  const handleRejectAll = () => {
    updateConsent({
      analytics: false,
      preferences: false,
      marketing: false,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="cookie-settings-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={() => setShowSettings(false)}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2
              id="cookie-settings-title"
              className="text-xl font-semibold text-gray-900"
            >
              Configuración de cookies
            </h2>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-1"
              aria-label="Cerrar configuración de cookies"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <p className="text-sm text-gray-600 mb-6">
              Puedes gestionar tus preferencias de cookies a continuación. Las cookies necesarias no se pueden desactivar ya que son esenciales para el funcionamiento del sitio.{' '}
              <Link
                href="/cookies"
                className="text-primary-600 hover:text-primary-700 underline font-medium"
              >
                Más información en nuestra política de cookies
              </Link>
            </p>

            <div className="space-y-4">
              {cookieCategories.map((category) => {
                const isChecked = category.id === 'necessary' ? true : localConsent[category.id]

                return (
                  <div
                    key={category.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5 text-primary-600">
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {category.name}
                            {category.required && (
                              <span className="ml-2 text-xs text-gray-500 font-normal">
                                (Siempre activas)
                              </span>
                            )}
                          </h3>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggle(category.id)}
                              disabled={category.required}
                              className="sr-only peer"
                              aria-label={`Activar cookies de ${category.name}`}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" />
                          </label>
                        </div>
                        <p className="text-sm text-gray-600">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={handleRejectAll}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              Rechazar todas
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              Aceptar todas
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              Guardar preferencias
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
