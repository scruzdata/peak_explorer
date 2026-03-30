'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, Mountain, Bookmark, Trophy, ChevronDown } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { cn } from '@/lib/utils'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const isLandingPage = pathname === '/'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const navItems = [
    { href: '/rutas',          label: 'Rutas' },
    { href: '/vias-ferratas',  label: 'Vías Ferratas' },
    { href: '/blog',           label: 'Blog' },
  ]

  const isScrolledOrNotLanding = scrolled || !isLandingPage

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
        isScrolledOrNotLanding
          ? 'bg-white/95 backdrop-blur-md shadow-nav border-b border-editorial-100'
          : 'bg-transparent'
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group flex-shrink-0"
          prefetch={false}
        >
          <div className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-300',
            isScrolledOrNotLanding ? 'bg-primary-600' : 'bg-white/20 backdrop-blur-sm'
          )}>
            <Mountain className="h-5 w-5 text-white" />
          </div>
          <span className={cn(
            'text-base font-bold tracking-tight transition-colors duration-300',
            isScrolledOrNotLanding ? 'text-editorial-900' : 'text-white text-shadow-hero'
          )}>
            Peak Explorer
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={cn(
                  'relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  isActive
                    ? isScrolledOrNotLanding
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-white bg-white/15'
                    : isScrolledOrNotLanding
                      ? 'text-editorial-600 hover:text-editorial-900 hover:bg-editorial-100'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
              >
                {item.label}
                {isActive && (
                  <span className={cn(
                    'absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                    isScrolledOrNotLanding ? 'bg-primary-600' : 'bg-white'
                  )} />
                )}
              </Link>
            )
          })}
        </div>

        {/* Right side: User menu + CTA */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/mis-rutas"
                prefetch={false}
                className={cn(
                  'flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200',
                  isScrolledOrNotLanding
                    ? 'text-editorial-600 hover:text-editorial-900 hover:bg-editorial-100'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
              >
                <Bookmark className="h-4 w-4" />
                <span>Mis Rutas</span>
              </Link>
              <Link
                href="/perfil"
                prefetch={false}
                className={cn(
                  'flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200',
                  isScrolledOrNotLanding
                    ? 'text-editorial-600 hover:text-editorial-900 hover:bg-editorial-100'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
              >
                <Trophy className="h-4 w-4" />
                <span>Perfil</span>
              </Link>
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  prefetch={false}
                  className={cn(
                    'text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200',
                    isScrolledOrNotLanding
                      ? 'text-primary-700 hover:bg-primary-50'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  )}
                >
                  Admin
                </Link>
              )}
              <button
                onClick={signOut}
                className={cn(
                  'text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer',
                  isScrolledOrNotLanding
                    ? 'text-editorial-500 hover:text-editorial-900 hover:bg-editorial-100'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                )}
              >
                Salir
              </button>
            </>
          ) : (
            <Link
              href="/rutas"
              prefetch={false}
              className={cn(
                'text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200',
                isScrolledOrNotLanding
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-white text-editorial-900 hover:bg-white/90'
              )}
            >
              Explorar rutas
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={cn(
            'md:hidden p-2 rounded-lg transition-colors duration-200 cursor-pointer',
            isScrolledOrNotLanding
              ? 'text-editorial-700 hover:bg-editorial-100'
              : 'text-white hover:bg-white/10'
          )}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen
            ? <X className="h-5 w-5" />
            : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-editorial-100 shadow-lg">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-editorial-700 hover:bg-editorial-50'
                  )}
                >
                  {item.label}
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />}
                </Link>
              )
            })}

            {user ? (
              <div className="pt-2 mt-2 border-t border-editorial-100 space-y-1">
                <Link href="/mis-rutas" prefetch={false} onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-editorial-700 hover:bg-editorial-50">
                  <Bookmark className="h-4 w-4" /> Mis Rutas
                </Link>
                <Link href="/perfil" prefetch={false} onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-editorial-700 hover:bg-editorial-50">
                  <Trophy className="h-4 w-4" /> Perfil
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" prefetch={false} onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-primary-700 hover:bg-primary-50">
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => { signOut(); setMobileMenuOpen(false) }}
                  className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium text-editorial-500 hover:bg-editorial-50 cursor-pointer"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="pt-2 mt-2 border-t border-editorial-100">
                <Link href="/rutas" prefetch={false} onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center w-full px-4 py-3 rounded-xl text-sm font-semibold bg-primary-600 text-white">
                  Explorar rutas
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
