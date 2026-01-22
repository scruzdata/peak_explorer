/**
 * Utilidades para Google Analytics
 * 
 * Estas funciones solo funcionan si Google Analytics está cargado
 * y el usuario ha dado consentimiento para cookies de análisis
 */

/**
 * Envía un evento a Google Analytics
 * 
 * @param eventName - Nombre del evento (ej: 'click', 'download', 'share')
 * @param eventParams - Parámetros adicionales del evento
 * 
 * @example
 * trackEvent('button_click', {
 *   button_name: 'download_gpx',
 *   route_id: 'ruta-123'
 * })
 */
export function trackEvent(
  eventName: string,
  eventParams?: {
    [key: string]: string | number | boolean
  }
): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return
  }

  try {
    window.gtag('event', eventName, eventParams || {})
  } catch (error) {
    console.error('Error enviando evento a Google Analytics:', error)
  }
}

/**
 * Registra una vista de página
 * 
 * @param pagePath - Ruta de la página (ej: '/rutas/mi-ruta')
 * @param pageTitle - Título de la página (opcional)
 * 
 * @example
 * trackPageView('/rutas/mi-ruta', 'Mi Ruta de Montaña')
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return
  }

  try {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || '', {
      page_path: pagePath,
      page_title: pageTitle,
    })
  } catch (error) {
    console.error('Error registrando vista de página:', error)
  }
}

/**
 * Verifica si Google Analytics está disponible
 */
export function isAnalyticsAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function'
}

/**
 * Eventos predefinidos comunes
 */
export const AnalyticsEvents = {
  // Navegación
  PAGE_VIEW: 'page_view',
  ROUTE_VIEW: 'route_view',
  FERRATA_VIEW: 'ferrata_view',
  
  // Interacciones
  BUTTON_CLICK: 'button_click',
  LINK_CLICK: 'link_click',
  DOWNLOAD: 'download',
  SHARE: 'share',
  
  // Formularios
  FORM_START: 'form_start',
  FORM_SUBMIT: 'form_submit',
  FORM_ERROR: 'form_error',
  
  // Búsqueda
  SEARCH: 'search',
  
  // Autenticación
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGNUP: 'signup',
  
  // Contenido
  VIDEO_PLAY: 'video_play',
  VIDEO_COMPLETE: 'video_complete',
  IMAGE_VIEW: 'image_view',
} as const
