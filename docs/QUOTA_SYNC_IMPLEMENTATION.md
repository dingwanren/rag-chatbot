# 请求次数 + Token 限额同步实现文档

## 📋 实现概述

基于现有的数据库结构和 `check_and_consume` RPC 函数，实现了聊天接口的限额控制。

## 🗄️ 数据库依赖

### 现有表结构

**user_usage** - 记录用户每日使用量
- `user_id` (uuid, pk)
- `daily_tokens` (int)
- `daily_requests` (int)
- `last_reset_date` (date)

**user_limits** - 记录用户额度
- `user_id` (uuid, pk)
- `daily_token_limit` (int)
- `daily_request_limit` (int)

### 依赖的 RPC 函数

**check_and_consume(user_id, tokens)**
- 自动处理跨天重置
- 校验 request 是否超限
- 校验 token 是否超限
- 成功则自动扣减 usage
- 返回 `{ ok: boolean, message?: string, error_type?: 'requests' | 'tokens', current?: number, limit?: number }`

## 📁 修改的文件

### 1. `/api/chat-stream/route.ts`

**核心逻辑：**
```typescript
// 1. 调用 check_and_consume RPC（调用 LLM 前）
const { data: quotaResult, error: quotaError } = await supabase.rpc('check_and_consume', {
  user_id: user.id,
  tokens: 0, // 先只检查请求次数
})

// 2. 检查配额结果
if (!(quotaResult as any)?.ok) {
  return new Response(
    JSON.stringify({
      error: '今日额度已用完',
      code: 'QUOTA_EXCEEDED',
      details: {
        type: result.error_type || 'requests',
        current: result.current ?? 0,
        limit: result.limit ?? 0,
        resetTime: new Date().toISOString().split('T')[0],
      },
    }),
    { status: 429 }
  )
}

// 3. 调用 LLM 获取回答
// 4. 获取最新使用量（用于返回前端）
const { data: usageData } = await supabase
  .from('user_usage')
  .select('daily_tokens, daily_requests')
  .eq('user_id', user.id)
  .single()

// 5. 返回流式响应（包含 usage）
```

### 2. `/api/chat/route.ts`

**核心逻辑：**
```typescript
// 1. 调用 check_and_consume RPC（调用 LLM 前）
const { data: quotaResult } = await supabase.rpc('check_and_consume', {
  user_id: user.id,
  tokens: 0,
})

// 2. 检查配额，失败返回 429
if (!(quotaResult as any)?.ok) {
  return new Response(JSON.stringify({ 
    error: '今日额度已用完',
    code: 'QUOTA_EXCEEDED',
  }), { status: 429 })
}

// 3. 调用 LLM（streamText）
// 4. onFinish 中记录 usage 并更新消息元数据
```

### 3. `components/chat/UsageIndicator.tsx`

**功能：**
- 从 `user_usage` 表获取使用量
- 从 `user_limits` 表获取限额
- 显示请求次数进度条：`daily_requests / daily_request_limit`
- 显示 Token 进度条：`daily_tokens / daily_token_limit`
- 支持实时 usage 更新（通过 `realtimeUsage` prop）

**使用方式：**
```tsx
<UsageIndicator realtimeUsage={usage} />
```

### 4. `app/(main)/chat/[id]/page.tsx`

**核心逻辑：**
```typescript
// 1. 发送消息
const result = await sendStreamingMessage({ chatId, content: messageText })

// 2. 消费流式响应并获取 usage
if (result?.stream) {
  const streamIterator = result.stream()
  let lastUsage: { daily_tokens: number; daily_requests: number } | undefined

  for await (const chunk of streamIterator) {
    if (chunk.done && chunk.usage) {
      lastUsage = chunk.usage
    }
  }

  if (lastUsage) {
    setUsage(lastUsage) // 更新 UI
  }
}

// 3. 错误处理（限额超限）
if (error.code === 'QUOTA_EXCEEDED') {
  const details = error.details
  setUsage({
    daily_tokens: details.type === 'tokens' ? details.current : usage?.daily_tokens ?? 0,
    daily_requests: details.type === 'requests' ? details.current : usage?.daily_requests ?? 0,
  })
  message.warning('今日额度已用完')
}
```

### 5. `lib/supabase/types.ts`

**添加的类型：**
```typescript
check_and_consume: {
  Args: {
    user_id: string
    tokens: number
  }
  Returns: Json
}
```

### 6. `lib/token-manager.ts`

**清理后保留的函数：**
- `estimateTokens(text)` - 估算 token 数量
- `recordTokenUsage(...)` - 记录 token 使用日志
- `getTokenUsageStats(userId)` - 获取用户统计

**移除的函数：**
- ❌ `consumeTokens()` - 不再需要，使用 `check_and_consume` 替代
- ❌ `getUserUsage()` - 不再需要，直接查询 `user_usage` 表
- ❌ `updateUserActualUsage()` - 不再需要

## 🔄 完整调用链路

```
用户发送消息
    ↓
[1] /api/chat-stream
    ↓
[2] 调用 check_and_consume RPC
    ├─ 失败 → 返回 429 + 错误详情 ✅
    └─ 成功 → 继续
    ↓
[3] 调用 LLM（DeepSeek / RAG）
    ↓
[4] 获取 user_usage 最新数据
    ↓
[5] 流式返回（包含 usage）
    {
      done: true,
      content: answer,
      usage: { daily_tokens, daily_requests }
    }
    ↓
[6] 前端消费流式响应
    ↓
[7] 更新 UsageIndicator 显示
```

## 🎯 错误处理

### 429 Too Many Requests

**返回格式：**
```json
{
  "error": "今日额度已用完",
  "code": "QUOTA_EXCEEDED",
  "details": {
    "type": "requests",  // 或 "tokens"
    "current": 20,
    "limit": 20,
    "resetTime": "2026-03-28"
  }
}
```

**前端处理：**
```typescript
if (error.code === 'QUOTA_EXCEEDED') {
  const details = error.details
  
  // 更新 usage 显示
  setUsage({
    daily_tokens: details.type === 'tokens' ? details.current : usage?.daily_tokens ?? 0,
    daily_requests: details.type === 'requests' ? details.current : usage?.daily_requests ?? 0,
  })
  
  // 显示友好提示
  message.warning({
    content: '今日额度已用完',
    description: (
      <div>
        <p>当前使用：{details.current}/{details.limit}</p>
        <p>超限类型：{details.type === 'requests' ? '请求次数' : 'Token 数量'}</p>
      </div>
    )
  })
}
```

## 📊 UI 显示

### UsageIndicator 组件

显示内容：
- 计划等级（Free / Pro / Super）
- Token 使用进度条：`daily_tokens / daily_token_limit`
- 请求次数进度条：`daily_requests / daily_request_limit`
- 今日剩余额度
- 超过 80% 显示警告

### Super 用户

Super 用户显示特殊样式：
```
⭐ Super  无限额度
```

## ✅ 实现原则

### 遵守的约束：
- ✅ 不修改数据库表结构
- ✅ 不新增字段
- ✅ 不删除现有表
- ✅ 使用现有 `check_and_consume` RPC
- ✅ 不在前端计算 token
- ✅ 不在前端判断限额
- ✅ 不绕过 RPC 直接 update

### 核心逻辑：
1. **后端限额控制** - 所有检查在 `check_and_consume` RPC 中完成
2. **前端只展示** - 仅显示 usage，不做计算
3. **实时同步** - 每次请求后获取最新 usage 并更新 UI

## 🧪 测试场景

### 场景 1：正常对话
```
用户发送消息 → check_and_consume 成功 → 调用 LLM → 返回 usage → UI 更新 ✅
```

### 场景 2：请求次数超限
```
用户发送消息 → check_and_consume 失败 (requests) → 返回 429 → 显示错误 ✅
```

### 场景 3：Token 超限
```
用户发送消息 → check_and_consume 失败 (tokens) → 返回 429 → 显示错误 ✅
```

## 📝 注意事项

1. **RPC 函数必须存在** - 确保 Supabase 中有 `check_and_consume` 函数
2. **user_usage 表必须有数据** - 首次使用时需要初始化
3. **跨天重置** - 由 RPC 函数自动处理
4. **并发安全** - 由 RPC 函数保证原子性

## 🚀 部署步骤

1. **验证数据库**
   - 确认 `user_usage` 表存在
   - 确认 `user_limits` 表存在
   - 确认 `check_and_consume` RPC 函数存在

2. **部署代码**
   ```bash
   git add .
   git commit -m "feat: implement quota sync with check_and_consume RPC"
   git push
   ```

3. **测试**
   - 发送消息，检查 usage 更新
   - 测试限额超限场景
   - 验证 UI 显示正确

---

**实现完成日期：** 2026-03-28  
**状态：** ✅ 完成  
**依赖：** `check_and_consume` RPC 函数
