'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { KnowledgeBase as DbKnowledgeBase } from '@/lib/supabase/types'
import type { KnowledgeBase } from '@/types'

function toKnowledgeBase(db: DbKnowledgeBase): KnowledgeBase {
  return {
    id: db.id,
    name: db.name,
    description: db.description ?? undefined,
    createdAt: new Date(db.created_at),
    documentCount: 0,
  }
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

  const knowledgeBases = (data ?? []).map(toKnowledgeBase)
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

  return { data: toKnowledgeBase(data), error: null }
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

  return { data: toKnowledgeBase(data), error: null }
}

/**
 * 删除知识库（软删除：将 status 改为 'deleted'）
 */
export async function deleteKnowledgeBase(id: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('未授权')
  }

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

  revalidatePath('/')

  return { data: toKnowledgeBase(data), error: null }
}
