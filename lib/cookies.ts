/**
 * Utilidades para gestión de cookies y consentimiento GDPR/ePrivacy
 */

export type CookieCategory = 'necessary' | 'analytics' | 'marketing' | 'preferences'

export interface CookieConsent {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
  timestamp: number
  version: string
}

const CONSENT_STORAGE_KEY = 'cookie_consent'
const CONSENT_VERSION = '1.0'

/**
 * Obtiene el consentimiento guardado del usuario
 */
export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!stored) return null

    const consent = JSON.parse(stored) as CookieConsent
    
    // Validar que la versión sea compatible
    if (consent.version !== CONSENT_VERSION) {
      return null
    }

    return consent
  } catch (error) {
    console.error('Error leyendo consentimiento de cookies:', error)
    return null
  }
}

/**
 * Guarda el consentimiento del usuario
 */
export function saveCookieConsent(consent: Partial<CookieConsent>): void {
  if (typeof window === 'undefined') return

  try {
    const fullConsent: CookieConsent = {
      necessary: true, // Siempre true, no se puede rechazar
      analytics: consent.analytics ?? false,
      marketing: consent.marketing ?? false,
      preferences: consent.preferences ?? false,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    }

    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(fullConsent))
    
    // Disparar evento personalizado para que otros componentes reaccionen
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: fullConsent }))
  } catch (error) {
    console.error('Error guardando consentimiento de cookies:', error)
  }
}

/**
 * Verifica si el usuario ha dado consentimiento para una categoría específica
 */
export function hasConsentFor(category: CookieCategory): boolean {
  const consent = getCookieConsent()
  if (!consent) return false

  // Las cookies necesarias siempre están permitidas
  if (category === 'necessary') return true

  return consent[category] === true
}

/**
 * Verifica si el usuario ha dado algún tipo de consentimiento
 */
export function hasAnyConsent(): boolean {
  return getCookieConsent() !== null
}

/**
 * Acepta todas las cookies
 */
export function acceptAllCookies(): void {
  saveCookieConsent({
    analytics: true,
    marketing: true,
    preferences: true,
  })
}

/**
 * Rechaza todas las cookies no esenciales
 */
export function rejectAllCookies(): void {
  saveCookieConsent({
    analytics: false,
    marketing: false,
    preferences: false,
  })
}

/**
 * Carga un script externo solo si hay consentimiento
 */
export function loadScriptIfConsented(
  src: string,
  category: CookieCategory,
  options?: {
    id?: string
    async?: boolean
    defer?: boolean
    onLoad?: () => void
    onError?: () => void
  }
): void {
  if (typeof window === 'undefined') return

  // Las cookies necesarias siempre se cargan
  if (category === 'necessary' || hasConsentFor(category)) {
    const scriptId = options?.id || `script-${category}-${Date.now()}`
    
    // Evitar cargar el mismo script dos veces
    if (document.getElementById(scriptId)) {
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = src
    if (options?.async) script.async = true
    if (options?.defer) script.defer = true
    
    if (options?.onLoad) {
      script.onload = options.onLoad
    }
    
    if (options?.onError) {
      script.onerror = options.onError
    }

    document.head.appendChild(script)
  }
}

/**
 * Ejemplo de uso para cargar Google Analytics
 * 
 * IMPORTANTE: Descomenta y configura según tus necesidades
 * 
 * export function loadGoogleAnalytics() {
 *   loadScriptIfConsented(
 *     'https://www.googletagmanager.com/gtag/js?id=TU-GA-ID',
 *     'analytics',
 *     {
 *       id: 'google-analytics',
 *       async: true,
 *       onLoad: () => {
 *         // Inicializar gtag después de cargar el script
 *         if (typeof window !== 'undefined' && (window as any).gtag) {
 *           (window as any).gtag('config', 'TU-GA-ID')
 *         }
 *       }
 *     }
 *   )
 * }
 */
