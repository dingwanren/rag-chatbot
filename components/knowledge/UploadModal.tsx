'use client'

import { useState, useCallback } from 'react'
import { Modal, Upload, Button, Typography, Progress, message, Space } from 'antd'
import { InboxOutlined, UploadOutlined, CloseOutlined, WarningOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import { analyzePdfAction, uploadKnowledgeFile, type PdfQualityCheckResult } from '@/app/actions/knowledge-file'

const { Title, Text } = Typography

interface UploadModalProps {
  open: boolean
  onClose: () => void
  onUpload: (files: File[]) => void
  knowledgeBaseName?: string
  knowledgeBaseId?: string
}

/**
 * 文件上传结果
 */
interface UploadResult {
  file: File
  qualityCheck?: PdfQualityCheckResult
  success?: boolean
  error?: string
}

export function UploadModal({
  open,
  onClose,
  onUpload,
  knowledgeBaseName,
  knowledgeBaseId,
}: UploadModalProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<UploadResult[]>([])

  const handleUpload: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList)
  }

  const handleRemove = (file: UploadFile) => {
    const newFileList = fileList.filter((f) => f.uid !== file.uid)
    setFileList(newFileList)
  }

  const handleCustomRequest: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    setUploading(true)
    const mockFile = file as File

    try {
      // 🎯 1. PDF 质量检测
      if (mockFile.type === 'application/pdf' && knowledgeBaseId) {
        const qualityCheck = await analyzePdfAction(mockFile)
        console.log('[UploadModal] 质量检测结果:', qualityCheck)

        // ❌ 检测失败（error）
        if (qualityCheck.status === 'error') {
          setUploading(false)
          message.error(qualityCheck.message)
          if (onError) {
            onError(new Error(qualityCheck.message))
          }
          return
        }

        // ⚠️ 警告（warning）- 添加到待确认列表
        if (qualityCheck.status === 'warning') {
          setUploading(false)
          setPendingFiles(prev => [...prev, {
            file: mockFile,
            qualityCheck,
          }])
          if (onSuccess) {
            onSuccess('warning') // 特殊标记
          }
          return
        }

        // ✅ 成功 - 继续上传
        if (onSuccess) {
          onSuccess({ qualityCheck })
        }
      } else {
        // 非 PDF 文件直接成功
        if (onSuccess) {
          onSuccess('ok')
        }
      }
    } catch (error) {
      setUploading(false)
      console.error('[UploadModal] 检测失败:', error)
      if (onError) {
        onError(error instanceof Error ? error : new Error('上传失败'))
      }
    }
  }

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
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

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      message.error('文件大小不能超过 10MB')
      return false
    }

    return true
  }

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    accept: '.pdf,.doc,.docx,.txt,.md',
    fileList,
    onChange: handleUpload,
    onRemove: handleRemove,
    customRequest: handleCustomRequest,
    beforeUpload,
  }

  /**
   * 处理待确认的文件上传
   */
  const handlePendingFiles = useCallback(async () => {
    if (pendingFiles.length === 0 || !knowledgeBaseId) return

    setUploading(true)

    try {
      // 遍历待确认文件，执行实际上传
      for (const { file } of pendingFiles) {
        const result = await uploadKnowledgeFile(knowledgeBaseId, file, true)

        if (result.error) {
          message.error(`${file.name}: 上传失败 - ${result.error.message}`)
        } else {
          message.success(`${file.name}: 上传成功`)
          onUpload([file])
        }
      }

      setPendingFiles([])
      setFileList([])
      onClose()
    } catch (error) {
      console.error('[UploadModal] 批量上传失败:', error)
      message.error('批量上传失败')
    } finally {
      setUploading(false)
    }
  }, [pendingFiles, knowledgeBaseId, onUpload, onClose])

  /**
   * 确认上传（用户点击 warning 确认框的"仍然上传"）
   */
  const confirmUpload = useCallback(() => {
    handlePendingFiles()
  }, [handlePendingFiles])

  /**
   * 取消上传（用户点击 warning 确认框的"取消"）
   */
  const cancelUpload = useCallback(() => {
    setPendingFiles([])
    setFileList([])
    message.info('已取消上传')
  }, [])

  const handleOk = () => {
    const filesToUpload = fileList
      .filter((f) => {
        // 只上传没有 pending 的文件
        const isPending = pendingFiles.some(pf => pf.file.name === f.name)
        return !isPending && (f.status === 'done' || f.status === 'uploading')
      })
      .map((f) => f.originFileObj as File)

    if (filesToUpload.length > 0 && knowledgeBaseId) {
      setUploading(true)
      // 执行实际上传
      uploadKnowledgeFile(knowledgeBaseId, filesToUpload[0], true)
        .then((result) => {
          if (result.error) {
            message.error(`上传失败：${result.error.message}`)
          } else {
            message.success('上传成功')
            onUpload(filesToUpload)
            setFileList([])
            onClose()
          }
        })
        .catch((error) => {
          message.error(`上传失败：${error instanceof Error ? error.message : '未知错误'}`)
        })
        .finally(() => {
          setUploading(false)
        })
    } else if (pendingFiles.length > 0) {
      // 有待确认的文件，显示确认框
      Modal.confirm({
        title: (
          <Space>
            <WarningOutlined style={{ color: '#faad14' }} />
            文件质量警告
          </Space>
        ),
        content: (
          <div className="space-y-2">
            <p>以下文件可能影响问答效果：</p>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {pendingFiles.map((pf, index) => (
                <li key={index}>
                  <strong>{pf.file.name}</strong>
                  {pf.qualityCheck?.message && (
                    <span className="text-xs block ml-4 text-gray-500">
                      {pf.qualityCheck.message}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ),
        okText: '仍然上传',
        cancelText: '取消',
        onOk: confirmUpload,
        onCancel: cancelUpload,
        okButtonProps: { danger: false },
        width: 500,
      })
    } else {
      message.warning('请选择要上传的文件')
    }
  }

  return (
    <Modal
      title={`上传文件到 ${knowledgeBaseName || '知识库'}`}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="确认上传"
      cancelText="取消"
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={uploading}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleOk}
          loading={uploading}
          disabled={fileList.length === 0 && pendingFiles.length === 0}
        >
          确认上传
        </Button>,
      ]}
    >
      <div className="space-y-4">
        <Upload.Dragger
          {...uploadProps}
          listType="text"
          style={{ padding: '20px 0', marginBottom: 16 }}
        >
          <div className="flex flex-col items-center py-8">
            <InboxOutlined className="text-5xl text-blue-500 mb-4" />
            <Title level={5} className="!mb-2">
              点击或拖拽文件到此处上传
            </Title>
            <Text type="secondary" className="text-sm text-center">
              支持 PDF、Word、TXT、Markdown 格式
              <br />
              单个文件最大 10MB
            </Text>
            <Text type="secondary" className="text-xs mt-2">
              📄 PDF 文件将自动进行质量检测
            </Text>
          </div>
        </Upload.Dragger>

        {fileList.length > 0 && (
          <div className="space-y-2">
            <Text type="secondary" className="text-sm">
              已选择 {fileList.length} 个文件
              {pendingFiles.length > 0 && (
                <Text type="warning" className="ml-2">
                  （{pendingFiles.length} 个待确认）
                </Text>
              )}
            </Text>
            {fileList.map((file) => {
              const isPending = pendingFiles.some(pf => pf.file.name === file.name)
              const pendingInfo = pendingFiles.find(pf => pf.file.name === file.name)

              return (
                <div
                  key={file.uid}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isPending ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                      isPending ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      {isPending ? (
                        <WarningOutlined className="text-yellow-600" />
                      ) : (
                        <UploadOutlined className="text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Text className="block truncate text-sm">{file.name}</Text>
                      {isPending && pendingInfo?.qualityCheck?.message && (
                        <Text type="warning" className="text-xs block">
                          {pendingInfo.qualityCheck.message}
                        </Text>
                      )}
                      {file.status === 'uploading' && (
                        <Progress
                          percent={file.percent || 0}
                          size="small"
                          strokeColor="#1890ff"
                          showInfo={false}
                        />
                      )}
                      {file.status === 'done' && !isPending && (
                        <Text type="secondary" className="text-xs">
                          检测通过
                        </Text>
                      )}
                      {file.status === 'error' && (
                        <Text type="danger" className="text-xs">
                          上传失败
                        </Text>
                      )}
                    </div>
                  </div>
                  <Button
                    type="text"
                    danger
                    icon={<CloseOutlined />}
                    size="small"
                    onClick={() => handleRemove(file)}
                    disabled={file.status === 'uploading'}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}
