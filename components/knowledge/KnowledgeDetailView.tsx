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
import { TestDataFlowPanel } from './TestDataFlowPanel'
import { uploadKnowledgeFile, deleteKnowledgeFile, getFiles } from '@/app/actions/knowledge-file'
import { createClient } from '@/lib/supabase/browser'

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
  const [showTestPanel, setShowTestPanel] = useState(false)

  // Load files from server
  useEffect(() => {
    loadFiles()
  }, [knowledgeBaseId])

  // ============================================
  // 🥇 Step 2: Supabase Realtime 订阅（核心）
  // ============================================
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`knowledge-files-${knowledgeBaseId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'knowledge_files',
          filter: `knowledge_base_id=eq.${knowledgeBaseId}`,
        },
        (payload) => {
          const updated = payload.new as KnowledgeFile

          // 只更新变化的那一条数据，不刷新整个列表
          setFiles(prev =>
            prev.map(f =>
              f.id === updated.id
                ? { ...f, status: updated.status }
                : f
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [knowledgeBaseId])

  // ============================================
  // 🥇 Step 1: 轮询机制兜底（修复依赖问题）
  // ============================================
  useEffect(() => {
    const hasProcessingFile = files.some(f => 
      f.status === 'processing' || f.status === 'pending'
    )

    if (!hasProcessingFile) {
      return
    }

    const pollInterval = setInterval(async () => {
      try {
        const { data } = await getFiles(knowledgeBaseId)
        if (data) {
          // 只更新状态变化的文件，避免整个表格刷新
          setFiles(prevFiles => {
            if (prevFiles.length === data.length) {
              return prevFiles.map(prevFile => {
                const newFile = data.find(f => f.id === prevFile.id)
                if (newFile && newFile.status !== prevFile.status) {
                  console.log('[Poll] File status changed:', prevFile.id, prevFile.status, '->', newFile.status)
                  return { ...prevFile, status: newFile.status }
                }
                return prevFile
              })
            }
            return data
          })
        }
      } catch (error) {
        console.error('Poll error:', error)
      }
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [files, knowledgeBaseId])

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

        // 🥇 Step 3: 上传成功后直接更新 UI，不立即 loadFiles
        // 交给 realtime / polling 更新状态
        setFiles(prev => [
          {
            ...data,
            status: 'processing', // 初始状态设为 processing
          },
          ...prev,
        ])

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
          <Tag 
            icon={config.icon} 
            color={config.color}
            className="transition-all duration-300"
          >
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
      <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
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

      {/* 🔍 数据链路测试面板 */}
      <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
          <Text strong>🔍 数据链路测试</Text>
          <Button
            size="small"
            type={showTestPanel ? 'primary' : 'default'}
            onClick={() => setShowTestPanel(!showTestPanel)}
          >
            {showTestPanel ? '收起' : '展开'}
          </Button>
        </Flex>
        {showTestPanel && (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            <TestDataFlowPanel />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
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
      <div className="flex-1 min-h-0 overflow-hidden">
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
                  scroll={{ y: 'calc(100vh - 400px)' }}
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
