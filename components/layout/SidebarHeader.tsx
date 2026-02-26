'use client'

import { Bot } from 'lucide-react'

export function SidebarHeader() {
  return (
    <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
      <Bot className="w-6 h-6 text-sidebar-primary" />
      <span className="font-semibold text-lg text-sidebar-foreground">
        RAG Chatbot
      </span>
    </div>
  )
}
