'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Bubble, Sender, type BubbleListProps } from '@ant-design/x'
import { Flex, Avatar, Spin, message } from 'antd'
import { UserOutlined, RobotOutlined } from '@ant-design/icons'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { MarkdownContent } from '@/components/chat/MarkdownContent'
import { UsageIndicator } from '@/components/chat/UsageIndicator'
import { useMessages, useSendMessage } from '@/hooks/useChat'
import { getChat } from '@/app/actions/chat'
import { getKnowledgeBase } from '@/app/actions/knowledge-base'
import type { Chat as ChatType } from '@/types'

interface ChatDetailPageProps {
  params: Promise<{ id: string }>
}

let id = 0
const getKey = () => `bubble_${id++}`

export default function ChatDetailPage({ params }: ChatDetailPageProps) {
  const router = useRouter()
  const [chatId, setChatId] = useState<string | null>(null)
  const [chatInfo, setChatInfo] = useState<ChatType | null>(null)
  const [knowledgeBaseName, setKnowledgeBaseName] = useState<string | undefined>()
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [hasSentPending, setHasSentPending] = useState(false)
  const [loadingChat, setLoadingChat] = useState(true)

  const { messages: dbMessages, isLoading: isLoadingMessages } = useMessages(chatId)
  const { sendMessage: sendStreamingMessage, isPending } = useSendMessage()

  // 解析 params 并加载聊天信息
  useEffect(() => {
    params.then(async ({ id }) => {
      setChatId(id)

      try {
        const chat = await getChat(id)
        setChatInfo(chat)

        // 如果是 RAG 聊天，加载知识库名称
        if (chat.mode === 'rag' && chat.knowledge_base_id) {
          const { data: kb } = await getKnowledgeBase(chat.knowledge_base_id)
          if (kb) {
            setKnowledgeBaseName(kb.name)
          }
        }
      } catch (error) {
        console.error('Load chat error:', error)
        message.error('加载聊天信息失败')
      } finally {
        setLoadingChat(false)
      }

      // 检查是否有待发送的消息
      const stored = sessionStorage.getItem(`chat-${id}-pending`)
      if (stored && !hasSentPending) {
        setPendingMessage(stored)
        sessionStorage.removeItem(`chat-${id}-pending`)
      }
    })
  }, [params, hasSentPending])

  // 自动发送待处理消息
  useEffect(() => {
    if (pendingMessage && chatId && !hasSentPending && !loadingChat) {
      setHasSentPending(true)

      sendStreamingMessage({ chatId, content: pendingMessage })
        .catch((error) => {
          console.error('Auto-send message error:', error)
        })
        .finally(() => {
          setPendingMessage(null)
        })
    }
  }, [pendingMessage, chatId, hasSentPending, sendStreamingMessage, loadingChat])

  const isMounted = chatId !== null && !loadingChat

  // 转换数据库消息为 Bubble.List 格式
  const bubbleItems = useMemo(() => {
    return (dbMessages ?? []).map((message) => {
      const role = message.role === 'user' ? 'user' : 'ai'
      return {
        key: message.id || getKey(),
        role,
        content: message.content,
        placement: role === 'user' ? ('end' as const) : ('start' as const),
      }
    })
  }, [dbMessages])

  const isLoading = isPending || isLoadingMessages || !isMounted

  const memoRole = useMemo<BubbleListProps['role']>(() => ({
    ai: {
      typing: true,
      avatar: () => <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />,
      contentRender: (content) => <MarkdownContent content={content} streaming={isLoading} />,
    },
    user: {
      placement: 'end',
      avatar: () => <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />,
    },
  }), [isLoading])

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!chatId) return
    if (!messageText.trim()) return

    // 如果是 RAG 聊天但没有知识库，禁止发送
    if (chatInfo?.mode === 'rag' && !chatInfo.knowledge_base_id) {
      message.error('该聊天未绑定知识库，无法发送消息')
      return
    }

    try {
      await sendStreamingMessage({ chatId, content: messageText })
    } catch (error: any) {
      // Hook 内部已处理日志，这里只负责 UI 提示
      
      // 限额超限 - 显示详细友好的提示
      if (error.code === 'QUOTA_EXCEEDED') {
        const details = error.details
        let description = '您的今日请求次数或 token 额度已用完'
        
        if (details) {
          description = `当前使用：${details.current}/${details.limit}，将于 ${details.resetTime} 自动恢复`
        }
        
        message.open({
          type: 'warning',
          content: '今日额度已用完',
          description: (
            <div>
              <p className="mb-2">{error.message || description}</p>
              {details && (
                <div className="text-xs text-gray-600">
                  <p>💡 提示：</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>额度将于明日 0 点自动恢复</li>
                    <li>当前账户等级：<strong>{details.plan}</strong></li>
                    <li>超限类型：{details.type === 'requests' ? '请求次数' : 'Token 数量'}</li>
                  </ul>
                </div>
              )}
              <p className="mt-2 text-sm font-medium">
                需要更多额度？请联系管理员升级账户计划
              </p>
            </div>
          ),
          duration: 8,
        })
        return
      }
      
      // 未授权 - 跳转登录
      if (error.code === 'UNAUTHORIZED' || error.status === 401) {
        message.open({
          type: 'error',
          content: '请先登录',
          description: '您需要先登录才能发送消息',
          duration: 3,
        })
        setTimeout(() => {
          router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
        }, 1000)
        return
      }
      
      // 其他错误 - 简单提示
      message.error(error.message || '发送消息失败，请稍后重试')
    }
  }, [chatId, chatInfo, sendStreamingMessage, router])

  if (!isMounted) {
    return (
      <div className="flex flex-col h-full">
        <ChatHeader title="加载中..." />
        <div className="flex-1 flex justify-center items-center">
          <Spin size="large" description="加载中..." />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        title={chatInfo?.title || '新对话'}
        mode={chatInfo?.mode}
        knowledgeBaseName={knowledgeBaseName}
      />
      <div className="flex flex-1 min-h-0">
        <Bubble.List
          role={memoRole}
          items={bubbleItems}
          className="flex-1 overflow-y-auto"
          autoScroll
        />
      </div>
      {/* 限额使用情况显示 */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
        <UsageIndicator />
      </div>
      <Sender
        placeholder={chatInfo?.mode === 'rag' ? '输入问题，基于知识库获取答案...' : '输入消息...'}
        value={input}
        onChange={setInput}
        loading={isLoading}
        onSubmit={(messageText) => {
          handleSendMessage(messageText)
          setInput('')
        }}
      />
    </div>
  )
}
