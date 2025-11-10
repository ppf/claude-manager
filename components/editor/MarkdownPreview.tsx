'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { cn } from '@/lib/utils'
import 'highlight.js/styles/github-dark.css'

interface MarkdownPreviewProps {
  content: string
  className?: string
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none p-4 overflow-auto',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Disable links for security
          a: ({ node: _node, ...props }) => <span className="text-blue-500 cursor-not-allowed" {...props} />,
          // Style code blocks
          code: ({ node: _node, inline, ...props }) =>
            inline ? (
              <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props} />
            ) : (
              <code className="block bg-muted p-2 rounded" {...props} />
            ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

interface SplitEditorProps {
  editor: React.ReactNode
  preview: React.ReactNode
  showPreview: boolean
}

export function SplitEditor({ editor, preview, showPreview }: SplitEditorProps) {
  if (!showPreview) {
    return <div className="h-full">{editor}</div>
  }

  return (
    <div className="h-full grid grid-cols-2 gap-2">
      <div className="border-r">{editor}</div>
      <div className="overflow-auto">{preview}</div>
    </div>
  )
}

