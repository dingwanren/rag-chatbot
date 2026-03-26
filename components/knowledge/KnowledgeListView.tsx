'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Button, Typography, Empty, Spin } from 'antd'
import { PlusOutlined, SearchOutlined, FolderOutlined } from '@ant-design/icons'
import { KnowledgeBase } from '@/types'

const { Title, Text } = Typography

interface KnowledgeListViewProps {
  knowledgeBases?: KnowledgeBase[]
  selectedId?: string
  onSelect?: (kb: KnowledgeBase) => void
  onCreateNew?: () => void
  loading?: boolean
}

// Mock data
const mockKnowledgeBases: KnowledgeBase[] = [
  {
    id: 'kb-1',
    name: '产品文档',
    description: '产品相关知识和资料',
    createdAt: new Date(),
    documentCount: 12,
  },
  {
    id: 'kb-2',
    name: '技术手册',
    description: '技术支持文档',
    createdAt: new Date(),
    documentCount: 8,
  },
  {
    id: 'kb-3',
    name: '常见问题',
    description: '客户常见问题集合',
    createdAt: new Date(),
    documentCount: 5,
  },
  {
    id: 'kb-4',
    name: '培训资料',
    description: '员工培训相关材料',
    createdAt: new Date(),
    documentCount: 20,
  },
]

export function KnowledgeListView({
  knowledgeBases = mockKnowledgeBases,
  selectedId,
  onSelect,
  onCreateNew,
  loading = false,
}: KnowledgeListViewProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredKnowledgeBases = useMemo(() => {
    if (!searchQuery.trim()) return knowledgeBases
    return knowledgeBases.filter(kb =>
      kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kb.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [knowledgeBases, searchQuery])

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew()
    } else {
      // Mock create new knowledge base
      const newKb: KnowledgeBase = {
        id: `kb-${Date.now()}`,
        name: '未命名知识库',
        description: '请输入描述',
        createdAt: new Date(),
        documentCount: 0,
      }
      router.push(`/knowledge-bases/${newKb.id}`)
    }
  }

  const handleSelect = (kb: KnowledgeBase) => {
    if (onSelect) {
      onSelect(kb)
    } else {
      router.push(`/knowledge-bases/${kb.id}`)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-full md:w-[260px] flex-shrink-0">
      {/* Header with create button */}
      <div className="p-4 border-b border-gray-200">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          block
          onClick={handleCreateNew}
          className="h-10"
        >
          + 新建知识库
        </Button>
      </div>

      {/* Search box */}
      <div className="p-3 border-b border-gray-100">
        <Input
          placeholder="搜索知识库..."
          prefix={<SearchOutlined className="text-gray-400" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
          size="middle"
        />
      </div>

      {/* Knowledge base list */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spin size="large" />
          </div>
        ) : filteredKnowledgeBases.length === 0 ? (
          <Empty
            description="暂无知识库"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className="space-y-1">
            {filteredKnowledgeBases.map((kb) => (
              <div
                key={kb.id}
                onClick={() => handleSelect(kb)}
                className={`
                  p-3 rounded-lg cursor-pointer transition-all duration-200
                  ${selectedId === kb.id
                    ? 'bg-blue-50 border-blue-200 border'
                    : 'hover:bg-gray-50 border border-transparent'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                    ${selectedId === kb.id ? 'bg-blue-100' : 'bg-gray-100'}
                  `}>
                    <FolderOutlined
                      className={`text-lg ${selectedId === kb.id ? 'text-blue-500' : 'text-gray-500'}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Title
                      level={5}
                      className="!mb-1 !text-sm font-medium truncate"
                      ellipsis={{ tooltip: kb.name }}
                    >
                      {kb.name}
                    </Title>
                    <Text
                      type="secondary"
                      className="text-xs block truncate"
                      ellipsis={{ tooltip: kb.description }}
                    >
                      {kb.description || '暂无描述'}
                    </Text>
                    <div className="mt-1 flex items-center gap-2">
                      <Text type="secondary" className="text-xs">
                        {kb.documentCount ?? 0} 个文档
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
