'use client'

import Link from 'next/link'
import { Mountain } from 'lucide-react'
import { CookieSettingsButton } from '@/components/cookies/CookieSettingsButton'

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
              {/* Optimización accesibilidad: text-primary-300 mejora contraste sobre bg-gray-900 (ratio >4.5:1) */}
              <li>
                <Link href="/rutas" className="hover:text-primary-300 transition-colors">
                  Rutas de Montaña
                </Link>
              </li>
              <li>
                <Link href="/vias-ferratas" className="hover:text-primary-300 transition-colors">
                  Vías Ferratas
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Legal</h3>
            <ul className="space-y-2 text-sm">
              {/* Optimización accesibilidad: text-primary-300 mejora contraste sobre bg-gray-900 (ratio >4.5:1) */}
              <li>
                <Link href="/privacidad" className="hover:text-primary-300 transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-primary-300 transition-colors">
                  Política de Cookies
                </Link>
              </li>
              <li>
                <Link href="/afiliados" className="hover:text-primary-300 transition-colors">
                  Aviso de Afiliados
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="hover:text-primary-300 transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Contacto</h3>
            <ul className="space-y-2 text-sm">
              {/* Optimización accesibilidad: text-primary-300 mejora contraste sobre bg-gray-900 (ratio >4.5:1) */}
              <li>
                <a href="mailto:info@peak-explorer.com" className="hover:text-primary-300 transition-colors">
                  info@peak-explorer.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left text-sm">
              <p>
                © {currentYear} Peak Explorer. Todos los derechos reservados.
              </p>
              {/* Optimización accesibilidad: text-gray-400 mejora contraste sobre bg-gray-900 (ratio >4.5:1) */}
              <p className="mt-2 text-xs text-gray-400">
                Algunos enlaces son de afiliados. Esto no afecta el precio que pagas.
              </p>
            </div>
            <div className="flex-shrink-0">
              <CookieSettingsButton />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

