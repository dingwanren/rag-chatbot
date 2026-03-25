'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { KnowledgeFile } from '@/types'
import { processFile } from '@/lib/process-file'

/**
 * 上传文件到 Supabase Storage 并写入数据库
 */
export async function uploadKnowledgeFile(
  knowledgeBaseId: string,
  file: File
): Promise<{ data: KnowledgeFile | null; error: Error | null }> {
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

    // 验证知识库属于当前用户
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

    // 文件上传成功后，调用 processFile 解析 PDF 文本
    const insertedFile = dbData as KnowledgeFile
    console.log('=== 开始处理上传的 PDF 文件，fileId:', insertedFile.id, '===')
    try {
      const text = await processFile(insertedFile.id)
      console.log('=== PDF 处理完成，文本长度:', text.length, '===')
      // 更新状态为 processed
      await supabase
        .from('knowledge_files')
        .update({ status: 'processed' })
        .eq('id', insertedFile.id)
    } catch (processError) {
      console.error('File processing error:', processError)
      // 处理失败不影响上传流程，仅记录日志
    }

    revalidatePath(`/knowledge-base/${knowledgeBaseId}`)

    return { data: insertedFile, error: null }
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
 * 删除文件（Storage + 数据库）
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

    revalidatePath(`/knowledge-base/${file.knowledge_base_id}`)

    return { success: true }
  } catch (e) {
    console.error('deleteKnowledgeFile error:', e)
    return { success: false, error: e instanceof Error ? e : new Error('删除失败') }
  }
}
