# 限额系统测试指南

## 📋 测试前准备

### 1. 运行数据库迁移

在 Supabase Dashboard 中执行：
1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 进入你的项目 → **SQL Editor**
3. 复制 `supabase/migrations/001_add_quota_system.sql` 的内容并运行

或者使用 Supabase CLI：
```bash
npx supabase db push
```

### 2. 验证表已创建

在 **Table Editor** 中确认以下表存在：
- ✅ `profiles`
- ✅ `user_limits`
- ✅ `usage_logs`

---

## 🧪 测试步骤

### 步骤 1：启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

---

### 步骤 2：登录账户

1. 访问登录页面
2. 使用已有账户登录，或注册新账户
3. **注意**：新注册用户默认为 `free` 等级

---

### 步骤 3：访问测试页面

访问 **http://localhost:3000/test-quota**

这个页面提供：
- 👤 查看当前用户信息
- 📊 查看限额使用情况
- 💬 测试单次聊天
- ⚡ 压力测试（连续 5 次请求）
- 📜 查看 Usage Logs
- 🔄 重置限额（测试用）

---

### 步骤 4：功能测试

#### 测试 1：正常聊天请求

1. 点击 **"📋 检查用户和限额"**
2. 确认显示你的用户信息和当前限额
3. 点击 **"💬 测试单次聊天"**
4. 观察日志输出，应该显示成功
5. 再次点击 **"📋 检查用户和限额"**，查看使用量是否增加

**预期结果：**
- ✅ 聊天请求成功
- ✅ `used_requests_today` +1
- ✅ `used_tokens_today` 增加相应 token 数

---

#### 测试 2：压力测试

1. 点击 **"⚡ 压力测试 (5 次请求)"**
2. 观察日志输出
3. 检查限额使用情况

**预期结果：**
- ✅ 5 个请求都成功（如果限额足够）
- ✅ 使用量正确累加

---

#### 测试 3：限额超限测试

**方法 1：修改限额为极小值**

在 Supabase SQL Editor 中运行：
```sql
-- 将你的用户 ID 替换到下面
UPDATE user_limits 
SET daily_request_limit = 2, daily_token_limit = 1000
WHERE user_id = 'YOUR_USER_ID';
```

然后发送 3 次聊天请求：
- 第 1-2 次：应该成功
- 第 3 次：应该返回 429 错误 "今日请求次数已用完"

**方法 2：手动填满限额**

```sql
UPDATE user_limits 
SET used_requests_today = 19
WHERE user_id = 'YOUR_USER_ID';
-- free 用户默认限制 20 次
```

然后再发送 1 次请求，应该被拒绝。

---

#### 测试 4：Super 用户无限制测试

1. 在 SQL Editor 中将自己升级为 super 用户：
```sql
UPDATE profiles SET plan = 'super' WHERE id = 'YOUR_USER_ID';
```

2. 刷新测试页面，点击 **"📋 检查用户和限额"**
3. 确认 plan 显示为 `super`
4. 多次发送聊天请求

**预期结果：**
- ✅ Super 用户不会被限额阻止
- ✅ usage_logs 仍然记录
- ✅ user_limits 仍然更新使用量

---

#### 测试 5：Usage Logs 记录测试

1. 点击 **"📜 查看 Usage Logs"**
2. 确认显示最近的 token 使用记录

**预期结果：**
- ✅ 每次请求都有记录
- ✅ token 数量正确
- ✅ 时间戳正确

---

#### 测试 6：每日自动重置测试

**方法 1：修改 last_reset_date**

```sql
-- 将重置日期设置为昨天
UPDATE user_limits 
SET last_reset_date = CURRENT_DATE - INTERVAL '1 day'
WHERE user_id = 'YOUR_USER_ID';
```

然后发送一次聊天请求，系统应该：
- 自动重置使用量
- `used_requests_today` 变为 1（而不是继续累加）

**方法 2：等待自然日切换**

等到第二天（北京时间 0 点），使用量应该自动归零。

---

## 📊 数据库查询测试

在 Supabase SQL Editor 中运行以下查询：

### 查看所有限额情况

```sql
SELECT
  p.id,
  p.plan,
  ul.used_requests_today,
  ul.daily_request_limit,
  ul.used_tokens_today,
  ul.daily_token_limit
FROM profiles p
JOIN user_limits ul ON p.id = ul.user_id
ORDER BY p.plan;
```

### 查看最近的 usage logs

```sql
SELECT * FROM usage_logs
ORDER BY created_at DESC
LIMIT 20;
```

### 统计今日使用情况

```sql
SELECT 
  ul.user_id,
  p.plan,
  SUM(ul.total_tokens) as total_tokens_today,
  COUNT(*) as requests_count
FROM usage_logs ul
JOIN profiles p ON ul.user_id = p.id
WHERE DATE(ul.created_at) = CURRENT_DATE
GROUP BY ul.user_id, p.plan
ORDER BY total_tokens_today DESC;
```

---

## ✅ 测试检查清单

- [ ] 数据库表已创建（profiles, user_limits, usage_logs）
- [ ] 新用户默认为 free 等级
- [ ] free 用户达到请求限制后被拒绝
- [ ] free 用户达到 token 限制后被拒绝
- [ ] super 用户不受限制
- [ ] usage_logs 正确记录每次请求
- [ ] 每日自动重置功能正常
- [ ] 测试页面可以正常访问
- [ ] 并发请求不会出现数据错误

---

## 🐛 常见问题排查

### 问题 1：提示 "未登录"

**原因**：未登录或 session 过期

**解决**：
1. 重新登录
2. 清除浏览器缓存后重新登录

---

### 问题 2：提示 "无法创建用户限额记录"

**原因**：数据库表未创建或 RLS 策略问题

**解决**：
1. 确认已运行迁移 SQL
2. 检查 RLS 策略是否正确

---

### 问题 3：使用量没有更新

**原因**：可能是并发问题或数据库连接问题

**解决**：
1. 检查浏览器控制台和服务器日志
2. 在 Supabase 中查看 user_limits 表
3. 运行测试 SQL 脚本排查

---

### 问题 4：Super 用户仍然被限制

**原因**：plan 字段未正确更新

**解决**：
```sql
-- 确认 plan 已更新
SELECT id, plan FROM profiles WHERE id = 'YOUR_USER_ID';

-- 如果没有更新，重新执行
UPDATE profiles SET plan = 'super' WHERE id = 'YOUR_USER_ID';
```

---

## 📝 测试报告模板

测试完成后，记录以下信息：

```
测试日期：YYYY-MM-DD
测试人员：XXX

✅ 通过的测试：
- 测试 1：正常聊天请求
- 测试 2：压力测试
- ...

❌ 失败的测试：
- 测试 X：XXX
  错误信息：XXX
  可能原因：XXX

📊 测试数据：
- 总请求数：XX
- 成功数：XX
- 失败数：XX
- 平均响应时间：XX ms
```

---

## 🔗 相关文件

- 数据库迁移：`supabase/migrations/001_add_quota_system.sql`
- 测试页面：`app/test-quota/page.tsx`
- 限额逻辑：`lib/quota.ts`
- API 路由：`app/api/chat/route.ts`
- 类型定义：`lib/supabase/types.ts`
