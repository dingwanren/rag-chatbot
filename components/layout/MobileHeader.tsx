'use client'

import { MenuFoldOutlined, MenuUnfoldOutlined, LeftOutlined } from '@ant-design/icons'
import { Button, Typography } from 'antd'

const { Title } = Typography

interface MobileHeaderProps {
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  onBack?: () => void
  title?: string
  showBack?: boolean
}

export function MobileHeader({
  sidebarCollapsed,
  onToggleSidebar,
  onBack,
  title = 'RAG Chatbot',
  showBack = false,
}: MobileHeaderProps) {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-3">
        {showBack && onBack ? (
          <Button
            type="text"
            icon={<LeftOutlined />}
            onClick={onBack}
            size="small"
            className="!p-2"
          />
        ) : (
          <Button
            type="text"
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onToggleSidebar}
            size="small"
            className="!p-2"
          />
        )}
        <Title level={5} className="!mb-0 !text-base font-medium truncate">
          {title}
        </Title>
      </div>
    </header>
  )
}
