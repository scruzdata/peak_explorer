import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aviso de Afiliados - Peak Explorer',
  description:
    'Información sobre el uso de enlaces de afiliados en Peak Explorer y cómo pueden generar una comisión sin coste adicional para ti.',
}

export default function AvisoAfiliadosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Aviso de Afiliados
        </h1>
        <p className="mt-4 text-sm text-gray-500">
          Última actualización: {new Date().toLocaleDateString('es-ES')}
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-700">
          <p>
            En <strong>Peak Explorer</strong> creemos en la transparencia. Algunos de los
            enlaces que aparecen en la plataforma pueden ser enlaces de afiliados. Esto
            significa que, si haces una compra o reserva a través de esos enlaces, Peak
            Explorer puede recibir una comisión sin que ello suponga un coste adicional
            para ti.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              1. ¿Qué es un enlace de afiliados?
            </h2>
            <p className="mt-2">
              Un enlace de afiliados es un enlace especial que identifica que has llegado
              a la web de un tercero (por ejemplo, una tienda online o plataforma de
              reservas) desde Peak Explorer. Si realizas una compra o reserva, ese tercero
              puede abonar a Peak Explorer una pequeña comisión por haberle referido un
              cliente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              2. Coste para el usuario
            </h2>
            <p className="mt-2">
              El uso de enlaces de afiliados <strong>no incrementa el precio</strong> que
              tú pagas. El coste es exactamente el mismo que si accedieras directamente al
              sitio web del tercero sin pasar por Peak Explorer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              3. Criterios de recomendación
            </h2>
            <p className="mt-2">
              Las recomendaciones de material, alojamiento, seguros u otros servicios se
              realizan de buena fe, basadas en la utilidad para actividades de montaña y
              aire libre. El hecho de que exista un programa de afiliación no altera
              nuestra intención de recomendar productos o servicios que consideramos
              relevantes.
            </p>
            <p className="mt-2">
              Aun así, te recomendamos que siempre contrastes la información, leas
              opiniones y tomes tus propias decisiones de compra de forma responsable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              4. Plataformas de afiliación
            </h2>
            <p className="mt-2">
              En determinados casos, Peak Explorer puede participar en programas de
              afiliados de distintas plataformas (por ejemplo, tiendas de material de
              montaña, reservas de alojamiento o actividades). En todos los casos se
              aplican las condiciones y políticas de privacidad propias de cada tercero,
              ajenas al control de Peak Explorer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              5. Independencia editorial
            </h2>
            <p className="mt-2">
              El contenido editorial (descripciones de rutas, consejos de seguridad, etc.)
              es independiente de los acuerdos comerciales de afiliación. El objetivo
              principal de Peak Explorer es ayudarte a planificar y disfrutar tus
              actividades de montaña de forma más segura e informada.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              6. Dudas o más información
            </h2>
            <p className="mt-2">
              Si tienes cualquier duda sobre este Aviso de Afiliados o sobre cómo
              monetizamos la plataforma, escríbenos a{' '}
              <a
                href="mailto:info@peak-explorer.com"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                info@peak-explorer.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}


