import { Metadata } from 'next'
import { UserProfile } from '@/components/user/UserProfile'

export const metadata: Metadata = {
  title: 'Mi Perfil - Peak Explorer',
  description: 'Gestiona tus rutas, badges y estadísticas en Peak Explorer',
}

export default function PerfilPage() {
  return <UserProfile />
}

