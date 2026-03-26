# 侧边栏知识库列表修复

## 🐛 问题

侧边栏的知识库列表使用的是 **mock 数据**，导致：
1. 显示的知识库不是真实的
2. 点击跳转的 URL 错误（`/knowledge/[id]`）
3. 请求报错无权限（因为 ID 是假的）

## ✅ 修复内容

### 1. 新增 Hook - `useKnowledgeBases`

**文件**: `hooks/useChat.ts`

```typescript
export function useKnowledgeBases() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['knowledgeBases'],
    queryFn: getKnowledgeBases,  // 使用已有的 Server Action
    retry: 1,
  })

  return {
    knowledgeBases: data?.data ?? [],
    isLoading,
    error: data?.error || error,
    refetch,
  }
}
```

**功能**:
- ✅ 从 `getKnowledgeBases()` 获取真实知识库列表
- ✅ 支持加载状态
- ✅ 错误处理
- ✅ 自动刷新

---

### 2. 移除 Mock 数据

**文件**: `components/layout/AppSidebar.tsx`

**删除**:
```typescript
// ❌ 删除 mock 数据
const mockKnowledgeBases: KnowledgeBase[] = [
  { id: 'kb-1', name: '产品文档', ... },
  { id: 'kb-2', name: '技术手册', ... },
  { id: 'kb-3', name: '常见问题', ... },
]
```

---

### 3. 使用真实数据

**更新**:
```typescript
// ✅ 使用真实数据
const { knowledgeBases, isLoading: isLoadingKnowledgeBases } = useKnowledgeBases()

// 构建 items 时
...(knowledgeBases ?? []).map((kb) => ({
  key: `kb-${kb.id}`,
  label: (
    <div onClick={() => router.push(`/knowledge-base/${kb.id}`)}>
      <DatabaseOutlined /> {kb.name}
    </div>
  ),
  group: 'RAG 模式',
}))
```

---

### 4. 修复跳转 URL

**之前**: `/knowledge/[id]` ❌  
**现在**: `/knowledge-base/[id]` ✅

**匹配的路由**:
```
app/knowledge-base/[id]/page.tsx
```

---

### 5. 修复选中状态

**更新**:
```typescript
const selectedKey = useMemo(() => {
  if (pathname.includes('/knowledge-base')) {
    const parts = pathname.split('/')
    const kbId = parts[parts.length - 1]
    return kbId ? `kb-${kbId}` : 'knowledge-manage'
  }
  // ...
}, [pathname])
```

**逻辑**:
- 提取 URL 中的知识库 ID
- 生成 key: `kb-[id]`
- 高亮对应的侧边栏项

---

### 6. 添加加载状态

```typescript
{isLoadingKnowledgeBases || isLoadingChats ? (
  <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
    加载中...
  </div>
) : (
  <Conversations items={items} ... />
)}
```

---

## 📊 数据流

```
┌─────────────────────────────────────┐
│  AppSidebar (侧边栏组件)             │
│                                      │
│  useKnowledgeBases()                 │
│    ↓                                 │
│  getKnowledgeBases() (Server Action) │
│    ↓                                 │
│  Supabase 查询 knowledge_bases 表     │
│    ↓                                 │
│  返回真实知识库列表                   │
│    ↓                                 │
│  渲染到侧边栏                         │
└─────────────────────────────────────┘
```

---

## 🔍 对比

### 修复前 ❌

```typescript
// Mock 数据
const mockKnowledgeBases = [
  { id: 'kb-1', name: '产品文档' },
  { id: 'kb-2', name: '技术手册' },
  { id: 'kb-3', name: '常见问题' },
]

// 错误 URL
router.push(`/knowledge/${kb.id}`)

// 问题：
// - 显示假数据
// - 跳转 404
// - 权限错误
```

### 修复后 ✅

```typescript
// 真实数据
const { knowledgeBases } = useKnowledgeBases()

// 正确 URL
router.push(`/knowledge-base/${kb.id}`)

// 效果：
// - 显示真实知识库
// - 跳转正确
// - 权限正常
```

---

## 🧪 测试步骤

### 1. 查看侧边栏
1. 访问任意页面
2. 查看侧边栏
3. ✅ 显示真实的知识库列表（从数据库）
4. ✅ 加载时显示"加载中..."

### 2. 点击知识库
1. 点击侧边栏中的某个知识库
2. ✅ 跳转到 `/knowledge-base/[id]`
3. ✅ 显示知识库详情页
4. ✅ 无权限错误

### 3. 高亮状态
1. 进入知识库详情页
2. ✅ 侧边栏对应项高亮
3. ✅ key 匹配正确

### 4. 知识库管理入口
1. 点击"知识库管理"
2. ✅ 跳转到 `/knowledge-base`
3. ✅ 显示知识库列表页面

---

## 📝 相关文件

### 修改的文件
1. `hooks/useChat.ts` - 新增 `useKnowledgeBases` hook
2. `components/layout/AppSidebar.tsx` - 使用真实数据

### 依赖的接口
1. `app/actions/knowledge-base.ts` - `getKnowledgeBases()`
2. `app/knowledge-base/[id]/page.tsx` - 知识库详情页

---

## ✅ 修复结果

- ✅ 侧边栏显示真实知识库列表
- ✅ 点击跳转到正确的 URL
- ✅ 无权限错误
- ✅ 加载状态显示
- ✅ 选中状态高亮
- ✅ 数据实时更新（创建/删除知识库后自动刷新）

🎉 **侧边栏知识库列表已修复！**
