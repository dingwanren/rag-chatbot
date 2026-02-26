'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Bubble, Sender, type BubbleListProps } from '@ant-design/x'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Flex, Avatar, Spin, Tabs, Typography, Dropdown, message, Modal, Button } from 'antd'
import { UserOutlined, RobotOutlined, MoreOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { FileList } from './FileList'
import { UploadArea } from './UploadArea'
import { KBFile, Chat } from '@/types'

const { Title } = Typography

interface KnowledgeBasePageProps {
  knowledgeBaseId: string
  knowledgeBaseName: string
}

// Mock data
const mockFiles: KBFile[] = [
  {
    id: 'file-1',
    name: '产品手册.pdf',
    size: 1024 * 1024 * 2,
    type: 'application/pdf',
    knowledgeBaseId: 'kb-1',
    createdAt: new Date(),
  },
  {
    id: 'file-2',
    name: '技术文档.docx',
    size: 1024 * 500,
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    knowledgeBaseId: 'kb-1',
    createdAt: new Date(),
  },
]

const mockChats: Chat[] = [
  {
    id: 'chat-kb-1',
    title: '产品知识问答',
    createdAt: new Date(),
    mode: 'rag',
    knowledgeBaseId: 'kb-1',
  },
  {
    id: 'chat-kb-2',
    title: '文档内容咨询',
    createdAt: new Date(),
    mode: 'rag',
    knowledgeBaseId: 'kb-1',
  },
]

let id = 0
const getKey = () => `bubble_${id++}`

const subscribeToMounted = (onStoreChange: () => void) => {
  onStoreChange()
  return () => {}
}

export function KnowledgeBasePage({ knowledgeBaseId, knowledgeBaseName }: KnowledgeBasePageProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('chat')
  const [files, setFiles] = useState<KBFile[]>(mockFiles)
  const [chats, setChats] = useState<Chat[]>(mockChats)
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [input, setInput] = useState('')

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  })

  const isMounted = useState(true)[0]

  // Chat list operations
  const handleDeleteChat = useCallback((key: string) => {
    Modal.confirm({
      title: '确认删除？',
      content: '删除后无法恢复',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        setChats(prev => prev.filter(chat => chat.id !== key))
        if (selectedChat?.id === key) {
          setSelectedChat(null)
        }
        message.success('已删除会话')
      },
    })
  }, [selectedChat])

  const handleRenameChat = useCallback((key: string, currentTitle: string) => {
    const newTitle = prompt('请输入新标题:', currentTitle)
    if (newTitle && newTitle.trim()) {
      setChats(prev => prev.map(chat =>
        chat.id === key ? { ...chat, title: newTitle } : chat
      ))
      message.success('已重命名会话')
    }
  }, [])

  const chatMenuItems = useMemo(() => [
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
  ], [chats, handleRenameChat, handleDeleteChat])

  // File operations
  const handleDeleteFile = useCallback((key: string) => {
    Modal.confirm({
      title: '确认删除？',
      content: '删除后无法恢复',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        setFiles(prev => prev.filter(file => file.id !== key))
        message.success('已删除文件')
      },
    })
  }, [])

  const handleFileUpload = useCallback((uploadedFiles: File[]) => {
    const newFiles: KBFile[] = uploadedFiles.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      knowledgeBaseId,
      createdAt: new Date(),
    }))
    setFiles(prev => [...prev, ...newFiles])
    message.success(`已上传 ${uploadedFiles.length} 个文件`)
  }, [knowledgeBaseId])

  // Create new chat when sending message without selected chat
  const handleSendMessage = useCallback((messageText: string) => {
    if (!selectedChat) {
      // Create new chat and redirect
      const newChatId = `chat-${Date.now()}`
      const newChat: Chat = {
        id: newChatId,
        title: messageText.slice(0, 20) + (messageText.length > 20 ? '...' : ''),
        createdAt: new Date(),
        mode: 'rag',
        knowledgeBaseId,
      }
      setChats(prev => [newChat, ...prev])
      message.success('已创建新对话')
      // Redirect to chat detail page
      router.push(`/chat/${newChatId}`)
      return
    }
    sendMessage({ text: messageText })
  }, [selectedChat, sendMessage, knowledgeBaseId, router])

  const bubbleItems = useMemo(() => {
    return messages.map((message) => {
      const content = message.parts
        .map((part) => (part.type === 'text' ? part.text : ''))
        .join('')

      const role = message.role === 'user' ? 'user' : 'ai'

      return {
        key: message.id || getKey(),
        role,
        content,
        placement: role === 'user' ? ('end' as const) : ('start' as const),
      }
    })
  }, [messages])

  const isLoading = status === 'streaming' || status === 'submitted'

  const memoRole = useMemo<BubbleListProps['role']>(() => ({
    ai: {
      typing: true,
      avatar: () => <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />,
    },
    user: {
      placement: 'end',
      avatar: () => <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />,
    },
  }), [])

  const handleCreateNewChat = useCallback(() => {
    setSelectedChat(null)
    setInput('')
  }, [])

  const tabsItems = [
    {
      key: 'chat',
      label: '聊天',
      children: (
        <Flex vertical style={{ height: '100%' }}>
          {/* Chat list or Chat area */}
          {!selectedChat ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, padding: 16, overflowY: 'auto' }}>
              <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                <Title level={5} style={{ margin: 0 }}>聊天记录</Title>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="small"
                  onClick={handleCreateNewChat}
                >
                  新对话
                </Button>
              </Flex>
              {chats.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  <p>暂无聊天记录</p>
                  <p style={{ fontSize: 12 }}>点击下方输入框创建新对话</p>
                </div>
              ) : (
                chats.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span style={{ flex: 1 }}>{chat.title}</span>
                    <Dropdown
                      menu={{ items: chatMenuItems }}
                      trigger={['click']}
                    >
                      <MoreOutlined
                        onClick={(e) => e.stopPropagation()}
                        style={{ cursor: 'pointer', padding: 4 }}
                      />
                    </Dropdown>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              <div style={{ flex: 1, minHeight: 0 }}>
                <Bubble.List
                  role={memoRole}
                  items={bubbleItems}
                  style={{ height: '100%', overflowY: 'auto' }}
                  autoScroll
                />
              </div>
              <Sender
                placeholder="输入消息..."
                value={input}
                onChange={setInput}
                loading={isLoading}
                onSubmit={(message) => {
                  handleSendMessage(message)
                  setInput('')
                }}
              />
            </>
          )}
        </Flex>
      ),
    },
    {
      key: 'files',
      label: '文件',
      children: (
        <Flex vertical style={{ height: '100%' }}>
          <UploadArea onUpload={handleFileUpload} />
          <FileList
            files={files}
            onDelete={handleDeleteFile}
          />
        </Flex>
      ),
    },
  ]

  return (
    <Flex vertical style={{ height: '100vh' }}>
      <Flex
        justify="center"
        align="center"
        style={{ padding: '12px 24px', borderBottom: '1px solid #f0f0f0', background: '#fff' }}
      >
        <Title level={5} style={{ margin: 0 }}>{knowledgeBaseName}</Title>
      </Flex>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabsItems}
        style={{ flex: 1, overflow: 'hidden' }}
        tabBarStyle={{ margin: 0, padding: '0 16px' }}
      />
    </Flex>
  )
}
