'use client'

import { useEffect, useState } from 'react'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const scrollableHeight = documentHeight - windowHeight
      const progressPercent = (scrollTop / scrollableHeight) * 100
      setProgress(Math.min(100, Math.max(0, progressPercent)))
    }

    window.addEventListener('scroll', updateProgress)
    updateProgress()

    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  return (
    <div className="reading-progress">
      <div
        className="reading-progress-bar"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

