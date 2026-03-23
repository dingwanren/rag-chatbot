'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  getKnowledgeBases,
  createKnowledgeBase,
  renameKnowledgeBase,
  deleteKnowledgeBase,
} from '@/app/actions/knowledge-base'
import type { KnowledgeBase } from '@/types'

interface KnowledgeBaseListProps {
  selectedId?: string
  onSelect?: (kb: KnowledgeBase) => void
}

export function KnowledgeBaseList({ selectedId, onSelect }: KnowledgeBaseListProps) {
  const router = useRouter()
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [selectedKbForAction, setSelectedKbForAction] = useState<KnowledgeBase | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Load knowledge bases
  useEffect(() => {
    loadKnowledgeBases()
  }, [])

  const loadKnowledgeBases = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await getKnowledgeBases()
      if (error) {
        setError(error.message)
      } else {
        setKnowledgeBases(data ?? [])
      }
    } catch (e) {
      setError('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreateModal = () => {
    setInputValue('')
    setShowCreateModal(true)
  }

  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
    setInputValue('')
  }

  const handleCreate = () => {
    if (!inputValue.trim()) return

    startTransition(async () => {
      const { data, error } = await createKnowledgeBase(inputValue.trim())
      if (error) {
        setError(error.message)
      } else {
        handleCloseCreateModal()
        router.refresh()
        loadKnowledgeBases()
        if (data && onSelect) {
          onSelect(data)
        }
      }
    })
  }

  const handleOpenRenameModal = (kb: KnowledgeBase) => {
    setSelectedKbForAction(kb)
    setInputValue(kb.name)
    setShowRenameModal(true)
  }

  const handleCloseRenameModal = () => {
    setShowRenameModal(false)
    setSelectedKbForAction(null)
    setInputValue('')
  }

  const handleRename = () => {
    if (!inputValue.trim() || !selectedKbForAction) return

    startTransition(async () => {
      const { data, error } = await renameKnowledgeBase(
        selectedKbForAction.id,
        inputValue.trim()
      )
      if (error) {
        setError(error.message)
      } else {
        handleCloseRenameModal()
        router.refresh()
        loadKnowledgeBases()
      }
    })
  }

  const handleDelete = (kb: KnowledgeBase) => {
    if (!confirm(`确定要删除"${kb.name}"吗？此操作不可恢复。`)) return

    startTransition(async () => {
      const { data, error } = await deleteKnowledgeBase(kb.id)
      if (error) {
        setError(error.message)
      } else {
        router.refresh()
        loadKnowledgeBases()
        if (selectedId === kb.id && onSelect) {
          onSelect(null as any)
        }
      }
    })
  }

  const handleSelect = (kb: KnowledgeBase) => {
    if (onSelect) {
      onSelect(kb)
    } else {
      router.push(`/knowledge/${kb.id}`)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-full md:w-[260px] flex-shrink-0">
      {/* Header with create button */}
      <div className="p-4 border-b border-gray-200">
        <Button
          onClick={handleOpenCreateModal}
          disabled={isPending || loading}
          className="w-full h-10"
        >
          + 新建知识库
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            加载中...
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500 text-sm">{error}</div>
        ) : knowledgeBases.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
            暂无知识库
          </div>
        ) : (
          <div className="space-y-1">
            {knowledgeBases.map((kb) => (
              <div
                key={kb.id}
                className={`
                  group p-3 rounded-lg cursor-pointer transition-all duration-200 border
                  ${selectedId === kb.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'hover:bg-gray-50 border-transparent'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => handleSelect(kb)}
                  >
                    <div className="text-sm font-medium truncate">
                      {kb.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {kb.description || '暂无描述'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {kb.documentCount ?? 0} 个文档
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === kb.id ? null : kb.id)
                      }}
                      className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isPending}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 12 12">
                        <circle cx="6" cy="2" r="1.5" />
                        <circle cx="6" cy="6" r="1.5" />
                        <circle cx="6" cy="10" r="1.5" />
                      </svg>
                    </button>
                    {openMenuId === kb.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div
                          className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[120px]"
                        >
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(null)
                              handleOpenRenameModal(kb)
                            }}
                          >
                            重命名
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(null)
                              handleDelete(kb)
                            }}
                          >
                            删除
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">新建知识库</h2>
            <Input
              placeholder="输入知识库名称"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inputValue.trim()) {
                  handleCreate()
                } else if (e.key === 'Escape') {
                  handleCloseCreateModal()
                }
              }}
              disabled={isPending}
              autoFocus
            />
            <div className="flex gap-2 mt-4 justify-end">
              <Button
                variant="outline"
                onClick={handleCloseCreateModal}
                disabled={isPending}
              >
                取消
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isPending || !inputValue.trim()}
              >
                {isPending ? '创建中...' : '创建'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && selectedKbForAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">重命名知识库</h2>
            <Input
              placeholder="输入新名称"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inputValue.trim()) {
                  handleRename()
                } else if (e.key === 'Escape') {
                  handleCloseRenameModal()
                }
              }}
              disabled={isPending}
              autoFocus
            />
            <div className="flex gap-2 mt-4 justify-end">
              <Button
                variant="outline"
                onClick={handleCloseRenameModal}
                disabled={isPending}
              >
                取消
              </Button>
              <Button
                onClick={handleRename}
                disabled={isPending || !inputValue.trim()}
              >
                {isPending ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
