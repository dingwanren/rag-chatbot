'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Chat } from '@/types'
import type { Message } from '@/lib/supabase/types'

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
 * 获取单个聊天信息
 */
export async function getChat(chatId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('未授权')
  }

  const { data, error } = await supabase
    .from('chats')
    .select('id, title, mode, knowledge_base_id, created_at, updated_at')
    .eq('id', chatId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    throw new Error(`获取聊天信息失败：${error.message}`)
  }

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
 * 获取单个聊天的消息列表（按 seq 升序）
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

  // 🎯 按 seq 升序排序，确保消息顺序正确
  const { data, error } = await supabase
    .from('messages')
    .select('id, chat_id, role, content, status, metadata, created_at, seq')
    .eq('chat_id', chatId)
    .order('seq', { ascending: true })

  if (error) {
    throw new Error(`获取消息失败：${error.message}`)
  }

  return data as Message[]
}

/**
 * 发送消息（创建 user message 和 assistant message 占位）
 * 返回 assistant message 的 id 用于后续 streaming 更新
 * 
 * ⚠️ 注意：assistant 消息初始状态为 'loading'，内容为"正在思考..."
 */
export async function sendMessage(chatId: string, content: string) {
  console.log('[sendMessage] Called with:', { chatId, content })

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('[sendMessage] Auth error:', authError)
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
    console.error('[sendMessage] Chat error:', chatError)
    throw new Error('聊天不存在或无权限')
  }

  // 🎯 获取当前聊天的最大 seq（用于保证消息顺序）
  const { data: maxSeqData } = await supabase
    .from('messages')
    .select('seq')
    .eq('chat_id', chatId)
    .order('seq', { ascending: false })
    .limit(1)
    .single()

  const nextSeq = (maxSeqData?.seq ?? 0) + 1

  // 尝试调用 RPC 函数（如果存在）
  const { data: rpcData, error: rpcError } = await supabase.rpc('create_message_pair', {
    p_chat_id: chatId,
    p_user_content: content,
  })

  if (!rpcError && rpcData && rpcData.length > 0) {
    // RPC 成功，返回 assistant message id
    const assistantMessageId = rpcData[0].assistant_message_id
    console.log('[sendMessage] RPC success, assistantMessageId:', assistantMessageId)

    // 更新 user 和 assistant 消息的 seq
    await supabase
      .from('messages')
      .update({ seq: nextSeq })
      .eq('chat_id', chatId)
      .eq('role', 'user')
      .is('metadata', null) // 最新插入的 user 消息

    await supabase
      .from('messages')
      .update({ 
        seq: nextSeq + 1,
        content: '正在思考...',
        status: 'streaming',
        metadata: { loading: true }
      })
      .eq('id', assistantMessageId)

    return { assistantMessageId, chatTitle: chat.title }
  }

  console.log('[sendMessage] RPC not available, using normal insert')

  // RPC 不存在，使用普通插入（带 seq）
  const { data: insertData, error: insertError } = await supabase
    .from('messages')
    .insert([
      {
        chat_id: chatId,
        role: 'user' as const,
        content,
        status: 'completed' as const,
        seq: nextSeq,
      },
      {
        chat_id: chatId,
        role: 'assistant' as const,
        content: '正在思考...', // 🎯 显示 loading 文本
        status: 'streaming' as const,
        metadata: { loading: true } satisfies unknown, // 标记为 loading 状态
        seq: nextSeq + 1,
      },
    ])
    .select('id')

  if (insertError) {
    console.error('[sendMessage] Insert error:', insertError)
    throw new Error(`发送消息失败：${insertError.message}`)
  }

  // 返回 assistant message 的 id（第二个插入的记录）
  const assistantMessageId = insertData[1]?.id
  console.log('[sendMessage] Insert success, assistantMessageId:', assistantMessageId)
  console.log('[sendMessage] insertData:', insertData)

  return { assistantMessageId, chatTitle: chat.title }
}

/**
 * 删除消息（用于清理失败的占位消息）
 */
export async function deleteMessage(messageId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('未授权')
  }

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)

  if (error) {
    console.error('[deleteMessage] Error:', error)
    throw new Error(`删除消息失败：${error.message}`)
  }

  console.log('[deleteMessage] Success, messageId:', messageId)
}

/**
 * 更新 assistant message 的内容和状态
 * @param messageId - 消息 ID
 * @param content - 消息内容
 * @param status - 消息状态（'streaming' 或 'completed'）
 * @param sources - 引用来源（可选）
 */
export async function updateMessage(
  messageId: string,
  content: string,
  status: 'streaming' | 'completed' = 'streaming',
  sources?: { index: number; fileName?: string; page?: number }[]
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('未授权')
  }

  const { error } = await supabase
    .from('messages')
    .update({
      content,
      status,
      metadata: {
        loading: false,
        sources: sources || undefined,
      } satisfies unknown, // 移除 loading 标记，添加 sources
    })
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
