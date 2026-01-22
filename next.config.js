/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  // Configuración de headers de seguridad
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production'
    
    // Configuración base de CSP
    // Permite recursos necesarios para la aplicación:
    // - Mapbox (mapas)
    // - Firebase (autenticación y datos)
    // - Google APIs (News, Fonts)
    // - Twitter API
    // - APIs internas de Next.js
    const cspDirectives = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Necesario para Next.js y algunos componentes
        "'unsafe-eval'", // Necesario para Mapbox GL y algunas librerías
        'https://api.mapbox.com',
        'https://*.mapbox.com',
        'https://*.googleapis.com',
        'https://*.gstatic.com',
        'https://www.googletagmanager.com', // Google Analytics
        'https://*.google-analytics.com', // Google Analytics
        'https://*.firebaseapp.com',
        'https://*.firebase.com',
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Necesario para Tailwind CSS y estilos inline
        'https://fonts.googleapis.com',
        'https://api.mapbox.com',
        'https://*.mapbox.com',
      ],
      'img-src': [
        "'self'",
        'data:', // Para imágenes en base64
        'blob:', // Para imágenes generadas dinámicamente
        'https://*.mapbox.com', // Tiles de Mapbox
        'https://*.firebaseapp.com', // Firebase Storage
        'https://*.firebasestorage.googleapis.com', // Firebase Storage
        'https://openweathermap.org', // Iconos de OpenWeatherMap
        'http://openweathermap.org', // Iconos de OpenWeatherMap (algunos pueden usar http)
        'https://meteosierra.com', // Meteosierra.com (imágenes/iconos)
        'http://meteosierra.com', // Meteosierra.com (algunos recursos pueden usar http)
        'https://*.googleapis.com', // Google APIs (imágenes)
        'https://*.gstatic.com', // Google static content
        'https://infocar.dgt.es',
        'https://www.alberguesyrefugios.com',
        'https://camareando.com',
        'https://cantur.com',
        'https://rtsp.me'
      ],
      'font-src': [
        "'self'",
        'data:', // Para fuentes en base64
        'https://fonts.gstatic.com',
        'https://fonts.googleapis.com',
      ],
      'connect-src': [
        "'self'",
        'https://api.mapbox.com',
        'https://*.mapbox.com',
        'https://*.googleapis.com',
        'https://www.googletagmanager.com', // Google Analytics
        'https://*.google-analytics.com', // Google Analytics
        'https://*.analytics.google.com', // Google Analytics
        'https://*.firebaseapp.com',
        'https://*.firebase.com',
        'https://api.twitter.com',
        'https://news.google.com',
        'https://generativelanguage.googleapis.com', // Gemini API
        'https://api.open-meteo.com', // Open-Meteo API (meteorología)
        'https://api.openweathermap.org', // OpenWeatherMap API (meteorología)
        'https://meteosierra.com', // Meteosierra.com (API meteorológica)
        'http://meteosierra.com', // Meteosierra.com (algunos recursos pueden usar http)
        'https://infocar.dgt.es',
        'https://www.alberguesyrefugios.com',
        'https://camareando.com',
        'https://cantur.com',
        'https://rtsp.me',
        'wss://*.firebaseio.com', // WebSocket para Firebase
        'wss://*.firebase.com',
      ],
      'frame-src': [
        "'self'",
        'https://*.mapbox.com',
        'https://*.google.com',
        'https://*.firebaseapp.com',
        'https://meteosierra.com', // Meteosierra.com (widgets/iframes)
        'http://meteosierra.com', // Meteosierra.com (algunos recursos pueden usar http)
        'https://infocar.dgt.es',
        'https://www.alberguesyrefugios.com',
        'https://camareando.com',
        'https://cantur.com',
        'https://rtsp.me'
      ],
      'worker-src': [
        "'self'",
        'blob:', // Necesario para Web Workers de Mapbox
      ],
      'child-src': [
        "'self'",
        'blob:',
      ],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"], // Equivalente a X-Frame-Options
    }

    // Construir string CSP
    const cspParts = Object.entries(cspDirectives)
      .map(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          return `${key} ${value.join(' ')}`
        }
        return null
      })
      .filter(Boolean)

    // Añadir upgrade-insecure-requests solo en producción
    if (isProduction) {
      cspParts.push('upgrade-insecure-requests')
    }

    const cspString = cspParts.join('; ')

    return [
      {
        // Aplicar a todas las rutas
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspString,
          },
          {
            key: 'Strict-Transport-Security',
            value: isProduction
              ? 'max-age=31536000; includeSubDomains; preload'
              : 'max-age=0', // Desactivar en desarrollo
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=(self)',
              'interest-cohort=()',
              'payment=()',
              'usb=()',
            ].join(', '),
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Download-Options',
            value: 'noopen',
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
        ],
      },
    ]
  },
  // Desactivar TODA la caché en desarrollo y forzar hot-reload
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Desactivar caché completamente
      config.cache = false
      // Desactivar snapshot para forzar recarga de módulos
      config.snapshot = {
        managedPaths: [],
        immutablePaths: [],
      }
      // Desactivar caché de módulos
      config.module = {
        ...config.module,
        unsafeCache: false,
      }
      // Forzar recarga de módulos en cambios
      config.watchOptions = {
        poll: 1000, // Verificar cambios cada segundo
        aggregateTimeout: 300, // Esperar 300ms antes de recompilar
        ignored: /node_modules/,
      }
      // Invalidar módulos cuando cambian archivos de datos
      if (!isServer) {
        config.resolve = {
          ...config.resolve,
          alias: {
            ...config.resolve.alias,
          },
        }
      }
    }
    return config
  },
  // Desactivar caché de páginas
  onDemandEntries: {
    maxInactiveAge: 0,
    pagesBufferLength: 0,
  },
}

module.exports = nextConfig

