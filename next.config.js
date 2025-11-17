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

