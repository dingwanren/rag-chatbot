# 每日 Token 使用量实时更新实现文档

## 📋 实现概述

实现了每日 token 使用量的实时更新功能，无需额外 API 请求，在每次问答后自动刷新 UI。

---

## 🔄 完整数据流

```
用户发送消息
    ↓
后端：consume_tokens（原子扣减）
    ↓
后端：调用 LLM
    ↓
后端：获取最新 usage（getUserUsage）
    ↓
后端：在流完成时返回 usage
{
  done: true,
  content: "...",
  usage: {
    daily_tokens: 9500,
    daily_requests: 15,
    limit: 10000,
    remaining: 500
  }
}
    ↓
前端：解析 usage
    ↓
前端：setUsage(realtimeUsage)
    ↓
UI：实时更新进度条 ✅
```

---

## 🔧 关键改动

### 1️⃣ 后端 API - 返回 usage

#### 修改文件：`app/api/chat-stream/route.ts`

```typescript
// 🎯 获取最新的每日使用量（用于前端实时更新）
const currentUsage = await getUserUsage(user.id)
const usageInfo = {
  daily_tokens: currentUsage.dailyTokens,
  daily_requests: currentUsage.dailyRequests,
  limit: tokenLimit,
  remaining: tokenLimit - currentUsage.dailyTokens,
}

// 流完成时返回 usage
controller.enqueue(
  encoder.encode(JSON.stringify({ 
    done: true, 
    content: answer,
    usage: usageInfo, // ✅ 包含 usage
  }) + '\n')
)
```

**关键点：**
- ✅ 在流完成时返回 usage
- ✅ 包含 daily_tokens, limit, remaining
- ✅ 即使出错也返回 usage

---

### 2️⃣ 前端 Hook - 解析 usage

#### 修改文件：`hooks/useChat.ts`

```typescript
if (data.done) {
  // 流完成：更新为 success 状态
  await updateMessage(assistantMessageId, data.content, 'success')
  
  // 🎯 返回 usage 信息（用于前端更新）
  yield { 
    done: true, 
    content: data.content,
    usage: data.usage, // ✅ 解析 usage
  }
}
```

---

### 3️⃣ 聊天页面 - 管理 usage 状态

#### 修改文件：`app/(main)/chat/[id]/page.tsx`

```typescript
// 🎯 Token 使用量状态（用于实时更新）
const [usage, setUsage] = useState<{
  daily_tokens: number
  daily_requests: number
  limit: number
  remaining: number
} | null>(null)

// 发送消息并获取返回的 usage
const result = await sendStreamingMessage({ chatId, content: messageText })

// 🎯 如果返回了 usage，更新状态
if (result?.usage) {
  setUsage(result.usage)
}
```

---

### 4️⃣ UsageIndicator 组件 - 实时刷新

#### 修改文件：`components/chat/UsageIndicator.tsx`

```typescript
interface UsageIndicatorProps {
  realtimeUsage?: {
    daily_tokens: number
    daily_requests: number
    limit: number
    remaining: number
  } | null
}

export function UsageIndicator({ realtimeUsage }: UsageIndicatorProps) {
  // 🎯 当实时 usage 更新时，优先使用实时数据
  useEffect(() => {
    if (realtimeUsage) {
      setUsage(prev => ({
        ...prev!,
        used_tokens: realtimeUsage.daily_tokens,
        used_requests: realtimeUsage.daily_requests,
      }))
    }
  }, [realtimeUsage])
  
  // 渲染时使用实时数据
  const tokenPercentage = realtimeUsage
    ? Math.round((realtimeUsage.daily_tokens / realtimeUsage.limit) * 100)
    : Math.round((usage.used_tokens / usage.token_limit) * 100)
}
```

---

## 📊 UI 展示效果

### 正常状态（< 80%）

```
┌─────────────────────────────────┐
│ 😊 Free | 今日剩余：5000 tokens  │
│ [====50%====] 5000/10000        │
│ [====30%====] 6/20              │
└─────────────────────────────────┘
```

### 警告状态（80%-90%）

```
┌─────────────────────────────────┐
│ 😊 Free | 今日剩余：1500 tokens  │
│ [====85%====] 8500/10000  ⚠️    │
│ [====60%====] 12/20             │
│ ⚠️ 额度即将用完，请考虑升级账户   │
└─────────────────────────────────┘
```

### 危险状态（> 90%）

```
┌─────────────────────────────────┐
│ 😊 Free | 今日剩余：500 tokens   │
│ [====95%====] 9500/10000  🔴    │
│ [====80%====] 16/20             │
│ ⚠️ 额度即将用完，请考虑升级账户   │
└─────────────────────────────────┘
```

---

## 🎯 核心优势

### 1️⃣ 无需额外 API

```typescript
// ❌ 错误做法：每次发送消息后额外请求
await sendMessage(...)
await fetch('/api/usage') // 浪费！

// ✅ 正确做法：在响应中返回 usage
const result = await sendMessage(...)
setUsage(result.usage) // 无需额外请求！
```

---

### 2️⃣ 数据一致性

```typescript
// ✅ 所有数据以数据库为准
const currentUsage = await getUserUsage(user.id) // 从数据库读取
const usageInfo = {
  daily_tokens: currentUsage.dailyTokens,
  limit: tokenLimit,
  remaining: tokenLimit - currentUsage.dailyTokens,
}
```

---

### 3️⃣ 实时更新

```typescript
// 用户发送消息
    ↓
// 后端 consume_tokens
    ↓
// 后端 getUserUsage（最新数据）
    ↓
// 返回 usage
    ↓
// 前端 setUsage
    ↓
// UI 立即刷新 ✅
```

---

## 🧪 测试场景

### 场景 1：正常对话

```
初始：5000/10000 tokens (50%)
    ↓
用户发送消息
    ↓
消耗：800 tokens
    ↓
UI 更新：5800/10000 tokens (58%) ✅
```

---

### 场景 2：接近限额

```
初始：7500/10000 tokens (75%)
    ↓
用户发送消息
    ↓
消耗：800 tokens
    ↓
UI 更新：8300/10000 tokens (83%)
    ↓
显示橙色警告 ⚠️
```

---

### 场景 3：超限

```
初始：9500/10000 tokens (95%)
    ↓
用户发送消息
    ↓
consume_tokens: 失败
    ↓
返回错误：TOKEN_LIMIT
    ↓
UI 显示：⚠️ 今日额度已用完
    ↓
不更新 usage（保持 9500）✅
```

---

## 📁 修改文件清单

| 文件 | 改动 | 作用 |
|------|------|------|
| `app/api/chat-stream/route.ts` | 新增 usage 返回 | 后端返回实时 usage |
| `hooks/useChat.ts` | 解析 usage | 从流中解析 usage |
| `app/(main)/chat/[id]/page.tsx` | 新增 usage state | 管理实时 usage 状态 |
| `components/chat/UsageIndicator.tsx` | 支持 realtimeUsage | 实时刷新 UI |

---

## 🎨 UI 样式规范

### 颜色状态

| 使用率 | 颜色 | 提示 |
|--------|------|------|
| < 80% | 🔵 蓝色 | 无提示 |
| 80%-90% | 🟠 橙色 | ⚠️ 警告 |
| > 90% | 🔴 红色 | ⚠️ 严重警告 |

---

### 进度条样式

```typescript
const getStatusColor = (percentage: number) => {
  if (percentage >= 90) return 'red'
  if (percentage >= 80) return 'orange'
  return 'blue'
}
```

---

### 警告提示

```typescript
{tokenPercentage >= 80 && (
  <Alert
    type="warning"
    message="⚠️ 额度即将用完，请考虑升级账户"
    size="small"
  />
)}
```

---

## 🚀 最佳实践总结

### ✅ 正确做法
- ✅ 在响应中返回 usage
- ✅ 无需额外 API 请求
- ✅ 所有数据以数据库为准
- ✅ 实时更新 UI
- ✅ 超过 80% 显示警告

### ❌ 错误做法
- ❌ 额外调用 API 获取 usage
- ❌ 前端自行计算 token
- ❌ 不显示警告提示
- ❌ 忽略剩余 tokens

---

## 📈 性能优化

### 1️⃣ 减少 API 请求

**优化前：**
```
发送消息 → 1 次 API
获取 usage → 1 次 API
总计：2 次 API ❌
```

**优化后：**
```
发送消息（包含 usage）→ 1 次 API
总计：1 次 API ✅
```

---

### 2️⃣ 避免重复渲染

```typescript
// ✅ 使用 useEffect 依赖
useEffect(() => {
  if (realtimeUsage) {
    setUsage(prev => ({ ...prev!, ...realtimeUsage }))
  }
}, [realtimeUsage]) // 只在 realtimeUsage 变化时更新
```

---

## 🔍 技术细节

### 为什么使用 getUserUsage？

```typescript
// ✅ 使用 RPC 函数
const currentUsage = await getUserUsage(user.id)

// ❌ 避免手动查询
const usage = await supabase
  .from('user_usage')
  .select('*')
  .eq('user_id', user.id)
  .single()
```

**原因：**
- getUserUsage 自动处理重置逻辑
- 保证数据一致性
- 减少代码重复

---

### 为什么在流完成时返回？

```typescript
// ✅ 流完成时返回
if (data.done) {
  yield { done: true, content, usage }
}
```

**原因：**
- 此时 token 已消耗完成
- 数据最准确
- 前端只需解析一次

---

## 📚 参考资料

- [React Query 最佳实践](https://tanstack.com/query/latest/docs/react/overview)
- [Supabase RPC 文档](https://supabase.com/docs/guides/database/functions)
- [Ant Design Progress 组件](https://ant.design/components/progress)

---

**实现完成日期：** 2026-03-27  
**状态：** ✅ 生产就绪  
**实时更新：** 🎯 无需额外 API
