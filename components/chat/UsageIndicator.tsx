'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { Progress, Tooltip } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'

/**
 * 限额使用情况显示组件
 * 显示用户今日的 token 和请求次数使用情况
 */
export function UsageIndicator() {
  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState<{
    plan: string
    used_requests: number
    request_limit: number
    used_tokens: number
    token_limit: number
  } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadUsage()
  }, [])

  const loadUsage = async () => {
    try {
      // 获取当前用户
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // 获取用户等级
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('plan')
        .eq('user_id', user.id)
        .single()

      // 获取限额
      const { data: limits } = await supabase
        .from('user_limits')
        .select('used_requests_today, used_tokens_today, daily_request_limit, daily_token_limit')
        .eq('user_id', user.id)
        .single()

      if (profile && limits) {
        setUsage({
          plan: profile.plan,
          used_requests: limits.used_requests_today,
          request_limit: limits.daily_request_limit,
          used_tokens: limits.used_tokens_today,
          token_limit: limits.daily_token_limit,
        })
      }
    } catch (error) {
      console.error('Load usage error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !usage) {
    return null
  }

  // Super 用户不显示限额
  if (usage.plan === 'super') {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded text-xs font-medium">
          ⭐ Super
        </span>
        <span>无限额度</span>
      </div>
    )
  }

  const requestPercentage = Math.round((usage.used_requests / usage.request_limit) * 100)
  const tokenPercentage = Math.round((usage.used_tokens / usage.token_limit) * 100)

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'red'
    if (percentage >= 70) return 'orange'
    return 'blue'
  }

  return (
    <div className="flex flex-col gap-2 text-xs">
      {/* 计划等级 */}
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          usage.plan === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {usage.plan === 'pro' ? '🚀 Pro' : '😊 Free'}
        </span>
        <span className="text-gray-500">今日剩余：{usage.request_limit - usage.used_requests} 次请求</span>
      </div>

      {/* 请求次数进度条 */}
      <div className="flex items-center gap-2">
        <Tooltip title={`请求次数：${usage.used_requests}/${usage.request_limit}`}>
          <Progress
            percent={requestPercentage}
            strokeColor={getStatusColor(requestPercentage)}
            railColor="#f0f0f0"
            showInfo={false}
            className="!mb-0 flex-1"
            size="small"
          />
        </Tooltip>
        <span className="text-gray-500 whitespace-nowrap">
          {usage.used_requests}/{usage.request_limit}
        </span>
      </div>

      {/* Token 使用进度条 */}
      <div className="flex items-center gap-2">
        <Tooltip title={`Token：${usage.used_tokens}/${usage.token_limit}`}>
          <Progress
            percent={tokenPercentage}
            strokeColor={getStatusColor(tokenPercentage)}
            railColor="#f0f0f0"
            showInfo={false}
            className="!mb-0 flex-1"
            size="small"
          />
        </Tooltip>
        <span className="text-gray-500 whitespace-nowrap">
          {usage.used_tokens}/{usage.token_limit}
        </span>
      </div>

      {/* 提示 */}
      {requestPercentage >= 90 || tokenPercentage >= 90 ? (
        <div className="flex items-center gap-1 text-orange-600 mt-1">
          <InfoCircleOutlined />
          <span>额度即将用完，请考虑升级账户</span>
        </div>
      ) : null}
    </div>
  )
}
