import Link from 'next/link'
import { ArrowRight, Mountain, Zap, MapPin } from 'lucide-react'
import { RouteCard } from '@/components/routes/RouteCard'
import { getTrekkingRoutesAsync, getFerratasAsync } from '@/lib/routes'

// Forzar recarga dinámica para obtener datos frescos de Firestore
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  // Obtener rutas desde Firestore (solo datos estáticos si Firestore no está configurado)
  const [allTrekkingRoutes, allFerratas] = await Promise.all([
    getTrekkingRoutesAsync(),
    getFerratasAsync(),
  ])
  
  // Obtener rutas destacadas (primeras 3 de cada tipo)
  const featuredTrekking = allTrekkingRoutes.slice(0, 3)
  const featuredFerratas = allFerratas.slice(0, 2)

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/Animate_the_clouds_202511141732.mp4" type="video/mp4" />
          </video>
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
            <Link href="/rutas" className="btn-primary text-lg px-8 py-4">
              Ver Rutas de Montaña
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="/vias-ferratas" className="btn-secondary text-lg px-8 py-4 bg-white/10 backdrop-blur text-white hover:bg-white/20">
              Ver Vías Ferratas
              <Zap className="ml-2 h-5 w-5" />
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
            <Link
              href="/rutas"
              className="hidden sm:flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              Ver todas
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuredTrekking.map((route) => (
              <RouteCard key={route.id} route={route} />
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
            <Link
              href="/vias-ferratas"
              className="hidden sm:flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              Ver todas
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {featuredFerratas.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

