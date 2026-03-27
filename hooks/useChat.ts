'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createChat,
  sendMessage as sendStreamingMessage,
  getMessages,
  getChatList,
  deleteChat,
  renameChat,
  deleteMessage,
  updateMessage,
} from '@/app/actions/chat'
import { getKnowledgeBases } from '@/app/actions/knowledge-base'
import type { Chat, Message } from '@/lib/supabase/types'

/**
 * 解析 API 错误响应
 */
function parseApiError(errorText: string): {
  message: string
  code?: string
  details?: any
} {
  try {
    const err = JSON.parse(errorText)
    return {
      message: err.message || '请求失败',
      code: err.code,
      details: err.details,
    }
  } catch {
    // 解析失败，返回原始文本
    return {
      message: errorText || '请求失败',
    }
  }
}

/**
 * 生成友好的错误消息内容
 */
function formatErrorMessage(code?: string, message?: string, details?: any): string {
  // 限额超限
  if (code === 'QUOTA_EXCEEDED') {
    const detailText = details ? `（当前：${details.current}/${details.limit}）` : ''
    return `⚠️ 今日额度已用完${detailText}\n\n${message || '请明天再试或升级账户计划'}`
  }
  
  // 未授权
  if (code === 'UNAUTHORIZED') {
    return `⚠️ 请先登录\n\n${message || '登录后继续使用'}`
  }
  
  // 禁止访问
  if (code === 'FORBIDDEN') {
    return `⚠️ 无权访问\n\n${message || '您没有权限执行此操作'}`
  }
  
  // 其他错误
  return `⚠️ ${message || '发生错误，请稍后重试'}`
}

/**
 * Hook: 获取聊天列表
 */
export function useChatList() {
  const { data, isLoading, error, refetch } = useQuery<Chat[]>({
    queryKey: ['chatList'],
    queryFn: getChatList,
    retry: 1,
  })

  return {
    chats: data ?? [],
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook: 获取单个聊天的消息
 */
export function useMessages(chatId: string | null) {
  const { data, isLoading, error, refetch } = useQuery<Message[]>({
    queryKey: ['messages', chatId],
    queryFn: () => chatId ? getMessages(chatId) : Promise.resolve([]),
    enabled: !!chatId,
    retry: 1,
  })

  return {
    messages: data ?? [],
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook: 创建聊天
 */
export function useCreateChat() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ title, mode, knowledgeBaseId }: {
      title?: string
      mode?: 'chat' | 'rag'
      knowledgeBaseId?: string
    }) => {
      return createChat(title, mode, knowledgeBaseId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatList'] })
    },
  })

  return {
    createChat: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  }
}

/**
 * Hook: 发送消息并处理流式响应（产品级体验）
 */
export function useSendMessage() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ chatId, content }: { chatId: string; content: string }) => {
      // 1. 发送消息（创建 user + assistant 占位，status: 'loading'）
      const { assistantMessageId } = await sendStreamingMessage(chatId, content)

      // 2. 开始流式请求
      const payload = { chatId, messageId: assistantMessageId }

      try {
        const response = await fetch('/api/chat-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorText = await response.text()
          const { message, code, details } = parseApiError(errorText)
          
          // 🎯 关键：失败时更新为错误消息（不删除！）
          const errorMessage = formatErrorMessage(code, message, details)
          await updateMessage(assistantMessageId, errorMessage, 'error')
          
          // 错误分级日志
          if (response.status >= 500) {
            console.error('[API Error]', response.status, message, { code, details })
          } else if (process.env.NODE_ENV === 'development') {
            console.warn('[Business Limit]', response.status, message, { code, details })
          }
          
          // 抛出错误（包含完整信息）
          const error = new Error(message) as any
          error.code = code
          error.status = response.status
          error.details = details
          throw error
        }

        if (!response.body) {
          throw new Error('No response body')
        }

        // 3. 处理流式响应
        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        return {
          assistantMessageId,
          stream: async function* () {
            let accumulatedContent = ''
            
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const text = decoder.decode(value)
              const lines = text.split('\n').filter(line => line.trim())

              for (const line of lines) {
                try {
                  const data = JSON.parse(line)
                  if (data.done) {
                    // 流完成：更新为 success 状态
                    await updateMessage(assistantMessageId, data.content, 'success')
                    yield { done: true, content: data.content }
                  } else if (data.error) {
                    // 流中出错：更新为 error 状态
                    const errorMsg = formatErrorMessage(undefined, data.error, undefined)
                    await updateMessage(assistantMessageId, errorMsg, 'error')
                    yield { error: data.error, content: data.content }
                  } else {
                    // 流式更新：保持 loading 状态
                    accumulatedContent = data.content
                    yield { chunk: data.chunk, content: accumulatedContent }
                  }
                } catch {
                  // 忽略解析错误
                }
              }
            }
          },
        }
      } catch (error) {
        // 网络错误或其他异常：更新为 error 状态
        const errorMsg = formatErrorMessage(
          'INTERNAL_ERROR',
          error instanceof Error ? error.message : '未知错误',
          undefined
        )
        await updateMessage(assistantMessageId, errorMsg, 'error')
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      queryClient.invalidateQueries({ queryKey: ['chatList'] })
    },
  })

  return {
    sendMessage: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  }
}

/**
 * Hook: 重命名聊天
 */
export function useRenameChat() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ chatId, title }: { chatId: string; title: string }) => {
      return renameChat(chatId, title)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatList'] })
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })

  return {
    renameChat: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  }
}

/**
 * Hook: 删除聊天
 */
export function useDeleteChat() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (chatId: string) => {
      return deleteChat(chatId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatList'] })
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })

  return {
    deleteChat: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  }
}

/**
 * Hook: 获取知识库列表
 */
export function useKnowledgeBases() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['knowledgeBases'],
    queryFn: getKnowledgeBases,
    retry: 1,
  })

  return {
    knowledgeBases: data?.data ?? [],
    isLoading,
    error: data?.error || error,
    refetch,
  }
}
