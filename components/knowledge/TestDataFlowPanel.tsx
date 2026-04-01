'use client'

import { useState } from 'react'
import { Button, Card, Divider, Space, Spin, Tag, Typography } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography

interface TestDataFlowResult {
  knowledge_chunks?: {
    status: 'success' | 'error'
    count?: number
    error?: string
    sample?: Array<{
      id: string
      file_id: string
      chunk_index: number
      contentLength: number
      metadata: any
    }>
  }
  pinecone?: {
    status: 'success' | 'error'
    count?: number
    error?: string
    sample?: Array<{
      id: string
      score: number
      metadata: {
        file_name?: string
        chunk_index?: number
        content_length?: number
      }
    }>
  }
  id_consistency?: {
    db_ids_sample: string[]
    pinecone_ids_sample: string[]
    matching_count: number
    status: string
  }
  message_sources?: {
    status: 'success' | 'error'
    count?: number
    error?: string
    sample?: Array<{
      id: string
      message_id: string
      chunk_id: string
      score: number | null
    }>
  }
  summary?: {
    overall: string
    checks: {
      knowledge_chunks: string
      pinecone: string
      id_match: string
    }
  }
}

export function TestDataFlowPanel() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<TestDataFlowResult | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/test-data-flow')
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Failed to fetch data flow:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStatus = (status: 'success' | 'error') =>
    status === 'success' ? (
      <Tag icon={<CheckCircleOutlined />} color="success">OK</Tag>
    ) : (
      <Tag icon={<CloseCircleOutlined />} color="error">ERROR</Tag>
    )

  return (
    <Card
      title="🔍 数据链路测试"
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchData}
          loading={loading}
        >
          刷新
        </Button>
      }
      style={{ marginBottom: 24 }}
      styles={{ body: { maxHeight: 500, overflowY: 'auto' } }}
    >
      {loading && !data ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>检查数据链路中...</div>
        </div>
      ) : !data ? (
        <Paragraph type="secondary">点击"刷新"按钮开始检查</Paragraph>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 总体状态 */}
          {data.summary && (
            <Card
              size="small"
              title="总体状态"
              style={{
                backgroundColor:
                  data.summary.overall.includes('✅') ? '#f6ffed' : '#fff2e8',
              }}
            >
              <Text strong style={{ fontSize: 16 }}>
                {data.summary.overall}
              </Text>
              <div style={{ margin: '8px 0' }}>
                <Tag color={data.summary.checks.knowledge_chunks === '✅' ? 'success' : 'error'}>
                  knowledge_chunks: {data.summary.checks.knowledge_chunks}
                </Tag>
                <Tag color={data.summary.checks.pinecone === '✅' ? 'success' : 'error'}>
                  Pinecone: {data.summary.checks.pinecone}
                </Tag>
                <Tag color={data.summary.checks.id_match === '✅' ? 'success' : 'error'}>
                  ID 匹配：{data.summary.checks.id_match}
                </Tag>
              </div>
            </Card>
          )}

          {/* knowledge_chunks */}
          {data.knowledge_chunks && (
            <Card
              size="small"
              title={
                <Space>
                  <span>1️⃣ knowledge_chunks 表</span>
                  {renderStatus(data.knowledge_chunks.status)}
                </Space>
              }
            >
              {data.knowledge_chunks.status === 'success' ? (
                <>
                  <Paragraph>
                    <Text strong>记录数：</Text>
                    {data.knowledge_chunks.count}
                  </Paragraph>
                  {data.knowledge_chunks.sample && data.knowledge_chunks.sample.length > 0 && (
                    <div>
                      <Text strong>样本数据：</Text>
                      <div style={{ marginTop: 8 }}>
                        {data.knowledge_chunks.sample.map((chunk) => (
                          <Card
                            key={chunk.id}
                            size="small"
                            style={{ marginBottom: 8, fontSize: 12 }}
                          >
                            <div>ID: {chunk.id}</div>
                            <div>File: {chunk.file_id}</div>
                            <div>Index: {chunk.chunk_index}</div>
                            <div>Content Length: {chunk.contentLength}</div>
                            <div>Metadata: {JSON.stringify(chunk.metadata, null, 2)}</div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Paragraph type="danger">
                  {data.knowledge_chunks.error}
                </Paragraph>
              )}
            </Card>
          )}

          {/* Pinecone */}
          {data.pinecone && (
            <Card
              size="small"
              title={
                <Space>
                  <span>2️⃣ Pinecone 向量库</span>
                  {renderStatus(data.pinecone.status)}
                </Space>
              }
            >
              {data.pinecone.status === 'success' ? (
                <>
                  <Paragraph>
                    <Text strong>向量数：</Text>
                    {data.pinecone.count}
                  </Paragraph>
                  {data.pinecone.sample && data.pinecone.sample.length > 0 && (
                    <div>
                      <Text strong>样本数据：</Text>
                      <div style={{ marginTop: 8 }}>
                        {data.pinecone.sample.map((item) => (
                          <Card
                            key={item.id}
                            size="small"
                            style={{ marginBottom: 8, fontSize: 12 }}
                          >
                            <div>ID: {item.id}</div>
                            <div>Score: {item.score}</div>
                            <div>File Name: {item.metadata.file_name}</div>
                            <div>Chunk Index: {item.metadata.chunk_index}</div>
                            <div>Content Length: {item.metadata.content_length}</div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Paragraph type="danger">{data.pinecone.error}</Paragraph>
              )}
            </Card>
          )}

          {/* ID 一致性 */}
          {data.id_consistency && (
            <Card
              size="small"
              title={
                <Space>
                  <span>3️⃣ ID 一致性检查</span>
                  <Tag color={data.id_consistency.status.includes('✅') ? 'success' : 'error'}>
                    {data.id_consistency.status}
                  </Tag>
                </Space>
              }
            >
              <Paragraph>
                <Text strong>匹配的 ID 数：</Text>
                {data.id_consistency.matching_count}
              </Paragraph>
              <Paragraph>
                <Text strong>DB IDs 样本：</Text>
                <br />
                <Text code>{data.id_consistency.db_ids_sample.join(', ')}</Text>
              </Paragraph>
              <Paragraph>
                <Text strong>Pinecone IDs 样本：</Text>
                <br />
                <Text code>{data.id_consistency.pinecone_ids_sample.join(', ')}</Text>
              </Paragraph>
            </Card>
          )}

          {/* message_sources */}
          {data.message_sources && (
            <Card
              size="small"
              title={
                <Space>
                  <span>4️⃣ message_sources 表</span>
                  {renderStatus(data.message_sources.status)}
                </Space>
              }
            >
              {data.message_sources.status === 'success' ? (
                <>
                  <Paragraph>
                    <Text strong>记录数：</Text>
                    {data.message_sources.count}
                  </Paragraph>
                  {data.message_sources.sample && data.message_sources.sample.length > 0 && (
                    <div>
                      <Text strong>样本数据：</Text>
                      <div style={{ marginTop: 8 }}>
                        {data.message_sources.sample.map((source) => (
                          <Card
                            key={source.id}
                            size="small"
                            style={{ marginBottom: 8, fontSize: 12 }}
                          >
                            <div>ID: {source.id}</div>
                            <div>Message ID: {source.message_id}</div>
                            <div>Chunk ID: {source.chunk_id}</div>
                            <div>Score: {source.score}</div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Paragraph type="danger">{data.message_sources.error}</Paragraph>
              )}
            </Card>
          )}
        </div>
      )}
    </Card>
  )
}
