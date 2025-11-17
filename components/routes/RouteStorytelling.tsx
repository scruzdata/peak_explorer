'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface RouteStorytellingProps {
  content: string
}

export function RouteStorytelling({ content }: RouteStorytellingProps) {
  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold">La Experiencia</h2>
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </section>
  )
}

