import Link from 'next/link'
import { Mountain } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <Mountain className="mb-4 h-16 w-16 text-gray-400" />
      <h1 className="mb-2 text-4xl font-bold text-gray-900">404</h1>
      <p className="mb-8 text-lg text-gray-600">Página no encontrada</p>
      <Link
        href="/"
        className="btn-primary"
      >
        Volver al inicio
      </Link>
    </div>
  )
}

