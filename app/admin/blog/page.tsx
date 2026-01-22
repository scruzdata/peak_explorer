import { Metadata } from 'next'
import { AdminBlogPanel } from '@/components/admin/AdminBlogPanel'
import { AdminProtected } from '@/components/admin/AdminProtected'

export const metadata: Metadata = {
  title: 'Gestión de Blog - Panel de Administración',
  description: 'Gestiona artículos del blog',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminBlogPage() {
  return (
    <AdminProtected>
      <AdminBlogPanel />
    </AdminProtected>
  )
}
