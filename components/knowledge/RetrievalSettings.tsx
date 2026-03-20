'use client'

import { useState } from 'react'
import { Slider, Switch, Card, Typography, Space, Button, message, Form, InputNumber, Divider, Space as AntSpace } from 'antd'
import { SaveOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface RetrievalSettingsForm {
  topK: number
  similarityThreshold: number
  maxChunkSize: number
  chunkOverlap: number
  enableHybridSearch: boolean
  enableReranking: boolean
}

export function RetrievalSettings() {
  const [form] = Form.useForm<RetrievalSettingsForm>()
  const [saving, setSaving] = useState(false)

  const initialValues: RetrievalSettingsForm = {
    topK: 5,
    similarityThreshold: 0.7,
    maxChunkSize: 500,
    chunkOverlap: 50,
    enableHybridSearch: false,
    enableReranking: true,
  }

  const handleSave = async () => {
    try {
      await form.validateFields()
      const values = form.getFieldsValue()
      setSaving(true)
      // Mock API call
      console.log('Saving settings:', values)
      setTimeout(() => {
        setSaving(false)
        message.success('设置已保存')
      }, 1000)
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Title level={5} className="!mb-0">检索配置</Title>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
        >
          保存设置
        </Button>
      </div>

      <Form
        form={form}
        initialValues={initialValues}
        layout="vertical"
        size="large"
      >
        <Card size="small" title="检索参数" className="mb-4">
          <Form.Item
            label={
              <div className="flex items-center justify-between">
                <span>Top-K (返回结果数量)</span>
                <Text type="secondary" className="text-sm">
                  {form.getFieldValue('topK') || initialValues.topK}
                </Text>
              </div>
            }
            name="topK"
            rules={[{ required: true, message: '请输入 Top-K 值' }]}
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
                <span>相似度阈值</span>
                <Text type="secondary" className="text-sm">
                  {(form.getFieldValue('similarityThreshold') || initialValues.similarityThreshold).toFixed(2)}
                </Text>
              </div>
            }
            name="similarityThreshold"
            rules={[{ required: true, message: '请输入相似度阈值' }]}
            extra="低于此阈值的检索结果将被过滤"
          >
            <Slider
              min={0}
              max={1}
              step={0.05}
              marks={{
                0: '0',
                0.5: '0.5',
                0.7: '0.7',
                1: '1',
              }}
              tooltip={{ formatter: (value) => value?.toFixed(2) }}
            />
          </Form.Item>
        </Card>

        <Card size="small" title="分块设置" className="mb-4">
          <Form.Item
            label="最大分块大小 (字符数)"
            name="maxChunkSize"
            rules={[{ required: true, message: '请输入最大分块大小' }]}
            extra="每个文本片段的最大字符数"
          >
            <AntSpace.Compact style={{ width: '100%' }}>
              <InputNumber
                min={100}
                max={2000}
                step={50}
                style={{ flex: 1 }}
              />
              <div className="flex items-center px-3 bg-gray-50 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-500">
                字符
              </div>
            </AntSpace.Compact>
          </Form.Item>

          <Form.Item
            label="分块重叠"
            name="chunkOverlap"
            rules={[{ required: true, message: '请输入分块重叠值' }]}
            extra="相邻分块之间的重叠字符数"
          >
            <AntSpace.Compact style={{ width: '100%' }}>
              <InputNumber
                min={0}
                max={500}
                step={10}
                style={{ flex: 1 }}
              />
              <div className="flex items-center px-3 bg-gray-50 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-500">
                字符
              </div>
            </AntSpace.Compact>
          </Form.Item>
        </Card>

        <Card size="small" title="高级选项">
          <Form.Item
            label="混合搜索"
            name="enableHybridSearch"
            valuePropName="checked"
            extra="同时使用关键词搜索和向量搜索"
          >
            <Switch />
          </Form.Item>

          <Divider className="!my-4" />

          <Form.Item
            label="重排序 (Reranking)"
            name="enableReranking"
            valuePropName="checked"
            extra="对检索结果进行重排序以提高相关性"
          >
            <Switch defaultChecked />
          </Form.Item>
        </Card>
      </Form>
    </div>
  )
}
