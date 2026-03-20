'use client'

import { useState, useCallback } from 'react'
import { Button, Typography, Table, Tag, Space, Modal, message, Upload, Flex } from 'antd'
import {
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  SyncOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import type { UploadProps, TableProps } from 'antd'
import { KBFile, FileParseStatus } from '@/types'
import { RetrievalSettings } from './RetrievalSettings'
import { FileCard } from './FileCard'

const { Title, Text } = Typography

interface KnowledgeDetailViewProps {
  knowledgeBaseId: string
  knowledgeBaseName: string
  files?: KBFile[]
  onUpload?: (files: File[]) => void
  onDeleteFile?: (fileId: string) => void
  onRetryParse?: (fileId: string) => void
}

// Mock data
const mockFiles: KBFile[] = [
  {
    id: 'file-1',
    name: '产品手册.pdf',
    size: 1024 * 1024 * 2,
    type: 'application/pdf',
    knowledgeBaseId: 'kb-1',
    createdAt: new Date(Date.now() - 86400000 * 2),
    status: 'success',
  },
  {
    id: 'file-2',
    name: '技术文档.docx',
    size: 1024 * 500,
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    knowledgeBaseId: 'kb-1',
    createdAt: new Date(Date.now() - 86400000),
    status: 'parsing',
  },
  {
    id: 'file-3',
    name: '错误日志.txt',
    size: 1024 * 100,
    type: 'text/plain',
    knowledgeBaseId: 'kb-1',
    createdAt: new Date(),
    status: 'failed',
    errorMessage: '文件格式解析失败',
  },
  {
    id: 'file-4',
    name: '用户指南.md',
    size: 1024 * 300,
    type: 'text/markdown',
    knowledgeBaseId: 'kb-1',
    createdAt: new Date(Date.now() - 3600000),
    status: 'success',
  },
]

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

export function KnowledgeDetailView({
  knowledgeBaseId,
  knowledgeBaseName,
  files = mockFiles,
  onUpload,
  onDeleteFile,
  onRetryParse,
}: KnowledgeDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'files' | 'settings'>('files')
  const [uploading, setUploading] = useState(false)

  const handleDeleteFile = useCallback((fileId: string, fileName: string) => {
    Modal.confirm({
      title: '确认删除？',
      content: `确定要删除文件 "${fileName}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        onDeleteFile?.(fileId)
        message.success('已删除文件')
      },
    })
  }, [onDeleteFile])

  const handleRetryParse = useCallback((fileId: string) => {
    onRetryParse?.(fileId)
    message.loading({ content: '重新解析中...', key: 'retry', duration: 1.5 })
    setTimeout(() => {
      message.success({ content: '已重新提交解析', key: 'retry', duration: 2 })
    }, 1500)
  }, [onRetryParse])

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

  const handleCustomUpload: UploadProps['customRequest'] = ({ file, onSuccess, onError }) => {
    setUploading(true)
    // Mock upload
    setTimeout(() => {
      setUploading(false)
      if (onSuccess) onSuccess('ok')
      message.success(`${(file as File).name} 上传成功`)
      onUpload?.([file as File])
    }, 1500)
  }

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    accept: '.pdf,.doc,.docx,.txt,.md',
    showUploadList: false,
    customRequest: handleCustomUpload,
    beforeUpload: (file) => {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
      ]

      if (!allowedTypes.includes(file.type)) {
        message.error('只能上传 PDF、Word、TXT 或 Markdown 文件')
        return false
      }

      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        message.error('文件大小不能超过 10MB')
        return false
      }

      return true
    },
  }

  // Table columns for desktop
  const columns: TableProps<KBFile>['columns'] = [
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: KBFile) => (
        <div className="flex items-center gap-2">
          <InboxOutlined className="text-blue-500" />
          <span className="font-medium">{name}</span>
        </div>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => (
        <Text type="secondary">{formatFileSize(size)}</Text>
      ),
      width: 100,
    },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: Date) => (
        <Text type="secondary">{formatDate(createdAt)}</Text>
      ),
      width: 160,
    },
    {
      title: '解析状态',
      dataIndex: 'status',
      key: 'status',
      render: (status?: FileParseStatus) => {
        const config = status ? statusConfig[status] : statusConfig.parsing
        return (
          <Tag icon={config.icon} color={config.color}>
            {config.text}
          </Tag>
        )
      },
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: KBFile) => (
        <Space size="small">
          {record.status === 'failed' && (
            <Button
              type="link"
              size="small"
              onClick={() => handleRetryParse(record.id)}
            >
              重试
            </Button>
          )}
          <Button
            type="link"
            size="small"
            danger
            onClick={() => handleDeleteFile(record.id, record.name)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const successCount = files.filter(f => f.status === 'success').length

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
          <div>
            <Title level={4} className="!mb-2">{knowledgeBaseName}</Title>
            <Text type="secondary">
              共 {files.length} 个文件 · 成功 {successCount} 个
            </Text>
          </div>
          <Upload {...uploadProps}>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              loading={uploading}
              disabled={activeTab !== 'files'}
            >
              上传文件
            </Button>
          </Upload>
        </Flex>
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
        <Flex gap="large">
          <button
            onClick={() => setActiveTab('files')}
            className={`pb-2 text-sm font-medium transition-colors ${
              activeTab === 'files'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            文件列表
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2 text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            检索设置
          </button>
        </Flex>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'files' ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block h-full overflow-auto p-6">
              <Table
                columns={columns}
                dataSource={files}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 条`,
                }}
                scroll={{ y: 'calc(100vh - 300px)' }}
              />
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden h-full overflow-auto p-4 space-y-3">
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onDelete={() => handleDeleteFile(file.id, file.name)}
                  onRetry={() => handleRetryParse(file.id)}
                />
              ))}
              {files.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <InboxOutlined className="text-5xl mb-4" />
                  <p>暂无文件</p>
                  <p className="text-sm">点击上方上传文件</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-full overflow-auto p-6">
            <RetrievalSettings />
          </div>
        )}
      </div>
    </div>
  )
}
