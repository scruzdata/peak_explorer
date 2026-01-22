'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { CookieConsent, CookieCategory } from '@/lib/cookies'
import {
  getCookieConsent,
  saveCookieConsent,
  hasConsentFor,
  acceptAllCookies,
  rejectAllCookies,
} from '@/lib/cookies'

interface CookieConsentContextType {
  consent: CookieConsent | null
  hasConsent: (category: CookieCategory) => boolean
  acceptAll: () => void
  rejectAll: () => void
  updateConsent: (consent: Partial<CookieConsent>) => void
  showBanner: boolean
  setShowBanner: (show: boolean) => void
  showSettings: boolean
  setShowSettings: (show: boolean) => void
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined)

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Cargar consentimiento al montar
  useEffect(() => {
    const storedConsent = getCookieConsent()
    setConsent(storedConsent)
    
    // Mostrar banner solo si no hay consentimiento previo
    if (!storedConsent) {
      setShowBanner(true)
    }

    // Escuchar cambios en el consentimiento (desde otros tabs/windows)
    const handleConsentUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<CookieConsent>
      setConsent(customEvent.detail)
    }

    window.addEventListener('cookieConsentUpdated', handleConsentUpdate)
    window.addEventListener('storage', (e) => {
      if (e.key === 'cookie_consent') {
        const newConsent = getCookieConsent()
        setConsent(newConsent)
      }
    })

    return () => {
      window.removeEventListener('cookieConsentUpdated', handleConsentUpdate)
    }
  }, [])

  const acceptAll = () => {
    acceptAllCookies()
    const newConsent = getCookieConsent()
    setConsent(newConsent)
    setShowBanner(false)
    setShowSettings(false)
  }

  const rejectAll = () => {
    rejectAllCookies()
    const newConsent = getCookieConsent()
    setConsent(newConsent)
    setShowBanner(false)
    setShowSettings(false)
  }

  const updateConsent = (newConsent: Partial<CookieConsent>) => {
    saveCookieConsent(newConsent)
    const updated = getCookieConsent()
    setConsent(updated)
    setShowBanner(false)
    setShowSettings(false)
  }

  const hasConsent = (category: CookieCategory) => {
    return hasConsentFor(category)
  }

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        hasConsent,
        acceptAll,
        rejectAll,
        updateConsent,
        showBanner,
        setShowBanner,
        showSettings,
        setShowSettings,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext)
  if (context === undefined) {
    throw new Error('useCookieConsent debe usarse dentro de CookieConsentProvider')
  }
  return context
}
