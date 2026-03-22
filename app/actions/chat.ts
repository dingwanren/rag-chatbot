'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Chat, Message } from '@/lib/supabase/types'

/**
 * 创建新聊天
 */
export async function createChat(
  title: string = '新对话',
  mode: 'chat' | 'rag' = 'chat',
  knowledgeBaseId?: string
) {
  const supabase = await createClient()

  // 获取当前用户（依赖 RLS）
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('未授权')
  }

  const { data, error } = await supabase
    .from('chats')
    .insert({
      user_id: user.id,
      title,
      mode,
      knowledge_base_id: knowledgeBaseId ?? null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`创建聊天失败：${error.message}`)
  }

  revalidatePath('/')
  revalidatePath('/chat/[id]')

  return data as Chat
}

/**
 * 获取聊天列表（按 updated_at 倒序）
 * 依赖 RLS：只返回当前用户的 chats
 */
export async function getChatList() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('未授权')
  }

  const { data, error } = await supabase
    .from('chats')
    .select('id, title, last_message, last_message_at, mode, knowledge_base_id, created_at, updated_at')
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`获取聊天列表失败：${error.message}`)
  }

  return data as Chat[]
}

/**
 * 获取单个聊天的消息列表（按 created_at 升序）
 * 依赖 RLS：通过 chat_id 关联，只返回当前用户的消息
 */
export async function getMessages(chatId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('未授权')
  }

  // 验证 chat 属于当前用户
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .select('id')
    .eq('id', chatId)
    .eq('user_id', user.id)
    .single()

  if (chatError || !chat) {
    throw new Error('聊天不存在或无权限')
  }

  const { data, error } = await supabase
    .from('messages')
    .select('id, chat_id, role, content, status, metadata, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`获取消息失败：${error.message}`)
  }

  return data as Message[]
}

/**
 * 发送消息（创建 user message 和 assistant message 占位）
 * 返回 assistant message 的 id 用于后续 streaming 更新
 */
export async function sendMessage(chatId: string, content: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('未授权')
  }

  // 验证 chat 属于当前用户
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .select('id, title')
    .eq('id', chatId)
    .eq('user_id', user.id)
    .single()

  if (chatError || !chat) {
    throw new Error('聊天不存在或无权限')
  }

  // 尝试调用 RPC 函数（如果存在）
  const { data: rpcData, error: rpcError } = await supabase.rpc('create_message_pair', {
    p_chat_id: chatId,
    p_user_content: content,
  })

  if (!rpcError && rpcData && rpcData.length > 0) {
    // RPC 成功，返回 assistant message id
    const assistantMessageId = rpcData[0].assistant_message_id
    return { assistantMessageId, chatTitle: chat.title }
  }

  // RPC 不存在，使用普通插入
  const { data: insertData, error: insertError } = await supabase
    .from('messages')
    .insert([
      {
        chat_id: chatId,
        role: 'user' as const,
        content,
        status: 'completed' as const,
      },
      {
        chat_id: chatId,
        role: 'assistant' as const,
        content: '',
        status: 'streaming' as const,
      },
    ])
    .select('id')

  if (insertError) {
    throw new Error(`发送消息失败：${insertError.message}`)
  }

  // 返回 assistant message 的 id（第二个插入的记录）
  const assistantMessageId = insertData[1]?.id
  return { assistantMessageId, chatTitle: chat.title }
}

/**
 * 更新 assistant message 的内容（streaming 中）
 */
export async function updateMessage(
  messageId: string,
  content: string,
  status: 'streaming' | 'completed' = 'streaming'
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('未授权')
  }

  const { error } = await supabase
    .from('messages')
    .update({ content, status })
    .eq('id', messageId)

  if (error) {
    throw new Error(`更新消息失败：${error.message}`)
  }
}

/**
 * 重命名聊天
 * 完全依赖 RLS 进行权限控制
 */
export async function renameChat(chatId: string, title: string) {
  const supabase = await createClient()

  // 获取当前用户（依赖 RLS）
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('未授权')
  }

  // 直接更新，依赖 RLS 确保用户只能更新自己的聊天
  const { data: updatedData, error: updateError } = await supabase
    .from('chats')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', chatId)
    .select('id, title')
    .single()

  if (updateError) {
    console.error('Update error:', updateError)
    throw new Error(`重命名失败：${updateError.message}`)
  }

  if (!updatedData || updatedData.title !== title) {
    throw new Error('无权限重命名此聊天')
  }

  revalidatePath('/')
  revalidatePath('/chat/[id]')

  return { success: true, chatId, title }
}

/**
 * 更新聊天标题（别名，兼容旧代码）
 */
export async function updateChatTitle(chatId: string, title: string) {
  return renameChat(chatId, title)
}

/**
 * 删除聊天
 * 利用数据库的 on delete cascade 自动删除 messages
 * 完全依赖 RLS 进行权限控制
 */
export async function deleteChat(chatId: string) {
  const supabase = await createClient()

  // 获取当前用户（依赖 RLS）
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('未授权')
  }

  // 直接删除，依赖 RLS 确保用户只能删除自己的聊天
  const { error: deleteError } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId)

  if (deleteError) {
    console.error('Delete error:', deleteError)
    throw new Error(`删除失败：${deleteError.message}`)
  }

  // 检查是否真的删除了（如果 RLS 拒绝，不会报错但也不会删除）
  const { data: checkData } = await supabase
    .from('chats')
    .select('id')
    .eq('id', chatId)
    .single()

  if (checkData) {
    throw new Error('无权限删除此聊天')
  }

  revalidatePath('/')
  revalidatePath('/chat/[id]')

  return { success: true, chatId }
}
