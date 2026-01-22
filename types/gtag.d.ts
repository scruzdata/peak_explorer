/**
 * Tipos para Google Analytics (gtag)
 */

interface Window {
  dataLayer: any[]
  gtag: (
    command: 'config' | 'set' | 'event' | 'js',
    targetId: string | Date,
    config?: {
      anonymize_ip?: boolean
      page_path?: string
      page_title?: string
      [key: string]: any
    }
  ) => void
}
