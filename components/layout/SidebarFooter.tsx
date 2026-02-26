'use client'

import { SettingOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Avatar, Dropdown } from 'antd'

export function SidebarFooter() {
  const menuItems = [
    { key: 'profile', label: '个人资料' },
    { key: 'settings', label: '设置' },
    { type: 'divider' as const },
    { key: 'logout', label: '退出登录' },
  ]

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-sidebar-border mt-auto">
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        <button className="flex items-center gap-2 hover:bg-sidebar-accent rounded-md p-2 transition-colors">
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div className="text-sm text-left">
            <p className="font-medium text-sidebar-foreground">用户</p>
            <p className="text-xs text-muted-foreground">user@example.com</p>
          </div>
        </button>
      </Dropdown>
      <Button type="text" icon={<SettingOutlined />} className="text-sidebar-foreground" />
    </div>
  )
}
