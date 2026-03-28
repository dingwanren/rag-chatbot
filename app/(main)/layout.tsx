'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { CreateChatModal } from '@/components/chat/CreateChatModal'
import { useCreateChat } from '@/hooks/useChat'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { createChat, isPending: isCreating } = useCreateChat()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showModal, setShowModal] = useState(false)

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

  const handleCreateChat = async (data: { title: string; mode: 'chat' | 'rag'; knowledgeBaseId?: string }) => {
    try {
      const { id: chatId } = await createChat(data)
      setShowModal(false)
      router.push(`/chat/${chatId}`)
    } catch (error) {
      console.error('Create chat error:', error)
    }
  }

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => !prev)
  }

  return (
    <div className="flex h-screen">
      {/* Mobile header - only visible on small screens */}
      <MobileHeader
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
      />

      {/* Sidebar - hidden on mobile, controlled by collapse state */}
      <div className="hidden md:block">
        <AppSidebar collapsed={sidebarCollapsed} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarCollapsed === false && (
        <>
          {/* Mobile sidebar - slides in from left */}
          <div className="md:hidden fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setSidebarCollapsed(true)}
            />
            <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
              <AppSidebar />
            </div>
          </div>
        </>
      )}

      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">
        {children}
      </main>

      {/* 创建聊天弹窗（全局可用） */}
      <CreateChatModal
        open={showModal}
        onCreate={handleCreateChat}
        onCancel={() => setShowModal(false)}
      />
    </div>
  )
}
