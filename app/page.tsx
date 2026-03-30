import Link from 'next/link'
import { ArrowRight, Mountain, Download, MapPin, Zap, Shield, Star, TrendingUp } from 'lucide-react'
import dynamicImport from 'next/dynamic'
import { getTrekkingRoutesAsync, getFerratasAsync } from '@/lib/routes'

const RouteCard = dynamicImport(
  () => import('@/components/routes/RouteCard').then((mod) => ({ default: mod.RouteCard })),
  {
    ssr: true,
    loading: () => <div className="h-72 skeleton" />,
  }
)

const BlogCard = dynamicImport(
  () => import('@/components/blog/BlogCard').then((mod) => ({ default: mod.BlogCard })),
  {
    ssr: true,
    loading: () => <div className="h-64 skeleton" />,
  }
)

import { VideoHero } from '@/components/VideoHero'

const FerrataClimberIcon = dynamicImport(
  () => import('@/components/routes/RoutesMapView').then((mod) => ({ default: mod.FerrataClimberIcon })),
  { ssr: false }
)

async function getAllBlogsLazy() {
  try {
    const { getAllBlogsFromFirestore } = await import('@/lib/firebase/blogs')
    return await getAllBlogsFromFirestore(false)
  } catch {
    return []
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const [allTrekkingRoutes, allFerratas, allBlogs] = await Promise.all([
    getTrekkingRoutesAsync(),
    getFerratasAsync(),
    getAllBlogsLazy(),
  ])

  const sortByDate = (a: { createdAt?: string | number | Date }, b: { createdAt?: string | number | Date }) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return bTime - aTime
  }

  const featuredTrekking = [...allTrekkingRoutes].sort(sortByDate).slice(0, 3)
  const featuredFerratas = [...allFerratas].sort(sortByDate).slice(0, 2)
  const recentBlogs = allBlogs.slice(0, 3)

  const totalRoutes = allTrekkingRoutes.length + allFerratas.length

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      {/* -mt-16 pulls the hero behind the fixed header for full-bleed effect */}
      <section className="relative -mt-16 h-screen min-h-[640px] flex items-center justify-center overflow-hidden">
        {/* Background video */}
        <div className="absolute inset-0 z-0">
          <VideoHero
            src="/Animate_the_clouds_202511141732.webm"
            className="absolute inset-0 w-full h-full"
          />
          {/* Gradient overlay: dark top (for header legibility) → dark bottom (for text) */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/65" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center text-white">
          {/* Eyebrow */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-white/90 animate-fade-in">
            <Mountain className="h-4 w-4 text-primary-300" />
            Montañas de España
          </div>

          {/* Headline */}
          <h1 className="mb-5 font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white text-shadow-hero animate-fade-up leading-[0.9]">
            Explora<br />
            <span className="text-gradient-brand" style={{ WebkitTextFillColor: 'unset', color: '#38bdf8' }}>
              sin límites
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mb-10 text-lg sm:text-xl text-white/80 max-w-xl mx-auto text-shadow-hero animate-slide-up leading-relaxed">
            Rutas de trekking y vías ferratas con guías completas,
            mapas GPX y condiciones en tiempo real.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-scale-in">
            <Link
              href="/rutas"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-7 py-4 text-base font-semibold text-white shadow-lg hover:bg-primary-700 transition-all duration-200 hover:-translate-y-0.5"
            >
              <Mountain className="h-5 w-5" />
              Rutas de Montaña
            </Link>
            <Link
              href="/vias-ferratas"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/30 px-7 py-4 text-base font-semibold text-white hover:bg-white/20 transition-all duration-200 hover:-translate-y-0.5"
            >
              <FerrataClimberIcon className="h-5 w-5" />
              Vías Ferratas
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 animate-bounce">
          <div className="w-5 h-8 border-2 border-white/40 rounded-full flex justify-center pt-1.5">
            <div className="w-0.5 h-2 bg-white/60 rounded-full" />
          </div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────────────── */}
      <section className="bg-editorial-900 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/10">
            <div className="flex flex-col items-center gap-0.5 px-4 py-3">
              <span className="font-display text-3xl sm:text-4xl font-black text-white leading-none">
                {totalRoutes}+
              </span>
              <span className="text-xs font-medium text-white/50 uppercase tracking-widest">Rutas</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 px-4 py-3">
              <span className="font-display text-3xl sm:text-4xl font-black text-white leading-none">
                {allFerratas.length}+
              </span>
              <span className="text-xs font-medium text-white/50 uppercase tracking-widest">Ferratas</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 px-4 py-3">
              <span className="font-display text-3xl sm:text-4xl font-black text-primary-300 leading-none">
                GPX
              </span>
              <span className="text-xs font-medium text-white/50 uppercase tracking-widest">Descarga libre</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 px-4 py-3">
              <span className="font-display text-3xl sm:text-4xl font-black text-primary-300 leading-none">
                HD
              </span>
              <span className="text-xs font-medium text-white/50 uppercase tracking-widest">Webcams</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUE PROPOSITIONS ─────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="section-label justify-center">
              <Zap className="h-3.5 w-3.5" /> Por qué Peak Explorer
            </p>
            <h2 className="section-heading text-4xl sm:text-5xl">
              Todo lo que necesitas
            </h2>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* ── Card 1: Guías — hiker on ridge with map, aerial trail view ── */}
            <div className="lg:col-span-2 group relative overflow-hidden rounded-3xl min-h-[240px] flex flex-col justify-between cursor-default">
              {/* Background image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: "url('/bento-guias.jpg')" }}
              />
              {/* Colour overlay: sky-blue tint so card identity holds even without image */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-900/85 via-primary-800/70 to-primary-700/60" />
              {/* Content */}
              <div className="relative z-10 p-8 flex flex-col justify-between h-full">
                <div>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-2 text-2xl font-bold text-white">Guías Completas de Ruta</h3>
                  <p className="text-white/80 leading-relaxed max-w-sm text-sm">
                    Distancia, desnivel, dificultad, puntos de interés, parkings y más.
                    Toda la información para planificar tu aventura.
                  </p>
                </div>
                <div className="mt-6">
                  <Link
                    href="/rutas"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 hover:text-white hover:gap-2.5 transition-all"
                  >
                    Ver todas las rutas <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Card 2: GPX — GPS device on rock, orange-sunset backdrop ── */}
            <div className="group relative overflow-hidden rounded-3xl min-h-[240px] flex flex-col justify-between cursor-default">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: "url('/bento-gpx.jpg')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-accent-700/85 via-accent-600/70 to-accent-500/55" />
              <div className="relative z-10 p-8 flex flex-col justify-between h-full">
                <div>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
                    <Download className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-white">Tracks GPX Gratis</h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    Descarga el track GPS en formato GPX para cualquier dispositivo o app.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Card 3: Seguridad — safety gear laid out on rock ── */}
            <div className="group relative overflow-hidden rounded-3xl min-h-[200px] flex flex-col justify-between cursor-default">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: "url('/bento-seguridad.jpg')" }}
              />
              {/* Light card: semi-white overlay so dark text remains legible */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/75 via-white/60 to-editorial-100/70" />
              <div className="relative z-10 p-8 flex flex-col justify-between h-full">
                <div>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-editorial-900/10 backdrop-blur-sm border border-editorial-300/40">
                    <Shield className="h-6 w-6 text-editorial-800" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-editorial-900">Consejos de Seguridad</h3>
                  <p className="text-editorial-700 text-sm leading-relaxed">
                    Recomendaciones esenciales y equipamiento necesario para cada ruta.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Card 4: Valoraciones — hikers celebrating at summit ── */}
            <div className="group relative overflow-hidden rounded-3xl min-h-[200px] flex flex-col justify-between cursor-default">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: "url('/bento-valoraciones.jpg')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-cta-600/80 via-cta-500/65 to-cta-400/50" />
              <div className="relative z-10 p-8 flex flex-col justify-between h-full">
                <div>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-white">Valoraciones</h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    Ratings reales y reseñas de la comunidad de montañeros.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Card 5: Webcams — stormy misty peak, telephoto ── */}
            <div className="group relative overflow-hidden rounded-3xl min-h-[200px] flex flex-col justify-between cursor-default">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: "url('/bento-webcams.jpg')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-summit-700/80 via-summit-600/65 to-summit-500/50" />
              <div className="relative z-10 p-8 flex flex-col justify-between h-full">
                <div>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-white">Webcams en Vivo</h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    Comprueba las condiciones actuales antes de salir.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FEATURED TREKKING ROUTES ───────────────────────────────────────── */}
      <section className="py-20 bg-editorial-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="section-label">
                <Mountain className="h-3.5 w-3.5" /> Trekking
              </p>
              <h2 className="section-heading">
                Rutas Destacadas
              </h2>
              <p className="mt-2 text-base text-editorial-500">
                Las mejores rutas de montaña en España, curadas por expertos.
              </p>
            </div>
            <Link
              href="/rutas"
              className="flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-900 transition-colors self-start sm:self-auto whitespace-nowrap"
            >
              Ver todas las rutas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredTrekking.map((route, index) => (
              <RouteCard key={route.id} route={route} priority={index < 2} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED VÍA FERRATAS ─────────────────────────────────────────── */}
      <section className="py-20 bg-editorial-900 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary-400 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-accent-400 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="section-label" style={{ color: '#7dd3fc' }}>
                Vías Ferratas
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
                Ferratas Destacadas
              </h2>
              <p className="mt-2 text-base text-editorial-400">
                Experiencias verticales de K2 a K6 en los mejores macizos.
              </p>
            </div>
            <Link
              href="/vias-ferratas"
              className="flex items-center gap-1.5 text-sm font-semibold text-primary-300 hover:text-primary-200 transition-colors self-start sm:self-auto whitespace-nowrap"
            >
              Ver todas las ferratas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {featuredFerratas.map((route) => (
              <RouteCard key={route.id} route={route} priority={false} type="ferrata" />
            ))}
          </div>
        </div>
      </section>

      {/* ── RECENT BLOG POSTS ─────────────────────────────────────────────── */}
      {recentBlogs.length > 0 && (
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="section-label">Blog</p>
                <h2 className="section-heading">Últimos Artículos</h2>
                <p className="mt-2 text-base text-editorial-500">
                  Guías, reportajes y noticias de montaña.
                </p>
              </div>
              <Link
                href="/blog"
                className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-900 transition-colors"
              >
                Ver todos los artículos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recentBlogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} openInNewTab={true} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-primary-600 relative overflow-hidden">
        {/* Background shimmer */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center text-white">
          <Mountain className="mx-auto mb-6 h-12 w-12 text-primary-200 animate-float" />
          <h2 className="mb-4 font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
            ¿Listo para la aventura?
          </h2>
          <p className="mb-10 text-lg text-primary-100 max-w-lg mx-auto">
            Explora cientos de rutas, descarga tus tracks GPX y vive la montaña como nunca antes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/rutas"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-primary-700 hover:bg-primary-50 transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
            >
              <Mountain className="h-5 w-5" />
              Explorar Rutas
            </Link>
            <Link
              href="/vias-ferratas"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 px-8 py-4 text-base font-bold text-white hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5"
            >
              Ver Ferratas
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
