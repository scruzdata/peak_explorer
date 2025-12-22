import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad - Peak Explorer',
  description:
    'Información sobre cómo Peak Explorer recoge, utiliza y protege tus datos personales cuando utilizas la web y la aplicación.',
}

export default function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Política de Privacidad
        </h1>
        <p className="mt-4 text-sm text-gray-500">
          Última actualización: {new Date().toLocaleDateString('es-ES')}
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-700">
          <p>
            En <strong>Peak Explorer</strong> nos tomamos muy en serio la protección de tus
            datos personales. En este documento te explicamos qué datos recopilamos, para
            qué los utilizamos y qué derechos tienes.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              1. Responsable del tratamiento
            </h2>
            <p className="mt-2">
              El responsable del tratamiento de los datos es <strong>Peak Explorer</strong>.
              Para cualquier duda relacionada con la privacidad puedes escribirnos a{' '}
              <a
                href="mailto:info@peak-explorer.com"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                info@peak-explorer.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              2. Datos que recopilamos
            </h2>
            <p className="mt-2">
              Dependiendo de cómo uses Peak Explorer, podemos recopilar:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                <strong>Datos de cuenta</strong>: nombre, correo electrónico y contraseña
                en caso de que crees una cuenta.
              </li>
              <li>
                <strong>Datos de uso</strong>: rutas consultadas, favoritos, estadísticas
                básicas de uso de la aplicación.
              </li>
              <li>
                <strong>Datos técnicos</strong>: dirección IP aproximada, tipo de
                dispositivo, navegador y sistema operativo, necesarios para el correcto
                funcionamiento y la seguridad del servicio.
              </li>
              <li>
                <strong>Ubicación</strong> (solo si la autorizas explícitamente en tu
                dispositivo) para mostrarte rutas cercanas o registrar tus actividades.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              3. Finalidades del tratamiento
            </h2>
            <p className="mt-2">
              Utilizamos tus datos personales para las siguientes finalidades:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Prestarte el servicio de planificación y registro de rutas.</li>
              <li>
                Gestionar tu cuenta de usuario, listas de rutas guardadas y preferencias.
              </li>
              <li>
                Mejorar la calidad y seguridad de la web y de la aplicación, analizando de
                forma agregada el uso que se hace del servicio.
              </li>
              <li>
                Enviarte comunicaciones relacionadas con el servicio (por ejemplo,
                cambios importantes en la plataforma o en esta política).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              4. Base legal para el tratamiento
            </h2>
            <p className="mt-2">
              Tratamos tus datos sobre la base de:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                La <strong>ejecución del contrato</strong> cuando usas la plataforma tras
                aceptar nuestros Términos y Condiciones.
              </li>
              <li>
                Tu <strong>consentimiento</strong> expreso cuando así lo requerimos (por
                ejemplo, para el uso de ubicación o el envío de determinadas
                comunicaciones).
              </li>
              <li>
                El <strong>interés legítimo</strong> de mejorar el servicio y garantizar la
                seguridad de la plataforma.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">5. Cookies</h2>
            <p className="mt-2">
              Peak Explorer puede utilizar cookies técnicas y de análisis para garantizar
              el correcto funcionamiento de la web y entender cómo se utiliza la
              plataforma. Puedes configurar tu navegador para bloquear o eliminar cookies,
              aunque esto podría afectar a algunas funcionalidades.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              6. Conservación de los datos
            </h2>
            <p className="mt-2">
              Conservaremos tus datos personales mientras mantengas una cuenta activa o
              mientras sean necesarios para prestarte el servicio. Una vez cancelada la
              cuenta o pasado un periodo de inactividad razonable, los datos se
              anonimizarán o se eliminarán de forma segura, salvo que exista una
              obligación legal de conservación.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              7. Comunicación de datos a terceros
            </h2>
            <p className="mt-2">
              No vendemos tus datos personales. Solo compartimos información con
              proveedores de servicios tecnológicos que nos ayudan a alojar la
              plataforma, enviar correos o analizar de forma agregada el uso del servicio,
              siempre bajo contratos que garantizan la confidencialidad y el cumplimiento
              de la normativa aplicable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              8. Tus derechos de privacidad
            </h2>
            <p className="mt-2">
              Puedes ejercer en cualquier momento tus derechos de acceso, rectificación,
              supresión, oposición, limitación del tratamiento y portabilidad de los
              datos, en los términos previstos por la normativa aplicable.
            </p>
            <p className="mt-2">
              Para ello, escríbenos a{' '}
              <a
                href="mailto:info@peak-explorer.com"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                info@peak-explorer.com
              </a>{' '}
              indicando claramente tu solicitud e identificándote como usuario.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              9. Cambios en esta política
            </h2>
            <p className="mt-2">
              Podemos actualizar esta Política de Privacidad para adaptarla a cambios
              legales o de funcionamiento de la plataforma. Publicaremos la versión
              actualizada en esta misma página e indicaremos la fecha de la última
              actualización.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}


