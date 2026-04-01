'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createChat,
  sendMessage as sendStreamingMessage,
  getMessages,
  getChatList,
  deleteChat,
  renameChat,
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
  details?: unknown
} {
  try {
    const err = JSON.parse(errorText)
    return {
      message: (err as Record<string, unknown>).message as string || '请求失败',
      code: (err as Record<string, unknown>).code as string | undefined,
      details: (err as Record<string, unknown>).details as unknown,
    }
  } catch {
    return {
      message: errorText || '请求失败',
    }
  }
}

/**
 * 生成友好的错误消息内容
 */
function formatErrorMessage(code?: string, message?: string, details?: Record<string, unknown>): string {
  if (code === 'QUOTA_EXCEEDED') {
    const detailText = details ? `（当前：${details.current}/${details.limit}）` : ''
    return `⚠️ 今日额度已用完${detailText}\n\n${message || '请明天再试或升级账户计划'}`
  }

  if (code === 'UNAUTHORIZED') {
    return `⚠️ 请先登录\n\n${message || '登录后继续使用'}`
  }

  if (code === 'FORBIDDEN') {
    return `⚠️ 无权访问\n\n${message || '您没有权限执行此操作'}`
  }

  return `⚠️ ${message || '发生错误，请稍后重试'}`
}

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

export function useMessages(chatId: string | null) {
  const { data, isLoading, error, refetch } = useQuery<Message[]>({
    queryKey: ['messages', chatId],
    queryFn: () => chatId ? getMessages(chatId) : Promise.resolve([]),
    enabled: !!chatId,
    retry: 1,
    // 🎯 关键：按 created_at 升序排序，确保消息顺序正确
    staleTime: 1000, // 1 秒内不重复请求
  })

  return {
    messages: data ?? [],
    isLoading,
    error,
    refetch,
  }
}

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
    retry: false,  // 失败不重试，避免重复创建
  })

  return {
    createChat: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  }
}

/**
 * 🎯 优化的 Hook：发送消息并实时流式更新（不依赖数据库轮询）
 */
export function useSendMessage() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ chatId, content }: { chatId: string; content: string }) => {
      // 1. 发送消息（创建 user + assistant 占位）
      const { assistantMessageId } = await sendStreamingMessage(chatId, content)

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

          const errorMessage = formatErrorMessage(code, message, details as Record<string, unknown> | undefined)
          await updateMessage(assistantMessageId, errorMessage, 'completed')

          if (response.status >= 500) {
            console.error('[API Error]', response.status, message, { code, details })
          }

          const error = new Error(message) as Error & { code?: string; status?: number; details?: unknown }
          error.code = code
          error.status = response.status
          error.details = details
          throw error
        }

        if (!response.body) {
          throw new Error('No response body')
        }

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
                    // 流完成：更新数据库为 completed 状态（包含 sources）
                    await updateMessage(assistantMessageId, data.content, 'completed', data.sources)

                    yield {
                      done: true,
                      content: data.content,
                      usage: data.usage,
                      sources: data.sources,
                    }
                  } else if (data.error) {
                    const errorMsg = formatErrorMessage(undefined, data.error, undefined)
                    await updateMessage(assistantMessageId, errorMsg, 'completed')
                    yield {
                      error: data.error,
                      content: data.content,
                      usage: data.usage,
                    }
                  } else {
                    // 🎯 流式更新：只更新本地状态，不更新数据库（避免频繁 IO）
                    accumulatedContent = data.content
                    yield {
                      chunk: data.chunk,
                      content: accumulatedContent,
                      // 🎯 返回当前内容，让前端实时更新
                      streamingContent: accumulatedContent,
                    }
                  }
                } catch {
                  // 忽略解析错误
                }
              }
            }
          },
        }
      } catch (error) {
        const errorMsg = formatErrorMessage(
          'INTERNAL_ERROR',
          error instanceof Error ? error.message : '未知错误',
          undefined
        )
        await updateMessage(assistantMessageId, errorMsg, 'completed')
        throw error
      }
    },
    onSuccess: () => {
      // 🎯 流式完成后不立即刷新，避免覆盖本地完整内容
      // 数据库更新由 API 端完成，前端通过用户刷新或下次进入时同步
      console.log('[useSendMessage] Mutation completed, skipping DB refresh to preserve local state')
    },
  })

  return {
    sendMessage: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  }
}

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
