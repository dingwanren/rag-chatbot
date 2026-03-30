import { createClient } from './supabase/server'
import type { ChatSummary } from './supabase/types'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

/**
 * 总结配置
 */
export const SUMMARY_CONFIG = {
  SUMMARY_INTERVAL: 10,  // 每 10 轮对话总结一次
  RECENT_MESSAGES_COUNT: 10,  // 获取最近 10 条消息
  MAX_SUMMARY_LENGTH: 100,  // 总结内容最大字数
}

/**
 * 获取聊天总结
 * @param chatId - 聊天 ID
 */
export async function getChatSummary(chatId: string): Promise<ChatSummary | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('chat_summaries')
    .select('*')
    .eq('chat_id', chatId)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

/**
 * 获取最近的消息
 * @param chatId - 聊天 ID
 * @param limit - 获取数量
 */
export async function getRecentMessages(chatId: string, limit: number = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[getRecentMessages] Error:', error)
    return []
  }

  // 反转顺序，使其按时间正序排列
  return data.reverse()
}

/**
 * 获取消息总数
 * @param chatId - 聊天 ID
 */
export async function getMessageCount(chatId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('chat_id', chatId)

  if (error) {
    console.error('[getMessageCount] Error:', error)
    return 0
  }

  return count || 0
}

/**
 * 生成对话总结的 System Prompt
 */
export function buildSummaryPrompt(messages: Array<{ role: string; content: string }>): string {
  const messagesText = messages
    .map(msg => `${msg.role === 'user' ? '用户' : '助手'}: ${msg.content}`)
    .join('\n')

  return `请总结以下对话，提取关键信息：

要求：
1. 用户信息：用户的身份、偏好、背景等
2. 当前目标：用户想要完成的任务或解决的问题
3. 重要上下文：对话中的关键事实、数据、决策等
4. 控制在 100 字以内，简洁明了
5. 使用中文总结

对话内容：
${messagesText}

总结（100 字以内）：`
}

/**
 * 调用 AI 模型生成总结
 * @param messages - 历史消息
 */
export async function generateSummaryWithAI(messages: Array<{ role: string; content: string }>): Promise<string> {
  const supabase = await createClient()

  const summaryPrompt = buildSummaryPrompt(messages)

  try {
    // 使用 DeepSeek 模型生成总结
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        messages: [
          {
            role: 'system',
            content: '你是一个专业的对话总结助手，擅长提取关键信息并生成简洁的总结。'
          },
          {
            role: 'user',
            content: summaryPrompt
          }
        ],
        model: 'deepseek-chat',
        max_tokens: 150
      }
    })

    if (error) {
      console.error('[generateSummaryWithAI] API Error:', error)
      // 降级方案：返回简化版总结
      return messages
        .slice(0, 5)
        .map(m => `${m.role}: ${m.content.slice(0, 50)}`)
        .join(' | ')
    }

    return data.choices?.[0]?.message?.content || ''
  } catch (err) {
    console.error('[generateSummaryWithAI] Exception:', err)
    return ''
  }
}

/**
 * 更新聊天总结
 * @param chatId - 聊天 ID
 * @param summaryText - 总结内容
 * @param messageCount - 消息总数
 */
export async function updateChatSummary(
  chatId: string,
  summaryText: string,
  messageCount: number
): Promise<boolean> {
  const supabase = await createClient()

  // 限制总结长度
  const trimmedSummary = summaryText.length > SUMMARY_CONFIG.MAX_SUMMARY_LENGTH
    ? summaryText.slice(0, SUMMARY_CONFIG.MAX_SUMMARY_LENGTH) + '...'
    : summaryText

  const { error } = await supabase.rpc('update_chat_summary', {
    p_chat_id: chatId,
    p_summary_text: trimmedSummary,
    p_message_count: messageCount
  })

  if (error) {
    console.error('[updateChatSummary] Error:', error)
    return false
  }

  return true
}

/**
 * 检查是否需要总结，并在需要时执行总结
 * @param chatId - 聊天 ID
 * @returns 返回总结内容（如果有）
 */
export async function checkAndUpdateSummary(chatId: string): Promise<string | null> {
  try {
    // 获取当前消息总数
    const messageCount = await getMessageCount(chatId)

    // 获取现有总结
    const existingSummary = await getChatSummary(chatId)

    // 计算自上次总结以来的新消息数
    const lastSummaryCount = existingSummary?.message_count || 0
    const newMessagesCount = messageCount - lastSummaryCount

    // 如果距离上次总结已超过设定轮数，生成新总结
    if (newMessagesCount >= SUMMARY_CONFIG.SUMMARY_INTERVAL) {
      console.log(`[Summary] Chat ${chatId}: 需要总结 (${newMessagesCount} 条新消息)`)

      // 获取最近的消息用于总结
      const recentMessages = await getRecentMessages(chatId, SUMMARY_CONFIG.SUMMARY_INTERVAL)

      if (recentMessages.length > 0) {
        // 生成总结
        const summary = await generateSummaryWithAI(recentMessages)

        if (summary) {
          // 更新总结
          const success = await updateChatSummary(chatId, summary, messageCount)

          if (success) {
            console.log(`[Summary] Chat ${chatId}: 总结已更新`)
            return summary
          }
        }
      }
    }

    return existingSummary?.summary_text || null
  } catch (error) {
    console.error('[checkAndUpdateSummary] Error:', error)
    return null
  }
}

/**
 * 构建带总结的 messages 数组
 * @param chatId - 聊天 ID
 * @param userInput - 用户当前输入
 * @param systemPrompt - 基础 System Prompt
 */
export async function buildMessagesWithSummary(
  chatId: string,
  userInput: string,
  systemPrompt: string = ''
): Promise<ChatCompletionMessageParam[]> {
  // 获取总结
  const summary = await getChatSummary(chatId)

  // 获取最近消息
  const recentMessages = await getRecentMessages(chatId, SUMMARY_CONFIG.RECENT_MESSAGES_COUNT)

  // 构建 messages
  const messages: ChatCompletionMessageParam[] = []

  // 1. System message（包含总结）
  if (summary?.summary_text) {
    messages.push({
      role: 'system',
      content: `${systemPrompt}\n\n[对话总结]\n${summary.summary_text}`
    })
  } else if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt
    })
  }

  // 2. 最近的历史消息
  recentMessages.forEach(msg => {
    messages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    })
  })

  // 3. 用户当前输入
  messages.push({
    role: 'user',
    content: userInput
  })

  return messages
}
