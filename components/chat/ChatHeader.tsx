'use client'

import { Flex, Typography } from 'antd'

const { Title } = Typography

interface ChatHeaderProps {
  title: string
}

export function ChatHeader({ title }: ChatHeaderProps) {
  return (
    <Flex
      justify="center"
      align="center"
      style={{ padding: '12px 24px', borderBottom: '1px solid #f0f0f0', background: '#fff' }}
    >
      <Title level={5} style={{ margin: 0 }}>{title}</Title>
    </Flex>
  )
}
