'use client'

import { Flex, Typography, Dropdown, message, Modal } from 'antd'
import { FileTextOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons'
import { KBFile } from '@/types'

const { Text } = Typography

interface FileListProps {
  files: KBFile[]
  onDelete?: (fileId: string) => void
}

export function FileList({ files, onDelete }: FileListProps) {
  const handleDelete = (fileId: string, fileName: string) => {
    Modal.confirm({
      title: '确认删除？',
      content: `确定要删除文件 "${fileName}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        onDelete?.(fileId)
        message.success('已删除文件')
      },
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const menuItems = files.map(file => ({
    key: file.id,
    label: '删除',
    icon: <DeleteOutlined />,
    danger: true,
    onClick: ({ domEvent }: { domEvent: React.MouseEvent }) => {
      domEvent.stopPropagation()
      handleDelete(file.id, file.name)
    },
  }))

  if (files.length === 0) {
    return (
      <Flex
        justify="center"
        align="center"
        style={{ flex: 1, padding: 40, color: '#999' }}
      >
        <div style={{ textAlign: 'center' }}>
          <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <p>暂无文件</p>
          <p style={{ fontSize: 12 }}>在上方上传文件</p>
        </div>
      </Flex>
    )
  }

  return (
    <div style={{ padding: 16, overflowY: 'auto' }}>
      {files.map((file) => (
        <div
          key={file.id}
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            transition: 'background-color 0.2s',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <FileTextOutlined style={{ fontSize: 20, color: '#1890ff' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ display: 'block', marginBottom: 4 }}>{file.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatFileSize(file.size)}
            </Text>
          </div>
          <Dropdown menu={{ items: [{
            key: 'delete',
            label: '删除',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: ({ domEvent }: { domEvent: React.MouseEvent }) => {
              domEvent.stopPropagation()
              handleDelete(file.id, file.name)
            },
          }] }} trigger={['click']}>
            <MoreOutlined
              onClick={(e) => e.stopPropagation()}
              style={{ cursor: 'pointer', padding: 4 }}
            />
          </Dropdown>
        </div>
      ))}
    </div>
  )
}
