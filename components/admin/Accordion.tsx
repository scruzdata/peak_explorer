'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react'

interface AccordionItemProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  icon?: LucideIcon
}

export function AccordionItem({ title, children, defaultOpen = false, icon: Icon }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 rounded-md mb-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-md"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-gray-600" />}
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-600" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-600" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 py-3 bg-white rounded-b-md">
          {children}
        </div>
      )}
    </div>
  )
}
