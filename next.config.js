/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Optimización: Compilador moderno para navegadores actuales (reduce polyfills innecesarios)
  // Esto mejora el tamaño del bundle y elimina JavaScript antiguo innecesario
  compiler: {
    // Eliminar console.log en producción para reducir bundle size
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Optimización: Configuración de compilación para navegadores modernos
  // Target moderno reduce transpilación innecesaria y polyfills
  swcMinify: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Optimización: Mejorar rendimiento de imágenes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    // Optimización: Tree-shaking mejorado para paquetes grandes
    optimizePackageImports: ['lucide-react', 'framer-motion', 'react-icons'],
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
        'https://rtsp.me',
        'https://www.youtube.com/',
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

    const headers = [
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

    // Optimización: Headers de caché para recursos estáticos (mejora TTFB y reduce carga)
    if (isProduction) {
      headers.push(
        {
          // Optimización: Cachear assets estáticos de Next.js (CSS, JS, imágenes)
          source: '/_next/static/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
        {
          // Optimización: Cachear imágenes optimizadas
          source: '/_next/image',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
        {
          // Optimización: Cachear assets públicos (favicon, etc)
          source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif|woff|woff2|ttf|eot)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        }
      )
    }

    return headers
  },
  // Desactivar TODA la caché en desarrollo y forzar hot-reload
  webpack: (config, { dev, isServer }) => {
    // Optimización: Configurar target moderno para evitar polyfills innecesarios
    if (!isServer) {
      // Target moderno para navegadores actuales (reduce JavaScript antiguo)
      // Esto evita que webpack incluya polyfills para Array.at, Object.fromEntries, etc.
      config.target = ['web', 'es2022']
      
      // Optimización: Deshabilitar polyfills automáticos de webpack
      // Next.js ya maneja esto, pero esto asegura que no se agreguen polyfills innecesarios
      if (!config.resolve.fallback) {
        config.resolve.fallback = {}
      }
    }
    
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
    } else {
      // Optimización: Mejorar code splitting en producción
      // Separar vendor chunks para mejor caché
      if (!isServer) {
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              default: false,
              vendors: false,
              // Optimización: Separar vendor chunks grandes para mejor caché
              framework: {
                name: 'framework',
                chunks: 'all',
                test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
                priority: 40,
                enforce: true,
              },
              // Optimización: Separar librerías grandes en chunks individuales
              lib: {
                test(module) {
                  // Reducir umbral a 100KB para separar más librerías
                  return module.size() > 100000 && /node_modules[/\\]/.test(module.identifier())
                },
                name(module) {
                  const hash = require('crypto').createHash('sha1')
                  hash.update(module.identifier())
                  return hash.digest('hex').substring(0, 8)
                },
                priority: 30,
                minChunks: 1,
                reuseExistingChunk: true,
              },
              // Optimización: Reducir tamaño del chunk commons aumentando minChunks
              // Solo incluir código usado en 3+ páginas para reducir JavaScript no utilizado
              commons: {
                name: 'commons',
                minChunks: 3, // Aumentado de 2 a 3 para reducir tamaño
                priority: 20,
                minSize: 20000, // Mínimo 20KB para crear chunk commons
              },
              shared: {
                name(module, chunks) {
                  return require('crypto')
                    .createHash('sha1')
                    .update(chunks.reduce((acc, chunk) => acc + chunk.name, ''))
                    .digest('hex')
                    .substring(0, 8)
                },
                priority: 10,
                minChunks: 2,
                reuseExistingChunk: true,
              },
            },
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

