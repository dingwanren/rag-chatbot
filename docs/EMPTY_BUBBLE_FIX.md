# 空 Assistant 气泡修复文档

## 🐛 问题描述

### 问题现象
用户发送消息失败后（如 429 限额），UI 上出现空白色块（空 assistant 气泡）。

### 问题原因
1. `sendMessage` action 会立即创建空 assistant 消息（占位）
2. API 请求失败后，这条占位消息没有被删除
3. UI 从数据库读取并显示所有消息，包括空消息

---

## ✅ 修复方案

### 核心思路
**三层防护**：
1. **逻辑层**：失败时立即删除占位消息
2. **Hook 层**：捕获错误并清理
3. **UI 层**：过滤空消息（兜底）

---

## 🔧 关键修改

### 1️⃣ `app/actions/chat.ts` - 新增删除消息函数

```typescript
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
```

---

### 2️⃣ `hooks/useChat.ts` - 失败时删除占位消息

#### 修改前
```typescript
if (!response.ok) {
  const errorText = await response.text()
  const { message, code, details } = parseApiError(errorText)
  
  // ❌ 没有删除占位消息
  // 直接抛出错误
  
  throw error
}
```

#### 修改后
```typescript
if (!response.ok) {
  const errorText = await response.text()
  const { message, code, details } = parseApiError(errorText)
  
  // ✅ 关键：删除占位消息（避免空气泡）
  if (assistantMessageId) {
    try {
      await deleteMessage(assistantMessageId)
      console.log('[useSendMessage] Deleted placeholder message:', assistantMessageId)
    } catch (deleteError) {
      console.error('[useSendMessage] Failed to delete placeholder:', deleteError)
    }
  }
  
  // 抛出错误
  throw error
}
```

**关键点：**
- ✅ 在抛出错误前删除占位消息
- ✅ 即使删除失败也不阻断主流程
- ✅ 确保 UI 不会显示空气泡

---

### 3️⃣ `app/(main)/chat/[id]/page.tsx` - UI 层过滤空消息

#### 修改前
```typescript
const bubbleItems = useMemo(() => {
  return (dbMessages ?? []).map((message) => {
    const role = message.role === 'user' ? 'user' : 'ai'
    return {
      key: message.id || getKey(),
      role,
      content: message.content,
      placement: role === 'user' ? 'end' : 'start',
    }
  })
}, [dbMessages])
```

#### 修改后
```typescript
const bubbleItems = useMemo(() => {
  return (dbMessages ?? [])
    // 🎯 过滤掉空内容的消息（兜底逻辑）
    .filter((msg) => msg.content && msg.content.trim() !== '')
    .map((message) => {
      const role = message.role === 'user' ? 'user' : 'ai'
      return {
        key: message.id || getKey(),
        role,
        content: message.content,
        placement: role === 'user' ? 'end' : 'start',
      }
    })
}, [dbMessages])
```

**关键点：**
- ✅ 过滤空内容消息
- ✅ 兜底防护（即使逻辑层失败，UI 也不会显示）
- ✅ 使用 `trim()` 避免纯空格消息

---

## 📊 修复流程

```
用户发送消息
    ↓
sendMessage 创建占位消息
    ├─ user message (content: "你好")
    └─ assistant message (content: "", status: "streaming")
    ↓
返回 assistantMessageId
    ↓
调用 /api/chat-stream
    ↓
┌─────────────────┐
│   请求成功？     │
└─────────────────┘
    ↓          ↓
   YES        NO
    ↓          ↓
 正常流式     删除占位消息 ✅
 更新内容     deleteMessage(assistantMessageId)
    ↓          ↓
 用户看到    只显示 Toast 错误
 正常回复    不显示空气泡 ✅
```

---

## 🎯 最终效果

### 修复前 ❌
```
用户发送消息
    ↓
限额错误（429）
    ↓
UI 显示：
┌─────────────────┐
│ 👤 你好          │
├─────────────────┤
│ 🤖              │ ← 空白色块（空气泡）
└─────────────────┘
```

### 修复后 ✅
```
用户发送消息
    ↓
限额错误（429）
    ↓
UI 显示：
┌─────────────────┐
│ 👤 你好          │
└─────────────────┘
    ↓
⚠️ Toast 提示：今日额度已用完
（无空气泡，干净）
```

---

## 🧪 测试场景

### 场景 1：限额超限（429）

**步骤：**
1. 设置限额为 1
2. 发送第 1 条消息 → 成功
3. 发送第 2 条消息 → 失败

**预期结果：**
- ✅ 不显示空气泡
- ✅ 只显示 Toast 提示
- ✅ 消息列表保持干净

---

### 场景 2：网络错误（500）

**步骤：**
1. 模拟服务器错误
2. 发送消息

**预期结果：**
- ✅ 不显示空气泡
- ✅ 显示系统错误 Toast
- ✅ 控制台打印错误日志

---

### 场景 3：正常请求

**步骤：**
1. 发送消息
2. 等待响应

**预期结果：**
- ✅ 正常显示 assistant 回复
- ✅ 无空气泡
- ✅ 流式更新正常

---

## 📁 修改文件清单

| 文件 | 改动 | 作用 |
|------|------|------|
| `app/actions/chat.ts` | 新增 `deleteMessage` | 删除占位消息 |
| `hooks/useChat.ts` | 失败时调用 `deleteMessage` | 逻辑层清理 |
| `app/(main)/chat/[id]/page.tsx` | 过滤空消息 | UI 层兜底 |

---

## 🎯 三层防护总结

| 层级 | 措施 | 作用 |
|------|------|------|
| **逻辑层** | `deleteMessage` | 失败时立即删除占位消息 |
| **Hook 层** | `useSendMessage` catch | 捕获错误并清理 |
| **UI 层** | `.filter(msg.content)` | 兜底过滤空消息 |

**为什么需要三层？**
- 逻辑层：主要清理逻辑
- Hook 层：确保错误时执行清理
- UI 层：即使前两层失败，UI 也不会显示空气泡

---

## 🚀 最佳实践

### ✅ 正确做法
- ✅ 失败时立即删除占位消息
- ✅ UI 层过滤空消息（兜底）
- ✅ 只显示 Toast 提示，不显示空气泡
- ✅ 保持 UI 干净整洁

### ❌ 错误做法
- ❌ 保留空 assistant 消息
- ❌ 仅依赖 UI 过滤（不修逻辑）
- ❌ 显示"正在思考..."但永远不更新
- ❌ 空气泡 + Toast 同时显示

---

## 📈 用户体验提升

### 修复前
- ❌ 明显 UI bug（空白色块）
- ❌ 用户困惑（为什么有空白消息？）
- ❌ 感觉像未完成的产品

### 修复后
- ✅ UI 干净整洁
- ✅ 只看到错误提示，看不到空气泡
- ✅ 接近真实 AI 产品体验（如 ChatGPT）

---

## 🔍 技术细节

### 为什么先创建占位消息？
**原因：**
1. 流式响应需要消息 ID 来更新
2. 数据库需要记录消息状态
3. 支持断线重连后继续接收

### 为什么不延迟创建？
**原因：**
1. 需要保证消息顺序
2. 支持并发发送多条消息
3. 数据库作为唯一数据源

### 为什么需要三层防护？
**原因：**
1. 逻辑层可能失败（网络问题）
2. Hook 层提供额外保障
3. UI 层是最后防线

---

## 📚 参考资料

- [Ant Design X Bubble 组件](https://x.ant.design/components/bubble)
- [React Query Error Handling](https://tanstack.com/query/latest/docs/react/guides/query-functions#handling-and-throwing-errors)
- [ChatGPT UI/UX 分析](https://www.nngroup.com/articles/chatbot-ux/)

---

**修复完成日期：** 2026-03-27  
**状态：** ✅ 生产就绪  
**UI 体验：** 🎯 无空气泡，干净整洁
