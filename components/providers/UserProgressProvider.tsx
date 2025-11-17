'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { UserProgress, Badge } from '@/types'

interface UserProgressContextType {
  progress: UserProgress | null
  addBookmark: (routeId: string) => void
  removeBookmark: (routeId: string) => void
  completeRoute: (routeId: string, photo?: string, notes?: string) => void
  unlockBadge: (badge: Badge) => void
  isBookmarked: (routeId: string) => boolean
  isCompleted: (routeId: string) => boolean
}

const UserProgressContext = createContext<UserProgressContextType | undefined>(undefined)

export function UserProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgress | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('userProgress')
    if (stored) {
      try {
        setProgress(JSON.parse(stored))
      } catch (e) {
        console.error('Error parsing progress data', e)
      }
    } else {
      // Inicializar progreso vacío
      const initialProgress: UserProgress = {
        userId: '1',
        bookmarks: [],
        completedRoutes: [],
        badges: [],
        stats: {
          totalDistance: 0,
          totalElevation: 0,
          routesCompleted: 0,
          gpxDownloads: 0,
        },
      }
      setProgress(initialProgress)
      localStorage.setItem('userProgress', JSON.stringify(initialProgress))
    }
  }, [])

  const saveProgress = (newProgress: UserProgress) => {
    setProgress(newProgress)
    localStorage.setItem('userProgress', JSON.stringify(newProgress))
  }

  const addBookmark = (routeId: string) => {
    if (!progress) return
    if (progress.bookmarks.includes(routeId)) return
    
    const newProgress = {
      ...progress,
      bookmarks: [...progress.bookmarks, routeId],
    }
    saveProgress(newProgress)
  }

  const removeBookmark = (routeId: string) => {
    if (!progress) return
    const newProgress = {
      ...progress,
      bookmarks: progress.bookmarks.filter(id => id !== routeId),
    }
    saveProgress(newProgress)
  }

  const completeRoute = (routeId: string, photo?: string, notes?: string) => {
    if (!progress) return
    if (progress.completedRoutes.some(r => r.routeId === routeId)) return

    const newProgress = {
      ...progress,
      completedRoutes: [
        ...progress.completedRoutes,
        {
          routeId,
          completedAt: new Date().toISOString(),
          photo,
          notes,
        },
      ],
      stats: {
        ...progress.stats,
        routesCompleted: progress.stats.routesCompleted + 1,
      },
    }
    saveProgress(newProgress)
  }

  const unlockBadge = (badge: Badge) => {
    if (!progress) return
    if (progress.badges.some(b => b.id === badge.id)) return

    const newProgress = {
      ...progress,
      badges: [...progress.badges, badge],
    }
    saveProgress(newProgress)
  }

  const isBookmarked = (routeId: string) => {
    return progress?.bookmarks.includes(routeId) ?? false
  }

  const isCompleted = (routeId: string) => {
    return progress?.completedRoutes.some(r => r.routeId === routeId) ?? false
  }

  return (
    <UserProgressContext.Provider
      value={{
        progress,
        addBookmark,
        removeBookmark,
        completeRoute,
        unlockBadge,
        isBookmarked,
        isCompleted,
      }}
    >
      {children}
    </UserProgressContext.Provider>
  )
}

export function useUserProgress() {
  const context = useContext(UserProgressContext)
  if (context === undefined) {
    throw new Error('useUserProgress must be used within a UserProgressProvider')
  }
  return context
}

