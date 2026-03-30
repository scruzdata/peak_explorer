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
  alternates: {
    canonical: 'https://www.peakexplorer.es',
    languages: {
      'es': 'https://www.peakexplorer.es',
      'x-default': 'https://www.peakexplorer.es',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://www.peakexplorer.es',
    siteName: 'Peak Explorer',
    title: 'Peak Explorer - Rutas de Trekking y Vías Ferratas en España',
    description: 'Descubre las mejores rutas de trekking y vías ferratas de España. Guías completas con mapas GPX, fotos y consejos de seguridad.',
    images: [
      {
        url: 'https://www.peakexplorer.es/bento-guias.jpg',
        width: 1200,
        height: 630,
        alt: 'Peak Explorer — Rutas de montaña en España',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Peak Explorer - Rutas de Trekking y Vías Ferratas en España',
    description: 'Descubre las mejores rutas de trekking y vías ferratas de España. Guías completas con mapas GPX, fotos y consejos de seguridad.',
    images: ['https://www.peakexplorer.es/bento-guias.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'theme-color': '#0369a1',
  },
}

const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://www.peakexplorer.es/#website',
      url: 'https://www.peakexplorer.es',
      name: 'Peak Explorer',
      description: 'Rutas de trekking y vías ferratas en España',
      inLanguage: 'es-ES',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://www.peakexplorer.es/rutas?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://www.peakexplorer.es/#organization',
      name: 'Peak Explorer',
      url: 'https://www.peakexplorer.es',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.peakexplorer.es/bento-guias.jpg',
        width: 1200,
        height: 630,
      },
      sameAs: [],
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://api.mapbox.com" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        {/* GTM noscript fallback */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
            title="Google Tag Manager"
          />
        </noscript>
        <SessionProvider>
          <CookieConsentProvider>
            <AuthProvider>
              <UserProgressProvider>
                <div className="flex min-h-screen flex-col">
                  <Header />
                  {/* pt-16 accounts for the fixed header height (h-16) */}
                  <main className="flex-1 pt-16">{children}</main>
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

