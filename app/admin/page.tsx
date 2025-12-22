import { Metadata } from 'next'
import { AdminPanel } from '@/components/admin/AdminPanel'
import { AdminProtected } from '@/components/admin/AdminProtected'

export const metadata: Metadata = {
  title: 'Panel de Administración - Peak Explorer',
  description: 'Gestiona rutas, contenido y configuración',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminPage() {
  return (
    <AdminProtected>
      <AdminPanel />
    </AdminProtected>
  )
}

