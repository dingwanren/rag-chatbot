'use client'

import { useState, useCallback } from 'react'
import { Bubble, Sender, type BubbleListProps } from '@ant-design/x'
import { Flex, Avatar, Typography } from 'antd'
import { UserOutlined, RobotOutlined, MessageOutlined } from '@ant-design/icons'
import { MarkdownContent } from '@/components/chat/MarkdownContent'

const { Title, Text } = Typography

export function ChatHome() {
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

  const handleSendMessage = useCallback((message: string) => {
    // TODO: 实现发送消息逻辑，创建新聊天并跳转 URL
    console.log('发送消息:', message)
  }, [])

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
        loading={isSending}
        onSubmit={(message) => {
          handleSendMessage(message)
          setInput('')
        }}
      />
    </div>
  )
}
