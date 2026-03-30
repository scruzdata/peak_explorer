import { Metadata } from 'next'
import { Mountain, Map, Shield, BookOpen, Users, Award } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sobre Nosotros — Peak Explorer',
  description:
    'Conoce el equipo detrás de Peak Explorer: montañeros apasionados que documentan rutas de trekking y vías ferratas en España con rigor técnico y amor por la montaña.',
  alternates: {
    canonical: 'https://www.peakexplorer.es/sobre-nosotros',
  },
  openGraph: {
    title: 'Sobre Nosotros — Peak Explorer',
    description:
      'Conoce el equipo detrás de Peak Explorer: montañeros apasionados que documentan rutas de trekking y vías ferratas en España.',
    url: 'https://www.peakexplorer.es/sobre-nosotros',
  },
}

export default function SobreNosotrosPage() {
  return (
    <main className="min-h-screen bg-editorial-50">

      {/* ── Hero ── */}
      <section className="bg-editorial-900 text-white py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <Mountain className="mx-auto mb-6 h-12 w-12 text-primary-400" />
          <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight mb-4">
            Sobre Peak Explorer
          </h1>
          <p className="text-lg text-editorial-300 max-w-2xl mx-auto leading-relaxed">
            Somos montañeros que documentan la montaña española con la misma dedicación
            con la que la recorremos.
          </p>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-editorial-900 mb-6">
            Nuestra misión
          </h2>
          <div className="space-y-4 text-base text-editorial-600 leading-relaxed">
            <p>
              Peak Explorer nació de una necesidad concreta: encontrar información fiable, actualizada y
              completa sobre rutas de montaña en España sin tener que combinar diez fuentes distintas.
              Queríamos saber el estado real del acceso, el desnivel exacto, si se puede ir con perro,
              dónde aparcar y qué condiciones esperar en cada época del año. Todo en un mismo lugar.
            </p>
            <p>
              Hoy somos la plataforma de referencia para descubrir y planificar rutas de trekking y vías
              ferratas en las principales sierras de España. Cada ficha es el resultado de investigación
              de campo, contrastación con fuentes oficiales (IGN, AEMET, administraciones de parques
              naturales) y revisión continuada a medida que las condiciones cambian.
            </p>
            <p>
              No publicamos rutas que no podamos verificar. Preferimos tener menos fichas y que cada una
              sea de máxima calidad a tener un catálogo inflado de información dudosa. La seguridad de
              quien recorre estas montañas depende de la exactitud de lo que publicamos.
            </p>
          </div>
        </div>
      </section>

      {/* ── Coverage ── */}
      <section className="py-16 bg-editorial-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-editorial-900 mb-6">
            Qué cubrimos
          </h2>
          <div className="space-y-4 text-base text-editorial-600 leading-relaxed mb-8">
            <p>
              Nuestra cobertura se centra en las grandes sierras y macizos de la Península Ibérica.
              El Sistema Central —Guadarrama, Gredos y Béjar— es el núcleo de nuestro catálogo,
              con rutas para todos los niveles desde accesibles caminatas familiares hasta ascensiones
              técnicas de alta montaña. También cubrimos Picos de Europa, los Pirineos, Sierra Nevada,
              la Cordillera Cantábrica y las sierras del interior peninsular.
            </p>
            <p>
              Para las vías ferratas seguimos la escala de dificultad europea K (K1 a K6), el mismo
              sistema que utilizan los federaciones de montañismo europeas y que permite comparar
              objetivamente la exigencia física y técnica de cada vía. Cada ferrata incluye la longitud
              total de los pasos de progresión, el material específico recomendado y las vías de escape
              o alternativas de descenso.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              'Sierra de Guadarrama',
              'Sierra de Gredos',
              'Picos de Europa',
              'Pirineos',
              'Sierra Nevada',
              'Cordillera Cantábrica',
            ].map((sierra) => (
              <div
                key={sierra}
                className="rounded-xl bg-white border border-editorial-200 px-4 py-3 text-sm font-medium text-editorial-700"
              >
                {sierra}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Methodology ── */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-editorial-900 mb-8">
            Cómo elaboramos cada ficha
          </h2>
          <div className="space-y-6">
            {[
              {
                icon: Map,
                title: 'Track GPS verificado',
                text: 'Cada track GPX se obtiene de rastreo en campo o se contrasta con cartografía oficial del IGN (Instituto Geográfico Nacional). Los datos de distancia y desnivel se calculan a partir del MDT (Modelo Digital del Terreno) oficial a 5 m de resolución.',
              },
              {
                icon: Shield,
                title: 'Información de seguridad específica',
                text: 'Los consejos de seguridad no son genéricos: recogen los riesgos concretos de cada itinerario. Para alta montaña consultamos los boletines de peligro de aludes de AEMET y las alertas de los parques naturales correspondientes.',
              },
              {
                icon: BookOpen,
                title: 'Actualización continua',
                text: 'Las rutas se revisan cuando hay cambios en el acceso, cierre de pistas forestales, modificaciones de señalización o cambios en la normativa de los espacios protegidos. La fecha de última actualización es visible en cada ficha.',
              },
              {
                icon: Users,
                title: 'Comunidad',
                text: 'Las valoraciones y comentarios de la comunidad complementan la información técnica con experiencias reales. Damos especial valor a las aportaciones sobre estado del camino, condiciones estacionales y dificultades no previstas.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100">
                    <Icon className="h-5 w-5 text-primary-700" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-editorial-900 mb-1">{title}</h3>
                  <p className="text-sm text-editorial-600 leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="py-16 bg-editorial-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-editorial-900 mb-6">
            Principios editoriales
          </h2>
          <div className="space-y-4 text-base text-editorial-600 leading-relaxed">
            <p>
              <strong className="text-editorial-900">Rigor ante todo.</strong> No publicamos fichas basadas
              únicamente en información de terceros sin contraste. Los datos técnicos —distancia, desnivel,
              tiempo, coordenadas de inicio y aparcamiento— se verifican contra fuentes primarias.
            </p>
            <p>
              <strong className="text-editorial-900">Transparencia sobre la dificultad.</strong> Preferimos
              ser precisos sobre la dificultad real de una ruta aunque eso reduzca su atractivo aparente.
              Nadie debería verse sorprendido negativamente en una montaña por haber consultado Peak Explorer.
            </p>
            <p>
              <strong className="text-editorial-900">Actualización honesta.</strong> Las rutas tienen fecha
              de verificación visible. Cuando algo no ha podido verificarse recientemente lo indicamos
              explícitamente. Una ficha desactualizada que no lo advierte es peor que no tener ficha.
            </p>
            <p>
              <strong className="text-editorial-900">Respeto al medio.</strong> Señalamos el impacto
              ambiental cuando es relevante, los límites de aforo de los espacios protegidos y las normas
              de los parques naturales. La montaña seguirá ahí para las próximas generaciones si la
              tratamos con respeto.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <Award className="mx-auto mb-4 h-10 w-10 text-primary-200" />
          <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight mb-4">
            Empieza a explorar
          </h2>
          <p className="text-primary-100 mb-8 leading-relaxed">
            Más de {30}+ rutas documentadas con tracks GPX, perfiles de elevación y consejos de seguridad.
            Gratis y sin registro.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/rutas"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-primary-700 hover:bg-primary-50 transition-colors"
            >
              <Mountain className="h-4 w-4" />
              Ver rutas de trekking
            </Link>
            <Link
              href="/vias-ferratas"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 px-7 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              Ver vías ferratas
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}
