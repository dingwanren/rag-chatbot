'use client'

import { useState, useCallback, useEffect } from 'react'
import { Modal, Input, Radio, Select, Form, message } from 'antd'
import { getKnowledgeBases } from '@/app/actions/knowledge-base'
import type { KnowledgeBase } from '@/types'

interface CreateChatModalProps {
  open: boolean
  onCreate: (data: { title: string; mode: 'chat' | 'rag'; knowledgeBaseId?: string }) => void
  onCancel: () => void
  isCreating?: boolean  // 添加创建中状态
}

export function CreateChatModal({ open, onCreate, onCancel, isCreating = false }: CreateChatModalProps) {
  const [form] = Form.useForm()
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [loadingKnowledgeBases, setLoadingKnowledgeBases] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'chat' | 'rag'>('chat')

  // 加载知识库列表
  useEffect(() => {
    if (open) {
      loadKnowledgeBases()
    }
  }, [open])

  const loadKnowledgeBases = async () => {
    setLoadingKnowledgeBases(true)
    try {
      const { data, error } = await getKnowledgeBases()
      if (error) {
        message.error(error.message)
      } else {
        setKnowledgeBases(data ?? [])
      }
    } catch (e) {
      message.error('加载知识库列表失败')
    } finally {
      setLoadingKnowledgeBases(false)
    }
  }

  const handleModeChange = useCallback((e: any) => {
    const newMode = e.target.value
    setSelectedMode(newMode)

    // 切换到普通聊天时，清空知识库选择
    if (newMode === 'chat') {
      form.setFieldValue('knowledgeBaseId', undefined)
    }
  }, [form])

  const handleCreate = useCallback(async () => {
    // 防止重复点击
    if (isCreating) return

    try {
      const values = await form.validateFields()

      // 如果是 rag 模式，必须选择知识库
      if (values.mode === 'rag' && !values.knowledgeBaseId) {
        message.error('请选择知识库')
        return
      }

      onCreate({
        title: values.title || '新对话',
        mode: values.mode,
        knowledgeBaseId: values.knowledgeBaseId,
      })

      // 重置表单
      form.resetFields()
      setSelectedMode('chat')
    } catch (error) {
      console.error('Validation error:', error)
    }
  }, [form, onCreate, isCreating])

  const handleCancel = useCallback(() => {
    // 如果正在创建，不允许取消
    if (isCreating) return
    
    form.resetFields()
    setSelectedMode('chat')
    onCancel()
  }, [form, onCancel, isCreating])

  return (
    <Modal
      title="创建新聊天"
      open={open}
      onOk={handleCreate}
      onCancel={handleCancel}
      okText="创建"
      cancelText="取消"
      confirmLoading={isCreating}  // 使用创建状态，而不是知识库加载状态
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          mode: 'chat',
        }}
      >
        <Form.Item
          label="聊天标题"
          name="title"
          rules={[{ max: 50, message: '标题不能超过 50 个字符' }]}
        >
          <Input placeholder="可选，默认：新对话" allowClear disabled={isCreating} />
        </Form.Item>

        <Form.Item
          label="聊天模式"
          name="mode"
          rules={[{ required: true, message: '请选择聊天模式' }]}
        >
          <Radio.Group onChange={handleModeChange} value={selectedMode} disabled={isCreating}>
            <Radio value="chat">
              <span role="img" aria-label="chat">💬</span> 普通聊天
            </Radio>
            <Radio value="rag">
              <span role="img" aria-label="rag">📚</span> 知识库聊天
            </Radio>
          </Radio.Group>
        </Form.Item>

        {selectedMode === 'rag' && (
          <Form.Item
            label="选择知识库"
            name="knowledgeBaseId"
            rules={[{ required: true, message: '请选择知识库' }]}
            extra="聊天将基于所选知识库的内容回答问题"
          >
            <Select
              placeholder="请选择知识库"
              loading={loadingKnowledgeBases}  // 只在加载知识库时转圈
              allowClear={false}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={knowledgeBases.map((kb) => ({
                value: kb.id,
                label: kb.name,
                title: kb.name,
              }))}
              notFoundContent={loadingKnowledgeBases ? '加载中...' : '暂无知识库'}
              disabled={isCreating}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}
