import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const SUPERADMIN_EMAIL = 'maitaiweb@gmail.com'

export default withAuth(
  function middleware(req) {
    // El callback authorized ya verifica el email, pero por seguridad
    // verificamos de nuevo aquí
    const token = req.nextauth.token
    const email = token?.email as string | undefined

    if (email !== SUPERADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/auth/unauthorized', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Solo autorizar si hay un token válido y el email es el superadmin
        const email = token?.email as string | undefined
        return !!token && email === SUPERADMIN_EMAIL
      },
    },
  }
)

// Proteger solo la ruta /admin
export const config = {
  matcher: '/admin/:path*',
}

