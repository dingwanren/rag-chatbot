'use client'

import { useState } from 'react'
import { Card, Tag, Button, Space, Typography, Collapse } from 'antd'
import {
  InboxOutlined,
  DeleteOutlined,
  SyncOutlined,
  RightOutlined,
  DownOutlined,
} from '@ant-design/icons'
import { KBFile, FileParseStatus } from '@/types'

const { Title, Text } = Typography

const statusConfig: Record<FileParseStatus, { color: string; icon: React.ReactNode; text: string }> = {
  parsing: {
    color: 'blue',
    icon: <SyncOutlined spin />,
    text: '解析中',
  },
  success: {
    color: 'green',
    icon: null,
    text: '成功',
  },
  failed: {
    color: 'red',
    icon: null,
    text: '失败',
  },
}

interface FileCardProps {
  file: KBFile
  onDelete?: () => void
  onRetry?: () => void
}

export function FileCard({ file, onDelete, onRetry }: FileCardProps) {
  const [expanded, setExpanded] = useState(false)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const status = file.status || 'parsing'
  const config = statusConfig[status]

  return (
    <Card
      className="shadow-sm hover:shadow-md transition-shadow"
      size="small"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
          <InboxOutlined className="text-blue-500 text-lg" />
        </div>

        <div className="flex-1 min-w-0">
          <Title level={5} className="!mb-1 !text-sm truncate">
            {file.name}
          </Title>
          <div className="flex items-center gap-2">
            <Text type="secondary" className="text-xs">
              {formatFileSize(file.size)}
            </Text>
            <Tag icon={config.icon} color={config.color} className="!m-0">
              {config.text}
            </Tag>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {expanded ? (
            <DownOutlined className="text-gray-400 text-xs" />
          ) : (
            <RightOutlined className="text-gray-400 text-xs" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <Text type="secondary">上传时间</Text>
            <Text>{formatDate(file.createdAt)}</Text>
          </div>

          {file.errorMessage && (
            <div className="bg-red-50 text-red-600 text-xs p-2 rounded">
              错误：{file.errorMessage}
            </div>
          )}

          <Space className="w-full justify-end" wrap={false}>
            {file.status === 'failed' && (
              <Button
                size="small"
                icon={<SyncOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  onRetry?.()
                }}
              >
                重试
              </Button>
            )}
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.()
              }}
            >
              删除
            </Button>
          </Space>
        </div>
      )}
    </Card>
  )
}
