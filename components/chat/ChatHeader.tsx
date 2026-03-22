'use client'

import { Typography } from 'antd'

const { Title } = Typography

interface ChatHeaderProps {
  title: string
}

export function ChatHeader({ title }: ChatHeaderProps) {
  return (
    <div className="flex justify-center items-center p-3 border-b border-[#f0f0f0] bg-white">
      <Title level={5} className="m-0">{title}</Title>
    </div>
  )
}
