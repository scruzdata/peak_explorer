'use client'

import { useState, useEffect } from 'react'
import { ChecklistItem } from '@/types'
import { CheckCircle2, Circle } from 'lucide-react'

interface RouteChecklistProps {
  routeId: string
}

export function RouteChecklist({ routeId }: RouteChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([])

  useEffect(() => {
    // Cargar checklist desde localStorage
    const stored = localStorage.getItem(`checklist-${routeId}`)
    if (stored) {
      try {
        setItems(JSON.parse(stored))
      } catch (e) {
        // Si falla, crear checklist por defecto
        setItems(createDefaultChecklist())
      }
    } else {
      setItems(createDefaultChecklist())
    }
  }, [routeId])

  const createDefaultChecklist = (): ChecklistItem[] => {
    return [
      { id: '1', text: 'Revisar condiciones meteorológicas', checked: false },
      { id: '2', text: 'Preparar mochila con agua y comida', checked: false },
      { id: '3', text: 'Descargar track GPX en el dispositivo', checked: false },
      { id: '4', text: 'Informar a alguien de la ruta planificada', checked: false },
      { id: '5', text: 'Revisar equipo necesario', checked: false },
      { id: '6', text: 'Cargar batería del GPS/móvil', checked: false },
    ]
  }

  const toggleItem = (id: string) => {
    const newItems = items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    )
    setItems(newItems)
    localStorage.setItem(`checklist-${routeId}`, JSON.stringify(newItems))
  }

  const downloadChecklist = () => {
    const content = items.map((item, index) => 
      `${item.checked ? '☑' : '☐'} ${index + 1}. ${item.text}`
    ).join('\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `checklist-ruta-${routeId}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Checklist Pre-Ruta</h3>
        <button
          onClick={downloadChecklist}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Descargar
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className="flex cursor-pointer items-center space-x-2 rounded-lg p-2 hover:bg-gray-50 transition-colors"
          >
            {item.checked ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400" />
            )}
            <span className={item.checked ? 'text-gray-500 line-through' : 'text-gray-900'}>
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

