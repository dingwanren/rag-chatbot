'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Conversations, type ConversationsProps } from '@ant-design/x'
import type { MenuProps } from 'antd'
import {
  DeleteOutlined,
  EditOutlined,
  DatabaseOutlined,
  PlusOutlined,
  MessageOutlined,
  FolderOutlined,
} from '@ant-design/icons'
import { message, Modal, Input } from 'antd'
import { SidebarHeader } from './SidebarHeader'
import { SidebarFooter } from './SidebarFooter'
import type { KnowledgeBase, Chat } from '@/lib/supabase/types'
import { useChatList, useDeleteChat, useRenameChat } from '@/hooks/useChat'

// Static mock data for knowledge bases (TODO: 实现知识库 API)
const mockKnowledgeBases: KnowledgeBase[] = [
  {
    id: 'kb-1',
    name: '产品文档',
    description: '产品相关知识和资料',
    document_count: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: '',
  },
  {
    id: 'kb-2',
    name: '技术手册',
    description: '技术支持文档',
    document_count: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: '',
  },
  {
    id: 'kb-3',
    name: '常见问题',
    description: '客户常见问题集合',
    document_count: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: '',
  },
]

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
  const [editingKey, setEditingKey] = useState<string | null>(null)

  const handleNewChat = useCallback(() => {
    // 只跳转到首页，不创建聊天
    // 等用户发送消息时才创建聊天
    router.push('/')
  }, [router])

  const handleNavigateToKnowledge = useCallback(() => {
    router.push('/knowledge')
  }, [router])

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
        // 获取输入框的值
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

  // 构建 Conversations items
  const items: ConversationsProps['items'] = useMemo(() => [
    // 知识库管理入口
    {
      key: 'knowledge-manage',
      label: (
        <div
          onClick={handleNavigateToKnowledge}
          className="flex items-center w-full cursor-pointer"
        >
          <FolderOutlined style={{ marginRight: 8, fontSize: 16 }} />
          <span>知识库管理</span>
        </div>
      ),
      group: '知识管理',
    },
    // RAG 模式分组 - 知识库列表
    ...mockKnowledgeBases.map((kb) => ({
      key: `kb-${kb.id}`,
      label: (
        <div
          onClick={(e) => {
            e.preventDefault()
            router.push(`/knowledge/${kb.id}`)
          }}
          className="flex items-center w-full cursor-pointer"
        >
          <DatabaseOutlined style={{ marginRight: 8 }} />
          {kb.name}
        </div>
      ),
      group: 'RAG 模式',
    })),
    // 普通聊天分组
    ...chats.map((chat) => ({
      key: chat.id,
      label: (
        <div
          onClick={(e) => {
            e.preventDefault()
            router.push(`/chat/${chat.id}`)
          }}
          className="flex items-center w-full cursor-pointer"
        >
          <MessageOutlined style={{ marginRight: 8 }} />
          {chat.title}
        </div>
      ),
      group: '普通聊天',
    })),
  ], [chats, handleNavigateToKnowledge, router])

  // 仅普通聊天有操作菜单
  const menuConfig: ConversationsProps['menu'] = useCallback((conversation) => {
    if (conversation.group === 'RAG 模式' || conversation.group === '知识管理') {
      return undefined
    }

    // conversation.key 是聊天的 id
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
    if (pathname.includes('/knowledge')) {
      return pathname.includes('/knowledge/') ? pathname.split('/').pop() : 'knowledge-manage'
    }
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
        <Conversations
          items={items}
          activeKey={selectedKey}
          creation={{
            label: '新建对话',
            icon: <PlusOutlined />,
            onClick: handleNewChat,
          }}
          menu={menuConfig}
          groupable={{
            label: (group) => (
              <span className="text-xs font-medium text-sidebar-foreground px-2 py-1">
                {group}
              </span>
            ),
            collapsible: true,
          }}
          style={{ background: 'transparent' }}
        />
      </div>
      <SidebarFooter />
    </aside>
  )
}
