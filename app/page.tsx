import Link from 'next/link'
import { ArrowRight, Mountain, Zap, MapPin } from 'lucide-react'
import dynamicImport from 'next/dynamic'
import { getTrekkingRoutesAsync, getFerratasAsync } from '@/lib/routes'

// OPTIMIZACIÓN: Lazy loading de componentes pesados para reducir JavaScript inicial en la landing
// RouteCard usa framer-motion que es pesado (~50KB), solo cargar cuando sea necesario
const RouteCard = dynamicImport(
  () => import('@/components/routes/RouteCard').then((mod) => ({ default: mod.RouteCard })),
  { 
    ssr: true, // Mantener SSR para SEO de las primeras rutas
    loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" /> // Placeholder mientras carga
  }
)

// OPTIMIZACIÓN: BlogCard es más ligero pero aún así lazy load para reducir bundle inicial
const BlogCard = dynamicImport(
  () => import('@/components/blog/BlogCard').then((mod) => ({ default: mod.BlogCard })),
  { 
    ssr: true, // Mantener SSR para SEO
    loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
  }
)

// OPTIMIZACIÓN: VideoHero solo se necesita en la landing, pero puede ser lazy si está below the fold
// Como está en el hero (above the fold), lo mantenemos normal pero optimizado
import { VideoHero } from '@/components/VideoHero'

// OPTIMIZACIÓN: FerrataClimberIcon es un SVG, pero lazy load para reducir imports
const FerrataClimberIcon = dynamicImport(
  () => import('@/components/routes/RoutesMapView').then((mod) => ({ default: mod.FerrataClimberIcon })),
  { ssr: false } // SVG, no crítico para SEO
)

// OPTIMIZACIÓN: Lazy loading de Firebase - solo cargar cuando se necesite
// Esto evita cargar ~100KB de Firebase en la landing si no se usa
async function getAllBlogsLazy() {
  try {
    // Dynamic import de Firebase solo cuando se necesita
    const { getAllBlogsFromFirestore } = await import('@/lib/firebase/blogs')
    const blogs = await getAllBlogsFromFirestore(false) // Solo blogs publicados
    console.log(`✅ Blogs cargados desde Firebase: ${blogs.length}`)
    return blogs
  } catch (error) {
    console.error('❌ Error cargando blogs desde Firebase:', error)
    if (error instanceof Error) {
      console.error('Mensaje de error:', error.message)
      console.error('Stack:', error.stack)
    }
    return [] // Fallback a array vacío si Firebase no está disponible
  }
}

// Forzar recarga dinámica para obtener datos frescos de Firestore
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  // OPTIMIZACIÓN: Lazy loading de blogs - Firebase solo se carga si se necesita
  // Obtener rutas desde Firestore (solo datos estáticos si Firestore no está configurado)
  const [allTrekkingRoutes, allFerratas, allBlogs] = await Promise.all([
    getTrekkingRoutesAsync(),
    getFerratasAsync(),
    getAllBlogsLazy(), // Lazy loading de Firebase
  ])
  
  // Obtener rutas destacadas (primeras 3 de cada tipo)
  const featuredTrekking = allTrekkingRoutes.slice(0, 3)
  const featuredFerratas = allFerratas.slice(0, 2)
  
  // Obtener blogs recientes (primeros 3)
  const recentBlogs = allBlogs.slice(0, 3)

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* Video optimizado: carga solo cuando está visible, se pausa cuando sale del viewport
              Usa Intersection Observer para detección eficiente y reduce el uso de recursos */}
          <VideoHero 
            src="/Animate_the_clouds_202511141732.webm" 
            className="absolute inset-0 w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        </div>
        
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center text-white">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl animate-fade-in">
            Explora las Montañas de España
          </h1>
          <p className="mb-8 text-xl sm:text-2xl text-gray-200 animate-slide-up">
            Descubre rutas de trekking y vías ferratas con guías completas, mapas GPX y consejos de seguridad
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in">
            <Link href="/rutas" className="btn-secondary text-lg px-8 py-4 bg-white/10 backdrop-blur text-white hover:bg-white/20">
              Ver Rutas de Montaña
              <Mountain className="ml-2 h-5 w-5" />
            </Link>
            <Link href="/vias-ferratas" className="btn-secondary text-lg px-8 py-4 bg-white/10 backdrop-blur text-white hover:bg-white/20">
              Ver Vías Ferratas
              <FerrataClimberIcon className="ml-2 h-10 w-10" />
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Optimización accesibilidad: h2 agregado para mantener jerarquía secuencial (h1 -> h2 -> h3) */}
          <h2 className="sr-only">Características principales</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
                <MapPin className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Rutas Detalladas</h3>
              <p className="text-gray-600">
                Información completa: distancia, desnivel, dificultad y mucho más
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
                <Mountain className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Mapas GPX</h3>
              <p className="text-gray-600">
                Descarga tracks GPS para usar en tu dispositivo o aplicación favorita
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
                <Zap className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Consejos de Seguridad</h3>
              <p className="text-gray-600">
                Recomendaciones esenciales para disfrutar de forma segura
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Trekking Routes */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Rutas de Montaña Destacadas
              </h2>
              <p className="mt-2 text-lg text-gray-600">
                Las mejores rutas de trekking en España
              </p>
            </div>
            {/* Optimización accesibilidad: text-primary-700 mejora contraste sobre fondo blanco (ratio >4.5:1) */}
            <Link
              href="/rutas"
              className="hidden sm:flex items-center text-primary-700 hover:text-primary-800 font-medium"
            >
              Ver todas
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Optimización: priority para primeras rutas (en viewport inicial) mejora LCP */}
            {featuredTrekking.map((route, index) => (
              <RouteCard key={route.id} route={route} priority={index < 2} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Ferratas */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Vías Ferratas Destacadas
              </h2>
              <p className="mt-2 text-lg text-gray-600">
                Experiencias verticales de K2 a K6
              </p>
            </div>
            {/* Optimización accesibilidad: text-primary-700 mejora contraste sobre bg-gray-50 (ratio >4.5:1) */}
            <Link
              href="/vias-ferratas"
              className="hidden sm:flex items-center text-primary-700 hover:text-primary-800 font-medium"
            >
              Ver todas
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Optimización: lazy loading para vías ferratas (below the fold) */}
            {featuredFerratas.map((route) => (
              <RouteCard key={route.id} route={route} priority={false} />
            ))}
          </div>
        </div>
      </section>

      {/* Recent Blog Posts */}
      {recentBlogs.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                  Blog Recientes
                </h2>
                <p className="mt-2 text-lg text-gray-600">
                  Últimos artículos sobre montaña, rutas y aventuras
                </p>
              </div>
              {/* Optimización accesibilidad: text-primary-700 mejora contraste sobre fondo blanco (ratio >4.5:1) */}
              <Link
                href="/blog"
                className="hidden sm:flex items-center text-primary-700 hover:text-primary-800 font-medium"
              >
                Ver todos
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {recentBlogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} openInNewTab={true} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

