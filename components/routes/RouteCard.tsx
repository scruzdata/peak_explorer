'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Clock, MapPin, TrendingUp, Star } from 'lucide-react'
import { Route } from '@/types'
import { formatDistance, formatElevation, getDifficultyColor, getFerrataGradeColor } from '@/lib/utils'

interface RouteCardProps {
  route: Route
}

export function RouteCard({ route }: RouteCardProps) {
  const hasRating = typeof route.rating === 'number'
  const ratingValue = hasRating ? Number(route.rating?.toFixed(1)) : null

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
          
          {/* Rating Badge */}
          {hasRating && (
            <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-gray-900 shadow z-10">
              <Star className="h-4 w-4 text-amber-500" fill="currentColor" strokeWidth={1.5} />
              {ratingValue}
            </div>
          )}

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

