'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { uploadFile } from '@/app/actions/knowledge-file'

interface FileUploadProps {
  knowledgeBaseId: string
  onUploadComplete?: () => void
}

export function FileUpload({ knowledgeBaseId, onUploadComplete }: FileUploadProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  console.log('FileUpload render:', { knowledgeBaseId, isPending, error })

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileChange triggered')
    const file = e.target.files?.[0]
    if (!file) {
      console.log('No file selected')
      return
    }

    console.log('File selected:', {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    // 校验文件类型
    if (file.type !== 'application/pdf') {
      setError('只支持 PDF 文件')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setError(null)

    startTransition(async () => {
      try {
        console.log('Starting upload with knowledgeBaseId:', knowledgeBaseId)
        
        const formData = new FormData()
        formData.append('file', file)
        formData.append('knowledgeBaseId', knowledgeBaseId)

        console.log('FormData created, calling uploadFile...')

        const { data, error } = await uploadFile(formData)

        console.log('uploadFile returned:', { data, error })

        if (error) {
          console.error('Upload failed:', error)
          setError(error.message)
        } else {
          console.log('Upload success:', data)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          router.refresh()
          onUploadComplete?.()
        }
      } catch (e) {
        console.error('Unexpected error:', e)
        setError(e instanceof Error ? e.message : '上传失败')
      }
    })
  }, [knowledgeBaseId, router, onUploadComplete])

  const handleClick = useCallback(() => {
    console.log('Upload button clicked')
    if (fileInputRef.current) {
      console.log('Triggering file input click')
      fileInputRef.current.click()
    }
  }, [])

  return (
    <div className="w-full">
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          disabled={isPending}
          style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}
          id="file-upload"
        />
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className={`
            inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium
            transition-colors
            ${isPending
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
            }
          `}
        >
          {isPending ? '上传中...' : '上传 PDF 文件'}
        </button>
        {error && (
          <span className="text-sm text-red-500">{error}</span>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        只支持 PDF 格式文件
      </p>
    </div>
  )
}
