'use client'

import { Bubble, Sender, type BubbleListProps } from '@ant-design/x'
import { useState, useMemo, useCallback, useSyncExternalStore } from 'react'
import { Avatar, Spin } from 'antd'
import { UserOutlined, RobotOutlined } from '@ant-design/icons'
import { ChatHeader } from './ChatHeader'
import { MarkdownContent } from './MarkdownContent'
import { useMessages, useSendMessage } from '@/hooks/useChat'
import type { Message } from '@/lib/supabase/types'

interface ChatAreaProps {
  chatId: string
  chatTitle?: string
}

let id = 0
const getKey = () => `bubble_${id++}`

const subscribeToMounted = (onStoreChange: () => void) => {
  onStoreChange()
  return () => {}
}

export function ChatArea({ chatId, chatTitle = 'New Chat' }: ChatAreaProps) {
  const { messages: dbMessages, isLoading: isLoadingMessages } = useMessages(chatId)
  const { sendMessage: sendStreamingMessage, isPending } = useSendMessage()
  const [input, setInput] = useState('')

  const isMounted = useSyncExternalStore(subscribeToMounted, () => true, () => false)

  // 转换数据库消息为 Bubble.List 格式
  const bubbleItems = useMemo<BubbleListProps['items']>(() => {
    return (dbMessages ?? []).map((message: Message) => {
      const role = message.role === 'user' ? 'user' : 'ai'
      return {
        key: message.id || getKey(),
        role,
        content: message.content,
        placement: role === 'user' ? ('end' as const) : ('start' as const),
      }
    })
  }, [dbMessages])

  const isLoading = isPending || isLoadingMessages

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
    if (!message.trim()) return

    try {
      // 1. 调用 Server Action 发送消息并获取 assistant message id
      await sendStreamingMessage({ chatId, content: message })

      // 2. 清空输入框
      setInput('')

      // 3. 监听流式更新（可选：可以在这里更新 UI）
      // 流式内容会通过 useMessages hook 自动更新
    } catch (error) {
      console.error('Send message error:', error)
      // 错误处理
    }
  }, [chatId, sendStreamingMessage])

  if (!isMounted) {
    return (
      <div className="flex flex-col h-full">
        <ChatHeader title={chatTitle} />
        <div className="flex-1 flex justify-center items-center">
          <Spin size="large" description="加载中..." />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader title={chatTitle} />
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
