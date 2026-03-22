'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Bubble, Sender, type BubbleListProps } from '@ant-design/x'
import { Flex, Avatar, Spin } from 'antd'
import { UserOutlined, RobotOutlined } from '@ant-design/icons'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { MarkdownContent } from '@/components/chat/MarkdownContent'
import { useMessages, useSendMessage } from '@/hooks/useChat'

interface ChatDetailPageProps {
  params: Promise<{ id: string }>
}

let id = 0
const getKey = () => `bubble_${id++}`

export default function ChatDetailPage({ params }: ChatDetailPageProps) {
  const router = useRouter()
  const [chatId, setChatId] = useState<string | null>(null)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [hasSentPending, setHasSentPending] = useState(false)

  const { messages: dbMessages, isLoading: isLoadingMessages } = useMessages(chatId)
  const { sendMessage: sendStreamingMessage, isPending } = useSendMessage()

  // 解析 params 并检查 sessionStorage
  useEffect(() => {
    params.then(({ id }) => {
      setChatId(id)

      // 检查是否有待发送的消息
      const stored = sessionStorage.getItem(`chat-${id}-pending`)
      if (stored && !hasSentPending) {
        setPendingMessage(stored)
        sessionStorage.removeItem(`chat-${id}-pending`)
      }
    })
  }, [params, hasSentPending])

  // 自动发送待处理消息
  useEffect(() => {
    if (pendingMessage && chatId && !hasSentPending) {
      setHasSentPending(true)

      sendStreamingMessage({ chatId, content: pendingMessage })
        .catch((error) => {
          console.error('Auto-send message error:', error)
        })
        .finally(() => {
          setPendingMessage(null)
        })
    }
  }, [pendingMessage, chatId, hasSentPending, sendStreamingMessage])

  const isMounted = chatId !== null

  // 转换数据库消息为 Bubble.List 格式
  const bubbleItems = useMemo(() => {
    return (dbMessages ?? []).map((message) => {
      const role = message.role === 'user' ? 'user' : 'ai'
      return {
        key: message.id || getKey(),
        role,
        content: message.content,
        placement: role === 'user' ? ('end' as const) : ('start' as const),
      }
    })
  }, [dbMessages])

  const isLoading = isPending || isLoadingMessages || !isMounted

  const memoRole = useMemo<BubbleListProps['role']>(() => ({
    ai: {
      typing: true,
      avatar: () => <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />,
      contentRender: (content) => <MarkdownContent content={content} streaming={isLoading} />,
    },
    user: {
      placement: 'end',
      avatar: () => <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />,
    },
  }), [isLoading])

  const handleSendMessage = useCallback(async (message: string) => {
    if (!chatId) return
    if (!message.trim()) return

    try {
      await sendStreamingMessage({ chatId, content: message })
    } catch (error) {
      console.error('Send message error:', error)
    }
  }, [chatId, sendStreamingMessage])

  if (!isMounted) {
    return (
      <div className="flex flex-col h-full">
        <ChatHeader title="Loading..." />
        <div className="flex-1 flex justify-center items-center">
          <Spin size="large" description="加载中..." />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader title="New Chat" />
      <div className="flex flex-1 min-h-0">
        <Bubble.List
          role={memoRole}
          items={bubbleItems}
          className="flex-1 overflow-y-auto"
          autoScroll
        />
      </div>
      <Sender
        placeholder="输入消息..."
        value={input}
        onChange={setInput}
        loading={isLoading}
        onSubmit={(message) => {
          handleSendMessage(message)
          setInput('')
        }}
      />
    </div>
  )
}
