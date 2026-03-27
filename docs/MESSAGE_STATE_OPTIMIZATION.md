# 产品级消息处理优化文档

## 🎯 优化目标

将聊天系统从"功能可用"升级为"产品级体验"，实现类似 ChatGPT 的完整交互流程。

---

## 📊 核心优化

### 消息状态管理

```typescript
type MessageStatus = 'loading' | 'success' | 'error'
```

| 状态 | 内容 | UI 表现 |
|------|------|--------|
| **loading** | "正在思考..." | 灰色背景，半透明 |
| **success** | 正常回答 | 正常样式 |
| **error** | "⚠️ 今日额度已用完..." | 红色边框，浅红背景 |

---

## 🔄 完整流程

### 1️⃣ 用户发送消息

```
用户：你好
    ↓
创建消息对：
- user: "你好" (status: completed)
- assistant: "正在思考..." (status: streaming, loading: true)
```

### 2️⃣ 请求处理中

```
UI 显示：
┌─────────────────┐
│ 👤 你好          │
├─────────────────┤
│ 🤖 正在思考...   │ ← loading 状态
└─────────────────┘
```

### 3️⃣ 请求成功

```
流式返回内容
    ↓
更新 assistant:
- content: "你好！有什么可以帮你的吗？"
- status: completed
- metadata: { loading: false }
    ↓
UI 显示：
┌─────────────────┐
│ 👤 你好          │
├─────────────────┤
│ 🤖 你好！有什么  │
│    可以帮你的吗？│
└─────────────────┘
```

### 4️⃣ 请求失败（核心优化点）

```
API 返回 429
{
  "code": "QUOTA_EXCEEDED",
  "message": "今日请求次数已用完"
}
    ↓
格式化错误消息：
"⚠️ 今日额度已用完（当前：20/20）

请明天再试或升级账户计划"
    ↓
更新 assistant:
- content: 错误消息
- status: completed (或保持 streaming)
- metadata: { loading: false }
    ↓
UI 显示：
┌─────────────────┐
│ 👤 你好          │
├─────────────────┤
│ 🤖 ⚠️ 今日额度   │
│    已用完        │
│    请明天再试... │
└─────────────────┘
     ↑ 红色边框，浅红背景
```

---

## 🔧 关键代码改动

### 1️⃣ `hooks/useChat.ts` - 核心逻辑

#### 错误处理
```typescript
if (!response.ok) {
  const errorText = await response.text()
  const { message, code, details } = parseApiError(errorText)
  
  // 🎯 关键：失败时更新为错误消息（不删除！）
  const errorMessage = formatErrorMessage(code, message, details)
  await updateMessage(assistantMessageId, errorMessage, 'error')
  
  throw error
}
```

#### 流式成功
```typescript
if (data.done) {
  // 流完成：更新为 success 状态
  await updateMessage(assistantMessageId, data.content, 'success')
  yield { done: true, content: data.content }
}
```

#### 流式错误
```typescript
if (data.error) {
  // 流中出错：更新为 error 状态
  const errorMsg = formatErrorMessage(undefined, data.error, undefined)
  await updateMessage(assistantMessageId, errorMsg, 'error')
  yield { error: data.error, content: data.content }
}
```

---

### 2️⃣ `app/actions/chat.ts` - 创建 loading 消息

```typescript
// 插入 assistant 占位消息（带 loading 状态）
{
  chat_id: chatId,
  role: 'assistant',
  content: '正在思考...', // 🎯 显示 loading 文本
  status: 'streaming',
  metadata: { loading: true }, // 标记为 loading 状态
}
```

---

### 3️⃣ UI 渲染 - 状态样式

```typescript
const bubbleItems = useMemo(() => {
  return (dbMessages ?? [])
    .filter((msg) => msg.content && msg.content.trim() !== '')
    .map((message) => {
      const isLoading = message.status === 'streaming' && message.content === '正在思考...'
      const isError = message.content?.startsWith('⚠️')
      
      return {
        key: message.id,
        role: message.role === 'user' ? 'user' : 'ai',
        content: message.content,
        // 🎯 根据状态设置样式
        styles: {
          content: isError 
            ? { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' }
            : isLoading 
              ? { backgroundColor: '#f0f0f0', opacity: 0.8 }
              : undefined,
        },
      }
    })
}, [dbMessages])
```

---

## 📋 错误消息格式化

### `formatErrorMessage` 函数

```typescript
function formatErrorMessage(code?: string, message?: string, details?: any): string {
  // 限额超限
  if (code === 'QUOTA_EXCEEDED') {
    const detailText = details ? `（当前：${details.current}/${details.limit}）` : ''
    return `⚠️ 今日额度已用完${detailText}\n\n${message || '请明天再试或升级账户计划'}`
  }
  
  // 未授权
  if (code === 'UNAUTHORIZED') {
    return `⚠️ 请先登录\n\n${message || '登录后继续使用'}`
  }
  
  // 禁止访问
  if (code === 'FORBIDDEN') {
    return `⚠️ 无权访问\n\n${message || '您没有权限执行此操作'}`
  }
  
  // 其他错误
  return `⚠️ ${message || '发生错误，请稍后重试'}`
}
```

---

## 🎯 用户体验对比

### 修复前 ❌

```
用户：你好
    ↓
限额错误
    ↓
UI:
┌──────────────┐
│ 👤 你好       │
├──────────────┤
│ 🤖           │ ← 空白色块
└──────────────┘
    ↓
❌ 用户困惑：为什么有空白？
```

### 修复后 ✅

```
用户：你好
    ↓
UI 立即显示：
┌──────────────┐
│ 👤 你好       │
├──────────────┤
│ 🤖 正在思考...│ ← loading 状态
└──────────────┘
    ↓
限额错误
    ↓
UI 更新：
┌──────────────┐
│ 👤 你好       │
├──────────────┤
│ 🤖 ⚠️ 今日额度│
│    已用完     │
│    请明天...  │ ← 错误消息（红色边框）
└──────────────┘
    ↓
✅ 用户明白：额度用完了
```

---

## 📊 状态流转图

```
assistant 消息生命周期：

创建
  ↓
[loading] "正在思考..."
  ↓
┌─────────────┬─────────────┐
│   成功      │    失败     │
│   ↓         │    ↓        │
│ [success]   │  [error]    │
│ 正常内容    │ ⚠️ 错误消息  │
└─────────────┴─────────────┘
```

---

## 🧪 测试场景

### 场景 1：正常对话

**步骤：**
1. 用户发送"你好"
2. API 正常返回

**预期：**
- ✅ 立即显示"正在思考..."
- ✅ 流式更新内容
- ✅ 最终显示完整回答

---

### 场景 2：限额超限

**步骤：**
1. 设置限额为 1
2. 发送第 2 条消息

**预期：**
- ✅ 立即显示"正在思考..."
- ✅ API 返回 429
- ✅ 更新为错误消息（红色边框）
- ✅ 不显示空白色块

---

### 场景 3：网络错误

**步骤：**
1. 断开网络
2. 发送消息

**预期：**
- ✅ 立即显示"正在思考..."
- ✅ 网络超时
- ✅ 更新为"⚠️ 发生错误，请稍后重试"

---

## 📁 修改文件清单

| 文件 | 改动 | 作用 |
|------|------|------|
| `lib/message-types.ts` | 新增 | 定义消息状态类型 |
| `hooks/useChat.ts` | 核心逻辑 | 状态管理 + 错误格式化 |
| `app/actions/chat.ts` | 创建/更新 | loading 消息 + 状态更新 |
| `app/(main)/chat/[id]/page.tsx` | UI 渲染 | 根据状态显示样式 |

---

## 🎨 UI 样式规范

### Loading 状态
```css
{
  backgroundColor: '#f0f0f0',
  opacity: 0.8
}
```
- 灰色背景
- 轻微透明
- 表示"处理中"

### Error 状态
```css
{
  backgroundColor: '#fff2f0',
  border: '1px solid #ffccc7'
}
```
- 浅红背景
- 红色边框
- 表示"错误/警告"

### Success 状态
```css
{
  // 默认样式
}
```
- 正常背景
- 无边框
- 表示"成功"

---

## 🚀 最佳实践总结

### ✅ 正确做法
- ✅ 立即显示"正在思考..."
- ✅ 失败时显示错误消息
- ✅ 使用不同样式区分状态
- ✅ 错误消息包含解决方案
- ✅ 保持消息完整性（不删除）

### ❌ 错误做法
- ❌ 显示空白色块
- ❌ 删除 assistant 消息
- ❌ 只显示 Toast，不更新消息
- ❌ 错误消息过于简单
- ❌ 所有消息同样式

---

## 📈 用户体验提升

### 修复前
- ❌ 空气泡（困惑）
- ❌ 消息断裂（不自然）
- ❌ 缺少反馈（不知道发生了什么）

### 修复后
- ✅ 始终有回应（自然）
- ✅ 状态清晰（loading/success/error）
- ✅ 错误友好（知道原因 + 解决方案）
- ✅ 接近 ChatGPT 体验

---

## 🔍 技术细节

### 为什么使用 metadata？

```typescript
metadata: { loading: true }
```

**原因：**
1. 数据库已有 metadata 字段（JSON 类型）
2. 无需修改表结构
3. 便于扩展其他状态

### 为什么 content 存储格式化文本？

**原因：**
1. 简化 UI 渲染逻辑
2. 支持 Markdown 渲染
3. 便于缓存和重用

### 为什么错误消息用 ⚠️ 图标？

**原因：**
1. 视觉识别（一眼看出是错误）
2. 友好不吓人（相比 ❌）
3. 符合 Ant Design 规范

---

## 📚 参考资料

- [ChatGPT UI/UX 分析](https://www.nngroup.com/articles/chatbot-ux/)
- [Ant Design X Bubble 组件](https://x.ant.design/components/bubble)
- [Error Message Best Practices](https://www.nngroup.com/articles/error-message-guidelines/)

---

**优化完成日期：** 2026-03-27  
**状态：** ✅ 生产就绪  
**体验等级：** 🎯 产品级（类 ChatGPT）
