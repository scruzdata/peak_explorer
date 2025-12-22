import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y Condiciones - Peak Explorer',
  description:
    'Condiciones de uso de Peak Explorer, responsabilidades del usuario y limitaciones de responsabilidad de la plataforma.',
}

export default function TerminosCondicionesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Términos y Condiciones de Uso
        </h1>
        <p className="mt-4 text-sm text-gray-500">
          Última actualización: {new Date().toLocaleDateString('es-ES')}
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-700">
          <p>
            El acceso y uso de <strong>Peak Explorer</strong> implica la aceptación plena
            de estos Términos y Condiciones. Te recomendamos leerlos atentamente antes de
            utilizar la plataforma.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              1. Objeto de la plataforma
            </h2>
            <p className="mt-2">
              Peak Explorer es una plataforma digital para descubrir, planificar y
              registrar rutas de montaña, trekking y vías ferratas. La información
              ofrecida tiene carácter orientativo y no sustituye en ningún caso la
              preparación personal ni el criterio profesional en actividades de montaña.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">2. Uso adecuado</h2>
            <p className="mt-2">
              Como usuario te comprometes a utilizar la plataforma de forma responsable y
              conforme a la ley, a estos Términos y a la buena fe. En particular, te
              comprometes a:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>No utilizar la plataforma para fines ilícitos o perjudiciales.</li>
              <li>
                No introducir datos falsos o contenidos que vulneren derechos de terceros.
              </li>
              <li>
                Respetar el medio ambiente y las normas de seguridad en la montaña en
                todo momento.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              3. Información sobre rutas y seguridad
            </h2>
            <p className="mt-2">
              Las rutas, descripciones, tiempos, desniveles y dificultades publicados en
              Peak Explorer se ofrecen a título informativo. Pueden contener errores o
              quedar desactualizados debido a cambios en el terreno, meteorología u otros
              factores externos.
            </p>
            <p className="mt-2">
              Es responsabilidad exclusiva del usuario evaluar su experiencia, condición
              física y equipamiento, así como comprobar las condiciones meteorológicas y
              posibles restricciones o regulaciones locales antes de realizar cualquier
              actividad.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              4. Exclusión de responsabilidad
            </h2>
            <p className="mt-2">
              Peak Explorer no se responsabiliza de accidentes, daños personales,
              materiales o de cualquier otro tipo que puedan producirse durante la
              realización de rutas u otras actividades descritas en la plataforma.
            </p>
            <p className="mt-2">
              El uso de la información disponible en Peak Explorer se realiza bajo la
              exclusiva responsabilidad del usuario, que asume todos los riesgos
              asociados a la práctica de actividades de montaña y aire libre.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              5. Cuenta de usuario y acceso
            </h2>
            <p className="mt-2">
              Si creas una cuenta en Peak Explorer, eres responsable de mantener la
              confidencialidad de tus credenciales de acceso y de todas las actividades
              realizadas bajo tu cuenta. Debes notificarnos de inmediato cualquier uso no
              autorizado o sospecha de vulneración de seguridad.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              6. Propiedad intelectual
            </h2>
            <p className="mt-2">
              Todos los contenidos de Peak Explorer (texto, imágenes, logotipos, diseño,
              código, etc.) están protegidos por derechos de propiedad intelectual e
              industrial, salvo indicación en contrario. Queda prohibida su reproducción,
              distribución o modificación sin autorización expresa.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              7. Enlaces externos y afiliados
            </h2>
            <p className="mt-2">
              La plataforma puede contener enlaces a sitios web de terceros, incluidos
              enlaces de afiliados. Peak Explorer no se hace responsable del contenido,
              seguridad ni de las prácticas de privacidad de dichos sitios externos.
            </p>
            <p className="mt-2">
              Algunos de estos enlaces pueden generar una comisión para Peak Explorer sin
              que esto suponga un coste adicional para ti, tal y como se detalla en el{' '}
              <a
                href="/afiliados"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                Aviso de Afiliados
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              8. Modificaciones del servicio
            </h2>
            <p className="mt-2">
              Peak Explorer se reserva el derecho a modificar, suspender o interrumpir en
              cualquier momento, y sin necesidad de previo aviso, parte o la totalidad de
              la plataforma, así como de actualizar estos Términos y Condiciones.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              9. Legislación aplicable
            </h2>
            <p className="mt-2">
              Estos Términos y Condiciones se rigen por la legislación aplicable en tu
              país de residencia o, en su defecto, por la legislación española. Para la
              resolución de cualquier conflicto que pudiera derivarse del uso de la
              plataforma, las partes se someten a los juzgados y tribunales competentes,
              salvo que la normativa aplicable establezca otra cosa.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}


