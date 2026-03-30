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
          seq?: number
        }
        Insert: {
          id?: string
          chat_id: string
          role: 'user' | 'assistant'
          content: string
          status?: 'streaming' | 'completed'
          metadata?: Json | null
          created_at?: string
          seq?: number
        }
        Update: {
          id?: string
          chat_id?: string
          role?: 'user' | 'assistant'
          content?: string
          status?: 'streaming' | 'completed'
          metadata?: Json | null
          created_at?: string
          seq?: number
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
      knowledge_files: {
        Row: {
          id: string
          knowledge_base_id: string
          file_name: string
          file_url: string
          file_size: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          knowledge_base_id: string
          file_name: string
          file_url: string
          file_size: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          knowledge_base_id?: string
          file_name?: string
          file_url?: string
          file_size?: number
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'knowledge_files_knowledge_base_id_fkey'
            columns: ['knowledge_base_id']
            referencedRelation: 'knowledge_bases'
            referencedColumns: ['id']
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          plan: 'free' | 'pro' | 'super'
          username: string | null
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id: string
          plan?: 'free' | 'pro' | 'super'
          username?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plan?: 'free' | 'pro' | 'super'
          username?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_limits: {
        Row: {
          user_id: string
          daily_token_limit: number
          daily_request_limit: number
          used_tokens_today: number
          used_requests_today: number
          last_reset_date: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          user_id: string
          daily_token_limit: number
          daily_request_limit: number
          used_tokens_today?: number
          used_requests_today?: number
          last_reset_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          daily_token_limit?: number
          daily_request_limit?: number
          used_tokens_today?: number
          used_requests_today?: number
          last_reset_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          id?: string
          user_id: string
          chat_id: string
          model: string
          prompt_tokens: number
          completion_tokens: number
          total_tokens: number
          cost?: number | null
          created_at?: string
        }
        Insert: {
          id?: string
          user_id: string
          chat_id: string
          model: string
          prompt_tokens: number
          completion_tokens: number
          total_tokens: number
          cost?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          chat_id?: string
          model?: string
          prompt_tokens?: number
          completion_tokens?: number
          total_tokens?: number
          cost?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'usage_logs_chat_id_fkey'
            columns: ['chat_id']
            referencedRelation: 'chats'
            referencedColumns: ['id']
          }
        ]
      }
      user_usage: {
        Row: {
          user_id: string
          daily_tokens: number
          daily_requests: number
          last_reset_date: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          user_id: string
          daily_tokens?: number
          daily_requests?: number
          last_reset_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          daily_tokens?: number
          daily_requests?: number
          last_reset_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      token_logs: {
        Row: {
          id?: string
          user_id: string
          chat_id: string
          prompt_tokens: number
          completion_tokens: number
          total_tokens: number
          model?: string
          created_at?: string
        }
        Insert: {
          id?: string
          user_id: string
          chat_id: string
          prompt_tokens: number
          completion_tokens: number
          total_tokens: number
          model?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          chat_id?: string
          prompt_tokens?: number
          completion_tokens?: number
          total_tokens?: number
          model?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'token_logs_chat_id_fkey'
            columns: ['chat_id']
            referencedRelation: 'chats'
            referencedColumns: ['id']
          }
        ]
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
      check_and_consume: {
        Args: {
          p_user_id: string
          p_tokens: number
        }
        Returns: Json
      }
      increment_tokens: {
        Args: {
          p_user_id: string
          p_tokens: number
        }
        Returns: undefined
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
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type UserLimits = Database['public']['Tables']['user_limits']['Row']
export type UserLimitsInsert = Database['public']['Tables']['user_limits']['Insert']
export type UsageLog = Database['public']['Tables']['usage_logs']['Row']
export type UsageLogInsert = Database['public']['Tables']['usage_logs']['Insert']
export type UserUsage = Database['public']['Tables']['user_usage']['Row']
export type UserUsageInsert = Database['public']['Tables']['user_usage']['Insert']
export type UserUsageUpdate = Database['public']['Tables']['user_usage']['Update']
export type TokenLog = Database['public']['Tables']['token_logs']['Row']
export type TokenLogInsert = Database['public']['Tables']['token_logs']['Insert']

// RPC 函数返回类型
export type CreateMessagePairResponse = Database['public']['Functions']['create_message_pair']['Returns'][number]
