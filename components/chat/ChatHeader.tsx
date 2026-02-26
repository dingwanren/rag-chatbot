'use client'

import { Flex, Typography, Space, Button, Dropdown } from 'antd'
import {
  ShareAltOutlined,
  SettingOutlined,
  EllipsisOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons'

const { Title } = Typography

interface ChatHeaderProps {
  title: string
}

export function ChatHeader({ title }: ChatHeaderProps) {
  const menuItems = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑标题',
    },
    {
      key: 'share',
      icon: <ShareAltOutlined />,
      label: '分享',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除对话',
      danger: true,
    },
  ]

  return (
    <Flex
      justify="space-between"
      align="center"
      style={{ padding: '12px 24px', borderBottom: '1px solid #f0f0f0', background: '#fff' }}
    >
      <Title level={5} style={{ margin: 0 }}>{title}</Title>
      <Space>
        <Button icon={<ShareAltOutlined />} size="small">
          分享
        </Button>
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button icon={<EllipsisOutlined />} size="small" />
        </Dropdown>
      </Space>
    </Flex>
  )
}
