'use client'

import { MessageOutlined } from '@ant-design/icons'
import { Typography } from 'antd'

const { Title, Text } = Typography

export default function ChatPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <MessageOutlined className="w-16 h-16 mx-auto text-muted-foreground" style={{ fontSize: '64px' }} />
        <Title level={2}>欢迎使用 RAG Chatbot</Title>
        <Text type="secondary" className="block max-w-md">
          开始一个新的对话，或者从侧边栏选择已有的聊天记录
        </Text>
      </div>
    </div>
  )
}
