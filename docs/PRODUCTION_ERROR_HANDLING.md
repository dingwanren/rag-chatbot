# 生产级错误处理优化总结

## ✅ 优化完成

### 🎯 核心目标

- ✅ 生产环境控制台保持干净
- ✅ 业务错误（429）不打印日志
- ✅ 只有系统错误（500+）才用 console.error
- ✅ 用户提示完全通过 UI 完成

---

## 📊 关键改动

### 1️⃣ hooks/useChat.ts - 错误处理核心

#### 修改前
```typescript
if (!response.ok) {
  const errorText = await response.text()
  console.error('[useSendMessage] Streaming response error:', response.status, errorText)
  
  // 解析错误...
  throw new Error(errorMessage)
}
```

#### 修改后
```typescript
if (!response.ok) {
  const errorText = await response.text()
  const { message, code, details } = parseApiError(errorText)
  
  // 🎯 错误分级日志 - 生产环境关键优化！
  if (response.status >= 500) {
    // 系统错误：console.error
    console.error('[API Error]', response.status, message, { code, details })
  } else if (process.env.NODE_ENV === 'development') {
    // 开发环境：业务错误用 console.warn（可选）
    console.warn('[Business Limit]', response.status, message, { code, details })
  }
  // 生产环境 + 业务错误：不打印任何日志 ✅
  
  const error = new Error(message) as any
  error.code = code
  error.status = response.status
  error.details = details
  throw error
}
```

**关键优化点：**
- ✅ 500+ → console.error（保留）
- ✅ 4xx + 开发环境 → console.warn（可选）
- ✅ 4xx + 生产环境 → **不打印任何日志** ✅

---

### 2️⃣ app/(main)/chat/[id]/page.tsx - UI 提示

#### 修改前
```typescript
catch (error: any) {
  console.error('Send message error:', error)  // ❌ 冗余日志
  
  if (error.type === 'limit_exceeded') {
    message.open({ ... })
  }
  // ...
}
```

#### 修改后
```typescript
catch (error: any) {
  // ✅ Hook 内部已处理日志，这里只负责 UI 提示
  
  if (error.code === 'QUOTA_EXCEEDED') {
    // 显示详细友好的提示
    message.open({
      type: 'warning',
      content: '今日额度已用完',
      description: <详细组件 />,
      duration: 8,
    })
    return
  }
  
  if (error.code === 'UNAUTHORIZED') {
    // 跳转登录
    message.error('请先登录')
    router.push('/login')
    return
  }
  
  // 其他错误 - 简单提示
  message.error(error.message || '发送消息失败')
}
```

**优化点：**
- ✅ 移除冗余 console.error
- ✅ 只负责 UI 提示
- ✅ 逻辑清晰，易于维护

---

### 3️⃣ lib/api-errors.ts - 后端结构化错误

已经正确实现：

```typescript
export function createQuotaError(
  message: string,
  details?: QuotaErrorDetails
): Response {
  const error: ApiError = {
    code: ErrorCode.QUOTA_EXCEEDED,
    message,
    details,
  }
  
  return new Response(JSON.stringify(error), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': details?.limit.toString(),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': details?.resetTime,
    },
  })
}
```

**返回格式：**
```json
{
  "code": "QUOTA_EXCEEDED",
  "message": "今日请求次数已用完，请明天再来或升级账户",
  "details": {
    "current": 20,
    "limit": 20,
    "resetTime": "2026-03-28",
    "plan": "free",
    "type": "requests"
  }
}
```

---

## 📋 错误处理流程

```
用户发送消息
    ↓
/api/chat-stream 处理
    ↓
限额检查失败
    ↓
返回 429 + 结构化 JSON
{
  code: "QUOTA_EXCEEDED",
  message: "...",
  details: {...}
}
    ↓
useSendMessage 捕获
    ↓
解析错误
    ↓
判断：status = 429 < 500
    ↓
生产环境：不打印日志 ✅
开发环境：console.warn（可选）
    ↓
抛出 Error 对象
    ↓
handleSendMessage 捕获
    ↓
根据 error.code 显示 UI 提示
    ↓
用户看到友好提示 ✅
```

---

## 🎯 最终效果对比

### 生产环境

| 错误类型 | 状态码 | 控制台 | UI 提示 |
|---------|--------|--------|--------|
| 限额超限 | 429 | **无日志** ✅ | Warning Toast |
| 未登录 | 401 | **无日志** ✅ | Error Toast + 跳转 |
| 禁止访问 | 403 | **无日志** ✅ | Warning Toast |
| 系统错误 | 500 | console.error ❌ | Error Toast |

### 开发环境

| 错误类型 | 状态码 | 控制台 | UI 提示 |
|---------|--------|--------|--------|
| 限额超限 | 429 | console.warn ⚠️ | Warning Toast |
| 未登录 | 401 | console.warn ⚠️ | Error Toast + 跳转 |
| 禁止访问 | 403 | console.warn ⚠️ | Warning Toast |
| 系统错误 | 500 | console.error ❌ | Error Toast |

---

## 🔧 日志规范

### ✅ 正确示范

```typescript
// 系统错误（500+）
console.error('[API Error]', status, message, { code, details })

// 开发环境业务错误（可选）
if (process.env.NODE_ENV === 'development') {
  console.warn('[Business Limit]', status, message)
}

// 生产环境业务错误：不打印
```

### ❌ 错误示范

```typescript
// 所有错误都用 error
console.error('Error:', error)

// 业务错误也打印
console.error('Quota exceeded:', error)  // ❌ 不应该

// 重复打印
console.error(...)  // Hook 内部
console.error(...)  // UI 层又打印一次
```

---

## 📁 修改文件清单

### 修改的文件

| 文件 | 改动 |
|------|------|
| `hooks/useChat.ts` | 简化 parseApiError，优化日志分级逻辑 |
| `app/(main)/chat/[id]/page.tsx` | 移除冗余 console.error，只保留 UI 提示 |

### 保持不变的文件

| 文件 | 状态 |
|------|------|
| `lib/api-errors.ts` | ✅ 已正确实现结构化错误 |
| `lib/error-types.ts` | ✅ 已正确定义类型 |
| `lib/quota.ts` | ✅ 已正确返回详细信息 |
| `app/api/chat-stream/route.ts` | ✅ 已正确使用 createQuotaError |

---

## 🧪 测试验证

### 测试步骤

1. **启动开发服务器**
   ```bash
   pnpm dev
   ```

2. **打开浏览器控制台**

3. **测试限额超限**
   ```sql
   -- 在 Supabase 中设置限额为 1
   UPDATE user_limits 
   SET used_requests_today = 1, daily_request_limit = 1
   WHERE user_id = 'YOUR_USER_ID';
   ```

4. **发送消息**
   - 第 1 次：成功
   - 第 2 次：限额超限

5. **观察控制台**
   - **开发环境**：显示黄色警告（console.warn）
   - **生产环境**：不显示任何日志 ✅

6. **观察 UI**
   - 显示友好的限额提示
   - 包含详细信息和恢复时间

---

## 🎯 生产级标准

### ✅ 已达成

- ✅ 生产环境控制台干净
- ✅ 业务错误不污染日志
- ✅ 系统错误正确记录
- ✅ 用户提示友好详细
- ✅ 错误信息结构化
- ✅ 代码清晰易维护

### 📊 日志行为

| 环境 | 429 限额 | 401 未登录 | 500 系统错误 |
|------|---------|-----------|------------|
| **开发** | console.warn | console.warn | console.error |
| **生产** | **无日志** | **无日志** | console.error |

---

## 🚀 最佳实践总结

### 1. 后端原则
- ✅ 永远返回结构化 JSON 错误
- ✅ 使用标准 HTTP 状态码
- ✅ 包含错误代码（code）
- ✅ 提供详细上下文（details）

### 2. 前端原则
- ✅ 500+ → console.error
- ✅ 4xx + 生产 → 不打印
- ✅ 4xx + 开发 → console.warn（可选）
- ✅ UI 提示完整友好

### 3. 日志原则
- ✅ 生产环境保持干净
- ✅ 只记录真正需要关注的错误
- ✅ 避免重复打印
- ✅ 包含完整上下文

---

## 📈 性能提升

### 减少不必要的 I/O

**优化前：**
- 每次业务错误都打印 console
- 生产环境也打印
- 可能影响性能

**优化后：**
- 生产环境业务错误不打印
- 减少不必要的 I/O 操作
- 提升性能 ✅

---

## 🔒 安全性提升

### 避免信息泄露

**优化前：**
- 生产环境打印详细错误
- 可能暴露内部逻辑

**优化后：**
- 生产环境不打印业务错误
- 只通过 UI 显示友好提示
- 更安全 ✅

---

## 📚 参考资料

- [Next.js 错误处理最佳实践](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [HTTP 状态码规范](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [RFC 7807 - Problem Details for HTTP APIs](https://tools.ietf.org/html/rfc7807)

---

**优化完成日期：** 2026-03-27  
**状态：** ✅ 生产就绪  
**控制台：** 🎯 生产环境保持干净
