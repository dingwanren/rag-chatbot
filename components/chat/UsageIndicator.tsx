'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { Progress, Tooltip, Alert } from 'antd'
import { WarningOutlined } from '@ant-design/icons'

interface UsageIndicatorProps {
  realtimeUsage?: {
    daily_tokens: number
    daily_requests: number
  } | null
}

/**
 * 限额使用情况显示组件
 * 显示用户今日的 token 和请求次数使用情况
 * 
 * 使用方式：
 * 1. 优先使用 realtimeUsage（从 API 返回）
 * 2. 如果没有 realtimeUsage，从数据库加载
 */
export function UsageIndicator({ realtimeUsage }: UsageIndicatorProps) {
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

  // 当实时 usage 更新时，优先使用实时数据
  useEffect(() => {
    if (realtimeUsage) {
      setUsage(prev => {
        if (!prev) return null
        return {
          ...prev,
          used_tokens: realtimeUsage.daily_tokens,
          used_requests: realtimeUsage.daily_requests,
        }
      })
    }
  }, [realtimeUsage])

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
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()

      // 从 user_limits 表获取限额
      const { data: limits } = await supabase
        .from('user_limits')
        .select('daily_token_limit, daily_request_limit')
        .eq('user_id', user.id)
        .single()

      // 从 user_usage 表获取使用量（包含 daily_tokens 和 daily_requests）
      const { data: usage } = await supabase
        .from('user_usage')
        .select('daily_tokens, daily_requests')
        .eq('user_id', user.id)
        .single()

      if (profile && limits) {
        setUsage({
          plan: profile.plan,
          used_requests: usage?.daily_requests ?? 0,
          request_limit: limits.daily_request_limit ?? 100,
          used_tokens: usage?.daily_tokens ?? 0,
          token_limit: limits.daily_token_limit ?? 10000,
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

  const currentTokens = realtimeUsage?.daily_tokens ?? usage.used_tokens
  const currentRequests = realtimeUsage?.daily_requests ?? usage.used_requests

  const tokenPercentage = Math.round((currentTokens / usage.token_limit) * 100)
  const requestPercentage = Math.round((currentRequests / usage.request_limit) * 100)

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'red'
    if (percentage >= 80) return 'orange'
    return 'blue'
  }

  const remainingTokens = usage.token_limit - currentTokens

  return (
    <div className="flex flex-col gap-2 text-xs">
      {/* 计划等级 */}
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          usage.plan === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {usage.plan === 'pro' ? '🚀 Pro' : '😊 Free'}
        </span>
        <span className="text-gray-500">
          今日剩余：<strong className={remainingTokens < usage.token_limit * 0.2 ? 'text-red-600' : ''}>
            {remainingTokens}
          </strong> tokens
        </span>
      </div>

      {/* Token 使用进度条 */}
      <div className="flex items-center gap-2">
        <Tooltip title={`Token：${currentTokens}/${usage.token_limit}`} styles={{ root: { maxWidth: '200px' } }}>
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
          {currentTokens}/{usage.token_limit}
        </span>
      </div>

      {/* 请求次数进度条 */}
      <div className="flex items-center gap-2">
        <Tooltip title={`请求次数：${currentRequests}/${usage.request_limit}`} styles={{ root: { maxWidth: '200px' } }}>
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
          {currentRequests}/{usage.request_limit}
        </span>
      </div>

      {/* 提示：超过 80% 显示警告 */}
      {tokenPercentage >= 80 || requestPercentage >= 80 ? (
        <Alert
          type="warning"
          message={
            <div className="text-xs">
              <WarningOutlined className="mr-1" />
              额度即将用完，请考虑升级账户
            </div>
          }
          className="mt-1"
          showIcon
        />
      ) : null}
    </div>
  )
}
