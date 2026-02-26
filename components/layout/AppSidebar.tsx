'use client'

import { useState } from 'react'
import { Conversations } from '@ant-design/x'
import { DeleteOutlined, EditOutlined, MoreOutlined, DatabaseOutlined, PlusOutlined } from '@ant-design/icons'
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
  },
]

const mockChats: Chat[] = [
  {
    id: 'chat-1',
    title: '新产品咨询',
    createdAt: new Date(),
    mode: 'rag',
    knowledgeBaseId: 'kb-1',
  },
  {
    id: 'chat-2',
    title: '技术支持对话',
    createdAt: new Date(),
    mode: 'normal',
  },
  {
    id: 'chat-3',
    title: '功能使用指南',
    createdAt: new Date(),
    mode: 'rag',
    knowledgeBaseId: 'kb-1',
  },
]

interface AppSidebarProps {
  className?: string
}

export function AppSidebar({ className }: AppSidebarProps) {
  const [hasKnowledgeBase, setHasKnowledgeBase] = useState(true)
  const [chats, setChats] = useState<Chat[]>(mockChats)
  const [editingKey, setEditingKey] = useState<string | null>(null)

  const handleNewChat = () => {
    console.log('Create new chat')
    message.success('新建对话')
  }

  const handleDeleteChat = (key: string) => {
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
  }

  const handleRenameChat = (key: string, currentTitle: string) => {
    setEditingKey(key)
    // 实际项目中这里应该弹出一个输入框让用户输入新名称
    const newTitle = prompt('请输入新标题:', currentTitle)
    if (newTitle && newTitle.trim()) {
      setChats(chats.map(chat => 
        chat.id === key ? { ...chat, title: newTitle } : chat
      ))
      message.success('已重命名会话')
    }
    setEditingKey(null)
  }

  // 构建 Conversations items
  const items = [
    // 知识库分组
    {
      type: 'divider' as const,
    },
    ...mockKnowledgeBases.map((kb) => ({
      key: kb.id,
      label: (
        <a href={`/knowledge/${kb.id}`} className="block w-full">
          {kb.name}
        </a>
      ),
      group: '知识库',
    })),
    // 聊天分组
    {
      type: 'divider' as const,
    },
    ...chats.map((chat) => ({
      key: chat.id,
      label: (
        <a href={`/chat/${chat.id}`} className="block w-full">
          {chat.title}
        </a>
      ),
      group: chat.mode === 'rag' ? 'RAG 模式' : '普通模式',
    })),
  ]

  // 会话操作菜单
  const menu = {
    items: [
      {
        key: 'edit',
        label: '重命名',
        icon: <EditOutlined />,
        onClick: ({ domEvent, key }: { domEvent: React.MouseEvent; key: string }) => {
          domEvent.stopPropagation()
          const chat = chats.find(c => c.id === key)
          if (chat) {
            handleRenameChat(key, chat.title)
          }
        },
      },
      {
        key: 'delete',
        label: '删除',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: ({ domEvent, key }: { domEvent: React.MouseEvent; key: string }) => {
          domEvent.stopPropagation()
          handleDeleteChat(key)
        },
      },
    ],
  }

  return (
    <aside
      className={`flex flex-col h-full bg-sidebar border-r border-sidebar-border ${className || ''}`}
    >
      <SidebarHeader />
      <div className="flex-1 overflow-y-auto p-2">
        <Conversations
          items={items}
          creation={{
            label: '新建对话',
            icon: <PlusOutlined />,
            onClick: handleNewChat,
          }}
          menu={menu}
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
