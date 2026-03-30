import Link from 'next/link'
import { Map, Download, ArrowRight } from 'lucide-react'

interface CTASectionProps {
  /** Slug of the related route (optional) */
  routeSlug?: string
  /** Display name of the route */
  routeName?: string
  /** Whether to show the GPX download button */
  showGpx?: boolean
  /** GPX download URL (optional) */
  gpxUrl?: string
}

export function CTASection({
  routeSlug,
  routeName,
  showGpx = true,
  gpxUrl,
}: CTASectionProps) {
  const routeHref = routeSlug ? `/rutas/${routeSlug}` : '/rutas'
  const label = routeName ?? 'esta ruta'

  return (
    <div className="my-8 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
      {/* Dark header band */}
      <div className="bg-gradient-to-r from-editorial-950 to-primary-900 px-6 py-4">
        <p className="font-display font-bold text-lg text-white tracking-tight">
          ¿Listo para la aventura?
        </p>
        {routeName && (
          <p className="text-sm text-white/60 mt-0.5">Ruta: {routeName}</p>
        )}
      </div>

      {/* CTA buttons */}
      <div className="bg-white px-6 py-5 flex flex-col sm:flex-row gap-3">
        {/* Primary: view on map */}
        <Link
          href={routeHref}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full
                     bg-primary-600 hover:bg-primary-700 px-5 py-3
                     text-sm font-bold text-white transition-colors duration-200
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <Map className="h-4 w-4 shrink-0" aria-hidden="true" />
          Ver {label} en el mapa
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>

        {/* Secondary: download GPX */}
        {showGpx && (
          gpxUrl ? (
            <a
              href={gpxUrl}
              download
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full
                         bg-cta-500 hover:bg-cta-400 px-5 py-3
                         text-sm font-bold text-white transition-colors duration-200
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-500"
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
              Descargar GPX
            </a>
          ) : (
            <Link
              href={`${routeHref}#gpx`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full
                         border border-slate-200 bg-white hover:bg-slate-50 px-5 py-3
                         text-sm font-bold text-slate-700 transition-colors duration-200
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
              Descargar GPX
            </Link>
          )
        )}
      </div>
    </div>
  )
}
