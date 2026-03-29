'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { UserOutlined, FolderOutlined, LogoutOutlined, UsergroupAddOutlined, SettingOutlined } from '@ant-design/icons'
import { Button, Avatar, Dropdown, Spin } from 'antd'
import type { MenuProps } from 'antd'
import { getCurrentUser, logout } from '@/app/actions/auth'

export function SidebarFooter() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')
  const [username, setUsername] = useState<string>('')

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const result = await getCurrentUser()
      if (result.success && result.user) {
        setUserEmail(result.user.email || '')
        setUsername(result.profile?.plan || '')
      }
    } catch (error) {
      console.error('Failed to load user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMenuClick: MenuProps['onClick'] = async ({ key }) => {
    if (key === 'profile') {
      router.push('/profile')
    } else if (key === 'settings') {
      router.push('/settings')
    } else if (key === 'logout') {
      await handleLogout()
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const menuItems: MenuProps['items'] = [
    { 
      key: 'profile', 
      label: '个人资料',
      icon: <UsergroupAddOutlined />
    },
    { 
      key: 'settings', 
      label: '设置',
      icon: <SettingOutlined />
    },
    { type: 'divider' },
    { 
      key: 'logout', 
      label: '退出登录',
      icon: <LogoutOutlined />,
      danger: true,
    },
  ]

  return (
    <div className="flex flex-col border-t border-sidebar-border">
      {/* 知识库管理按钮 */}
      <div className="p-2">
        <Button
          type="text"
          className="w-full justify-start text-sidebar-foreground"
          icon={<FolderOutlined />}
          onClick={() => router.push('/knowledge-bases')}
        >
          知识库管理
        </Button>
      </div>

      {/* 用户菜单 */}
      <div className="flex items-center gap-2 px-4 py-3">
        {loading ? (
          <Spin size="small" />
        ) : (
          <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} trigger={['click']}>
            <button className="flex items-center gap-2 hover:bg-sidebar-accent rounded-md p-2 transition-colors flex-1">
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <div className="text-sm text-left truncate flex-1">
                <p className="font-medium text-sidebar-foreground truncate">
                  {username || '用户'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{userEmail || '加载中...'}</p>
              </div>
            </button>
          </Dropdown>
        )}
      </div>
    </div>
  )
}
