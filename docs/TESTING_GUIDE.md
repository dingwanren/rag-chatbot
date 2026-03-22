# 聊天持久化系统 - 测试清单

## 前置条件

1. **配置 Supabase**
   ```bash
   # 在 Supabase Dashboard 获取
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJxxx
   ```

2. **配置 DeepSeek API**
   ```bash
   DEEPSEEK_API_KEY=sk-xxx
   ```

3. **运行数据库迁移**
   - 在 Supabase Dashboard → SQL Editor
   - 执行 `supabase/migrations/001_initial_schema.sql`

## 测试步骤

### 1. 测试用户认证

```bash
# 访问 /login 页面
# 注册/登录账号
# 确认能成功登录并获取 session
```

### 2. 测试创建聊天

```typescript
// 在浏览器控制台
const { createClient } = await import('@/lib/supabase/browser')
const supabase = createClient()

// 测试创建聊天
const { data, error } = await supabase
  .from('chats')
  .insert({
    user_id: (await supabase.auth.getUser()).data.user?.id,
    title: '测试聊天',
    mode: 'chat'
  })
  .select()
  .single()

console.log(data) // 应该显示创建的聊天
console.log(error) // 应该为 null
```

### 3. 测试聊天列表

```typescript
// 访问首页 /
// 应该能看到侧边栏和"欢迎使用 RAG Chatbot"
// 点击"新建对话"应该创建新聊天并跳转到 /chat/[id]
```

### 4. 测试发送消息

```typescript
// 在聊天页面输入"你好"并发送
// 应该看到：
// 1. 用户消息显示
// 2. AI 开始流式回复
// 3. 消息实时显示
```

### 5. 测试消息持久化

```typescript
// 刷新页面
// 应该能看到之前的聊天记录
// 侧边栏应该显示该聊天
```

### 6. 测试聊天列表同步

```typescript
// 在侧边栏应该能看到所有聊天
// 按最后消息时间倒序排列
// 点击聊天应该跳转到对应页面
```

### 7. 测试删除聊天

```typescript
// 在侧边栏右键点击聊天
// 选择"删除"
// 聊天应该消失
```

## 常见问题排查

### 问题 1: "未授权" 错误

**原因**: 用户未登录或 session 过期

**解决**:
```bash
# 检查 Supabase Auth 配置
# 确认用户已登录
const { data } = await supabase.auth.getUser()
console.log(data.user) // 应该有用户信息
```

### 问题 2: RLS 权限错误

**原因**: RLS 策略配置错误

**解决**:
```sql
-- 检查 RLS 是否启用
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- 检查策略
SELECT * FROM pg_policies WHERE tablename = 'chats';
```

### 问题 3: Streaming 不工作

**原因**: API Route 错误或 DeepSeek API 问题

**解决**:
```bash
# 检查 Next.js 服务器日志
# 确认 DEEPSEEK_API_KEY 配置正确
# 测试 API 调用
curl https://api.deepseek.com/v1/chat/completions \
  -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"test"}]}'
```

### 问题 4: 消息不显示

**原因**: 数据库查询或前端渲染问题

**解决**:
```typescript
// 检查消息是否存在于数据库
const { data } = await supabase
  .from('messages')
  .select('*')
  .eq('chat_id', chatId)
  .order('created_at', { ascending: true })

console.log(data) // 应该有消息数据
```

## 性能测试

### 1. 并发测试

```typescript
// 同时发送多条消息
// 确认消息顺序正确
// 确认数据库更新正确
```

### 2. 大数据量测试

```typescript
// 创建长对话（100+ 消息）
// 确认加载速度
// 确认滚动性能
```

## 下一步

1. **实现知识库管理**
   - 上传文档
   - 文档分块
   - 向量嵌入

2. **实现 RAG 聊天**
   - 检索相关 chunks
   - 添加到 context
   - 调用 LLM

3. **优化用户体验**
   - 添加加载状态
   - 添加错误处理
   - 添加消息编辑/删除
