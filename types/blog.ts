// Tipos para el sistema de Blog
import type { ImageData } from './index'

export type BlogStatus = 'draft' | 'published'

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string // Texto plano o markdown para compatibilidad
  contentJson?: any // Contenido estructurado Tiptap (JSON)
  featuredImage?: ImageData
  images?: ImageData[] // Imágenes intercaladas en el contenido
  tags: string[]
  status: BlogStatus
  author?: {
    name: string
    email?: string
    bio?: string
    expertise?: string[]
    avatarUrl?: string
  }
  seo: {
    metaTitle: string
    metaDescription: string
    keywords: string[]
  }
  createdAt: string
  updatedAt: string
  publishedAt?: string
  views?: number
  readingTime?: number // Tiempo estimado de lectura en minutos
}
