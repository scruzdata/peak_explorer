'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import type { Components } from 'react-markdown'

interface RouteStorytellingProps {
  content: string
}

const markdownComponents: Components = {
  p: ({ node, ...props }) => (
    <p className="mb-4 whitespace-pre-line" {...props} />
  ),
  li: ({ node, ordered, ...props }) => (
    <li className="mb-1" {...props} />
  ),
}

export function RouteStorytelling({ content }: RouteStorytellingProps) {
  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold">La Experiencia</h2>
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      </div>
    </section>
  )
}

