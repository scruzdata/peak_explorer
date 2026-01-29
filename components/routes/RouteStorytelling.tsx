'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'
import type { Components } from 'react-markdown'

interface RouteStorytellingProps {
  content: string
}

const markdownComponents: Components = {
  p: ({ ...props }) => (
    <p className="mb-4 whitespace-pre-line" {...props} />
  ),
  li: ({ ...props }) => (
    <li className="mb-1" {...props} />
  ),
  div: ({ className, style, ...props }: any) => {
    // Si el div tiene estilos inline que sugieren que contiene un iframe (como display:flex, justify-content:center)
    const isVideoContainer = 
      (style?.display === 'flex' || className?.includes('flex')) &&
      (style?.justifyContent === 'center' || className?.includes('justify-center'))
    
    if (isVideoContainer) {
      return (
        <div className="my-6 flex w-full justify-center" {...props}>
          <div className="w-full max-w-4xl">
            {props.children}
          </div>
        </div>
      )
    }
    
    return <div {...props} />
  },
  iframe: ({ width, height, style, ...props }: any) => {
    // Hacer el iframe responsive usando aspect-ratio
    return (
      <div className="relative my-4 w-full overflow-hidden rounded-lg" style={{ aspectRatio: '16/9' }}>
        <iframe
          {...props}
          className="absolute left-0 top-0 h-full w-full"
          style={{
            ...style,
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            border: 'none',
          }}
          width="100%"
          height="100%"
        />
      </div>
    )
  },
}

export function RouteStorytelling({ content }: RouteStorytellingProps) {
  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold">La Experiencia</h2>
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks] as any}
          rehypePlugins={[rehypeRaw] as any}
          // Permitimos HTML crudo para incrustar iframes (YouTube, etc.) en la narrativa.
          // El contenido viene de tu panel de admin, no de usuarios anónimos.
          skipHtml={false}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      </div>
    </section>
  )
}

