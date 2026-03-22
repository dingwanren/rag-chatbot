# RAG Chatbot - 聊天持久化系统实现文档

## 概述

本文档描述了基于 Next.js App Router + Supabase 的聊天持久化系统实现，支持流式输出（streaming）。

## 技术栈

- **Frontend**: Next.js 16 (App Router), React 19, Ant Design X
- **Backend**: Next.js Server Actions, Route Handlers
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (SSR mode)
- **AI**: DeepSeek API (via Vercel AI SDK)

## 目录结构

```
app/
├── actions/
│   └── chat.ts              # Server Actions (createChat, sendMessage, getMessages, etc.)
├── api/
│   └── chat-stream/
│       └── route.ts         # Streaming API Route
├── (main)/
│   ├── page.tsx             # 首页 (/) - 新聊天入口
│   └── chat/
│       ├── page.tsx         # 聊天列表页 (/chat)
│       └── [id]/
│           └── page.tsx     # 聊天详情页 (/chat/[id])
components/
├── chat/
│   ├── ChatArea.tsx         # 聊天区域组件
│   ├── ChatHome.tsx         # 首页聊天组件
│   ├── ChatHeader.tsx       # 聊天头部
│   └── MarkdownContent.tsx  # Markdown 渲染
└── layout/
    └── AppSidebar.tsx       # 侧边栏（聊天列表）
hooks/
└── useChat.ts               # React Query hooks
lib/
└── supabase/
    ├── browser.ts           # Browser client (@supabase/ssr)
    ├── server.ts            # Server client (@supabase/ssr)
    ├── middleware.ts        # Middleware client
    └── database.types.ts    # TypeScript types
supabase/
├── migrations/
│   └── 001_initial_schema.sql  # 数据库迁移
└── functions/
    └── create_message_pair.sql # RPC 函数
```

## 核心功能

### 1. Server Actions (`app/actions/chat.ts`)

| Function | 描述 |
|----------|------|
| `createChat(title, mode, knowledgeBaseId)` | 创建新聊天 |
| `sendMessage(chatId, content)` | 发送消息（创建 user + assistant 占位） |
| `getMessages(chatId)` | 获取聊天消息列表 |
| `getChatList()` | 获取用户聊天列表 |
| `deleteChat(chatId)` | 删除聊天 |
| `updateChatTitle(chatId, title)` | 更新聊天标题 |
| `updateMessage(messageId, content, status)` | 更新消息（streaming 用） |

### 2. Streaming API (`app/api/chat-stream/route.ts`)

```typescript
// 请求格式
POST /api/chat-stream
{
  "chatId": "uuid",
  "messageId": "uuid"  // assistant message id
}

// 响应格式 (SSE)
{ "chunk": "Hello", "content": "Hello" }
{ "chunk": " World", "content": "Hello World" }
{ "done": true, "content": "Hello World!" }
```

**节流机制**：每 500ms 更新一次数据库，避免频繁写入。

### 3. React Query Hooks (`hooks/useChat.ts`)

```typescript
// 获取聊天列表
const { chats, isLoading } = useChatList()

// 获取消息
const { messages } = useMessages(chatId)

// 创建聊天
const { createChat } = useCreateChat()

// 发送消息（带 streaming）
const { sendMessage } = useSendMessage()

// 删除聊天
const { deleteChat } = useDeleteChat()
```

### 4. 前端交互流程

```
用户发送消息
    ↓
1. 调用 sendMessage Server Action
   - 插入 user message (status=completed)
   - 插入 assistant message (status=streaming, content='')
   - 返回 assistantMessageId
    ↓
2. 调用 /api/chat-stream
   - 流式调用 DeepSeek API
   - 实时返回 chunk 到前端
   - 节流更新数据库（每 500ms）
    ↓
3. 流结束
   - 更新 message status = 'completed'
   - 前端自动刷新消息列表
```

## 数据库结构

### chats 表

| 字段 | 类型 | 描述 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 ID（外键） |
| title | TEXT | 聊天标题 |
| mode | TEXT | 'chat' | 'rag' |
| knowledge_base_id | UUID | 知识库 ID（RAG 模式） |
| last_message | TEXT | 最后一条消息 |
| last_message_at | TIMESTAMPTZ | 最后消息时间 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

### messages 表

| 字段 | 类型 | 描述 |
|------|------|------|
| id | UUID | 主键 |
| chat_id | UUID | 聊天 ID（外键） |
| role | TEXT | 'user' | 'assistant' |
| content | TEXT | 消息内容 |
| status | TEXT | 'streaming' | 'completed' |
| metadata | JSONB | 元数据 |
| created_at | TIMESTAMPTZ | 创建时间 |

## RLS 策略

所有表都启用了 Row Level Security：

```sql
-- Chats: 用户只能访问自己的 chats
CREATE POLICY "Users can view own chats" ON chats
  FOR SELECT USING (auth.uid() = user_id);

-- Messages: 通过 chat 所有权验证
CREATE POLICY "Users can view messages from own chats" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );
```

## Trigger

### 自动更新 chats 表

```sql
-- 当 messages 插入时，自动更新 chats.last_message 和 updated_at
CREATE TRIGGER trigger_update_chat_on_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_chat_on_message_insert();
```

## 环境变量

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key

# DeepSeek API
DEEPSEEK_API_KEY=your_deepseek_api_key
```

## 部署步骤

### 1. 运行数据库迁移

```bash
# 在 Supabase Dashboard 中执行
supabase/migrations/001_initial_schema.sql
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
# 编辑 .env.local 填入实际值
```

### 3. 启动开发服务器

```bash
pnpm dev
```

## 扩展 RAG 功能

当前实现已为 RAG 预留了扩展点：

1. **聊天模式**：`chats.mode` 字段支持 'chat' 和 'rag'
2. **知识库关联**：`chats.knowledge_base_id` 关联知识库
3. **数据库表**：`knowledge_bases`, `documents`, `chunks` 已创建
4. **扩展点**：在 `/api/chat-stream` 中添加 RAG 检索逻辑

```typescript
// TODO: RAG 检索
if (chat.mode === 'rag') {
  const context = await retrieveContext(chat.knowledge_base_id, userMessage)
  // 将 context 添加到 system prompt
}
```

## 性能优化

1. **节流更新**：streaming 时每 500ms 更新一次数据库
2. **React Query 缓存**：自动缓存聊天列表和消息
3. **RLS 索引**：在 `user_id`, `chat_id`, `created_at` 上建立索引
4. **乐观更新**：前端可先显示消息，再同步到后端

## 安全考虑

1. **SSR Auth**：使用 `@supabase/ssr` 正确处理 cookie
2. **RLS**：所有数据库操作都受 RLS 保护
3. **权限验证**：Server Action 和 API Route 都验证用户身份
4. **输入验证**：所有输入都经过验证和清理
