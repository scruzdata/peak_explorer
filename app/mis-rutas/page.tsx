import { Metadata } from 'next'
import { MyRoutes } from '@/components/user/MyRoutes'

export const metadata: Metadata = {
  title: 'Mis Rutas - Peak Explorer',
  description: 'Tus rutas guardadas y completadas',
}

export default function MisRutasPage() {
  return <MyRoutes />
}

