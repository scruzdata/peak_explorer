'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { List, ChevronDown } from 'lucide-react'
import { slugifyHeading } from '@/lib/blogHeadings'

export type { TocHeading } from '@/lib/blogHeadings'

interface TableOfContentsProps {
  headings: import('@/lib/blogHeadings').TocHeading[]
  contentSelector?: string
}

export function TableOfContents({
  headings,
  contentSelector = '[data-blog-content]',
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)
  const intersectionRef = useRef<IntersectionObserver | null>(null)

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        setActiveId(entry.target.id)
      }
    }
  }, [])

  useEffect(() => {
    if (headings.length === 0) return

    function injectAndObserve(): boolean {
      const container = document.querySelector(contentSelector)
      if (!container) return false

      const domHeadings = container.querySelectorAll('h2, h3')
      if (domHeadings.length === 0) return false

      // Assign IDs matching the extracted headings
      domHeadings.forEach((el) => {
        if (!el.id) {
          const id = slugifyHeading(el.textContent ?? '')
          if (id) el.id = id
        }
      })

      // Tear down any previous IntersectionObserver before creating a new one
      intersectionRef.current?.disconnect()
      const io = new IntersectionObserver(handleObserver, {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      })
      headings.forEach(({ id }) => {
        const el = document.getElementById(id)
        if (el) io.observe(el)
      })
      intersectionRef.current = io
      return true
    }

    // Try immediately (for SSR-rendered content)
    if (injectAndObserve()) {
      return () => intersectionRef.current?.disconnect()
    }

    // BlogRenderer is lazy-loaded — wait for headings to appear via MutationObserver
    const root = document.querySelector(contentSelector) ?? document.body
    const mo = new MutationObserver(() => {
      if (injectAndObserve()) mo.disconnect()
    })
    mo.observe(root, { childList: true, subtree: true })

    return () => {
      mo.disconnect()
      intersectionRef.current?.disconnect()
    }
  }, [headings, contentSelector, handleObserver])

  if (headings.length === 0) return null

  return (
    <nav aria-label="Tabla de contenidos" className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left lg:cursor-default"
        aria-expanded={isOpen}
        aria-controls="toc-list"
      >
        <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
          <List className="h-4 w-4" aria-hidden="true" />
          En este artículo
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 lg:hidden ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <div className="h-px bg-slate-100" />

      {/* List */}
      <ul
        id="toc-list"
        className={`px-4 py-3 space-y-0.5 overflow-y-auto max-h-[60vh] lg:block ${isOpen ? 'block' : 'hidden'}`}
      >
        {headings.map(({ id, text, level }) => {
          const isActive = activeId === id
          return (
            <li key={id} className={level === 3 ? 'pl-4' : ''}>
              <button
                onClick={() => {
                  const target = document.getElementById(id)
                  if (target) {
                    const HEADER_OFFSET = 88 // navbar height + breathing room
                    const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
                    window.scrollTo({ top, behavior: 'smooth' })
                  }
                  setIsOpen(false)
                }}
                className={`block w-full text-left rounded-lg px-3 py-2 text-sm leading-snug transition-all duration-150 cursor-pointer
                  ${isActive
                    ? 'bg-primary-50 font-semibold text-primary-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                aria-current={isActive ? 'location' : undefined}
              >
                {text}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="h-0.5 bg-gradient-to-r from-primary-500 to-cta-500 opacity-60" />
    </nav>
  )
}
