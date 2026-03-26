'use client'

import { useRouter } from 'next/navigation'
import { Bot } from 'lucide-react'

export function SidebarHeader() {
  const router = useRouter()

  const handleClick = () => {
    router.push('/')
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border cursor-pointer hover:bg-sidebar-accent transition-colors"
    >
      <Bot className="w-6 h-6 text-sidebar-primary" />
      <span className="font-semibold text-lg text-sidebar-foreground">
        RAG Chatbot
      </span>
    </div>
  )
}
