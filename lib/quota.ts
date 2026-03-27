import { createClient } from './supabase/server'
import type { UserLimits, UserProfile } from './supabase/types'
import type { QuotaErrorDetails } from './error-types'

/**
 * 默认限额配置（按用户等级）
 * free: 10k tokens, 20 requests
 * pro: 100k tokens, 100 requests
 * super: unlimited
 */
export const DEFAULT_LIMITS: Record<'free' | 'pro' | 'super', {
  daily_token_limit: number
  daily_request_limit: number
}> = {
  free: { daily_token_limit: 10000, daily_request_limit: 20 },
  pro: { daily_token_limit: 100000, daily_request_limit: 100 },
  super: { daily_token_limit: 999999999, daily_request_limit: 999999999 }, // 无限制
}

/**
 * 限额检查结果
 */
export interface LimitCheckResult {
  success: boolean
  error?: string
  errorType?: 'requests' | 'tokens'
  details?: QuotaErrorDetails
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('未登录或会话已过期')
  }

  return user
}

/**
 * 获取用户等级（plan）
 * @param userId - 用户 ID
 */
export async function getUserPlan(userId: string): Promise<'free' | 'pro' | 'super'> {
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('plan')
    .eq('user_id', userId)
    .single()

  if (error || !profile) {
    // 如果没有找到 profile，默认为 free
    return 'free'
  }

  return profile.plan
}

/**
 * 获取或创建用户限额记录
 * @param userId - 用户 ID
 */
export async function getOrCreateUserLimits(userId: string): Promise<UserLimits> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // 尝试获取现有记录
  const { data: existingLimits, error: fetchError } = await supabase
    .from('user_limits')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existingLimits && !fetchError) {
    return existingLimits
  }

  // 如果没有记录，创建新的
  const { data: newLimits, error: createError } = await supabase
    .from('user_limits')
    .insert({
      user_id: userId,
      daily_token_limit: DEFAULT_LIMITS.free.daily_token_limit,
      daily_request_limit: DEFAULT_LIMITS.free.daily_request_limit,
      used_tokens_today: 0,
      used_requests_today: 0,
      last_reset_date: today,
    })
    .select()
    .single()

  if (createError || !newLimits) {
    throw new Error('无法创建用户限额记录')
  }

  return newLimits
}

/**
 * 检查并重置每日限额（如果需要）
 * @param limits - 当前限额记录
 */
function shouldResetLimits(limits: UserLimits): boolean {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  return limits.last_reset_date !== today
}

/**
 * 重置每日限额
 * @param userId - 用户 ID
 * @param plan - 用户等级
 */
export async function resetDailyLimits(userId: string, plan: 'free' | 'pro' | 'super'): Promise<void> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const limits = DEFAULT_LIMITS[plan]

  const { error } = await supabase
    .from('user_limits')
    .update({
      used_tokens_today: 0,
      used_requests_today: 0,
      last_reset_date: today,
      daily_token_limit: limits.daily_token_limit,
      daily_request_limit: limits.daily_request_limit,
    })
    .eq('user_id', userId)

  if (error) {
    throw new Error('重置每日限额失败')
  }
}

/**
 * 检查用户限额并更新使用量
 * @param userId - 用户 ID
 * @param plan - 用户等级
 * @param totalTokens - 本次请求消耗的 token 数
 * @returns { success: boolean; error?: string }
 */
export async function checkAndUpdateLimits(
  userId: string,
  plan: 'free' | 'pro' | 'super',
  totalTokens: number
): Promise<LimitCheckResult> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // 获取当前限额记录
  const { data: limits, error: fetchError } = await supabase
    .from('user_limits')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (fetchError || !limits) {
    // 如果没有记录，创建新的
    const defaultLimits = DEFAULT_LIMITS[plan]
    const { data: newLimits, error: createError } = await supabase
      .from('user_limits')
      .insert({
        user_id: userId,
        daily_token_limit: defaultLimits.daily_token_limit,
        daily_request_limit: defaultLimits.daily_request_limit,
        used_tokens_today: 0,
        used_requests_today: 0,
        last_reset_date: today,
      })
      .select()
      .single()

    if (createError || !newLimits) {
      return { 
        success: false, 
        error: '无法初始化用户限额',
        errorType: 'requests',
        details: {
          current: 0,
          limit: 0,
          resetTime: today,
          plan,
          type: 'requests',
        }
      }
    }

    return { success: true }
  }

  // 检查是否需要重置
  if (shouldResetLimits(limits)) {
    await resetDailyLimits(userId, plan)
    // 重新获取更新后的限额
    const { data: updatedLimits, error: refetchError } = await supabase
      .from('user_limits')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (refetchError || !updatedLimits) {
      return { success: false, error: '无法获取更新后的限额' }
    }

    // 使用更新后的限额继续检查
    return checkAndUpdateLimits(userId, plan, totalTokens)
  }

  // Super 用户跳过限额检查
  if (plan === 'super') {
    // 仍然更新使用量，但不检查限制
    const { error: updateError } = await supabase
      .from('user_limits')
      .update({
        used_tokens_today: limits.used_tokens_today + totalTokens,
        used_requests_today: limits.used_requests_today + 1,
      })
      .eq('user_id', userId)

    if (updateError) {
      console.warn('[quota] 更新 super 用户使用量失败:', updateError)
      // 不阻断流程
    }

    return { success: true }
  }

  // 检查请求次数限制
  if (limits.used_requests_today >= limits.daily_request_limit) {
    return { 
      success: false, 
      error: '今日请求次数已用完，请明天再来或升级账户',
      errorType: 'requests',
      details: {
        current: limits.used_requests_today,
        limit: limits.daily_request_limit,
        resetTime: new Date().toISOString().split('T')[0],
        plan,
        type: 'requests',
      }
    }
  }

  // 检查 token 限制
  if (limits.used_tokens_today + totalTokens > limits.daily_token_limit) {
    return { 
      success: false, 
      error: '今日 Token 额度已用完，请明天再来或升级账户',
      errorType: 'tokens',
      details: {
        current: limits.used_tokens_today,
        limit: limits.daily_token_limit,
        resetTime: new Date().toISOString().split('T')[0],
        plan,
        type: 'tokens',
      }
    }
  }

  // 更新使用量（使用原子操作避免并发问题）
  const { error: updateError } = await supabase
    .from('user_limits')
    .update({
      used_tokens_today: limits.used_tokens_today + totalTokens,
      used_requests_today: limits.used_requests_today + 1,
    })
    .eq('user_id', userId)
    .eq('used_tokens_today', limits.used_tokens_today) // 乐观锁
    .eq('used_requests_today', limits.used_requests_today)

  if (updateError) {
    // 可能是并发冲突，重试或返回错误
    console.warn('[quota] 更新限额失败:', updateError)
    return { success: false, error: '系统繁忙，请稍后重试' }
  }

  return { success: true }
}

/**
 * 记录使用日志
 * @param userId - 用户 ID
 * @param chatId - 聊天 ID
 * @param model - 使用的模型
 * @param promptTokens - 输入 token 数
 * @param completionTokens - 输出 token 数
 * @param totalTokens - 总 token 数
 * @param cost - 成本（可选）
 */
export async function recordUsage(
  userId: string,
  chatId: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
  totalTokens: number,
  cost?: number
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('usage_logs')
    .insert({
      user_id: userId,
      chat_id: chatId,
      model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      cost: cost ?? null,
    })

  if (error) {
    console.error('记录 usage_logs 失败:', error)
    // 不阻断主流程，仅记录日志
  }
}

/**
 * 获取用户今日使用情况
 * @param userId - 用户 ID
 */
export async function getUserTodayUsage(userId: string): Promise<{
  used_tokens_today: number
  used_requests_today: number
  daily_token_limit: number
  daily_request_limit: number
  plan: 'free' | 'pro' | 'super'
} | null> {
  const supabase = await createClient()

  // 获取限额
  const { data: limits, error: limitsError } = await supabase
    .from('user_limits')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (limitsError || !limits) {
    return null
  }

  // 获取用户等级
  const plan = await getUserPlan(userId)

  return {
    used_tokens_today: limits.used_tokens_today,
    used_requests_today: limits.used_requests_today,
    daily_token_limit: limits.daily_token_limit,
    daily_request_limit: limits.daily_request_limit,
    plan,
  }
}
