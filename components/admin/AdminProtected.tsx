'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'

interface AdminProtectedProps {
  children: ReactNode
}
const SUPERADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL

export function AdminProtected({ children }: AdminProtectedProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated' || !session) {
    return null
  }

  // Verificar que el email sea el superadmin
  if (session.user?.email !== SUPERADMIN_EMAIL) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Acceso no autorizado
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              No tienes permisos para acceder al panel de administración.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

