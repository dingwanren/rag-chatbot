'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { KnowledgeFile } from '@/types'
import { processFile } from '@/lib/process-file'
import { analyzePdf } from '@/lib/pdf-analyzer'

/**
 * PDF 质量检测结果
 */
export interface PdfQualityCheckResult {
  status: 'success' | 'warning' | 'error'
  message?: string
  textLength?: number
}

/**
 * 分析 PDF 文件质量（Server Action）
 */
export async function analyzePdfAction(file: File): Promise<PdfQualityCheckResult> {
  return analyzePdf(file)
}

/**
 * 上传文件到 Supabase Storage 并写入数据库
 * @param knowledgeBaseId - 知识库 ID
 * @param file - 文件
 * @param skipQualityCheck - 是否跳过质量检测（用于用户确认 warning 后）
 */
export async function uploadKnowledgeFile(
  knowledgeBaseId: string,
  file: File,
  skipQualityCheck: boolean = false
): Promise<{ 
  data: KnowledgeFile | null
  error: Error | null
  qualityCheck?: PdfQualityCheckResult
}> {
  try {
    const supabase = await createClient()

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return { data: null, error: new Error('未授权') }
    }

    if (!file || !knowledgeBaseId) {
      return { data: null, error: new Error('文件和信息不能为空') }
    }

    // 🎯 1. PDF 质量检测（除非跳过）
    let qualityCheck: PdfQualityCheckResult | undefined
    
    if (!skipQualityCheck && file.type === 'application/pdf') {
      qualityCheck = await analyzePdf(file)
      console.log('[Upload] PDF 质量检测结果:', qualityCheck)

      // 如果检测失败，直接返回
      if (qualityCheck.status === 'error') {
        return {
          data: null,
          error: new Error(qualityCheck.message),
          qualityCheck,
        }
      }

      // 如果是 warning，返回给前端让用户决定
      if (qualityCheck.status === 'warning') {
        return {
          data: null,
          error: new Error('warning'), // 特殊标记
          qualityCheck,
        }
      }
    }

    // 2. 验证知识库属于当前用户
    const { data: kb, error: kbError } = await supabase
      .from('knowledge_bases')
      .select('id, user_id')
      .eq('id', knowledgeBaseId)
      .eq('user_id', user.id)
      .single()

    if (kbError || !kb) {
      console.error('KB check error:', kbError)
      return { data: null, error: new Error('知识库不存在或无权限') }
    }

    // 上传到 Supabase Storage
    const timestamp = Date.now()
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${user.id}/${knowledgeBaseId}/${timestamp}-${safeFileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('rag-files')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { data: null, error: new Error(`上传失败：${uploadError.message}`) }
    }

    // 获取 public URL
    const { data: urlData } = supabase.storage
      .from('rag-files')
      .getPublicUrl(path)

    const fileUrl = urlData?.publicUrl

    // 插入数据库 knowledge_files 表
    const { data: dbData, error: dbError } = await supabase
      .from('knowledge_files')
      .insert({
        knowledge_base_id: knowledgeBaseId,
        file_name: file.name,
        file_url: fileUrl,
        file_size: file.size,
        status: 'pending',
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB insert error:', dbError)
      // 回滚：删除已上传的文件
      await supabase.storage.from('rag-files').remove([path])
      return { data: null, error: new Error(`数据库写入失败：${dbError.message}`) }
    }

    // 文件上传成功后，异步调用 processFile 解析 PDF 文本
    const insertedFile = dbData as KnowledgeFile
    console.log('=== 开始异步处理上传的 PDF 文件，fileId:', insertedFile.id, '===')

    // 先更新状态为 processing
    await supabase
      .from('knowledge_files')
      .update({ status: 'processing' })
      .eq('id', insertedFile.id)

    // 🥇 Step 4: 优化异步处理，确保状态一定会更新
    processFile(insertedFile.id)
      .then((text) => {
        console.log('=== PDF 处理完成，文本长度:', text.length, '===')
        // 更新状态为 completed
        return supabase
          .from('knowledge_files')
          .update({ status: 'completed' })
          .eq('id', insertedFile.id)
      })
      .catch((processError) => {
        console.error('File processing error:', processError)
        // 处理失败，更新状态为 failed
        return supabase
          .from('knowledge_files')
          .update({ status: 'failed' })
          .eq('id', insertedFile.id)
      })

    revalidatePath(`/knowledge-bases/${knowledgeBaseId}`)

    return {
      data: insertedFile,
      error: null,
      qualityCheck,
    }
  } catch (e) {
    console.error('upload error:', e)
    return { data: null, error: new Error(`上传失败：${e instanceof Error ? e.message : '未知错误'}`) }
  }
}

/**
 * 上传文件到 Supabase Storage 并写入数据库 (FormData version for backward compatibility)
 */
export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File
  const knowledgeBaseId = formData.get('knowledgeBaseId') as string
  return uploadKnowledgeFile(knowledgeBaseId, file)
}

/**
 * 获取知识库下的文件列表
 */
export async function getFiles(knowledgeBaseId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: new Error('未授权') }
  }

  // 验证知识库属于当前用户
  const { data: kb, error: kbError } = await supabase
    .from('knowledge_bases')
    .select('id, user_id')
    .eq('id', knowledgeBaseId)
    .eq('user_id', user.id)
    .single()

  if (kbError || !kb) {
    return { data: null, error: new Error('知识库不存在或无权限') }
  }

  const { data, error } = await supabase
    .from('knowledge_files')
    .select('id, knowledge_base_id, file_name, file_url, file_size, status, created_at')
    .eq('knowledge_base_id', knowledgeBaseId)
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: new Error(`获取文件列表失败：${error.message}`) }
  }

  return { data: data as KnowledgeFile[], error: null }
}

/**
 * 删除文件（Storage + 数据库 + Pinecone 向量）
 */
export async function deleteKnowledgeFile(fileId: string): Promise<{ success: boolean; error?: Error }> {
  try {
    const supabase = await createClient()

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      throw new Error('未授权')
    }

    // 1️⃣ 查询文件信息（使用 file_url）
    const { data: file, error: fileError } = await supabase
      .from('knowledge_files')
      .select('id, knowledge_base_id, file_url')
      .eq('id', fileId)
      .single()

    if (fileError || !file) {
      console.error('File query error:', fileError)
      throw new Error('文件不存在')
    }

    // 2️⃣ 验证知识库属于当前用户
    const { data: kb, error: kbError } = await supabase
      .from('knowledge_bases')
      .select('id, user_id')
      .eq('id', file.knowledge_base_id)
      .eq('user_id', user.id)
      .single()

    if (kbError || !kb) {
      console.error('KB permission error:', kbError)
      throw new Error('无权限删除此文件')
    }

    // 3️⃣ 从 file_url 提取 storage path
    // URL format: https://<project>.supabase.co/storage/v1/object/public/rag-files/<path>
    const urlParts = file.file_url.split('/rag-files/')
    if (urlParts.length < 2) {
      throw new Error('Invalid file URL format')
    }
    const storagePath = urlParts[1]

    // 4️⃣ 删除 Supabase Storage 文件
    const { data, error: storageError } = await supabase.storage
      .from('rag-files')
      .remove([storagePath])

    console.log('删除结果:', data, storageError)
    if (storageError) {
      console.error('Storage delete error:', storageError)
      throw new Error(`删除存储文件失败：${storageError.message}`)
    }

    // 5️⃣ 删除数据库记录
    const { error: dbError } = await supabase
      .from('knowledge_files')
      .delete()
      .eq('id', fileId)

    if (dbError) {
      console.error('DB delete error:', dbError)
      throw new Error(`删除数据库记录失败：${dbError.message}`)
    }

    // 6️⃣ 删除 Pinecone 中的向量
    try {
      const { deletePineconeVectors } = await import('@/lib/pinecone')
      await deletePineconeVectors(fileId)
      console.log('Pinecone vectors deleted for fileId:', fileId)
    } catch (pineconeError) {
      // Pinecone 删除失败不影响整体流程，仅记录日志
      console.error('Pinecone delete error:', pineconeError)
    }

    revalidatePath(`/knowledge-bases/${file.knowledge_base_id}`)

    return { success: true }
  } catch (e) {
    console.error('deleteKnowledgeFile error:', e)
    return { success: false, error: e instanceof Error ? e : new Error('删除失败') }
  }
}
