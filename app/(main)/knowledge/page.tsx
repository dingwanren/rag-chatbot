'use client'

import { useState } from 'react'
import { KnowledgeListView } from '@/components/knowledge/KnowledgeListView'
import { KnowledgeDetailView } from '@/components/knowledge/KnowledgeDetailView'
import { KnowledgeBase, KBFile } from '@/types'

export default function KnowledgeManagementPage() {
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<KnowledgeBase | null>(null)

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
  ]

  const mockFiles: KBFile[] = [
    {
      id: 'file-1',
      name: '产品手册.pdf',
      size: 1024 * 1024 * 2,
      type: 'application/pdf',
      knowledgeBaseId: selectedKnowledgeBase?.id || 'kb-1',
      createdAt: new Date(Date.now() - 86400000 * 2),
      status: 'success',
    },
    {
      id: 'file-2',
      name: '技术文档.docx',
      size: 1024 * 500,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      knowledgeBaseId: selectedKnowledgeBase?.id || 'kb-1',
      createdAt: new Date(Date.now() - 86400000),
      status: 'parsing',
    },
    {
      id: 'file-3',
      name: '错误日志.txt',
      size: 1024 * 100,
      type: 'text/plain',
      knowledgeBaseId: selectedKnowledgeBase?.id || 'kb-1',
      createdAt: new Date(),
      status: 'failed',
      errorMessage: '文件格式解析失败',
    },
  ]

  const handleSelectKnowledgeBase = (kb: KnowledgeBase) => {
    setSelectedKnowledgeBase(kb)
  }

  const handleCreateNew = () => {
    // Mock create - in real app, this would open a modal or navigate to create page
    console.log('Create new knowledge base')
  }

  const handleUpload = (files: File[]) => {
    console.log('Uploading files:', files)
    // In real app, this would call an API
  }

  const handleDeleteFile = (fileId: string) => {
    console.log('Deleting file:', fileId)
    // In real app, this would call an API
  }

  const handleRetryParse = (fileId: string) => {
    console.log('Retrying parse:', fileId)
    // In real app, this would call an API
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel - Knowledge base list */}
      <KnowledgeListView
        knowledgeBases={mockKnowledgeBases}
        selectedId={selectedKnowledgeBase?.id}
        onSelect={handleSelectKnowledgeBase}
        onCreateNew={handleCreateNew}
      />

      {/* Right panel - Knowledge base detail */}
      <div className="flex-1 hidden md:block overflow-hidden">
        {selectedKnowledgeBase ? (
          <KnowledgeDetailView
            knowledgeBaseId={selectedKnowledgeBase.id}
            knowledgeBaseName={selectedKnowledgeBase.name}
            files={mockFiles}
            onUpload={handleUpload}
            onDeleteFile={handleDeleteFile}
            onRetryParse={handleRetryParse}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center text-gray-400">
              <p className="text-lg mb-2">未选择知识库</p>
              <p className="text-sm">请从左侧选择一个知识库进行管理</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile detail view - shown when knowledge base is selected */}
      {selectedKnowledgeBase && (
        <div className="md:hidden fixed inset-0 bg-white z-40 overflow-hidden">
          <KnowledgeDetailView
            knowledgeBaseId={selectedKnowledgeBase.id}
            knowledgeBaseName={selectedKnowledgeBase.name}
            files={mockFiles}
            onUpload={handleUpload}
            onDeleteFile={handleDeleteFile}
            onRetryParse={handleRetryParse}
          />
        </div>
      )}
    </div>
  )
}
