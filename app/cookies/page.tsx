import { Metadata } from 'next'
import Link from 'next/link'
import { CookieSettingsButton } from '@/components/cookies/CookieSettingsButton'

export const metadata: Metadata = {
  title: 'Política de Cookies - Peak Explorer',
  description: 'Información sobre el uso de cookies en Peak Explorer. Conoce qué cookies utilizamos y cómo gestionarlas.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function CookiesPage() {
  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Política de Cookies
        </h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              ¿Qué son las cookies?
            </h2>
            <p className="text-gray-700 mb-4">
              Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo (ordenador, tablet o móvil) cuando visitas un sitio web. Estas cookies permiten que el sitio web recuerde tus acciones y preferencias durante un período de tiempo, por lo que no tienes que volver a configurarlas cada vez que regresas al sitio o navegas de una página a otra.
            </p>
            <p className="text-gray-700">
              Peak Explorer utiliza cookies para mejorar tu experiencia de navegación, analizar cómo se utiliza el sitio y personalizar el contenido según tus preferencias.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Tipos de cookies que utilizamos
            </h2>

            <div className="space-y-6">
              <div className="border-l-4 border-primary-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  1. Cookies necesarias (técnicas)
                </h3>
                <p className="text-gray-700 mb-2">
                  Estas cookies son esenciales para el funcionamiento del sitio web y no se pueden desactivar. Permiten funciones básicas como la navegación por las páginas y el acceso a áreas seguras del sitio web.
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li><strong>Finalidad:</strong> Garantizar el funcionamiento básico del sitio</li>
                  <li><strong>Duración:</strong> Sesión o persistentes</li>
                  <li><strong>Gestión:</strong> No se pueden desactivar</li>
                </ul>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  2. Cookies de análisis
                </h3>
                <p className="text-gray-700 mb-2">
                  Estas cookies nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web recopilando y reportando información de forma anónima. Nos permiten contar las visitas y las fuentes de tráfico para poder medir y mejorar el rendimiento de nuestro sitio.
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li><strong>Finalidad:</strong> Análisis estadístico y mejora del sitio</li>
                  <li><strong>Duración:</strong> Hasta 2 años</li>
                  <li><strong>Gestión:</strong> Puedes activarlas o desactivarlas</li>
                </ul>
                <p className="text-gray-600 text-sm mt-2 italic">
                  Ejemplo: Google Analytics (si está configurado)
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  3. Cookies de preferencias
                </h3>
                <p className="text-gray-700 mb-2">
                  Estas cookies permiten que el sitio web recuerde información que cambia la forma en que se comporta o se ve el sitio, como tu idioma preferido o la región en la que te encuentras.
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li><strong>Finalidad:</strong> Personalizar la experiencia del usuario</li>
                  <li><strong>Duración:</strong> Hasta 1 año</li>
                  <li><strong>Gestión:</strong> Puedes activarlas o desactivarlas</li>
                </ul>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  4. Cookies de marketing
                </h3>
                <p className="text-gray-700 mb-2">
                  Estas cookies se utilizan para hacer un seguimiento de los visitantes a través de diferentes sitios web con la intención de mostrar anuncios relevantes y atractivos para el usuario individual.
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li><strong>Finalidad:</strong> Publicidad personalizada y seguimiento</li>
                  <li><strong>Duración:</strong> Hasta 1 año</li>
                  <li><strong>Gestión:</strong> Puedes activarlas o desactivarlas</li>
                </ul>
                <p className="text-gray-600 text-sm mt-2 italic">
                  Actualmente no utilizamos cookies de marketing, pero esta categoría está disponible para futuras implementaciones.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Cookies de terceros
            </h2>
            <p className="text-gray-700 mb-4">
              Algunas cookies son establecidas por servicios de terceros que aparecen en nuestras páginas. No tenemos control sobre estas cookies. Te recomendamos que consultes las políticas de cookies de estos servicios para obtener más información.
            </p>
            <p className="text-gray-700">
              Actualmente, Peak Explorer puede utilizar servicios de terceros como:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
              <li>Servicios de mapas (Mapbox, Leaflet)</li>
              <li>Servicios de autenticación (NextAuth, Firebase)</li>
              <li>Servicios de análisis (si están configurados)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Cómo gestionar tus cookies
            </h2>
            <p className="text-gray-700 mb-4">
              Puedes gestionar tus preferencias de cookies en cualquier momento. Tienes varias opciones:
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Opción 1: Configuración en el sitio
              </h3>
              <p className="text-gray-700 mb-4">
                Utiliza nuestro panel de configuración de cookies para gestionar tus preferencias:
              </p>
              <CookieSettingsButton />
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Opción 2: Configuración del navegador
              </h3>
              <p className="text-gray-700 mb-4">
                También puedes gestionar las cookies directamente desde tu navegador. Aquí tienes enlaces a las instrucciones de los navegadores más populares:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>
                  <a
                    href="https://support.google.com/chrome/answer/95647"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    Google Chrome
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    Mozilla Firefox
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.apple.com/es-es/guide/safari/sfri11471/mac"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    Safari
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    Microsoft Edge
                  </a>
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Retirar el consentimiento
            </h2>
            <p className="text-gray-700 mb-4">
              Puedes retirar tu consentimiento para el uso de cookies no esenciales en cualquier momento. Para hacerlo:
            </p>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>Haz clic en el botón de configuración de cookies (visible en el banner o en el pie de página)</li>
              <li>Desactiva las categorías de cookies que no deseas permitir</li>
              <li>Guarda tus preferencias</li>
            </ol>
            <p className="text-gray-700 mt-4">
              Ten en cuenta que retirar el consentimiento puede afectar a la funcionalidad de algunas partes del sitio web.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Más información
            </h2>
            <p className="text-gray-700 mb-4">
              Si tienes preguntas sobre nuestra política de cookies, puedes contactarnos a través de:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Nuestra página de <Link href="/privacidad" className="text-primary-600 hover:text-primary-700 underline">Política de Privacidad</Link></li>
              <li>Nuestra página de <Link href="/terminos" className="text-primary-600 hover:text-primary-700 underline">Términos y Condiciones</Link></li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Cambios en esta política
            </h2>
            <p className="text-gray-700">
              Nos reservamos el derecho de actualizar esta política de cookies en cualquier momento. Te notificaremos de cualquier cambio significativo publicando la nueva política en esta página y actualizando la fecha de &quot;Última actualización&quot; en la parte superior.
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Esta política de cookies cumple con el Reglamento General de Protección de Datos (RGPD) de la UE y la Directiva ePrivacy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
