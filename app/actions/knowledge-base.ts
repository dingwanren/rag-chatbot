'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { KnowledgeBase as DbKnowledgeBase } from '@/lib/supabase/types'
import type { KnowledgeBase } from '@/types'

async function toKnowledgeBase(db: DbKnowledgeBase, supabase: any): Promise<KnowledgeBase> {
  // 获取该知识库下的文件数量
  const { count } = await supabase
    .from('knowledge_files')
    .select('*', { count: 'exact', head: true })
    .eq('knowledge_base_id', db.id)
    .eq('status', 'processed')

  return {
    id: db.id,
    name: db.name,
    description: db.description ?? undefined,
    createdAt: new Date(db.created_at),
    documentCount: count ?? 0,
  }
}

/**
 * 获取单个知识库信息
 */
export async function getKnowledgeBase(id: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('未授权')
  }

  const { data, error } = await supabase
    .from('knowledge_bases')
    .select('id, user_id, name, description, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (error) {
    return { data: null, error: new Error(`获取知识库失败：${error.message}`) }
  }

  return { data: await toKnowledgeBase(data, supabase), error: null }
}

/**
 * 获取知识库列表（当前用户，status = 'active'，按 created_at 倒序）
 */
export async function getKnowledgeBases() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('未授权')
  }

  const { data, error } = await supabase
    .from('knowledge_bases')
    .select('id, user_id, name, description, created_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: new Error(`获取知识库列表失败：${error.message}`) }
  }

  // 并行获取每个知识库的文档数量
  const knowledgeBases = await Promise.all(
    (data ?? []).map((kb) => toKnowledgeBase(kb, supabase))
  )
  return { data: knowledgeBases, error: null }
}

/**
 * 创建知识库
 */
export async function createKnowledgeBase(name: string, description?: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('未授权')
  }

  const { data, error } = await supabase
    .from('knowledge_bases')
    .insert({
      user_id: user.id,
      name,
      description: description ?? null,
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: new Error(`创建知识库失败：${error.message}`) }
  }

  revalidatePath('/')

  return { data: await toKnowledgeBase(data, supabase), error: null }
}

/**
 * 重命名知识库
 */
export async function renameKnowledgeBase(id: string, name: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('未授权')
  }

  const { data, error } = await supabase
    .from('knowledge_bases')
    .update({ name })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { data: null, error: new Error(`重命名知识库失败：${error.message}`) }
  }

  if (!data) {
    return { data: null, error: new Error('知识库不存在或无权限') }
  }

  revalidatePath('/')

  return { data: await toKnowledgeBase(data, supabase), error: null }
}

/**
 * 删除知识库（软删除：将 status 改为 'deleted'，同时删除 Pinecone 向量）
 */
export async function deleteKnowledgeBase(id: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('未授权')
  }

  // 1. 先获取知识库信息（用于删除 Pinecone 向量）
  const { data: kb, error: kbError } = await supabase
    .from('knowledge_bases')
    .select('id, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (kbError || !kb) {
    return { data: null, error: new Error('知识库不存在或无权限') }
  }

  // 2. 获取该知识库下的所有文件（用于删除 Pinecone 向量）
  const { data: files } = await supabase
    .from('knowledge_files')
    .select('id')
    .eq('knowledge_base_id', id)

  // 3. 软删除知识库
  const { data, error } = await supabase
    .from('knowledge_bases')
    .update({ status: 'deleted' })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { data: null, error: new Error(`删除知识库失败：${error.message}`) }
  }

  if (!data) {
    return { data: null, error: new Error('知识库不存在或无权限') }
  }

  // 4. 删除 Pinecone 中的向量（使用 knowledgeBaseId filter）
  try {
    const { deletePineconeKnowledgeBaseVectors } = await import('@/lib/pinecone')
    await deletePineconeKnowledgeBaseVectors(id)
    console.log('Pinecone vectors deleted for knowledgeBaseId:', id)
  } catch (pineconeError) {
    console.error('Pinecone delete error:', pineconeError)
    // Pinecone 删除失败不影响整体流程
  }

  // 5. 删除数据库中的文件记录
  if (files && files.length > 0) {
    await supabase
      .from('knowledge_files')
      .delete()
      .eq('knowledge_base_id', id)
  }

  revalidatePath('/')

  return { data: await toKnowledgeBase(data, supabase), error: null }
}
