'use client'

import { useState } from 'react'
import { Card, Button, Input, Table, Tag, Space, message, Alert, Typography, Collapse, Tooltip } from 'antd'
import { SearchOutlined, PlayCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography

interface SearchResult {
  content: string
  score: number
  fileId: string
  chunkIndex: number
  fileName: string
}

interface DebugInfo {
  totalMatches: number
  filteredMatches: number
  knowledgeBaseId: string
  knowledgeBaseName: string
  allScores: string[]
  threshold: number
  top_k: number
}

interface RetrievalTestPanelProps {
  knowledgeBaseId: string
  config: {
    top_k: number
    threshold: number
  }
}

export function RetrievalTestPanel({ knowledgeBaseId, config }: RetrievalTestPanelProps) {
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)

  const handleTestSearch = async () => {
    if (!searchQuery.trim()) {
      message.warning('请输入测试查询词')
      return
    }

    setLoading(true)
    setSearchResults([])
    setDebugInfo(null)
    
    try {
      const startTime = Date.now()

      const response = await fetch('/api/rag/test-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          knowledgeBaseId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSearchResults(result.data.matches || [])
        
        if (result.data.matches?.length === 0) {
          const debugMsg = result.data.debug 
            ? `\n共检索到 ${result.data.debug.totalMatches} 条结果，${result.data.debug.allScores.length > 0 ? `分数：${result.data.debug.allScores.join(', ')}` : '但无匹配'}，阈值：${result.data.debug.threshold}`
            : ''
          message.info('未找到匹配结果' + debugMsg)
        } else {
          message.success(`找到 ${result.data.matches.length} 个匹配结果（耗时：${Date.now() - startTime}ms）`)
        }
        
        setDebugInfo(result.data.debug || null)
      } else {
        message.error(result.error || '检索测试失败')
      }
    } catch (error) {
      console.error('Test search error:', error)
      message.error('检索测试失败')
    } finally {
      setLoading(false)
    }
  }

  const resultsColumns = [
    {
      title: '#',
      dataIndex: 'index',
      key: 'index',
      width: 50,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: '相似度',
      key: 'score',
      width: 150,
      render: (_: unknown, record: SearchResult) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500"
              style={{ width: `${(record.score || 0) * 100}%` }}
            />
          </div>
          <Text className="text-sm" style={{ width: 50 }}>
            {(record.score || 0).toFixed(3)}
          </Text>
        </div>
      ),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: {
        showTitle: false,
      },
      render: (content: string) => (
        <Tooltip title={content} styles={{ root: { maxWidth: '600px' } }}>
          <div className="text-sm text-gray-700 line-clamp-2 break-words cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1">
            {content}
          </div>
        </Tooltip>
      ),
    },
    {
      title: '来源',
      key: 'source',
      width: 150,
      render: (_: unknown, record: SearchResult) => (
        <div className="flex flex-col gap-1">
          <Tag color="blue" className="truncate max-w-[140px]">
            {record.fileName || '未知文件'}
          </Tag>
          <Text type="secondary" className="text-xs">
            Chunk #{record.chunkIndex}
          </Text>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* 测试查询 */}
      <Card
        size="small"
        title={
          <div className="flex items-center gap-2">
            <PlayCircleOutlined className="text-blue-500" />
            <span>检索测试</span>
          </div>
        }
        extra={
          <Button
            type="primary"
            size="small"
            icon={<SearchOutlined />}
            onClick={handleTestSearch}
            loading={loading}
            disabled={!searchQuery.trim()}
          >
            测试
          </Button>
        }
      >
        <div className="space-y-2">
          <Input
            placeholder="输入测试查询词，例如：'什么是 RAG 检索？'"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onPressEnter={handleTestSearch}
            size="large"
            allowClear
          />
          <Text type="secondary" className="text-xs">
            💡 提示：输入与当前知识库内容相关的问题，测试检索效果
          </Text>
        </div>
      </Card>

      {/* 检索结果 */}
      {searchResults.length > 0 && (
        <Card
          size="small"
          title={`检索结果（共 ${searchResults.length} 条）`}
        >
          <div className="max-h-[300px] overflow-auto">
            <Table
              columns={resultsColumns}
              dataSource={searchResults}
              rowKey={(record) => `${record.fileId}-${record.chunkIndex}-${record.content.slice(0, 20)}`}
              pagination={false}
              size="small"
            />
          </div>
        </Card>
      )}

      {/* 调试信息 */}
      {debugInfo && (
        <Collapse
          items={[
            {
              key: 'debug',
              label: (
                <div className="flex items-center gap-2">
                  <InfoCircleOutlined className="text-orange-500" />
                  <Text>🔍 调试信息（查看检索详情）</Text>
                </div>
              ),
              children: (
                <div className="space-y-3 text-sm">
                  <div>
                    <Text strong>知识库：</Text>
                    <Text code>{debugInfo.knowledgeBaseName}</Text>
                    <Text type="secondary" className="ml-2">(ID: {debugInfo.knowledgeBaseId.slice(0, 8)}...)</Text>
                  </div>
                  <div>
                    <Text strong>Pinecone 返回：</Text>
                    <Text>{debugInfo.totalMatches} 条</Text>
                  </div>
                  <div>
                    <Text strong>阈值过滤后：</Text>
                    <Text>{debugInfo.filteredMatches} 条</Text>
                  </div>
                  <div>
                    <Text strong>所有匹配置信度：</Text>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {debugInfo.allScores.map((score, i) => (
                        <Tag
                          key={i}
                          color={parseFloat(score) >= debugInfo.threshold ? 'green' : 'gray'}
                        >
                          {score}
                        </Tag>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Text strong>当前配置：</Text>
                    <Space size="small">
                      <Tag color="blue">Top-K: {debugInfo.top_k}</Tag>
                      <Tag color="blue">Threshold: {debugInfo.threshold.toFixed(2)}</Tag>
                    </Space>
                    <Text type="secondary" className="ml-2">
                      ({debugInfo.allScores.filter(s => parseFloat(s) >= debugInfo.threshold).length} 条通过过滤)
                    </Text>
                  </div>
                  {debugInfo.filteredMatches === 0 && debugInfo.totalMatches > 0 && (
                    <Alert
                      title="阈值过高"
                      description="所有检索结果都被阈值过滤了。尝试降低 Threshold 值（如 0.5-0.6）或增加 Top-K 值。"
                      type="warning"
                      showIcon
                      className="mt-2"
                    />
                  )}
                </div>
              ),
            },
          ]}
          bordered={false}
        />
      )}

      {/* 无结果提示 */}
      {searchResults.length === 0 && searchQuery && !loading && (
        <Alert
          title="未找到匹配结果"
          description={
            <div className="space-y-2 text-sm">
              <div>可能的原因：</div>
              <ul className="list-disc list-inside text-gray-600">
                <li>知识库中没有相关内容</li>
                <li>相似度阈值设置过高，过滤了所有结果</li>
                <li>查询词太具体或太模糊</li>
              </ul>
              <div className="mt-2">
                <Text strong>建议：</Text>
                <ul className="list-disc list-inside text-gray-600">
                  <li>尝试降低 Threshold 值（如 0.5-0.6）</li>
                  <li>增加 Top-K 值（如 10-15）</li>
                  <li>使用不同的查询词重试</li>
                </ul>
              </div>
            </div>
          }
          type="warning"
          showIcon
        />
      )}
    </div>
  )
}
