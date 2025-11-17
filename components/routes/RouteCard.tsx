'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Clock, MapPin, TrendingUp, Bookmark, BookmarkCheck } from 'lucide-react'
import { Route } from '@/types'
import { formatDistance, formatElevation, getDifficultyColor, getFerrataGradeColor } from '@/lib/utils'
import { useUserProgress } from '@/components/providers/UserProgressProvider'

interface RouteCardProps {
  route: Route
}

export function RouteCard({ route }: RouteCardProps) {
  const { isBookmarked, addBookmark, removeBookmark } = useUserProgress()
  const bookmarked = isBookmarked(route.id)

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (bookmarked) {
      removeBookmark(route.id)
    } else {
      addBookmark(route.id)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="card card-hover group"
    >
      <Link href={`/${route.type === 'trekking' ? 'rutas' : 'vias-ferratas'}/${route.slug}`}>
        <div className="relative h-48 overflow-hidden">
          <Image
            src={route.heroImage.url}
            alt={route.heroImage.alt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Bookmark Button */}
          <button
            onClick={handleBookmark}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white transition-colors z-10"
            aria-label={bookmarked ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          >
            {bookmarked ? (
              <BookmarkCheck className="h-5 w-5 text-primary-600" />
            ) : (
              <Bookmark className="h-5 w-5 text-gray-700" />
            )}
          </button>

          {/* Difficulty Badge */}
          <div className="absolute bottom-3 left-3">
            <span className={`badge ${getDifficultyColor(route.difficulty)}`}>
              {route.difficulty}
            </span>
            {route.ferrataGrade && (
              <span className={`ml-2 badge ${getFerrataGradeColor(route.ferrataGrade)}`}>
                {route.ferrataGrade}
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          <h3 className="mb-2 text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
            {route.title}
          </h3>
          <p className="mb-4 line-clamp-2 text-gray-600">
            {route.summary}
          </p>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <MapPin className="mr-1 h-4 w-4" />
              {formatDistance(route.distance)}
            </div>
            <div className="flex items-center">
              <TrendingUp className="mr-1 h-4 w-4" />
              {formatElevation(route.elevation)}
            </div>
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              {route.duration}
            </div>
          </div>

          <div className="mt-4 flex items-center text-sm text-gray-500">
            <MapPin className="mr-1 h-4 w-4" />
            {route.location.region}, {route.location.province}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

