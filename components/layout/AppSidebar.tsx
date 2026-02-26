'use client'

import { useState } from 'react'
import { Conversations, type ConversationsProps } from '@ant-design/x'
import { DeleteOutlined, EditOutlined, DatabaseOutlined, PlusOutlined } from '@ant-design/icons'
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
  {
    id: 'kb-2',
    name: '技术手册',
    description: '技术支持文档',
    createdAt: new Date(),
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
}

export function AppSidebar({ className }: AppSidebarProps) {
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
    // RAG 模式分组 - 知识库列表
    ...mockKnowledgeBases.map((kb) => ({
      key: `kb-${kb.id}`,
      label: (
        <a href={`/knowledge/${kb.id}`} className="block w-full">
          <DatabaseOutlined style={{ marginRight: 8 }} />
          {kb.name}
        </a>
      ),
      group: 'RAG 模式',
    })),
    // 普通聊天分组
    ...chats.map((chat) => ({
      key: chat.id,
      label: (
        <a href={`/chat/${chat.id}`} className="block w-full">
          {chat.title}
        </a>
      ),
      group: '普通聊天',
    })),
  ]

  // 仅普通聊天有操作菜单，根据 group 字段判断
  const menuConfig: ConversationsProps['menu'] = (conversation) => {
    // RAG 模式分组不显示操作菜单
    if (conversation.group === 'RAG 模式') {
      return undefined;
    }

    // 普通聊天分组显示操作菜单
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
    };
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
