import { Lightbulb, AlertTriangle, Info, Backpack } from 'lucide-react'
import type { ReactNode } from 'react'

export type ContentBlockVariant = 'tip' | 'warning' | 'info' | 'gear'

interface ContentBlockProps {
  variant: ContentBlockVariant
  title?: string
  children: ReactNode
}

const CONFIG: Record<
  ContentBlockVariant,
  {
    icon: ReactNode
    label: string
    containerClass: string
    iconClass: string
    titleClass: string
    textClass: string
  }
> = {
  tip: {
    icon: <Lightbulb className="h-5 w-5 shrink-0" aria-hidden="true" />,
    label: 'Consejo',
    containerClass: 'bg-emerald-50 border border-emerald-200',
    iconClass: 'text-emerald-600',
    titleClass: 'text-emerald-800',
    textClass: 'text-emerald-700',
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />,
    label: 'Precaución',
    containerClass: 'bg-red-50 border border-red-200',
    iconClass: 'text-red-600',
    titleClass: 'text-red-800',
    textClass: 'text-red-700',
  },
  info: {
    icon: <Info className="h-5 w-5 shrink-0" aria-hidden="true" />,
    label: 'Información',
    containerClass: 'bg-sky-50 border border-sky-200',
    iconClass: 'text-sky-600',
    titleClass: 'text-sky-800',
    textClass: 'text-sky-700',
  },
  gear: {
    icon: <Backpack className="h-5 w-5 shrink-0" aria-hidden="true" />,
    label: 'Material necesario',
    containerClass: 'bg-amber-50 border border-amber-200',
    iconClass: 'text-amber-600',
    titleClass: 'text-amber-800',
    textClass: 'text-amber-700',
  },
}

export function ContentBlock({ variant, title, children }: ContentBlockProps) {
  const { icon, label, containerClass, iconClass, titleClass, textClass } = CONFIG[variant]

  return (
    <aside
      className={`rounded-2xl p-5 my-6 flex gap-4 ${containerClass}`}
      aria-label={title ?? label}
    >
      {/* Icon column */}
      <div className={`mt-0.5 ${iconClass}`}>{icon}</div>

      {/* Content column */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold uppercase tracking-wide mb-1 ${titleClass}`}>
          {title ?? label}
        </p>
        <div className={`text-sm leading-relaxed ${textClass}`}>{children}</div>
      </div>
    </aside>
  )
}
