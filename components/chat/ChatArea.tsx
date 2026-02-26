'use client'

import { Bubble, Sender, Prompts, type BubbleListProps } from '@ant-design/x'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useMemo, useCallback, useSyncExternalStore } from 'react'
import { Flex, Avatar, Spin } from 'antd'
import { UserOutlined, RobotOutlined } from '@ant-design/icons'
import { ChatHeader } from './ChatHeader'

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
    },
    user: {
      placement: 'end',
      avatar: () => <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />,
    },
  }), [])

  const handleSendMessage = useCallback((message: string) => {
    sendMessage({ text: message })
  }, [sendMessage])

  if (!isMounted) {
    return (
      <Flex vertical style={{ height: '100vh' }}>
        <ChatHeader title={chatTitle} />
        <Flex justify="center" align="center" style={{ flex: 1 }}>
          <Spin size="large" description="加载中..." />
        </Flex>
      </Flex>
    )
  }

  return (
    <Flex vertical style={{ height: '100vh' }}>
      <ChatHeader title={chatTitle} />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Bubble.List
          role={memoRole}
          items={bubbleItems}
          style={{ flex: 1, overflowY: 'auto' }}
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
        header={
          <Sender.Header title="快捷提示">
            <Prompts
              items={[
                { key: '1', description: '帮我总结一下这个文档' },
                { key: '2', description: '这个文档的主要内容是什么？' },
                { key: '3', description: '提取文档中的关键信息' },
              ]}
              onItemClick={({ data }) => {
                setInput(data.description as string ?? '')
              }}
            />
          </Sender.Header>
        }
      />
      {isLoading && (
        <Flex justify="center" style={{ padding: '8px' }}>
          <Spin size="small" description="AI 思考中..." />
        </Flex>
      )}
    </Flex>
  )
}
