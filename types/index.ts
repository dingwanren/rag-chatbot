export interface Chat {
  id: string
  user_id: string
  title: string
  mode: 'chat' | 'rag'
  knowledge_base_id: string | null
  last_message: string | null
  last_message_at: string | null
  created_at: string
  updated_at: string
}

export interface KnowledgeBase {
  id: string
  name: string
  description?: string
  created_at: string
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
