'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

/**
 * 限额系统测试页面
 * 访问：http://localhost:3000/test-quota
 *
 * ⚠️ 注意：此页面仅限开发环境使用，生产环境已禁用
 */
export default function TestQuotaPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<string[]>([])
  const [userInfo, setUserInfo] = useState<any>(null)
  const [limits, setLimits] = useState<any>(null)
  const supabase = createClient()

  // 🛡️ 生产环境阻止访问
  useEffect(() => {
    // 使用 Next.js 推荐的方式检测环境
    // 在生产环境中，window.__NEXT_DATA__ 会包含 production 标志
    const isProduction = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    
    if (isProduction) {
      alert('⚠️ 测试页面仅限开发环境使用\n\n生产环境已禁用此功能')
      router.push('/')
      return
    }

    addLog('🧪 测试页面已加载')
    addLog('📝 提示：此页面仅用于开发测试，生产环境无法访问')

    // 页面加载时自动检查用户信息
    checkUser()
  }, [])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  // 获取用户信息
  const checkUser = async () => {
    addLog('🔄 检查用户登录状态...')
    
    try {
      // 先获取 session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        addLog(`❌ 获取 Session 失败：${sessionError.message}`)
        return
      }
      
      if (!session) {
        addLog('❌ 未找到 Session，请先登录')
        return
      }
      
      addLog('✅ Session 存在，获取用户详情...')
      
      // 获取用户详情
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError) {
        addLog(`❌ 获取用户失败：${userError.message}`)
        return
      }

      if (user) {
        setUserInfo({
          id: user.id,
          email: user.email,
        })
        addLog(`✅ 已登录：${user.email}`)
        addLog(`📝 User ID: ${user.id}`)

        // 获取用户等级
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single()

        if (profileError) {
          addLog(`⚠️  获取用户等级失败：${profileError.message}`)
        } else if (profile) {
          addLog(`📊 用户等级：${profile.plan}`)
        } else {
          addLog('⚠️  未找到用户等级，默认为 free')
        }

        // 获取限额
        const { data: userLimits, error: limitsError } = await supabase
          .from('user_limits')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (limitsError) {
          addLog(`⚠️  获取限额失败：${limitsError.message}`)
        } else if (userLimits) {
          setLimits(userLimits)
          addLog(`📊 今日使用：${userLimits.used_requests_today}/${userLimits.daily_request_limit} 次请求`)
          addLog(`📊 Token 使用：${userLimits.used_tokens_today}/${userLimits.daily_token_limit}`)
        }
      } else {
        addLog('❌ 未登录')
      }
    } catch (e: any) {
      addLog(`❌ 未知错误：${e.message}`)
      console.error('checkUser error:', e)
    }
  }

  // 测试聊天 API
  const testChat = async () => {
    addLog('🔄 发送测试聊天请求...')
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: '你好，请用一句话介绍你自己'
            }
          ],
          chatId: `test-${Date.now()}`
        })
      })
      
      addLog(`📊 响应状态：${response.status}`)
      
      if (response.status === 429) {
        const error = await response.json()
        addLog(`❌ 限额错误：${error.error}`)
      } else if (response.status === 401) {
        addLog('❌ 未授权，请先登录')
      } else if (response.ok) {
        addLog('✅ 聊天请求成功！')
        
        // 刷新限额信息
        setTimeout(checkUser, 1000)
      } else {
        const error = await response.json()
        addLog(`⚠️  错误：${error.error}`)
      }
    } catch (e: any) {
      addLog(`❌ 请求失败：${e.message}`)
    }
  }

  // 测试连续请求（压力测试）
  const testMultipleRequests = async () => {
    const count = 5
    addLog(`🔄 开始压力测试：连续发送 ${count} 个请求...`)
    
    for (let i = 0; i < count; i++) {
      addLog(`\n--- 请求 ${i + 1}/${count} ---`)
      
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              {
                role: 'user',
                content: `测试问题 ${i + 1}`
              }
            ],
            chatId: `test-stress-${Date.now()}-${i}`
          })
        })
        
        addLog(`请求 ${i + 1} 状态：${response.status}`)
        
        if (response.status === 429) {
          const error = await response.json()
          addLog(`❌ 限额错误：${error.error}`)
          break // 停止测试
        }
        
        // 等待 500ms 避免过快
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (e: any) {
        addLog(`请求 ${i + 1} 失败：${e.message}`)
      }
    }
    
    addLog('\n✅ 压力测试完成')
    setTimeout(checkUser, 1000)
  }

  // 查看 Usage Logs
  const checkUsageLogs = async () => {
    if (!userInfo) {
      addLog('❌ 请先检查用户信息')
      return
    }
    
    addLog('🔄 获取最近 10 条 usage logs...')
    
    const { data, error } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', userInfo.id)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      addLog(`❌ 获取失败：${error.message}`)
      return
    }
    
    if (data.length === 0) {
      addLog('⚠️  暂无 usage logs')
      return
    }
    
    addLog(`✅ 找到 ${data.length} 条记录:`)
    data.forEach((log, i) => {
      addLog(`  ${i + 1}. ${log.model}: ${log.total_tokens} tokens (${log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'})`)
    })
  }

  // 重置限额（仅测试用）
  const resetLimits = async () => {
    if (!userInfo) {
      addLog('❌ 请先检查用户信息')
      return
    }
    
    addLog('🔄 重置今日使用量...')
    
    const { error } = await supabase
      .from('user_limits')
      .update({
        used_tokens_today: 0,
        used_requests_today: 0,
      })
      .eq('user_id', userInfo.id)
    
    if (error) {
      addLog(`❌ 重置失败：${error.message}`)
    } else {
      addLog('✅ 重置成功')
      setTimeout(checkUser, 500)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 限额系统测试页面</h1>
        
        {/* 用户信息卡片 */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">👤 用户信息</h2>
          {userInfo ? (
            <div className="space-y-2">
              <p><strong>ID:</strong> {userInfo.id}</p>
              <p><strong>Email:</strong> {userInfo.email}</p>
            </div>
          ) : (
            <p className="text-gray-500">未登录</p>
          )}
        </div>
        
        {/* 限额信息卡片 */}
        {limits && (
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <h2 className="text-xl font-semibold mb-4">📊 限额使用情况</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">请求次数</p>
                <p className="text-2xl font-bold">
                  {limits.used_requests_today} / {limits.daily_request_limit}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Token 使用</p>
                <p className="text-2xl font-bold">
                  {limits.used_tokens_today} / {limits.daily_token_limit}
                </p>
              </div>
              <div>
                <p className="text-gray-600">上次重置</p>
                <p className="text-lg">{limits.last_reset_date}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* 测试按钮 */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">🔧 测试操作</h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={checkUser}>📋 检查用户和限额</Button>
            <Button onClick={testChat}>💬 测试单次聊天</Button>
            <Button onClick={testMultipleRequests}>⚡ 压力测试 (5 次请求)</Button>
            <Button onClick={checkUsageLogs}>📜 查看 Usage Logs</Button>
            <Button onClick={resetLimits} variant="destructive">🔄 重置限额</Button>
          </div>
        </div>
        
        {/* 日志输出 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">📝 测试日志</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">暂无日志，点击上方按钮开始测试...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">{log}</div>
              ))
            )}
          </div>
          <Button 
            onClick={() => setLogs([])} 
            variant="outline" 
            className="mt-4"
          >
            清空日志
          </Button>
        </div>
      </div>
    </div>
  )
}
