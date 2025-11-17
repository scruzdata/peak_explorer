import { Metadata } from 'next'
import { AdminPanel } from '@/components/admin/AdminPanel'

export const metadata: Metadata = {
  title: 'Panel de Administración - Peak Explorer',
  description: 'Gestiona rutas, contenido y configuración',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminPage() {
  return <AdminPanel />
}

