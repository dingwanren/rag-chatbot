'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteKnowledgeFile as deleteFile } from '@/app/actions/knowledge-file'
import type { KnowledgeFile } from '@/lib/supabase/types'

interface FileListProps {
  files: KnowledgeFile[]
  knowledgeBaseId: string
  onFileDeleted?: () => void
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function FileList({ files, knowledgeBaseId, onFileDeleted }: FileListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = (fileId: string, fileName: string) => {
    if (!confirm(`确定要删除 "${fileName}" 吗？`)) return

    setDeletingId(fileId)

    startTransition(async () => {
      const { success, error } = await deleteFile(fileId)

      if (error) {
        alert(`删除失败：${error.message}`)
        setDeletingId(null)
      } else {
        // 通知父组件刷新列表
        onFileDeleted?.()
        router.refresh()
      }
    })
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-sm">暂无文件</p>
        <p className="text-xs mt-1">点击上方按钮上传 PDF 文件</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium truncate">{file.file_name}</span>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
              <span>{formatFileSize(file.file_size)}</span>
              <span>{formatDate(file.created_at)}</span>
              <span
                className={`
                  px-1.5 py-0.5 rounded text-xs
                  ${file.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : file.status === 'processing'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                  }
                `}
              >
                {file.status === 'pending' ? '待处理' : file.status}
              </span>
            </div>
          </div>
          <button
            onClick={() => handleDelete(file.id, file.file_name)}
            disabled={isPending || deletingId === file.id}
            className={`
              ml-4 px-3 py-1.5 text-sm rounded-md transition-colors
              ${deletingId === file.id
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
              }
            `}
          >
            {deletingId === file.id ? '删除中...' : '删除'}
          </button>
        </div>
      ))}
    </div>
  )
}
