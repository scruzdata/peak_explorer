'use client'

import { Badge } from '@/types'
import { motion } from 'framer-motion'

interface BadgeDisplayProps {
  badges: Badge[]
}

export function BadgeDisplay({ badges }: BadgeDisplayProps) {
  if (badges.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">Aún no has desbloqueado ningún badge. ¡Completa rutas para conseguirlos!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {badges.map((badge, index) => (
        <motion.div
          key={badge.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="mb-3 text-4xl">{badge.icon}</div>
          <h3 className="mb-1 text-lg font-semibold">{badge.name}</h3>
          <p className="mb-3 text-sm text-gray-600">{badge.description}</p>
          <p className="text-xs text-gray-500">
            Desbloqueado: {new Date(badge.unlockedAt).toLocaleDateString('es-ES')}
          </p>
        </motion.div>
      ))}
    </div>
  )
}

