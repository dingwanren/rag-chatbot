# RAG Chatbot 主界面实现提示词

## 任务描述

实现 RAG 聊天机器人应用的主界面布局，采用左右布局结构。当前阶段**仅实现页面框架和路由跳转逻辑**，各区域详细内容暂用占位内容填充。

---

## 技术栈

- **框架**: Next.js 16+ (App Router)
- **React**: 19+ (Server Components 优先)
- **样式**: Tailwind CSS v4
- **UI 库**: Radix UI + shadcn/ui 模式
- **图标**: Lucide React

---

## 实现要求

### 1. 文件结构

按照 Next.js App Router 规范组织文件：

```
app/
├── (main)/                    # 主应用布局 (登录后)
│   ├── layout.tsx             # 主布局 (左右结构)
│   ├── page.tsx               # 聊天主页 (默认欢迎页)
│   ├── chat/
│   │   └── [id]/
│   │       └── page.tsx       # 具体聊天页面
│   └── knowledge/
│       └── [id]/
│           └── page.tsx       # 知识库详情页面
├── (auth)/                    # 认证相关 (已存在)
│   └── login/
│       └── page.tsx
├── layout.tsx                 # 根布局
└── globals.css

components/
├── layout/
│   ├── AppSidebar.tsx         # 侧边栏容器
│   ├── SidebarHeader.tsx      # Logo/品牌区域
│   ├── NewChatButton.tsx      # 新聊天按钮
│   ├── RAGSection.tsx         # RAG 知识库区域 (条件渲染)
│   ├── ChatSection.tsx        # 聊天列表区域
│   └── SidebarFooter.tsx      # 用户信息区域
├── chat/
│   ├── ChatArea.tsx           # 聊天主区域容器
│   ├── ChatHeader.tsx         # 聊天标题栏
│   ├── MessageList.tsx        # 消息列表 (占位)
│   └── ChatInput.tsx          # 输入区域 (占位)
└── ui/                        # 基础 UI 组件 (已存在)
```

---

### 2. 布局规范

#### 2.1 主布局 (`app/(main)/layout.tsx`)

- 使用 **Server Component** (默认)
- 左右两栏布局，侧边栏固定宽度 280px
- 右侧聊天区域自适应填充剩余空间
- 使用 CSS Grid 或 Flexbox 实现

```tsx
// 关键代码模式
<div className="flex h-screen">
  <AppSidebar className="w-72 flex-shrink-0" />
  <main className="flex-1 flex flex-col overflow-hidden">
    {children}
  </main>
</div>
```

#### 2.2 侧边栏 (`components/layout/AppSidebar.tsx`)

**结构从上到下**:

1. **SidebarHeader** - Logo 和应用名称
2. **NewChatButton** - 新建对话按钮
3. **RAGSection** - RAG 知识库区域 (根据是否有知识库条件渲染)
   - 无知识库：显示 RAG 引导入口
   - 有知识库：显示可折叠分组 + 知识库列表
4. **ChatSection** - 聊天列表区域 (可折叠)
5. **SidebarFooter** - 用户信息和设置

**交互要求**:
- 分组标题支持折叠/展开 (使用 `useState` 本地状态)
- 折叠状态不需要持久化 (MVP 阶段)

#### 2.3 聊天区域 (`components/chat/ChatArea.tsx`)

**结构**:

1. **ChatHeader** - 显示当前对话标题
2. **MessageList** - 消息列表区域 (暂用占位文本)
3. **ChatInput** - 输入框区域 (暂用占位输入框)

---

### 3. 路由设计

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 欢迎页/重定向 | 未登录→登录页，已登录→聊天主页 |
| `/chat` | 聊天主页 | 默认欢迎状态，无选中对话 |
| `/chat/[id]` | 具体对话 | 显示特定对话内容 |
| `/knowledge/[id]` | 知识库详情 | 显示特定知识库管理界面 |

---

### 4. Server/Client Component 边界

遵循 Next.js 最佳实践：

- **默认使用 Server Component** (不添加 `'use client'`)
- **仅在需要交互时**使用 Client Component：
  - 折叠/展开状态 (`useState`)
  - 点击事件处理 (`onClick`)
  - 表单输入 (`onChange`)

**推荐模式**:

```tsx
// ✅ 正确：Server Component 作为布局
// app/(main)/layout.tsx
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  // 可在此获取用户信息等数据
  return (
    <div className="flex h-screen">
      <AppSidebar />  {/* 包含 Client 子组件 */}
      <main className="flex-1">{children}</main>
    </div>
  )
}

// ✅ 正确：Client Component 仅用于交互
// components/layout/AppSidebar.tsx
'use client'

export function AppSidebar() {
  const [isChatCollapsed, setIsChatCollapsed] = useState(false)
  // ... 交互逻辑
}
```

---

### 5. 样式规范

使用 Tailwind CSS v4，遵循以下约定：

- **颜色**: 使用 CSS 变量支持明/暗主题
- **间距**: 使用 Tailwind 默认间距尺度
- **响应式**: 先实现桌面端，移动端后续适配

```css
/* app/globals.css 中定义主题变量 */
@theme inline {
  --color-sidebar-bg: var(--color-neutral-100);
  --color-sidebar-hover: var(--color-neutral-200);
  --color-sidebar-active: var(--color-blue-100);
}
```

---

### 6. 占位内容说明

以下区域使用简单占位内容：

| 组件 | 占位内容 |
|------|----------|
| `MessageList` | 显示 "消息列表区域 - 待实现" |
| `ChatInput` | 简单输入框 + 发送按钮 (无功能) |
| `ChatSection` | 2-3 条静态聊天历史记录 |
| `RAGSection` | 根据状态显示静态引导或静态知识库列表 |
| `SidebarFooter` | 静态用户名 + 设置按钮 |

---

### 7. 类型定义

在 `types/index.ts` 中定义基础类型：

```typescript
// types/index.ts
export interface Chat {
  id: string
  title: string
  createdAt: Date
  mode: 'normal' | 'rag'
  knowledgeBaseId?: string
}

export interface KnowledgeBase {
  id: string
  name: string
  description?: string
  createdAt: Date
}

export type SidebarSection = 'rag' | 'chat'
```

---

## 实现检查清单

- [ ] 创建 `app/(main)/layout.tsx` 主布局
- [ ] 创建 `app/(main)/page.tsx` 默认欢迎页
- [ ] 创建 `app/(main)/chat/[id]/page.tsx` 聊天详情页
- [ ] 创建 `components/layout/AppSidebar.tsx` 侧边栏
- [ ] 创建 `components/layout/SidebarHeader.tsx`
- [ ] 创建 `components/layout/NewChatButton.tsx`
- [ ] 创建 `components/layout/RAGSection.tsx`
- [ ] 创建 `components/layout/ChatSection.tsx`
- [ ] 创建 `components/layout/SidebarFooter.tsx`
- [ ] 创建 `components/chat/ChatArea.tsx`
- [ ] 创建 `components/chat/ChatHeader.tsx`
- [ ] 创建 `components/chat/MessageList.tsx` (占位)
- [ ] 创建 `components/chat/ChatInput.tsx` (占位)
- [ ] 创建 `types/index.ts` 类型定义
- [ ] 验证路由跳转正常
- [ ] 验证侧边栏折叠功能
- [ ] 运行 `next build` 确保无编译错误

---

## 注意事项

1. **不要实现实际功能逻辑** - 仅布局框架
2. **不要调用 API** - 使用静态数据
3. **不要实现认证逻辑** - 假设已登录状态
4. **优先保证代码结构清晰** - 便于后续迭代
5. **遵循 Next.js 15+ 异步规范** - `params` 和 `searchParams` 是 Promise

---

## 参考设计文档

详细设计参考：`./mainpage.md`
