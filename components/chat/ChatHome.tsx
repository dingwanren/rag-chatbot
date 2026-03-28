'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Flex, Avatar, Typography, Button } from 'antd'
import { MessageOutlined, PlusOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export function ChatHome() {
  const router = useRouter()

  const handleCreateChat = useCallback(async () => {
    // 触发全局事件，打开创建聊天 Modal
    window.dispatchEvent(new CustomEvent('openCreateChatModal'))
  }, [])

  return (
    <div className="flex flex-col h-full items-center justify-center p-8">
      {/* 空状态提示 */}
      <div className="text-center space-y-6 max-w-lg">
        <div className="w-24 h-24 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
          <MessageOutlined className="text-blue-500" style={{ fontSize: '48px' }} />
        </div>

        <div className="space-y-2">
          <Title level={2} className="!mb-2">欢迎使用 RAG Chatbot</Title>
          <Text type="secondary" className="text-base block">
            创建一个新对话，开始与 AI 交流
          </Text>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleCreateChat}
          className="mt-4"
        >
          新建对话
        </Button>
      </div>
    </div>
  )
}
