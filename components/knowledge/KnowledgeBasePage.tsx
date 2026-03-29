'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bubble, Sender, type BubbleListProps } from '@ant-design/x'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { MenuProps } from 'antd'
import { Flex, Avatar, Spin, Tabs, Typography, Dropdown, message, Modal, Button } from 'antd'
import { UserOutlined, RobotOutlined, MoreOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { FileList } from '@/app/components/file-list'
import { UploadArea } from './UploadArea'
import { Chat, KnowledgeFile } from '@/types'
import { MarkdownContent } from '../chat/MarkdownContent'
import { getFiles } from '@/app/actions/knowledge-file'

const { Title } = Typography

interface KnowledgeBasePageProps {
  knowledgeBaseId: string
  knowledgeBaseName: string
}

let id = 0
const getKey = () => `bubble_${id++}`

const subscribeToMounted = (onStoreChange: () => void) => {
  onStoreChange()
  return () => {}
}

export function KnowledgeBasePage({ knowledgeBaseId, knowledgeBaseName }: KnowledgeBasePageProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('chat')
  const [files, setFiles] = useState<KnowledgeFile[]>([])
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [input, setInput] = useState('')
  const [loadingFiles, setLoadingFiles] = useState(true)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  })

  const isMounted = useState(true)[0]

  // Load files from server
  useEffect(() => {
    loadFiles()
  }, [knowledgeBaseId])

  const loadFiles = async () => {
    setLoadingFiles(true)
    try {
      const { data, error } = await getFiles(knowledgeBaseId)
      if (error) {
        message.error(error.message)
      } else {
        setFiles(data ?? [])
      }
    } catch (e) {
      message.error('加载文件列表失败')
    } finally {
      setLoadingFiles(false)
    }
  }

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

  const chatMenuItems = useMemo<MenuProps['items']>(() => [
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
  ], [chats, handleRenameChat, handleDeleteChat])

  // File operations
  const handleDeleteFile = useCallback((key: string) => {
    Modal.confirm({
      title: '确认删除？',
      content: '删除后无法恢复',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        const { success, error } = await import('@/app/actions/knowledge-file').then(m => m.deleteKnowledgeFile(key))
        if (error) {
          message.error(error.message)
        } else {
          await loadFiles()
          message.success('已删除文件')
        }
      },
    })
  }, [])

  const handleFileUpload = useCallback(async (uploadedFiles: File[]) => {
    const { uploadKnowledgeFile } = await import('@/app/actions/knowledge-file')
    
    let successCount = 0
    for (const file of uploadedFiles) {
      const { data, error } = await uploadKnowledgeFile(knowledgeBaseId, file)
      if (!error) {
        successCount++
      }
    }
    
    if (successCount > 0) {
      await loadFiles()
      message.success(`已上传 ${successCount} 个文件`)
    } else {
      message.error('上传失败')
    }
  }, [knowledgeBaseId])

  // Create new chat when sending message without selected chat
  const handleSendMessage = useCallback((messageText: string) => {
    if (!selectedChat) {
      // Create new chat and redirect
      const newChatId = `chat-${Date.now()}`
      const newChat: Chat = {
        id: newChatId,
        title: messageText.slice(0, 20) + (messageText.length > 20 ? '...' : ''),
        created_at: new Date().toISOString(),
        mode: 'rag',
        knowledge_base_id: knowledgeBaseId,
        user_id: '',
        last_message: null,
        last_message_at: null,
        updated_at: new Date().toISOString(),
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
      contentRender: (content) => (
        <MarkdownContent content={content} streaming={isLoading} />
      ),
    },
    user: {
      placement: 'end',
      avatar: () => <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />,
    },
  }), [isLoading])

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
          {loadingFiles ? (
            <div className="flex items-center justify-center py-12">
              <Spin />
            </div>
          ) : (
            <FileList
              files={files}
              knowledgeBaseId={knowledgeBaseId}
              onFileDeleted={loadFiles}
            />
          )}
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
