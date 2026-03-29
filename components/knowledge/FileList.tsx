'use client'

import { Flex, Typography, Dropdown, message, Modal, Tag } from 'antd'
import { FileTextOutlined, DeleteOutlined, MoreOutlined, SyncOutlined } from '@ant-design/icons'
import type { KnowledgeFile, FileStatus } from '@/types'

const { Text } = Typography

interface FileListProps {
  files: KnowledgeFile[]
  onDelete?: (fileId: string) => void
  onRetry?: (fileId: string) => void
}

const statusConfig: Record<FileStatus, { color: string; icon: React.ReactNode; text: string }> = {
  pending: {
    color: 'blue',
    icon: <SyncOutlined spin />,
    text: '等待中',
  },
  processing: {
    color: 'blue',
    icon: <SyncOutlined spin />,
    text: '处理中',
  },
  completed: {
    color: 'green',
    icon: <FileTextOutlined />,
    text: '已完成',
  },
  failed: {
    color: 'red',
    icon: <SyncOutlined />,
    text: '失败',
  },
}

export function FileList({ files, onDelete, onRetry }: FileListProps) {
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

  const handleRetry = (fileId: string) => {
    onRetry?.(fileId)
    message.loading({ content: '重新解析中...', key: 'retry', duration: 1.5 })
    setTimeout(() => {
      message.success({ content: '已重新提交解析', key: 'retry', duration: 2 })
    }, 1500)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

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
      {files.map((file) => {
        const status = (file.status as FileStatus) || 'pending'
        const config = statusConfig[status]

        return (
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
              <Text style={{ display: 'block', marginBottom: 4 }}>{file.file_name}</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {formatFileSize(file.file_size)}
                </Text>
                <Tag icon={config.icon} color={config.color} style={{ margin: 0, fontSize: 12 }}>
                  {config.text}
                </Tag>
              </div>
            </div>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'retry',
                    label: '重试',
                    icon: <SyncOutlined />,
                    onClick: (info) => {
                      info.domEvent.stopPropagation()
                      handleRetry(file.id)
                    },
                    disabled: file.status !== 'failed',
                  },
                  {
                    key: 'delete',
                    label: '删除',
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: (info) => {
                      info.domEvent.stopPropagation()
                      handleDelete(file.id, file.file_name)
                    },
                  },
                ],
              }}
              trigger={['click']}
            >
              <MoreOutlined
                onClick={(e) => e.stopPropagation()}
                style={{ cursor: 'pointer', padding: 4 }}
              />
            </Dropdown>
          </div>
        )
      })}
    </div>
  )
}
