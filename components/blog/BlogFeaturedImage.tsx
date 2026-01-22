'use client'

import Image from 'next/image'
import { ImageData } from '@/types'

interface BlogFeaturedImageProps {
  image: ImageData
  alt: string
  priority?: boolean
  className?: string
}

export function BlogFeaturedImage({ image, alt, priority = false, className = '' }: BlogFeaturedImageProps) {
  return (
    <div className={`relative w-full overflow-hidden bg-gray-200 ${className}`}>
      <Image
        src={image.url}
        alt={alt}
        fill
        className="object-cover"
        priority={priority}
        sizes="100vw"
        unoptimized={image.url.includes('firebasestorage') || image.url.includes('firebase')}
        onError={(e) => {
          console.error('Error cargando imagen destacada:', image.url)
          // Mostrar placeholder en lugar de ocultar
          const target = e.target as HTMLImageElement
          if (target.parentElement) {
            target.parentElement.innerHTML = '<div class="h-full w-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center"><span class="text-white/50 text-sm">Error cargando imagen</span></div>'
          }
        }}
      />
    </div>
  )
}
