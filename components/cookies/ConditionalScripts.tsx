'use client'

import { useEffect } from 'react'
import { useCookieConsent } from './CookieConsentProvider'
import { loadScriptIfConsented } from '@/lib/cookies'

/**
 * Componente para cargar scripts condicionalmente basados en el consentimiento
 * 
 * Google Analytics se carga automáticamente si:
 * 1. El usuario ha dado consentimiento para cookies de análisis
 * 2. La variable de entorno NEXT_PUBLIC_GA_ID está configurada
 */
export function ConditionalScripts() {
  const { hasConsent } = useCookieConsent()

  useEffect(() => {
    // Obtener el ID de Google Analytics desde variables de entorno
    const gaId = process.env.NEXT_PUBLIC_GA_ID

    // Cargar Google Analytics solo si hay consentimiento y está configurado
    if (hasConsent('analytics') && gaId) {
      loadScriptIfConsented(
        `https://www.googletagmanager.com/gtag/js?id=${gaId}`,
        'analytics',
        {
          id: 'google-analytics',
          async: true,
          onLoad: () => {
            if (typeof window !== 'undefined') {
              // Inicializar dataLayer
              window.dataLayer = window.dataLayer || []
              
              // Definir función gtag
              function gtag(
                command: 'config' | 'set' | 'event' | 'js',
                targetId: string | Date,
                config?: {
                  anonymize_ip?: boolean
                  page_path?: string
                  page_title?: string
                  [key: string]: any
                }
              ) {
                window.dataLayer.push(arguments)
              }

              // Asignar gtag a window
              window.gtag = gtag

              // Inicializar Google Analytics
              gtag('js', new Date())
              gtag('config', gaId, {
                anonymize_ip: true, // Anonimizar IPs para cumplir con GDPR
                page_path: window.location.pathname,
              })

              // Registrar evento de carga
              console.log('✅ Google Analytics cargado correctamente')
            }
          },
          onError: () => {
            console.error('❌ Error al cargar Google Analytics')
          },
        }
      )
    }

    // Ejemplo: Cargar otros scripts de análisis
    // if (hasConsent('analytics')) {
    //   loadScriptIfConsented('https://ejemplo.com/analytics.js', 'analytics', {
    //     id: 'otro-analytics',
    //     async: true,
    //   })
    // }

    // Ejemplo: Cargar scripts de marketing
    // if (hasConsent('marketing')) {
    //   loadScriptIfConsented('https://ejemplo.com/marketing.js', 'marketing', {
    //     id: 'marketing-script',
    //     async: true,
    //   })
    // }
  }, [hasConsent])

  // Este componente no renderiza nada
  return null
}
