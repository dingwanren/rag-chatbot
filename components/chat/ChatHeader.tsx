'use client'

import { Typography, Tag } from 'antd'
import { BookOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface ChatHeaderProps {
  title: string
  mode?: 'chat' | 'rag'
  knowledgeBaseName?: string
}

export function ChatHeader({ title, mode, knowledgeBaseName }: ChatHeaderProps) {
  return (
    <div className="flex justify-between items-center p-3 border-b border-[#f0f0f0] bg-white">
      <div className="flex-1 min-w-0">
        <Title level={5} className="m-0 truncate">{title}</Title>
        {mode === 'rag' && knowledgeBaseName && (
          <div className="mt-1">
            <Tag icon={<BookOutlined />} color="blue" className="!m-0">
              📚 {knowledgeBaseName}
            </Tag>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {mode === 'rag' && (
          <Text type="secondary" className="text-xs">
            基于知识库问答
          </Text>
        )}
      </div>
    </div>
  )
}
