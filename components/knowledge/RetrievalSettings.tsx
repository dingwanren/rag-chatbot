'use client'

import { useState, useEffect } from 'react'
import { Slider, Card, Typography, Space, Button, message, Form, InputNumber, Divider, Alert, Tabs } from 'antd'
import { SaveOutlined, ReloadOutlined, WarningOutlined, ExperimentOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { RetrievalTestPanel } from './RetrievalTestPanel'

const { Title, Text, Paragraph } = Typography

interface RetrievalSettingsForm {
  top_k: number
  threshold: number
  chunk_size: number
}

interface RetrievalSettingsProps {
  knowledgeBaseId: string
}

export function RetrievalSettings({ knowledgeBaseId }: RetrievalSettingsProps) {
  const [form] = Form.useForm<RetrievalSettingsForm>()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [needReindex, setNeedReindex] = useState(false)
  const [currentConfig, setCurrentConfig] = useState({ top_k: 5, threshold: 0.65 })

  const initialValues: RetrievalSettingsForm = {
    top_k: 5,
    threshold: 0.65,
    chunk_size: 500,
  }

  useEffect(() => {
    loadConfig()
  }, [knowledgeBaseId])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/rag/config?knowledgeBaseId=${knowledgeBaseId}`)
      const result = await response.json()

      if (result.success) {
        form.setFieldsValue({
          top_k: result.data.top_k,
          threshold: result.data.threshold,
          chunk_size: result.data.chunk_size,
        })
        setCurrentConfig({
          top_k: result.data.top_k,
          threshold: result.data.threshold,
        })
        setNeedReindex(false)
      } else {
        message.error(result.error || '加载配置失败')
      }
    } catch (error) {
      console.error('Load config error:', error)
      message.error('加载配置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)

      const response = await fetch('/api/rag/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          knowledgeBaseId,
          top_k: values.top_k,
          threshold: values.threshold,
          chunk_size: values.chunk_size,
        }),
      })

      const result = await response.json()

      if (result.success) {
        message.success(result.message || '设置已保存')
        setNeedReindex(result.data.needReindex || false)
        setCurrentConfig({
          top_k: values.top_k,
          threshold: values.threshold,
        })
      } else {
        message.error(result.error || '保存配置失败')
      }
    } catch (error) {
      console.error('Save config error:', error)
      message.error('保存配置失败')
    } finally {
      setSaving(false)
    }
  }

  const settingsContent = (
    <>
      <Alert
        title="配置说明"
        description={
          <div className="text-sm">
            <Text type="secondary">此配置仅对当前知识库（"{knowledgeBaseId.slice(0, 8)}..."）生效</Text>
            <br />
            <Text type="secondary">不同知识库可以有独立的检索参数</Text>
          </div>
        }
        type="info"
        showIcon
        className="mb-4"
      />

      {needReindex && (
        <Alert
          title={
            <div className="flex items-center gap-2">
              <WarningOutlined className="text-orange-500" />
              <Text strong>需要重新索引</Text>
            </div>
          }
          description={
            <Paragraph className="!mb-0 text-sm">
              修改分块大小（Chunk Size）后，需要重新处理已有文档才能生效。
              <br />
              <Text type="secondary">前往"文件管理"标签，重新上传文档以应用新配置。</Text>
            </Paragraph>
          }
          type="warning"
          showIcon
          className="mb-4"
        />
      )}

      <Form
        form={form}
        initialValues={initialValues}
        layout="vertical"
        size="large"
        disabled={loading}
      >
        <Card size="small" title="检索参数" className="mb-4">
          <Form.Item
            label={
              <div className="flex items-center justify-between">
                <span>Top-K <Text type="secondary" className="text-sm font-normal">（检索返回数量）</Text></span>
                <Text type="secondary" className="text-sm">
                  {form.getFieldValue('top_k') || initialValues.top_k}
                </Text>
              </div>
            }
            name="top_k"
            rules={[
              { required: true, message: '请输入 Top-K 值' },
              {
                validator: (_, value) => {
                  if (value < 1 || value > 20) {
                    return Promise.reject('Top-K 必须在 1 到 20 之间')
                  }
                  return Promise.resolve()
                },
              },
            ]}
            extra="控制检索返回的相似片段数量，值越大检索结果越多，但可能包含噪声"
          >
            <Slider
              min={1}
              max={20}
              marks={{
                1: '1',
                5: '5',
                10: '10',
                15: '15',
                20: '20',
              }}
              tooltip={{ formatter: (value) => `${value}` }}
            />
          </Form.Item>

          <Divider className="!my-4" />

          <Form.Item
            label={
              <div className="flex items-center justify-between">
                <span>Threshold <Text type="secondary" className="text-sm font-normal">（相似度阈值）</Text></span>
                <Text type="secondary" className="text-sm">
                  {(form.getFieldValue('threshold') || initialValues.threshold).toFixed(2)}
                </Text>
              </div>
            }
            name="threshold"
            rules={[
              { required: true, message: '请输入相似度阈值' },
              {
                validator: (_, value) => {
                  if (value < 0 || value > 1) {
                    return Promise.reject('Threshold 必须在 0 到 1 之间')
                  }
                  return Promise.resolve()
                },
              },
            ]}
            extra="低于此阈值的检索结果将被过滤，值越高要求越严格"
          >
            <Slider
              min={0}
              max={1}
              step={0.05}
              marks={{
                0: '0',
                0.5: '0.5',
                0.65: '0.65',
                0.7: '0.7',
                1: '1',
              }}
              tooltip={{ formatter: (value) => value?.toFixed(2) }}
            />
          </Form.Item>
        </Card>

        <Card size="small" title="分块设置" className="mb-4">
          <Form.Item
            label={
              <div className="flex items-center justify-between">
                <span>Chunk Size <Text type="secondary" className="text-sm font-normal">（文本分块大小）</Text></span>
              </div>
            }
            labelCol={{ className: 'w-full' }}
            name="chunk_size"
            rules={[
              { required: true, message: '请输入 Chunk Size 值' },
              {
                validator: (_, value) => {
                  if (value < 100 || value > 2000) {
                    return Promise.reject('Chunk Size 必须在 100 到 2000 之间')
                  }
                  return Promise.resolve()
                },
              },
            ]}
            extra="每个文本片段的字符数，影响检索粒度和上下文完整性。修改后需要重新上传文档才能生效。"
          >
            <Space.Compact className="w-full">
              <InputNumber
                min={100}
                max={2000}
                step={50}
                style={{ flex: 1 }}
                placeholder="请输入分块大小"
              />
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 text-sm text-gray-500">
                字符
              </div>
            </Space.Compact>
          </Form.Item>
        </Card>

        <Card size="small" title="配置说明" className="mb-4">
          <div className="space-y-3 text-sm">
            <div>
              <Text strong>Top-K 建议：</Text>
              <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                <li>默认值 5 适合大多数场景</li>
                <li>如果问题复杂需要更多上下文，可增加到 10-15</li>
                <li>如果检索结果噪声较大，可减少到 3-5</li>
              </ul>
            </div>
            <Divider className="!my-2" />
            <div>
              <Text strong>Threshold 建议：</Text>
              <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                <li>默认值 0.65 是平衡点</li>
                <li>如果检索结果相关性不高，可提高到 0.7-0.8</li>
                <li>如果检索结果太少，可降低到 0.5-0.6</li>
              </ul>
            </div>
            <Divider className="!my-2" />
            <div>
              <Text strong>Chunk Size 建议：</Text>
              <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                <li>默认值 500 适合段落级检索</li>
                <li>如果需要更精细的检索，可减少到 200-300</li>
                <li>如果需要更完整的上下文，可增加到 800-1000</li>
              </ul>
            </div>
          </div>
        </Card>
      </Form>
    </>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Title level={5} className="!mb-0">
          <ExperimentOutlined className="mr-2" />
          检索配置
        </Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadConfig}
            loading={loading}
            size="small"
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
            disabled={loading}
            size="small"
          >
            保存设置
          </Button>
        </Space>
      </div>

      <Tabs
        defaultActiveKey="settings"
        items={[
          {
            key: 'settings',
            label: (
              <span>
                <SaveOutlined className="mr-1" />
                参数设置
              </span>
            ),
            children: settingsContent,
          },
          {
            key: 'test',
            label: (
              <span>
                <PlayCircleOutlined className="mr-1" />
                检索测试
              </span>
            ),
            children: (
              <RetrievalTestPanel
                knowledgeBaseId={knowledgeBaseId}
                config={currentConfig}
              />
            ),
          },
        ]}
      />
    </div>
  )
}
