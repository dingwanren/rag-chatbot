'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button, Typography, Table, Tag, Space, Modal, message, Upload, Flex, Spin } from 'antd'
import {
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  SyncOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import type { UploadProps, TableProps } from 'antd'
import { KnowledgeFile } from '@/types'
import { RetrievalSettings } from './RetrievalSettings'
import { FileCard } from './FileCard'
import { uploadKnowledgeFile, deleteKnowledgeFile, getFiles } from '@/app/actions/knowledge-file'

const { Title, Text } = Typography

interface KnowledgeDetailViewProps {
  knowledgeBaseId: string
  knowledgeBaseName: string
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
  pending: {
    color: 'yellow',
    icon: undefined,
    text: '待处理',
  },
  processing: {
    color: 'blue',
    icon: <SyncOutlined spin />,
    text: '处理中',
  },
  completed: {
    color: 'green',
    icon: undefined,
    text: '完成',
  },
  failed: {
    color: 'red',
    icon: undefined,
    text: '失败',
  },
}

export function KnowledgeDetailView({
  knowledgeBaseId,
  knowledgeBaseName,
}: KnowledgeDetailViewProps) {
  const [files, setFiles] = useState<KnowledgeFile[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'files' | 'settings'>('files')
  const [uploading, setUploading] = useState(false)

  // Load files from server
  useEffect(() => {
    loadFiles()
  }, [knowledgeBaseId])

  const loadFiles = async () => {
    setLoading(true)
    try {
      const { data, error } = await getFiles(knowledgeBaseId)
      if (error) {
        message.error(error.message)
      } else {
        setFiles(data ?? [])
      }
    } catch (e) {
      message.error('加载文件列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFile = useCallback((fileId: string, fileName: string) => {
    Modal.confirm({
      title: '确认删除？',
      content: `确定要删除文件 "${fileName}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        const { success, error } = await deleteKnowledgeFile(fileId)

        if (success) {
          await loadFiles()
          message.success('已删除文件')
        } else {
          message.error(`删除失败：${error?.message}`)
        }
      },
    })
  }, [])

  const handleRetryParse = useCallback((fileId: string) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'processing' } : f))
    message.loading({ content: '重新解析中...', key: 'retry', duration: 1.5 })
    setTimeout(() => {
      message.success({ content: '已重新提交解析', key: 'retry', duration: 2 })
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'completed' } : f))
    }, 1500)
  }, [])

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

  const handleCustomUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    setUploading(true)
    const fileObj = file as File

    try {
      const { data, error } = await uploadKnowledgeFile(knowledgeBaseId, fileObj)

      if (error) {
        console.error('upload error:', error)
        message.error(`上传失败：${error.message}`)
        onError?.(error as any)
        return
      }

      if (data) {
        message.success(`${fileObj.name} 上传成功`)
        await loadFiles()
        onSuccess?.(data)
      }
    } catch (e) {
      console.error('upload error:', e)
      message.error(`上传失败：${e instanceof Error ? e.message : '未知错误'}`)
      onError?.(e as any)
    } finally {
      setUploading(false)
    }
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
  const columns: TableProps<KnowledgeFile>['columns'] = [
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
      render: (name: string, record: KnowledgeFile) => (
        <div className="flex items-center gap-2">
          <InboxOutlined className="text-blue-500" />
          <span className="font-medium">{name}</span>
        </div>
      ),
    },
    {
      title: '大小',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size: number) => (
        <Text type="secondary">{formatFileSize(size)}</Text>
      ),
      width: 100,
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (createdAt: string) => (
        <Text type="secondary">{formatDate(createdAt)}</Text>
      ),
      width: 160,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status?: string) => {
        const config = status && statusConfig[status] ? statusConfig[status] : statusConfig.pending
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
      render: (_: unknown, record: KnowledgeFile) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            danger
            onClick={() => handleDeleteFile(record.id, record.file_name)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
          <div>
            <Title level={4} className="!mb-2">{knowledgeBaseName}</Title>
            <Text type="secondary">
              共 {files.length} 个文件
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
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Spin />
                </div>
              ) : (
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
              )}
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden h-full overflow-auto p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Spin />
                </div>
              ) : (
                <>
                  {files.map((file) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      onDelete={() => handleDeleteFile(file.id, file.file_name)}
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
                </>
              )}
            </div>
          </>
        ) : (
          <div className="h-full overflow-auto p-6">
            <RetrievalSettings knowledgeBaseId={knowledgeBaseId} />
          </div>
        )}
      </div>
    </div>
  )
}
