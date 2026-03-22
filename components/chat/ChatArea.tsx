'use client'

import { Bubble, Sender, type BubbleListProps } from '@ant-design/x'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useMemo, useCallback, useSyncExternalStore } from 'react'
import { Flex, Avatar, Spin } from 'antd'
import { UserOutlined, RobotOutlined } from '@ant-design/icons'
import { ChatHeader } from './ChatHeader'
import { MarkdownContent } from './MarkdownContent'

interface ChatAreaProps {
  chatId?: string
  chatTitle?: string
}

let id = 0

const getKey = () => `bubble_${id++}`

// 用于检测是否已挂载的订阅函数
const subscribeToMounted = (onStoreChange: () => void) => {
  onStoreChange()
  return () => {}
}

export function ChatArea({ chatId, chatTitle = 'New Chat' }: ChatAreaProps) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  })
  const [input, setInput] = useState('')
  
  // 使用 useSyncExternalStore 替代 useEffect + useState 来检测挂载状态
  const isMounted = useSyncExternalStore(
    subscribeToMounted,
    () => true,
    () => false
  )

  // 转换 useChat 的 messages 为 Bubble.List 的 items 格式
  const bubbleItems = useMemo(() => {
    return messages.map((message) => {
      const content = message.parts
        .map((part) => (part.type === 'text' ? part.text : ''))
        .join('')
      
      // 将 'assistant' 转换为 'ai'，以匹配 role 配置
      const role = message.role === 'user' ? 'user' : 'ai'
      
      return {
        key: message.id || getKey(),
        role,
        content,
        placement: role === 'user' ? ('end' as const) : ('start' as const),
      }
    })
  }, [messages])

  const isLoading = status === 'streaming' || status === 'submitted'

  // 按照官方示例使用 useMemo 缓存 role 配置，并添加类型定义
  const memoRole = useMemo<BubbleListProps['role']>(() => ({
    ai: {
      typing: true,
      avatar: () => <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />,
      contentRender: (content) => (
        <MarkdownContent content={content} streaming={isLoading} />
      ),
    },
    user: {
      placement: 'end',
      avatar: () => <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />,
    },
  }), [isLoading])

  const handleSendMessage = useCallback((message: string) => {
    sendMessage({ text: message })
  }, [sendMessage])

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
