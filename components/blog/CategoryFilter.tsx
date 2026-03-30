'use client'

import { SlidersHorizontal } from 'lucide-react'

interface CategoryFilterProps {
  tags: string[]
  activeTag: string | null
  onChange: (tag: string | null) => void
}

export function CategoryFilter({ tags, activeTag, onChange }: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1" role="group" aria-label="Filtrar por categoría">
      {/* Icon */}
      <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-400 mr-1" aria-hidden="true" />

      {/* All */}
      <button
        onClick={() => onChange(null)}
        className={`blog-chip shrink-0 ${activeTag === null ? 'blog-chip-active' : 'blog-chip-inactive'}`}
        aria-pressed={activeTag === null}
      >
        Todos
      </button>

      {/* Dynamic tags */}
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onChange(tag === activeTag ? null : tag)}
          className={`blog-chip shrink-0 ${activeTag === tag ? 'blog-chip-active' : 'blog-chip-inactive'}`}
          aria-pressed={activeTag === tag}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
