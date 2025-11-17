import Link from 'next/link'
import { Mountain } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Mountain className="h-6 w-6 text-primary-400" />
              <span className="text-lg font-bold text-white">Peak Explorer</span>
            </Link>
            <p className="text-sm">
              Descubre las mejores rutas de trekking y vías ferratas de España.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Rutas</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/rutas" className="hover:text-primary-400 transition-colors">
                  Rutas de Montaña
                </Link>
              </li>
              <li>
                <Link href="/vias-ferratas" className="hover:text-primary-400 transition-colors">
                  Vías Ferratas
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacidad" className="hover:text-primary-400 transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/afiliados" className="hover:text-primary-400 transition-colors">
                  Aviso de Afiliados
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="hover:text-primary-400 transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Contacto</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:info@peak-explorer.com" className="hover:text-primary-400 transition-colors">
                  info@peak-explorer.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm">
          <p>
            © {currentYear} Peak Explorer. Todos los derechos reservados.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Algunos enlaces son de afiliados. Esto no afecta el precio que pagas.
          </p>
        </div>
      </div>
    </footer>
  )
}

