'use client'

import { useState, useCallback } from 'react'
import { Modal, Upload, Button, Typography, Progress, message } from 'antd'
import { InboxOutlined, UploadOutlined, CloseOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'

const { Title, Text } = Typography

interface UploadModalProps {
  open: boolean
  onClose: () => void
  onUpload: (files: File[]) => void
  knowledgeBaseName?: string
}

export function UploadModal({
  open,
  onClose,
  onUpload,
  knowledgeBaseName,
}: UploadModalProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)

  const handleUpload: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList)
  }

  const handleRemove = (file: UploadFile) => {
    const newFileList = fileList.filter((f) => f.uid !== file.uid)
    setFileList(newFileList)
  }

  const handleCustomRequest: UploadProps['customRequest'] = ({ file, onSuccess, onError }) => {
    setUploading(true)
    // Mock upload - simulate progress
    const mockFile = file as File
    setTimeout(() => {
      setUploading(false)
      if (onSuccess) {
        onSuccess('ok')
        message.success(`${mockFile.name} 上传成功`)
        onUpload([mockFile])
      }
    }, 2000)
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

  const handleOk = () => {
    const filesToUpload = fileList
      .filter((f) => f.status === 'done' || f.status === 'uploading')
      .map((f) => f.originFileObj as File)

    if (filesToUpload.length > 0) {
      onUpload(filesToUpload)
      setFileList([])
      onClose()
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
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleOk}
          loading={uploading}
          disabled={fileList.length === 0}
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
          </div>
        </Upload.Dragger>

        {fileList.length > 0 && (
          <div className="space-y-2">
            <Text type="secondary" className="text-sm">
              已选择 {fileList.length} 个文件
            </Text>
            {fileList.map((file) => (
              <div
                key={file.uid}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <UploadOutlined className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Text className="block truncate text-sm">{file.name}</Text>
                    {file.status === 'uploading' && (
                      <Progress
                        percent={file.percent || 0}
                        size="small"
                        strokeColor="#1890ff"
                        showInfo={false}
                      />
                    )}
                    {file.status === 'done' && (
                      <Text type="secondary" className="text-xs">
                        上传成功
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
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
