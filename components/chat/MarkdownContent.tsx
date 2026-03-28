'use client'

import XMarkdown from '@ant-design/x-markdown'
import { CodeHighlighter } from '@ant-design/x'
import type { ComponentProps } from '@ant-design/x-markdown'
import { useMemo } from 'react'

// 引入 XMarkdown 主题样式
import '@ant-design/x-markdown/themes/light.css'

/**
 * Code component for rendering code blocks with syntax highlighting
 */
function CodeComponent({ className, children }: ComponentProps) {
  const lang = className?.match(/language-(\w+)/)?.[1] || ''

  if (typeof children !== 'string') return null

  return <CodeHighlighter lang={lang}>{children}</CodeHighlighter>
}

interface MarkdownContentProps {
  content: React.ReactNode
  streaming?: boolean
}

/**
 * Markdown content renderer with code highlighting support
 */
export function MarkdownContent({ content, streaming = false }: MarkdownContentProps) {
  // Convert React.ReactNode to string
  const contentString = typeof content === 'string' ? content : String(content ?? '')

  // Memoize the components object to prevent infinite re-renders
  const components = useMemo(() => ({ code: CodeComponent }), [])

  return (
    <div className="x-markdown-light">
      <XMarkdown
        content={contentString}
        components={components}
        paragraphTag="div"
        // 🎯 流式模式：启用打字机效果
        streaming={streaming ? { enable: true } : undefined}
      />
    </div>
  )
}
