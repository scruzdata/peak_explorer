'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Clock, MapPin, TrendingUp, Star } from 'lucide-react'
import { Route } from '@/types'
import { formatDistance, formatElevation, getDifficultyColor, getFerrataGradeColor } from '@/lib/utils'

interface RouteCardProps {
  route: Route
  compact?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  isHovered?: boolean
}

export function RouteCard({ route, compact = false, onMouseEnter, onMouseLeave, isHovered = false }: RouteCardProps) {
  const hasRating = typeof route.rating === 'number'
  const ratingValue = hasRating ? Number(route.rating?.toFixed(1)) : null

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className={`group cursor-pointer transition-all duration-300 ${
          isHovered ? 'ring-2 ring-primary-500 ring-offset-2 rounded-xl scale-105 shadow-lg' : ''
        }`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Link href={`/${route.type === 'trekking' ? 'rutas' : 'vias-ferratas'}/${route.slug}`} target="_blank" rel="noopener noreferrer">
          <div className="relative h-48 overflow-hidden rounded-xl mb-2">
            <Image
              src={route.heroImage.url}
              alt={route.heroImage.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Rating Badge */}
            {hasRating && (
              <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-gray-900 shadow z-10">
                <Star className="h-3 w-3 text-amber-500" fill="currentColor" strokeWidth={1.5} />
                {ratingValue}
              </div>
            )}

            {/* Difficulty Badge */}
            <div className="absolute bottom-2 left-2">
              <span className={`text-xs px-2 py-1 rounded-md font-medium ${getDifficultyColor(route.difficulty)}`}>
                {route.difficulty}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
              {route.title}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-1">
              {route.location.region}, {route.location.province}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-600 pt-1">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{formatDistance(route.distance)}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>{formatElevation(route.elevation)}</span>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`card card-hover group transition-all duration-300 ${
        isHovered ? 'ring-2 ring-primary-500 ring-offset-2 scale-105 shadow-xl' : ''
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Link href={`/${route.type === 'trekking' ? 'rutas' : 'vias-ferratas'}/${route.slug}`} target="_blank" rel="noopener noreferrer">
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

