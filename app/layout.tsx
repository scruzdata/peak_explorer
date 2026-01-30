import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import dynamic from 'next/dynamic'
import './globals.css'
// Optimización: Removido import de leaflet CSS del layout (render blocking)
// Se carga dinámicamente solo cuando se necesita (ver componentes que usan mapas)
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { UserProgressProvider } from '@/components/providers/UserProgressProvider'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { CookieConsentProvider } from '@/components/cookies/CookieConsentProvider'

// Optimización: Lazy loading de componentes no críticos para reducir JavaScript inicial
// Estos componentes solo se cargan cuando se necesitan (mejora FCP y reduce bundle size)
const CookieBanner = dynamic(
  () => import('@/components/cookies/CookieBanner').then((mod) => ({ default: mod.CookieBanner })),
  { 
    ssr: false, // No necesario en SSR, solo se muestra después de verificar consentimiento
    loading: () => null, // No mostrar nada mientras carga (el componente ya tiene su propia lógica de renderizado)
  }
)

const CookieSettings = dynamic(
  () => import('@/components/cookies/CookieSettings').then((mod) => ({ default: mod.CookieSettings })),
  { 
    ssr: false, // Modal que solo se muestra cuando el usuario hace click
    loading: () => null, // No mostrar nada mientras carga
  }
)

const ConditionalScripts = dynamic(
  () => import('@/components/cookies/ConditionalScripts').then((mod) => ({ default: mod.ConditionalScripts })),
  { 
    ssr: false, // Scripts solo se cargan en cliente después de verificar consentimiento
    loading: () => null, // No mostrar nada mientras carga
  }
)

// Optimización: Fuente con display swap para evitar FOIT (Flash of Invisible Text)
// preload mejora LCP al cargar la fuente críticamente
const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap', // Muestra texto con fuente del sistema mientras carga (mejora CLS)
  preload: true, // Preload de fuente para mejorar LCP
  adjustFontFallback: true, // Ajusta métricas de fallback para reducir CLS
})

export const metadata: Metadata = {
  title: {
    default: 'Peak Explorer - Rutas de Trekking y Vías Ferratas en España',
    template: '%s | Peak Explorer',
  },
  description: 'Descubre las mejores rutas de trekking y vías ferratas de España. Guías completas con mapas GPX, fotos y consejos de seguridad.',
  keywords: ['trekking españa', 'vías ferratas', 'rutas montaña', 'senderismo', 'escalada'],
  authors: [{ name: 'Peak Explorer' }],
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://peak-explorer.com',
    siteName: 'Peak Explorer',
    title: 'Peak Explorer - Rutas de Trekking y Vías Ferratas',
    description: 'Descubre las mejores rutas de montaña de España',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Peak Explorer',
    description: 'Rutas de trekking y vías ferratas en España',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>
          <CookieConsentProvider>
            <AuthProvider>
              <UserProgressProvider>
                <div className="flex min-h-screen flex-col">
                  <Header />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
                <CookieBanner />
                <CookieSettings />
                <ConditionalScripts />
              </UserProgressProvider>
            </AuthProvider>
          </CookieConsentProvider>
        </SessionProvider>
      </body>
    </html>
  )
}

