---
name: ant-design-x
description: Ant Design X 组件库使用指南。当用户需要构建 AI 对话界面、使用 Bubble/Sender/Conversations 等组件、渲染流式 Markdown、展示思维链/思考过程、处理文件上传/附件、创建快捷提示/建议时，必须使用此技能。涵盖所有 @ant-design/x 和 @ant-design/x-markdown 组件的使用场景。
---

# Ant Design X Skill

## 概述

Ant Design X 是专为 AI 对话应用设计的 React 组件库，提供完整的 LUI（Language User Interface）构建能力。

### 核心能力

1. **对话组件** - Bubble（消息气泡）、Sender（输入框）、Conversations（会话管理）
2. **表达组件** - Prompts（快捷提示）、Suggestions（建议）、Attachments（附件）
3. **反馈组件** - Actions（操作列表）、ThoughtChain（思维链）、Sources（来源引用）
4. **渲染组件** - XMarkdown（流式 Markdown）、CodeHighlighter（代码高亮）、Mermaid（图表）
5. **状态组件** - Think（思考过程）、Welcome（欢迎页）、Notification（系统通知）

### 何时使用

- ✅ 构建 AI 聊天界面
- ✅ 渲染流式 Markdown 内容（公式、代码、图表）
- ✅ 展示 AI 思考过程或推理链
- ✅ 管理多会话/历史对话
- ✅ 提供快捷提示/命令输入
- ✅ 处理文件上传和预览
- ✅ 展示引用来源/参考链接
- ✅ 创建欢迎引导页面

---

## 识别指南

### 触发场景

用户提到以下任一概念时触发此技能：

| 场景类别 | 关键词/短语 |
|---------|------------|
| **对话界面** | "聊天界面"、"对话气泡"、"消息列表"、"输入框"、"发送消息" |
| **AI 组件** | "AI 对话"、"智能体"、"Bot"、"聊天机器人"、"LUI" |
| **Markdown** | "Markdown 渲染"、"流式输出"、"公式渲染"、"代码高亮"、"Mermaid 图表" |
| **会话管理** | "切换会话"、"历史对话"、"多会话"、"会话列表" |
| **交互反馈** | "点赞点踩"、"复制按钮"、"操作菜单"、"思维链"、"思考过程" |
| **文件处理** | "上传文件"、"附件"、"文件预览"、"粘贴图片" |
| **快捷输入** | "快捷提示"、"快捷命令"、"/命令"、"输入建议" |

### 不触发场景

- ❌ 仅需基础 antd 组件（Button、Input 等）
- ❌ 纯后端 AI 接口调用
- ❌ 与 UI 无关的 AI 模型配置

---

## 决策表

### 第一步：识别核心需求

```
用户需要什么？
├─ 对话界面 → Bubble + Sender + Conversations
├─ Markdown 渲染 → XMarkdown
├─ 快捷提示 → Prompts / Suggestion
├─ 文件上传 → Attachments + FileCard
├─ 思考过程展示 → Think / ThoughtChain
├─ 来源引用 → Sources
├─ 欢迎引导 → Welcome
└─ 系统通知 → Notification
```

### 第二步：选择详细文档

根据需求读取对应的参考文档：

| 需求 | 读取文档 |
|------|---------|
| 消息气泡/列表 | `./reference/bubble/bubble.md` |
| 输入框/语音输入 | `./reference/sender/sender.md` |
| 会话管理 | `./reference/conversations/conversations.md` |
| 流式 Markdown | `./reference/x-markdown/x-markdown.md` |
| Markdown 流式处理 | `./reference/x-markdown/guides/streaming.md` |
| Markdown 自定义组件 | `./reference/x-markdown/guides/components.md` |
| Markdown 插件 | `./reference/x-markdown/guides/plugins.md` |
| 快捷提示 | `./reference/prompts/prompts.md` |
| 快捷命令 | `./reference/suggestion/suggestion.md` |
| 文件上传 | `./reference/attachments/attachments.md` |
| 文件卡片 | `./reference/file-card/file-card.md` |
| 操作列表 | `./reference/actions/actions.md` |
| 思维链 | `./reference/thought-chain/thought-chain.md` |
| 思考过程 | `./reference/think/think.md` |
| 来源引用 | `./reference/sources/sources.md` |
| 代码高亮 | `./reference/code-highlighter/code-highlighter.md` |
| Mermaid 图表 | `./reference/mermaid/mermaid.md` |
| 欢迎页 | `./reference/welcome/welcome.md` |
| 系统通知 | `./reference/notification/notification.md` |
| 全局配置 | `./reference/x-provider/x-provider.md` |

### 第三步：确定组合方案

常见组合模式：

| 场景 | 组件组合 |
|------|---------|
| **基础对话** | Bubble + Sender + Bubble.List |
| **完整对话应用** | Conversations + Bubble.List + Sender + Prompts |
| **流式 AI 回复** | Bubble + XMarkdown(streaming) + Think |
| **带文件上传** | Sender + Attachments + FileCard.List |
| **带引用来源** | Bubble + Sources |
| **带思维链** | ThoughtChain + Bubble |
| **欢迎引导页** | Welcome + Prompts + Sender |

---

## Quick API Reference

### 核心组件快速查阅

#### Bubble（消息气泡）

```tsx
import { Bubble } from '@ant-design/x';

<Bubble
  content="消息内容"
  placement="start"  // start | end
  typing={{ effect: 'typing', step: 3, interval: 50 }}  // 打字动画
  streaming={isStreaming}  // 流式传输标志
  header="发送者"
  footer="底部操作"
  avatar={<Avatar />}
/>
```

#### Bubble.List（消息列表）

```tsx
<Bubble.List
  items={[
    { key: '1', role: 'ai', content: 'AI 回复' },
    { key: '2', role: 'user', content: '用户消息', placement: 'end' },
  ]}
  role={{
    ai: { typing: true, avatar: () => <Avatar /> },
    user: { placement: 'end' },
  }}
  style={{ height: 500 }}
  autoScroll
/>
```

#### Sender（输入框）

```tsx
import { Sender } from '@ant-design/x';

<Sender
  placeholder="输入消息..."
  allowSpeech  // 语音输入
  loading={isLoading}
  onSubmit={(message) => console.log(message)}
  header={<Sender.Header title="附件">{attachments}</Sender.Header>}
/>
```

#### XMarkdown（流式 Markdown）

```tsx
import XMarkdown from '@ant-design/x-markdown';

<XMarkdown
  content={markdownContent}
  streaming={{
    hasNextChunk: isStreaming,
    enableAnimation: true,
  }}
  components={{
    code: CodeComponent,
    think: ThinkComponent,
  }}
  config={{ extensions: Latex() }}  // LaTeX 公式
/>
```

### 详细文档路径

完整 API 和示例请读取：

- **对话核心**: `./reference/bubble/bubble.md`
- **输入框**: `./reference/sender/sender.md`
- **Markdown**: `./reference/x-markdown/x-markdown.md`
- **流式处理**: `./reference/x-markdown/guides/streaming.md`
- **自定义组件**: `./reference/x-markdown/guides/components.md`
- **插件系统**: `./reference/x-markdown/guides/plugins.md`

---

## 使用流程

### 1. 基础对话界面

```tsx
import { Bubble, Sender } from '@ant-design/x';
import { Flex } from 'antd';
import { useState } from 'react';

const ChatApp = () => {
  const [messages, setMessages] = useState([]);

  return (
    <Flex vertical style={{ height: '100vh' }}>
      <Bubble.List
        items={messages}
        style={{ flex: 1 }}
        role={{
          ai: { typing: true },
          user: { placement: 'end' },
        }}
      />
      <Sender
        placeholder="输入消息..."
        onSubmit={(message) => {
          setMessages([...messages, {
            key: Date.now(),
            role: 'user',
            content: message,
          }]);
          // 调用 AI 接口...
        }}
      />
    </Flex>
  );
};
```

### 2. 流式 Markdown 渲染

```tsx
import { Bubble } from '@ant-design/x';
import XMarkdown from '@ant-design/x-markdown';

<Bubble
  content={streamingContent}
  contentRender={(content) => (
    <XMarkdown
      content={content}
      streaming={{ hasNextChunk: isStreaming }}
      paragraphTag="div"
    />
  )}
/>
```

### 3. 思考过程展示

```tsx
import { Think, Bubble } from '@ant-design/x';
import XMarkdown from '@ant-design/x-markdown';

<Flex vertical gap="small">
  <Think title="思考中..." loading={isThinking}>
    {thinkingContent}
  </Think>
  <Bubble content={answer} />
</Flex>
```

---

## 最佳实践

### 1. 流式处理

- 使用 `streaming` 标志控制未完成语法处理
- 启用 `enableAnimation` 提供渐进式显示
- 使用 `incompleteMarkdownComponentMap` 处理未闭合语法

### 2. 性能优化

- Bubble.List 使用虚拟滚动处理大数据
- XMarkdown 组件使用 React.memo 缓存
- 避免内联定义 components

### 3. 主题定制

```tsx
import { XProvider } from '@ant-design/x';
import '@ant-design/x-markdown/themes/light.css';

<XProvider theme={{ components: { Bubble: {...} } }}>
  <App />
</XProvider>
```

---

## 参考文档索引

### 核心文档
- `./reference/bubble/bubble.md` - 对话气泡完整 API
- `./reference/sender/sender.md` - 输入框完整 API
- `./reference/conversations/conversations.md` - 会话管理

### Markdown 系列
- `./reference/x-markdown/x-markdown.md` - Markdown 渲染主文档
- `./reference/x-markdown/guides/streaming.md` - 流式处理指南
- `./reference/x-markdown/guides/components.md` - 自定义组件指南
- `./reference/x-markdown/guides/plugins.md` - 插件指南

### 功能组件
- `./reference/prompts/prompts.md` - 快捷提示
- `./reference/suggestion/suggestion.md` - 快捷命令
- `./reference/attachments/attachments.md` - 文件上传
- `./reference/file-card/file-card.md` - 文件卡片
- `./reference/actions/actions.md` - 操作列表
- `./reference/sources/sources.md` - 来源引用

### 展示组件
- `./reference/thought-chain/thought-chain.md` - 思维链
- `./reference/think/think.md` - 思考过程
- `./reference/welcome/welcome.md` - 欢迎页
- `./reference/notification/notification.md` - 系统通知
- `./reference/code-highlighter/code-highlighter.md` - 代码高亮
- `./reference/mermaid/mermaid.md` - Mermaid 图表
- `./reference/x-provider/x-provider.md` - 全局配置

---

## 常见问题

**Q: 如何结合 Bubble 和 XMarkdown？**
A: 在 Bubble 的 `contentRender` 中渲染 XMarkdown，参考 `./reference/bubble/bubble.md` 示例。

**Q: 流式输出如何处理未完成语法？**
A: 设置 `streaming.hasNextChunk=true` 并使用 `incompleteMarkdownComponentMap`，详见 `./reference/x-markdown/guides/streaming.md`。

**Q: 如何自定义 Markdown 组件？**
A: 使用 `components` 属性替换 HTML 标签，参考 `./reference/x-markdown/guides/components.md`。

**Q: 如何添加 LaTeX 公式支持？**
A: 引入 Latex 插件并通过 `config.extensions` 配置，参考 `./reference/x-markdown/guides/plugins.md`。
