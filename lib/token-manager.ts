import { createClient } from './supabase/server'

/**
 * Token 限额配置
 */
export const TOKEN_LIMITS = {
  FREE_USER: 10000,      // 免费用户每日限额
  PRO_USER: 100000,      // Pro 用户每日限额
  SUPER_USER: 999999999, // Super 用户（无限）
}

/**
 * 估算 token 数量（简化版本，不依赖 tiktoken）
 * @param text - 文本内容
 * @returns 估算的 token 数
 */
export function estimateTokens(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const otherChars = text.length - chineseChars

  // 中文约 1.5 token/字，英文约 4 字符/token
  const estimated = Math.ceil(chineseChars * 1.5 + otherChars / 4)

  // 添加 500 作为 completion buffer
  return estimated + 500
}

/**
 * 记录 token 使用日志
 * @param userId - 用户 ID
 * @param chatId - 聊天 ID
 * @param usage - token 使用详情
 * @param model - 使用的模型
 */
export async function recordTokenUsage(
  userId: string,
  chatId: string,
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  },
  model: string = 'unknown'
) {
  const supabase = await createClient()

  const { error } = await supabase.from('token_logs').insert({
    user_id: userId,
    chat_id: chatId,
    prompt_tokens: usage.prompt_tokens,
    completion_tokens: usage.completion_tokens,
    total_tokens: usage.total_tokens,
    model,
  })

  if (error) {
    console.error('[recordTokenUsage] Error:', error)
    // 不阻断主流程
  }
}

/**
 * 获取用户今日 token 使用统计
 * @param userId - 用户 ID
 */
export async function getTokenUsageStats(userId: string) {
  const supabase = await createClient()

  // 获取用户等级
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan')
    .eq('user_id', userId)
    .single()

  const plan = profile?.plan || 'free'
  const limit = TOKEN_LIMITS[plan.toUpperCase() as keyof typeof TOKEN_LIMITS] || TOKEN_LIMITS.FREE_USER

  // 获取使用量
  const { data: usage } = await supabase
    .from('user_usage')
    .select('daily_tokens')
    .eq('user_id', userId)
    .single()

  return {
    plan,
    limit,
    used: usage?.daily_tokens ?? 0,
    remaining: limit - (usage?.daily_tokens ?? 0),
    percentage: Math.min(((usage?.daily_tokens ?? 0) / limit) * 100, 100),
  }
}
