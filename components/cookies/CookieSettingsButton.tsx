'use client'

import React from 'react'
import { useCookieConsent } from './CookieConsentProvider'
import { Settings } from 'lucide-react'

export function CookieSettingsButton() {
  const { setShowSettings } = useCookieConsent()

  return (
    <button
      onClick={() => setShowSettings(true)}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
    >
      <Settings className="w-4 h-4" />
      Configurar cookies
    </button>
  )
}
