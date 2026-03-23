export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      chats: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          title: string
          mode: 'chat' | 'rag'
          knowledge_base_id?: string | null
          last_message?: string | null
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          mode?: 'chat' | 'rag'
          knowledge_base_id?: string | null
          last_message?: string | null
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'chats_knowledge_base_id_fkey'
            columns: ['knowledge_base_id']
            referencedRelation: 'knowledge_bases'
            referencedColumns: ['id']
          }
        ]
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          role: 'user' | 'assistant'
          content: string
          status: 'streaming' | 'completed'
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          role: 'user' | 'assistant'
          content: string
          status?: 'streaming' | 'completed'
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          role?: 'user' | 'assistant'
          content?: string
          status?: 'streaming' | 'completed'
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'messages_chat_id_fkey'
            columns: ['chat_id']
            referencedRelation: 'chats'
            referencedColumns: ['id']
          }
        ]
      }
      knowledge_bases: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          status?: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          status?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {
      create_message_pair: {
        Args: {
          p_chat_id: string
          p_user_content: string
        }
        Returns: {
          user_message_id: string
          assistant_message_id: string
        }[]
      }
    }
    Enums: {}
  }
}

// 导出的类型别名
export type Chat = Database['public']['Tables']['chats']['Row']
export type ChatInsert = Database['public']['Tables']['chats']['Insert']
export type ChatUpdate = Database['public']['Tables']['chats']['Update']
export type Message = Database['public']['Tables']['messages']['Row']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
export type MessageUpdate = Database['public']['Tables']['messages']['Update']
export type KnowledgeBase = Database['public']['Tables']['knowledge_bases']['Row']
export type KnowledgeBaseInsert = Database['public']['Tables']['knowledge_bases']['Insert']
export type KnowledgeBaseUpdate = Database['public']['Tables']['knowledge_bases']['Update']

// RPC 函数返回类型
export type CreateMessagePairResponse = Database['public']['Functions']['create_message_pair']['Returns'][number]
