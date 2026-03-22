'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bubble, Sender, type BubbleListProps } from '@ant-design/x'
import { Flex, Avatar, Typography } from 'antd'
import { UserOutlined, RobotOutlined, MessageOutlined } from '@ant-design/icons'
import { MarkdownContent } from '@/components/chat/MarkdownContent'
import { useCreateChat } from '@/hooks/useChat'

const { Title, Text } = Typography

export function ChatHome() {
  const router = useRouter()
  const { createChat, isPending: isCreating } = useCreateChat()
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)

  const bubbleItems: BubbleListProps['items'] = []

  const memoRole: BubbleListProps['role'] = {
    ai: {
      typing: true,
      avatar: () => <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />,
      contentRender: (content) => <MarkdownContent content={content} streaming={false} />,
    },
    user: {
      placement: 'end',
      avatar: () => <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />,
    },
  }

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return

    setIsSending(true)

    try {
      // 1. 创建新聊天
      const { id: chatId } = await createChat({ title: '新对话' })

      // 2. 将消息存储到 sessionStorage（用于传递到聊天页面）
      sessionStorage.setItem(`chat-${chatId}-pending`, message)

      // 3. 跳转到聊天详情页
      router.push(`/chat/${chatId}`)
    } catch (error) {
      console.error('Create chat error:', error)
      setIsSending(false)
    }
  }, [createChat, router])

  return (
    <div className="flex flex-col h-full">
      {/* 空状态提示 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <MessageOutlined className="w-16 h-16 mx-auto text-muted-foreground" style={{ fontSize: '64px' }} />
          <Title level={2}>欢迎使用 RAG Chatbot</Title>
          <Text type="secondary" className="block max-w-md">
            在下方输入问题，开始新的对话
          </Text>
        </div>
      </div>

      {/* 输入框 */}
      <Sender
        placeholder="输入消息..."
        value={input}
        onChange={setInput}
        loading={isSending || isCreating}
        onSubmit={(message) => {
          handleSendMessage(message)
          setInput('')
        }}
      />
    </div>
  )
}
