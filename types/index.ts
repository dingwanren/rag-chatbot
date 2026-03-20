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
  documentCount?: number
}

export type FileParseStatus = 'parsing' | 'success' | 'failed'

export interface KBFile {
  id: string
  name: string
  size: number
  type: string
  knowledgeBaseId: string
  createdAt: Date
  uploadedBy?: string
  status?: FileParseStatus
  errorMessage?: string
}

export type SidebarSection = 'rag' | 'chat' | 'knowledge'

export type MainView = 'chat' | 'knowledge'
