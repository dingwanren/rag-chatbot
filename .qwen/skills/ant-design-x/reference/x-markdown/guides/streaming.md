# XMarkdown 流式处理指南

本指南详细介绍 XMarkdown 的流式渲染能力，包括动画效果、语法处理、性能监控等功能。

---

## 目录

1. [动画效果](#动画效果)
2. [语法处理](#语法处理)
3. [性能监控](#性能监控)
4. [完整示例](#完整示例)

---

## 动画效果

为流式渲染的内容添加优雅的动画效果，支持文本的渐进式显示，提升用户阅读体验。

### 基础用法

```tsx
import { Bubble } from '@ant-design/x';
import XMarkdown from '@ant-design/x-markdown';
import { Button, Flex, Switch, Typography } from 'antd';
import { useState, useEffect, useRef } from 'react';

const text = `
# Ant Design X

Ant Design X 是一款 AI 应用复合工具集，融合了 UI 组件库、流式 Markdown 渲染引擎和 AI SDK。

## 特性

- 🌈 企业级 AI 产品最佳实践
- 🧩 灵活的原子组件
- ✨ 流式友好的 Markdown 渲染
`;

const App = () => {
  const [enableAnimation, setEnableAnimation] = useState(true);
  const [hasNextChunk, setHasNextChunk] = useState(true);
  const [index, setIndex] = useState(0);
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (index >= text.length) {
      setHasNextChunk(false);
      return;
    }

    timer.current = setTimeout(() => {
      setIndex((prev) => prev + 5);
    }, 20);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [index]);

  return (
    <Flex vertical gap="small" style={{ height: 600, overflow: 'auto' }}>
      <Flex justify="flex-end" gap="small">
        <Typography.Text>动画</Typography.Text>
        <Switch
          checked={enableAnimation}
          onChange={setEnableAnimation}
          checkedChildren="开"
          unCheckedChildren="关"
        />
        <Button onClick={() => { setIndex(0); setHasNextChunk(true); }}>
          重新渲染
        </Button>
      </Flex>

      <Bubble
        content={text.slice(0, index)}
        contentRender={(content) => (
          <XMarkdown
            streaming={{
              enableAnimation,
              hasNextChunk,
              animationConfig: { fadeDuration: 200 },
            }}
          >
            {content}
          </XMarkdown>
        )}
      />
    </Flex>
  );
};

export default App;
```

### API

#### streaming

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `hasNextChunk` | 是否还有后续数据 | `boolean` | `false` |
| `enableAnimation` | 启用文本淡入动画 | `boolean` | `false` |
| `animationConfig` | 文本动画配置 | `AnimationConfig` | `{ fadeDuration: 200, opacity: 0.2 }` |

#### AnimationConfig

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `fadeDuration` | 淡入动画持续时间（毫秒） | `number` | `200` |
| `opacity` | 动画期间字符的初始透明度值 | `number` | `0.2` |

### FAQ

**动画效果不生效？**

请检查以下条件：
- `enableAnimation` 是否设置为 `true`
- `hasNextChunk` 是否正确控制
- 浏览器是否支持 CSS3 动画

**动画导致性能问题？**

建议优化：
- 减少 `fadeDuration` 时间
- 使用 `linear` 缓动函数
- 分批渲染大量内容

---

## 语法处理

语法处理机制专为流式渲染场景设计，能够智能识别不完整的 Markdown 语法结构，通过灵活的自定义组件映射，提供流畅的用户体验。

### 基础用法

```tsx
import { Bubble } from '@ant-design/x';
import XMarkdown from '@ant-design/x-markdown';
import { Button, Flex, Skeleton, Space, Switch, Typography } from 'antd';
import { useState, useEffect, useRef } from 'react';

const text = `
# Ant Design X

Ant Design X 是一款 AI 应用复合工具集。

![Ant Design X](https://mdn.alipayobjects.com/huamei_yz9z7c/afts/img/0lMhRYbo0-8AAAAAQDAAAAgADlJoAQFr/original)

访问 [Ant Design](https://ant.design) 查看文档。
`;

// 自定义加载组件
const LoadingComponents = {
  'loading-link': () => (
    <Skeleton.Button active size="small" style={{ margin: '4px 0', width: 60 }} />
  ),
  'loading-image': () => <Skeleton.Image active style={{ width: 60, height: 60 }} />,
};

const App = () => {
  const [enableAnimation, setEnableAnimation] = useState(true);
  const [enableCache, setEnableCache] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [index, setIndex] = useState(0);
  const timer = useRef<any>(-1);

  const renderStream = () => {
    if (index >= text.length) {
      clearTimeout(timer.current);
      setIsStreaming(false);
      return;
    }
    timer.current = setTimeout(() => {
      setIndex((prev) => prev + 1);
      renderStream();
    }, 50);
  };

  useEffect(() => {
    if (index === text.length) return;
    renderStream();
    setIsStreaming(true);
    return () => {
      clearTimeout(timer.current);
    };
  }, [index]);

  return (
    <Flex vertical gap="middle">
      <Flex gap="small" justify="end">
        <Space>
          <Typography.Text>动画</Typography.Text>
          <Switch
            checked={enableAnimation}
            onChange={setEnableAnimation}
            checkedChildren="开"
            unCheckedChildren="关"
          />
        </Space>
        <Space>
          <Typography.Text>语法处理</Typography.Text>
          <Switch
            checked={enableCache}
            onChange={setEnableCache}
            checkedChildren="开"
            unCheckedChildren="关"
          />
        </Space>
        <Button onClick={() => setIndex(0)}>重新渲染</Button>
      </Flex>

      <Bubble
        content={text.slice(0, index)}
        contentRender={(content) => (
          <XMarkdown
            content={content}
            paragraphTag="div"
            streaming={{
              hasNextChunk: isStreaming && enableCache,
              enableAnimation,
              incompleteMarkdownComponentMap: {
                link: 'loading-link',
                image: 'loading-image',
              },
            }}
            components={LoadingComponents}
          />
        )}
      />
    </Flex>
  );
};

export default App;
```

### API

#### streaming

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `hasNextChunk` | 是否还有后续数据 | `boolean` | `false` |
| `enableAnimation` | 启用文本淡入动画 | `boolean` | `false` |
| `animationConfig` | 文本动画配置 | `AnimationConfig` | `{ fadeDuration: 200, opacity: 0.2 }` |
| `incompleteMarkdownComponentMap` | 未完成语法对应的自定义组件名 | `Partial<Record<StreamCacheTokenType, string>>` | `{}` |

### 未完成语法标记转换

当 `hasNextChunk` 为 `true` 时，所有未完成的语法标记会被自动转换为 `incomplete-token` 形式，并将未完成的语法通过 `data-raw` 属性返回。

例如：
- 未完成的链接 `[示例](https://example.com` → `<incomplete-link data-raw="[示例](https://example.com">`
- 未完成的图片 `![产品图](https://cdn.example.com/images/produc` → `<incomplete-image data-raw="![产品图](https://cdn.example.com/images/produc">`
- 未完成的标题 `###` → `<incomplete-heading data-raw="###">`

### StreamCacheTokenType 类型

```typescript
type StreamCacheTokenType =
  | 'text'       // 普通文本
  | 'link'       // 链接语法 [text](url)
  | 'image'      // 图片语法 ![alt](src)
  | 'heading'    // 标题语法 # ## ###
  | 'emphasis'   // 强调语法 *斜体* **粗体**
  | 'list'       // 列表语法 - + *
  | 'table'      // 表格语法 | 标题 | 内容 |
  | 'xml';       // XML/HTML 标签 <tag>
```

### 支持的语法类型

| 语法类型 | 格式示例 | 未完成状态示例 | 对应 TokenType |
|----------|----------|----------------|----------------|
| **链接** | `[text](url)` | `[示例网站](https://example` | `link` |
| **图片** | `![alt](src)` | `![产品图](https://cdn.example.com/images/produc` | `image` |
| **标题** | `# ## ###` 等 | `###` | `heading` |
| **强调** | `*斜体*` `**粗体**` | `**未完成的粗体文本` | `emphasis` |
| **列表** | `- + *` 列表标记 | `-` | `list` |
| **表格** | `\| 标题 \| 内容 \|` | `\| 标题 1 \| 标题 2 \|` | `table` |
| **XML 标签** | `<tag>` | `<div class="` | `xml` |

### 自定义未完成语法组件

```tsx
import { Skeleton } from 'antd';
import XMarkdown, { type ComponentProps } from '@ant-design/x-markdown';

const ImageSkeleton = () => (
  <Skeleton.Image active style={{ width: 60, height: 60 }} />
);

const IncompleteLink = (props: ComponentProps) => {
  const text = String(props['data-raw'] || '');
  
  // 提取链接文本，格式为 [text](url)
  const linkTextMatch = text.match(/^\[([^\]]*)\]/);
  const displayText = linkTextMatch ? linkTextMatch[1] : text.slice(1);

  return (
    <a style={{ pointerEvents: 'none' }} href="#">
      {displayText}
    </a>
  );
};

const App = () => {
  const [hasNextChunk, setHasNextChunk] = useState(true);

  return (
    <XMarkdown
      content="访问 [Ant Design](https://ant.design 查看文档，这里有\`代码示例\` 和\|表格数据\|"
      streaming={{
        hasNextChunk,
        incompleteMarkdownComponentMap: {
          link: 'link-loading',
        },
      }}
      components={{
        'link-loading': ImageSkeleton,
        'incomplete-link': IncompleteLink,
      }}
    />
  );
};

export default App;
```

### FAQ

**为什么需要它？**

在流式传输过程中，Markdown 语法可能处于不完整状态：

```markdown
// 不完整的链接语法：
[示例网站](https://example

// 不完整的图片语法：
![产品图](https://cdn.example.com/images/produc
```

不完整的语法结构可能导致：
- 链接无法正确跳转
- 图片加载失败
- 格式标记直接显示在内容中

**hasNextChunk 为什么不能始终为 `true`？**

`hasNextChunk` 不应该始终为 `true`，否则会导致以下问题：

1. **语法悬而未决**：未闭合的链接、图片等语法会一直保持加载状态
2. **用户体验差**：用户看到持续的加载动画，无法获得完整内容
3. **内存泄漏**：状态数据持续累积，无法正确清理

---

## 性能监控

实时监控 Markdown 渲染过程中的关键性能指标（如 FPS 与内存占用），以浮层形式在页面上展示，辅助开发者识别渲染瓶颈。

### 基础用法

```tsx
import XMarkdown from '@ant-design/x-markdown';

const content = `
# 性能监控示例

这是一段较长的 Markdown 内容，用于测试渲染性能。

## 特性

- 特性 1
- 特性 2
- 特性 3

\`\`\`javascript
console.log('Hello World');
\`\`\`
`;

const App = () => (
  <XMarkdown
    content={content}
    debug={true}  // 启用性能监控面板
  />
);

export default App;
```

### API

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `debug` | 是否启用性能监控面板 | `boolean` | `false` |

> ⚠️ **仅限开发环境使用**，生产构建中请确保关闭以避免性能开销与信息泄露。

---

## 完整示例

结合动画效果、语法处理和性能监控的完整示例：

```tsx
import { Bubble } from '@ant-design/x';
import XMarkdown from '@ant-design/x-markdown';
import { Button, Flex, Skeleton, Space, Switch, Typography, theme } from 'antd';
import { useState, useEffect, useRef } from 'react';

const text = `
# Ant Design X: AI 应用复合工具集

> "轻松构建 AI 驱动的用户界面"
>
> — Ant Design X 团队

## ✨ 特性

- 🌈 企业级 AI 产品最佳实践
- 🧩 灵活的原子组件
- ✨ 流式友好的 Markdown 渲染
- 🚀 开箱即用的模型集成

## 核心组件

### 对话组件
- **Bubble**: 消息气泡
- **Sender**: 输入框
- **Conversations**: 会话管理

### 展示组件
- **ThoughtChain**: 思维链
- **Sources**: 来源引用
- **FileCard**: 文件卡片

![Ant Design X](https://mdn.alipayobjects.com/huamei_yz9z7c/afts/img/0lMhRYbo0-8AAAAAQDAAAAgADlJoAQFr/original)

访问 [Ant Design X](https://x.ant.design) 了解更多。
`;

// 自定义加载组件
const LoadingComponents = {
  'loading-link': () => (
    <Skeleton.Button active size="small" style={{ margin: '4px 0', width: 60 }} />
  ),
  'loading-image': () => <Skeleton.Image active style={{ width: 60, height: 60 }} />,
};

const App = () => {
  const [enableAnimation, setEnableAnimation] = useState(true);
  const [enableCache, setEnableCache] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [index, setIndex] = useState(0);
  const timer = useRef<any>(-1);
  const { theme: antdTheme } = theme.useToken();
  const className = antdTheme.id === 0 ? 'x-markdown-light' : 'x-markdown-dark';

  const renderStream = () => {
    if (index >= text.length) {
      clearTimeout(timer.current);
      setIsStreaming(false);
      return;
    }
    timer.current = setTimeout(() => {
      setIndex((prev) => prev + 1);
      renderStream();
    }, 50);
  };

  useEffect(() => {
    if (index === text.length) return;
    renderStream();
    setIsStreaming(true);
    return () => {
      clearTimeout(timer.current);
    };
  }, [index]);

  return (
    <Flex vertical gap="middle" style={{ padding: 24 }}>
      <Flex gap="small" justify="end">
        <Space>
          <Typography.Text>动画</Typography.Text>
          <Switch
            checked={enableAnimation}
            onChange={setEnableAnimation}
          />
        </Space>
        <Space>
          <Typography.Text>语法处理</Typography.Text>
          <Switch
            checked={enableCache}
            onChange={setEnableCache}
          />
        </Space>
        <Button onClick={() => { setIndex(0); setIsStreaming(true); renderStream(); }}>
          重新渲染
        </Button>
      </Flex>

      <Bubble
        content={text.slice(0, index)}
        contentRender={(content) => (
          <XMarkdown
            className={className}
            content={content}
            paragraphTag="div"
            streaming={{
              hasNextChunk: isStreaming && enableCache,
              enableAnimation,
              animationConfig: { fadeDuration: 200, opacity: 0.2 },
              incompleteMarkdownComponentMap: {
                link: 'loading-link',
                image: 'loading-image',
              },
            }}
            components={LoadingComponents}
            debug={true}
          />
        )}
      />
    </Flex>
  );
};

export default App;
```

---

## 相关资源

- [主文档](../skill.md)
- [自定义组件指南](./components.md)
- [插件指南](./plugins.md)
