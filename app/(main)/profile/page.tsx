'use client'

import { useEffect, useState } from 'react'
import { UserOutlined, MailOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { Card, Spin, Descriptions, Avatar, Button, Input, message } from 'antd'
import { getCurrentUser } from '@/app/actions/auth'
import { updateProfile } from '@/app/actions/updateProfile'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [inputUsername, setInputUsername] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const result = await getCurrentUser()
      if (result.success && result.user) {
        const savedUsername = result.profile?.username || ''
        setUsername(savedUsername)
        setInputUsername(savedUsername)
        setEmail(result.user.email || '')
      }
    } catch (error) {
      console.error('Failed to load user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setInputUsername(username)
    setEditing(true)
  }

  const handleCancel = () => {
    setInputUsername(username)
    setEditing(false)
  }

  const handleSave = async () => {
    if (!inputUsername.trim()) {
      message.error('用户名不能为空')
      return
    }

    setSaving(true)
    try {
      const result = await updateProfile(inputUsername)
      if (result.success) {
        setUsername(result.data!.username)
        setEditing(false)
        message.success('用户名已更新')
      } else {
        message.error(result.error || '更新失败')
      }
    } catch (error) {
      console.error('Update error:', error)
      message.error('更新失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 overflow-auto bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">个人资料</h1>

        <Card>
          <div className="flex items-center gap-4 mb-6">
            <Avatar
              icon={<UserOutlined />}
              size={64}
              style={{ backgroundColor: '#1890ff' }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-medium">
                  {username || '未设置用户名'}
                </h2>
                {!editing && (
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={handleEdit}
                    size="small"
                  />
                )}
              </div>
              {!username && (
                <p className="text-gray-500">点击编辑设置用户名</p>
              )}
            </div>
          </div>

          <Descriptions column={1} bordered>
            <Descriptions.Item label="用户名">
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={inputUsername}
                    onChange={(e) => setInputUsername(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="请输入用户名"
                    maxLength={20}
                    autoFocus
                    style={{ width: 200 }}
                  />
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={handleSave}
                    loading={saving}
                    size="small"
                    disabled={!inputUsername.trim()}
                  >
                    保存
                  </Button>
                  <Button
                    icon={<CloseOutlined />}
                    onClick={handleCancel}
                    size="small"
                    disabled={saving}
                  >
                    取消
                  </Button>
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  <UserOutlined />
                  {username || '未设置'}
                </span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="邮箱">
              <MailOutlined className="mr-2" />
              {email}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    </div>
  )
}
