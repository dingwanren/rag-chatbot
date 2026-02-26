export interface Chat {
  id: string
  title: string
  createdAt: Date
  mode: 'normal' | 'rag'
  knowledgeBaseId?: string
}

export interface KnowledgeBase {
  id: string
  name: string
  description?: string
  createdAt: Date
}

export type SidebarSection = 'rag' | 'chat'
