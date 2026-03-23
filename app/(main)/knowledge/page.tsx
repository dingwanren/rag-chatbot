'use client'

import { useState } from 'react'
import { KnowledgeBaseList } from '@/app/components/knowledge-base-list'
import { KnowledgeDetailView } from '@/components/knowledge/KnowledgeDetailView'
import { KnowledgeBase } from '@/types'

export default function KnowledgeManagementPage() {
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<KnowledgeBase | null>(null)

  const handleSelectKnowledgeBase = (kb: KnowledgeBase) => {
    setSelectedKnowledgeBase(kb)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel - Knowledge base list */}
      <KnowledgeBaseList
        selectedId={selectedKnowledgeBase?.id}
        onSelect={handleSelectKnowledgeBase}
      />

      {/* Right panel - Knowledge base detail */}
      <div className="flex-1 hidden md:block overflow-hidden">
        {selectedKnowledgeBase ? (
          <KnowledgeDetailView
            knowledgeBaseId={selectedKnowledgeBase.id}
            knowledgeBaseName={selectedKnowledgeBase.name}
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
          />
        </div>
      )}
    </div>
  )
}
