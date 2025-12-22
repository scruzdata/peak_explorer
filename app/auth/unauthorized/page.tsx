import Link from 'next/link'

export default function UnauthorizedPage() {
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
          <p className="mt-1 text-sm text-gray-500">
            Solo los superadministradores autorizados pueden acceder a esta sección.
          </p>
        </div>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}

