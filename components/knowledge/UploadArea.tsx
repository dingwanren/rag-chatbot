'use client'

import { useState, useCallback } from 'react'
import { Flex, Upload, message, Typography } from 'antd'
import { InboxOutlined, UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'

const { Text } = Typography

interface UploadAreaProps {
  onUpload?: (files: File[]) => void
}

export function UploadArea({ onUpload }: UploadAreaProps) {
  const [uploading, setUploading] = useState(false)

  const handleUpload: UploadProps['onChange'] = (info) => {
    const { status, originFileObj } = info.file

    if (status === 'uploading') {
      setUploading(true)
      return
    }

    if (status === 'done') {
      setUploading(false)
      message.success(`${info.file.name} 上传成功`)
      if (originFileObj && onUpload) {
        onUpload([originFileObj])
      }
    } else if (status === 'error') {
      setUploading(false)
      message.error(`${info.file.name} 上传失败`)
    }
  }

  const handleCustomRequest: UploadProps['customRequest'] = ({ file, onSuccess, onError }) => {
    // Mock upload - in real app, this would upload to server
    setTimeout(() => {
      if (onSuccess) {
        onSuccess('ok')
      }
    }, 1000)
  }

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    accept: '.pdf,.doc,.docx,.txt,.md',
    showUploadList: false,
    customRequest: handleCustomRequest,
    onChange: handleUpload,
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

      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        message.error('文件大小不能超过 10MB')
        return false
      }

      return true
    },
  }

  return (
    <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
      <Upload.Dragger {...uploadProps} style={{ padding: '20px 0' }}>
        <Flex vertical align="center" gap={8}>
          <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          <Text style={{ fontSize: 14 }}>
            点击或拖拽文件到此处上传
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            支持 PDF、Word、TXT、Markdown 格式，最大 10MB
          </Text>
        </Flex>
      </Upload.Dragger>
    </div>
  )
}
