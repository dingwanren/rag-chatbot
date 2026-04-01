/**
 * 消息状态类型定义
 */

/**
 * 引用来源（前端展示用）
 */
export interface MessageSource {
  index: number
  fileName?: string
  page?: number
}

/**
 * 消息状态
 */
export type MessageStatus = 'loading' | 'success' | 'error'

/**
 * 扩展消息类型（包含状态和引用来源）
 */
export interface ChatMessage {
  id: string
  chat_id: string
  role: 'user' | 'assistant'
  content: string
  status: MessageStatus
  sources?: MessageSource[]
  metadata?: unknown
  created_at: string
}

/**
 * 错误消息内容
 */
export interface ErrorMessageContent {
  type: 'error'
  code?: string
  message: string
  suggestion?: string
  retryable?: boolean
}

/**
 * 加载消息内容
 */
export interface LoadingMessageContent {
  type: 'loading'
  text: string
}

/**
 * 成功消息内容
 */
export interface SuccessMessageContent {
  type: 'success'
  text: string
}

/**
 * 消息内容联合类型
 */
export type MessageContent = 
  | ErrorMessageContent
  | LoadingMessageContent
  | SuccessMessageContent
