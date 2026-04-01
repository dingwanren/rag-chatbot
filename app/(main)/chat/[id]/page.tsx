'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Bubble, Sender, Actions, type BubbleListProps } from '@ant-design/x'
import { Avatar, Spin, message, Divider } from 'antd'
import { UserOutlined, RobotOutlined } from '@ant-design/icons'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { MarkdownContent } from '@/components/chat/MarkdownContent'
import { UsageIndicator } from '@/components/chat/UsageIndicator'
import { useMessages, useSendMessage } from '@/hooks/useChat'
import { getChat } from '@/app/actions/chat'
import { getKnowledgeBase } from '@/app/actions/knowledge-base'
import type { Chat as ChatType } from '@/types'

interface ChatDetailPageProps {
  params: Promise<{ id: string }>
}

let id = 0
const getKey = () => `bubble_${id++}`

interface BubbleItem {
  key: string
  role: 'user' | 'ai'
  content: string
  placement: 'start' | 'end'
  styles?: {
    content?: React.CSSProperties
  }
  sources?: {
    index: number
    fileName?: string
    page?: number
  }[]
}

export default function ChatDetailPage({ params }: ChatDetailPageProps) {
  const router = useRouter()
  const [chatId, setChatId] = useState<string | null>(null)
  const [chatInfo, setChatInfo] = useState<ChatType | null>(null)
  const [knowledgeBaseName, setKnowledgeBaseName] = useState<string | undefined>()
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [hasSentPending, setHasSentPending] = useState(false)
  const [loadingChat, setLoadingChat] = useState(true)

  // 🎯 Token 使用量状态
  const [usage, setUsage] = useState<{
    daily_tokens: number
    daily_requests: number
  } | null>(null)

  // 🎯 本地消息列表状态（用于实时流式更新）
  const [localMessages, setLocalMessages] = useState<BubbleItem[]>([])
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [completedMessageId, setCompletedMessageId] = useState<string | null>(null)
  const [streamingSources, setStreamingSources] = useState<{ index: number; fileName?: string; page?: number }[] | null>(null)

  const { messages: dbMessages, isLoading: isLoadingMessages } = useMessages(chatId)
  const { sendMessage: sendStreamingMessage, isPending } = useSendMessage()

  // 解析 params 并加载聊天信息
  useEffect(() => {
    params.then(async ({ id }) => {
      setChatId(id)

      try {
        const chat = await getChat(id)
        setChatInfo(chat)

        if (chat.mode === 'rag' && chat.knowledge_base_id) {
          const { data: kb } = await getKnowledgeBase(chat.knowledge_base_id)
          if (kb) {
            setKnowledgeBaseName(kb.name)
          }
        }
      } catch (error) {
        console.error('Load chat error:', error)
        message.error('加载聊天信息失败')
      } finally {
        setLoadingChat(false)
      }

      const stored = sessionStorage.getItem(`chat-${id}-pending`)
      if (stored && !hasSentPending) {
        setPendingMessage(stored)
        sessionStorage.removeItem(`chat-${id}-pending`)
      }
    })
  }, [params, hasSentPending])

  // 自动发送待处理消息
  useEffect(() => {
    if (pendingMessage && chatId && !hasSentPending && !loadingChat) {
      setHasSentPending(true)
      handleSendMessage(pendingMessage)
        .catch((error) => {
          console.error('Auto-send message error:', error)
        })
        .finally(() => {
          setPendingMessage(null)
        })
    }
  }, [pendingMessage, chatId, hasSentPending, loadingChat])

  // 🎯 从数据库消息同步到本地（只在初始加载或完成时）
  useEffect(() => {
    console.log('[chat] useEffect triggered:', {
      dbMessagesCount: dbMessages?.length ?? 0,
      streamingMessageId,
      completedMessageId,
      willOverride: !completedMessageId && dbMessages && dbMessages.length > 0
    })

    if (dbMessages && dbMessages.length > 0 && !streamingMessageId) {
      const items = dbMessages
        .filter((msg) => msg.content && msg.content.trim() !== '')
        .map((msg) => {
          const role = msg.role === 'user' ? 'user' as const : 'ai' as const
          const isError = msg.content?.startsWith('⚠️')
          const sources = (msg.metadata as any)?.sources as { index: number; fileName?: string; page?: number }[] | undefined

          return {
            key: msg.id || getKey(),
            role,
            content: msg.content,
            placement: role === 'user' ? ('end' as const) : ('start' as const),
            styles: {
              content: isError
                ? { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' }
                : undefined,
            },
            sources, // 🎯 附加 sources 到消息项
          }
        })

      // 🎯 只在没有完成标记时才覆盖（避免覆盖本地完整内容）
      if (!completedMessageId) {
        console.log('[chat] ⚠️ WARNING: Overriding local messages with DB data!')
        setLocalMessages(items)
      } else {
        console.log('[chat] ✅ Protected by completedMessageId, skipping DB override')
      }
    }
  }, [dbMessages, streamingMessageId, completedMessageId])

  const isMounted = chatId !== null && !loadingChat

  // 🎯 合并本地消息和数据库消息
  const bubbleItems = useMemo(() => {
    if (streamingMessageId && localMessages.length > 0) {
      // 如果有正在流式的消息，使用本地状态
      return localMessages
    }
    return localMessages
  }, [localMessages, streamingMessageId])

  const isLoading = isPending || !isMounted

  // 🎯 定义操作按钮
  const actionItems = (content: string) => [
    {
      key: 'copy',
      label: '复制',
      actionRender: () => {
        return <Actions.Copy text={content} onCopy={() => message.success('已复制到剪贴板')} />
      },
    },
  ]

  const memoRole = useMemo<BubbleListProps['role']>(() => ({
    ai: {
      typing: true,
      avatar: () => <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />,
      contentRender: (content, item) => {
        const sources = (item as BubbleItem)?.sources
        const contentString = typeof content === 'string' ? content : String(content)

        return (
          <div>
            <MarkdownContent content={contentString} streaming={isLoading} />
            {sources && sources.length > 0 && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ fontSize: '12px', color: '#666' }}>
                  <div style={{ marginBottom: '8px', fontWeight: 500 }}>📄 引用来源：</div>
                  {sources.map(s => (
                    <div key={s.index} style={{ marginBottom: '4px' }}>
                      [{s.index}] {s.fileName || '未知文件'}
                      {s.page ? ` 第${s.page}页` : ''}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )
      },
      // 🎯 添加复制按钮（使用 Actions.Copy 组件）
      footer: (content) => (
        <Actions items={actionItems(content)} onClick={() => console.log(content)} />
      ),
    },
    user: {
      placement: 'end',
      avatar: () => <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />,
      // 🎯 用户消息也添加复制按钮
      footer: (content) => (
        <Actions items={actionItems(content)} onClick={() => console.log(content)} />
      ),
    },
  }), [isLoading])

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!chatId) return
    if (!messageText.trim()) return

    if (chatInfo?.mode === 'rag' && !chatInfo.knowledge_base_id) {
      message.error('该聊天未绑定知识库，无法发送消息')
      return
    }

    try {
      // 🎯 1. 立即在 UI 上显示用户消息
      const userMessage: BubbleItem = {
        key: `user_${Date.now()}`,
        role: 'user',
        content: messageText,
        placement: 'end',
      }

      setLocalMessages(prev => [...prev, userMessage])

      // 🎯 2. 创建 assistant 占位消息（loading 状态）
      const loadingMessage: BubbleItem = {
        key: `ai_${Date.now()}`,
        role: 'ai',
        content: '正在思考...',
        placement: 'start',
        styles: {
          content: { backgroundColor: '#f0f0f0', opacity: 0.8 },
        },
      }

      setLocalMessages(prev => [...prev, loadingMessage])
      setStreamingMessageId(loadingMessage.key)

      // 🎯 3. 发送消息并获取流式响应
      const result = await sendStreamingMessage({ chatId, content: messageText })

      // 🎯 4. 消费流式响应并实时更新 UI
      if (result?.stream) {
        const streamIterator = result.stream()

        for await (const chunk of streamIterator) {
          if (chunk.streamingContent !== undefined) {
            // 🎯 流式更新：实时更新本地状态
            setLocalMessages(prev =>
              prev.map(msg =>
                msg.key === loadingMessage.key
                  ? { ...msg, content: chunk.streamingContent }
                  : msg
              )
            )
          }

          // 🎯 保存 sources
          if (chunk.sources && chunk.sources.length > 0) {
            setStreamingSources(chunk.sources)
          }

          if (chunk.done && chunk.usage) {
            setUsage(chunk.usage)
          }

          if (chunk.done || chunk.error) {
            setStreamingMessageId(null)
            // 🎯 标记为已完成，防止数据库同步覆盖
            setCompletedMessageId(loadingMessage.key)

            // 🎯 更新 sources 到本地消息
            if (chunk.sources && chunk.sources.length > 0) {
              setLocalMessages(prev =>
                prev.map(msg =>
                  msg.key === loadingMessage.key
                    ? { ...msg, sources: chunk.sources }
                    : msg
                )
              )
            }

            console.log('[chat] Stream completed, message key:', loadingMessage.key)
            console.log('[chat] Set completedMessageId to prevent DB override')
            console.log('[chat] Sources:', chunk.sources)

            // 🎯 延迟清除完成标记，让数据库有时间同步（延长到 10 秒）
            setTimeout(() => {
              console.log('[chat] Clearing completedMessageId')
              setCompletedMessageId(null)
            }, 10000)
          }
        }
      }
    } catch (error: any) {
      setStreamingMessageId(null)

      if (error.code === 'QUOTA_EXCEEDED') {
        const details = error.details

        message.warning({
          content: '今日额度已用完',
          duration: 8,
        })

        // 移除 loading 消息
        setLocalMessages(prev => prev.filter(msg => msg.key !== streamingMessageId))
        return
      }

      if (error.code === 'UNAUTHORIZED' || error.status === 401) {
        message.error('请先登录')
        setTimeout(() => {
          router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
        }, 1000)
        return
      }

      message.error(error.message || '发送消息失败，请稍后重试')
      setStreamingMessageId(null)
    }
  }, [chatId, chatInfo, sendStreamingMessage, router, streamingMessageId])

  if (!isMounted) {
    return (
      <div className="flex flex-col h-full">
        <ChatHeader title="加载中..." />
        <div className="flex-1 flex justify-center items-center">
          <Spin size="large" description="加载中..." />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        title={chatInfo?.title || '新对话'}
        mode={chatInfo?.mode}
        knowledgeBaseName={knowledgeBaseName}
      />
      <div className="flex flex-1 min-h-0">
        <Bubble.List
          role={memoRole}
          items={bubbleItems}
          className="flex-1 overflow-y-auto"
          autoScroll
        />
      </div>
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
        <UsageIndicator realtimeUsage={usage} />
      </div>
      <Sender
        placeholder={chatInfo?.mode === 'rag' ? '输入问题，基于知识库获取答案...' : '输入消息...'}
        value={input}
        onChange={setInput}
        loading={isLoading}
        onSubmit={(messageText) => {
          handleSendMessage(messageText)
          setInput('')
        }}
        disabled={!!streamingMessageId}
      />
    </div>
  )
}
