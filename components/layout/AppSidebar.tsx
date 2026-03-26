'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Conversations, type ConversationsProps } from '@ant-design/x'
import type { MenuProps } from 'antd'
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  MessageOutlined,
  DatabaseOutlined,
} from '@ant-design/icons'
import { message, Modal, Input } from 'antd'
import { SidebarHeader } from './SidebarHeader'
import { SidebarFooter } from './SidebarFooter'
import type { Chat } from '@/lib/supabase/types'
import { useChatList, useDeleteChat, useRenameChat } from '@/hooks/useChat'

interface AppSidebarProps {
  className?: string
  collapsed?: boolean
}

export function AppSidebar({ className, collapsed = false }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { chats, isLoading: isLoadingChats } = useChatList()
  const { deleteChat, isPending: isDeleting } = useDeleteChat()
  const { renameChat, isPending: isRenaming } = useRenameChat()

  const handleNewChat = useCallback(() => {
    // 触发全局事件，打开创建聊天 Modal
    window.dispatchEvent(new CustomEvent('openCreateChatModal'))
  }, [])

  const handleDeleteChat = useCallback((key: string) => {
    Modal.confirm({
      title: '确认删除？',
      content: '删除后无法恢复，确定要删除这个对话吗？',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteChat(key)
          message.success('已删除会话')
          // 如果当前正在查看这个聊天，跳转到首页
          if (pathname === `/chat/${key}`) {
            router.push('/')
          }
        } catch (error) {
          console.error('Delete chat error:', error)
          message.error('删除失败')
        }
      },
    })
  }, [deleteChat, pathname, router])

  const handleRenameChat = useCallback(async (key: string, currentTitle: string) => {
    Modal.confirm({
      title: '重命名对话',
      content: (
        <Input
          defaultValue={currentTitle}
          placeholder="请输入新标题"
          onPressEnter={(e) => {
            const newTitle = e.currentTarget.value.trim()
            if (newTitle) {
              Modal.destroyAll()
              submitRename(key, newTitle)
            }
          }}
          autoFocus
        />
      ),
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        const input = document.querySelector('.ant-modal input') as HTMLInputElement
        const newTitle = input?.value.trim()
        if (newTitle) {
          submitRename(key, newTitle)
        }
      },
    })
  }, [])

  const submitRename = async (key: string, newTitle: string) => {
    try {
      await renameChat({ chatId: key, title: newTitle })
      message.success('已重命名会话')
    } catch (error) {
      console.error('Rename chat error:', error)
      message.error('重命名失败')
    }
  }

  // 构建 Conversations items - 只显示聊天列表
  const items: ConversationsProps['items'] = useMemo(() => {
    return chats.map((chat) => ({
      key: chat.id,
      label: (
        <div
          onClick={(e) => {
            e.preventDefault()
            router.push(`/chat/${chat.id}`)
          }}
          className="flex items-center w-full cursor-pointer"
        >
          {chat.mode === 'rag' ? (
            <DatabaseOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          ) : (
            <MessageOutlined style={{ marginRight: 8 }} />
          )}
          <span className="flex-1 truncate">{chat.title}</span>
          {chat.mode === 'rag' && (
            <span className="text-xs text-muted-foreground ml-1" title="知识库聊天">
              📚
            </span>
          )}
        </div>
      ),
    }))
  }, [chats, router])

  // 菜单配置 - 只有聊天有操作菜单
  const menuConfig: ConversationsProps['menu'] = useCallback((conversation) => {
    const chatId = conversation.key as string

    const menuItems: MenuProps['items'] = [
      {
        key: 'edit',
        label: '重命名',
        icon: <EditOutlined />,
        onClick: (info) => {
          info.domEvent.stopPropagation()
          const chat = chats.find(c => c.id === chatId)
          if (chat) {
            handleRenameChat(chatId, chat.title)
          }
        },
      },
      {
        key: 'delete',
        label: '删除',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: (info) => {
          info.domEvent.stopPropagation()
          handleDeleteChat(chatId)
        },
      },
    ]

    return { items: menuItems }
  }, [chats, handleRenameChat, handleDeleteChat])

  // 高亮当前选中的项目
  const selectedKey = useMemo(() => {
    if (pathname.includes('/chat/')) {
      return pathname.split('/').pop()
    }
    return undefined
  }, [pathname])

  return (
    <aside
      className={`flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
        collapsed ? 'w-0 overflow-hidden' : 'w-72'
      } ${className || ''}`}
    >
      <SidebarHeader />
      <div className="flex-1 overflow-y-auto p-2">
        {isLoadingChats ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            加载中...
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <MessageOutlined className="text-4xl mb-2 block" />
            <p>暂无对话</p>
            <p className="text-xs mt-1">点击"新建对话"开始聊天</p>
          </div>
        ) : (
          <Conversations
            items={items}
            activeKey={selectedKey}
            creation={{
              label: '新建对话',
              icon: <PlusOutlined />,
              onClick: handleNewChat,
            }}
            menu={menuConfig}
            style={{ background: 'transparent' }}
          />
        )}
      </div>
      <SidebarFooter />
    </aside>
  )
}
