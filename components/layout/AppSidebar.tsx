'use client'

import { useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Conversations, type ConversationsProps } from '@ant-design/x'
import {
  DeleteOutlined,
  EditOutlined,
  DatabaseOutlined,
  PlusOutlined,
  MessageOutlined,
  FolderOutlined,
} from '@ant-design/icons'
import { message, Modal } from 'antd'
import { SidebarHeader } from './SidebarHeader'
import { SidebarFooter } from './SidebarFooter'
import { KnowledgeBase, Chat } from '@/types'

// Static mock data for MVP
const mockKnowledgeBases: KnowledgeBase[] = [
  {
    id: 'kb-1',
    name: '产品文档',
    description: '产品相关知识和资料',
    createdAt: new Date(),
    documentCount: 12,
  },
  {
    id: 'kb-2',
    name: '技术手册',
    description: '技术支持文档',
    createdAt: new Date(),
    documentCount: 8,
  },
  {
    id: 'kb-3',
    name: '常见问题',
    description: '客户常见问题集合',
    createdAt: new Date(),
    documentCount: 5,
  },
]

const mockChats: Chat[] = [
  {
    id: 'chat-1',
    title: '新产品咨询',
    createdAt: new Date(),
    mode: 'normal',
  },
  {
    id: 'chat-2',
    title: '功能使用指南',
    createdAt: new Date(),
    mode: 'normal',
  },
]

interface AppSidebarProps {
  className?: string
  collapsed?: boolean
}

export function AppSidebar({ className, collapsed = false }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [chats, setChats] = useState<Chat[]>(mockChats)
  const [editingKey, setEditingKey] = useState<string | null>(null)

  const handleNewChat = useCallback(() => {
    router.push('/')
  }, [router])

  const handleNavigateToKnowledge = useCallback(() => {
    router.push('/knowledge')
  }, [router])

  const handleDeleteChat = useCallback((key: string) => {
    Modal.confirm({
      title: '确认删除？',
      content: '删除后无法恢复',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        setChats(chats.filter(chat => chat.id !== key))
        message.success('已删除会话')
      },
    })
  }, [chats])

  const handleRenameChat = useCallback((key: string, currentTitle: string) => {
    setEditingKey(key)
    const newTitle = prompt('请输入新标题:', currentTitle)
    if (newTitle && newTitle.trim()) {
      setChats(prevChats => prevChats.map(chat =>
        chat.id === key ? { ...chat, title: newTitle } : chat
      ))
      message.success('已重命名会话')
    }
    setEditingKey(null)
  }, [])

  // 构建 Conversations items - 使用 onClick + router.push 替代 <a> 标签
  const items: ConversationsProps['items'] = [
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
  ]

  // 仅普通聊天有操作菜单
  const menuConfig: ConversationsProps['menu'] = (conversation) => {
    if (conversation.group === 'RAG 模式' || conversation.group === '知识管理') {
      return undefined
    }

    return {
      items: [
        {
          key: 'edit',
          label: '重命名',
          icon: <EditOutlined />,
          onClick: (info) => {
            info.domEvent.stopPropagation()
            const chat = chats.find(c => c.id === info.key)
            if (chat) {
              handleRenameChat(info.key, chat.title)
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
            handleDeleteChat(info.key)
          },
        },
      ],
    }
  }

  // 高亮当前选中的项目
  const selectedKey = pathname.includes('/knowledge')
    ? pathname.includes('/knowledge/') ? pathname.split('/').pop() : 'knowledge-manage'
    : pathname.includes('/chat/') ? pathname.split('/').pop() : undefined

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
