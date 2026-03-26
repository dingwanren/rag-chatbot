'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flex, Avatar, Typography, Button, Spin } from 'antd'
import { MessageOutlined, PlusOutlined } from '@ant-design/icons'
import { CreateChatModal } from '@/components/chat/CreateChatModal'
import { useCreateChat } from '@/hooks/useChat'

const { Title, Text } = Typography

export function ChatHome() {
  const router = useRouter()
  const { createChat, isPending: isCreating } = useCreateChat()
  const [showModal, setShowModal] = useState(false)

  const handleCreateChat = useCallback(async (data: { title: string; mode: 'chat' | 'rag'; knowledgeBaseId?: string }) => {
    try {
      const { id: chatId } = await createChat(data)
      setShowModal(false)
      router.push(`/chat/${chatId}`)
    } catch (error) {
      console.error('Create chat error:', error)
    }
  }, [createChat, router])

  const handleCancelModal = useCallback(() => {
    setShowModal(false)
  }, [])

  // 监听全局事件（从侧边栏触发）
  useEffect(() => {
    const handleOpenModal = () => {
      setShowModal(true)
    }

    window.addEventListener('openCreateChatModal', handleOpenModal)
    return () => {
      window.removeEventListener('openCreateChatModal', handleOpenModal)
    }
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
          onClick={() => setShowModal(true)}
          disabled={isCreating}
          className="mt-4"
          loading={isCreating}
        >
          新建对话
        </Button>
      </div>

      {/* 创建聊天弹窗 */}
      <CreateChatModal
        open={showModal}
        onCreate={handleCreateChat}
        onCancel={handleCancelModal}
      />
    </div>
  )
}
