import { notFound } from 'next/navigation'
import { FileUpload } from '@/app/components/file-upload'
import { FileList } from '@/app/components/file-list'
import { getFiles } from '@/app/actions/knowledge-file'
import { createClient } from '@/lib/supabase/server'

interface KnowledgeBaseDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function KnowledgeBaseDetailPage({
  params,
}: KnowledgeBaseDetailPageProps) {
  const { id } = await params

  const supabase = await createClient()

  // 验证知识库存在且属于当前用户
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return notFound()
  }

  const { data: kb, error: kbError } = await supabase
    .from('knowledge_bases')
    .select('id, name, description')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (kbError || !kb) {
    return notFound()
  }

  // 获取文件列表
  const { data: files, error: filesError } = await getFiles(id)

  if (filesError) {
    console.error('Failed to fetch files:', filesError)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold mb-1">{kb.name}</h1>
            {kb.description && (
              <p className="text-sm text-gray-500">{kb.description}</p>
            )}
          </div>
          <FileUpload knowledgeBaseId={id} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <h2 className="text-sm font-medium text-gray-700 mb-4">
          文件列表
        </h2>
        <FileList
          files={files ?? []}
          knowledgeBaseId={id}
        />
      </div>
    </div>
  )
}
