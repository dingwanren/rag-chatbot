'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createChat,
  sendMessage as sendStreamingMessage,
  getMessages,
  getChatList,
  deleteChat,
  renameChat,
} from '@/app/actions/chat'
import type { Chat, Message } from '@/lib/supabase/types'

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
 * Hook: 发送消息并处理流式响应
 */
export function useSendMessage() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ chatId, content }: { chatId: string; content: string }) => {
      // 1. 发送消息（创建 user + assistant 占位）
      const { assistantMessageId } = await sendStreamingMessage(chatId, content)

      // 2. 开始流式请求
      const response = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, messageId: assistantMessageId }),
      })

      if (!response.ok) {
        throw new Error('Streaming failed')
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
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const text = decoder.decode(value)
            const lines = text.split('\n').filter(line => line.trim())

            for (const line of lines) {
              try {
                const data = JSON.parse(line)
                if (data.done) {
                  yield { done: true, content: data.content }
                } else if (data.error) {
                  yield { error: data.error, content: data.content }
                } else {
                  yield { chunk: data.chunk, content: data.content }
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        },
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
