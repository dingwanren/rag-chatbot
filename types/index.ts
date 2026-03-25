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

export type FileStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface KnowledgeFile {
  id: string
  knowledge_base_id: string
  file_name: string
  file_url: string
  file_size: number
  status: string
  created_at: string
}

export type SidebarSection = 'rag' | 'chat' | 'knowledge'

export type MainView = 'chat' | 'knowledge'
