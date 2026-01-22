'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, Mountain, Bookmark, Trophy } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { cn } from '@/lib/utils'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const navItems = [
    { href: '/', label: 'Inicio' },
    { href: '/rutas', label: 'Rutas de Montaña' },
    { href: '/vias-ferratas', label: 'Vías Ferratas' },
    { href: '/blog', label: 'Blog' },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2 group">
          <Mountain className="h-8 w-8 text-primary-600 transition-transform group-hover:scale-110" />
          <span className="text-xl font-bold text-gray-900">Peak Explorer</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary-600',
                pathname === item.href ? 'text-primary-600' : 'text-gray-700'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* User Menu */}
        <div className="hidden md:flex md:items-center md:space-x-4">
          {user ? (
            <>
              <Link
                href="/mis-rutas"
                className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
              >
                <Bookmark className="h-4 w-4" />
                <span>Mis Rutas</span>
              </Link>
              <Link
                href="/perfil"
                className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
              >
                <Trophy className="h-4 w-4" />
                <span>Perfil</span>
              </Link>
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={signOut}
                className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
              >
                Salir
              </button>
            </>
          ) : null}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-gray-700 hover:text-primary-600 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block text-base font-medium transition-colors',
                  pathname === item.href ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'
                )}
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <Link
                  href="/mis-rutas"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-base font-medium text-gray-700 hover:text-primary-600"
                >
                  Mis Rutas
                </Link>
                <Link
                  href="/perfil"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-base font-medium text-gray-700 hover:text-primary-600"
                >
                  Perfil
                </Link>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-base font-medium text-primary-600"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    signOut()
                    setMobileMenuOpen(false)
                  }}
                  className="block w-full text-left text-base font-medium text-gray-700 hover:text-primary-600"
                >
                  Salir
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </header>
  )
}

