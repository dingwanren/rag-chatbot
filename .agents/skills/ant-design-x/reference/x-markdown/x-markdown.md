# XMarkdown Markdown 渲染器 - Skill 参考文档

## 组件概述

**XMarkdown** (`@ant-design/x-markdown`) 是一个流式友好、高拓展性和高性能的 Markdown 渲染器，提供流式渲染公式、代码高亮、mermaid 图表等能力。

**安装依赖：**
```bash
npm install @ant-design/x-markdown
```

**基本导入：**
```tsx
import XMarkdown from '@ant-design/x-markdown';

// 引入主题（可选）
import '@ant-design/x-markdown/themes/light.css';
import '@ant-design/x-markdown/themes/dark.css';
```

---

## 使用场景

### 1. AI 对话内容渲染
渲染 LLM 返回的流式 Markdown 格式内容。

### 2. 代码高亮展示
配合 CodeHighlighter 组件高亮代码块。

### 3. 公式渲染
支持 LaTeX 公式渲染。

### 4. 流程图/图表
配合 Mermaid 渲染流程图、时序图等。

### 5. 自定义组件
用 React 组件替换任意 Markdown 元素。

### 6. 流式内容展示
支持流式输出的渐进式渲染和动画效果。

---

## 基础用法

### 基本使用

```tsx
import XMarkdown from '@ant-design/x-markdown';
import { theme } from 'antd';

const content = `
# Hello World

### 欢迎使用 XMarkdown！

- 项目 1
- 项目 2
- 项目 3

[Ant Design X](https://x.ant.design)
`;

const App = () => {
  const { theme: antdTheme } = theme.useToken();
  const className = antdTheme.id === 0 ? 'x-markdown-light' : 'x-markdown-dark';
  
  return <XMarkdown content={content} className={className} />;
};

export default App;
```

### 与 Bubble 配合

```tsx
import { Bubble } from '@ant-design/x';
import XMarkdown from '@ant-design/x-markdown';

const markdownContent = `
# Ant Design X

AI 应用复合工具集，融合了 UI 组件库、流式 Markdown 渲染引擎和 AI SDK。

## 特性

- 🌈 企业级 AI 产品最佳实践
- 🧩 灵活的原子组件
- ✨ 流式友好的 Markdown 渲染
- 🚀 开箱即用的模型集成
`;

const App = () => (
  <Bubble
    content={markdownContent}
    contentRender={(content) => (
      <XMarkdown content={content} paragraphTag="div" />
    )}
  />
);

export default App;
```

---

## 进阶功能

### 1. 代码高亮

配合 CodeHighlighter 组件高亮代码：

```tsx
import { CodeHighlighter } from '@ant-design/x';
import XMarkdown, { type ComponentProps } from '@ant-design/x-markdown';

const Code: React.FC<ComponentProps> = (props) => {
  const { className, children } = props;
  const lang = className?.match(/language-(\w+)/)?.[1] || '';

  if (typeof children !== 'string') return null;
  return <CodeHighlighter lang={lang}>{children}</CodeHighlighter>;
};

const markdown = `
\`\`\`python
def fibonacci(n):
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    else:
        a, b = 0, 1
        for _ in range(2, n+1):
            a, b = b, a + b
        return b
\`\`\`
`;

const App = () => (
  <XMarkdown components={{ code: Code }}>{markdown}</XMarkdown>
);

export default App;
```

### 2. Mermaid 图表

```tsx
import { Mermaid } from '@ant-design/x';
import XMarkdown, { type ComponentProps } from '@ant-design/x-markdown';

const Code: React.FC<ComponentProps> = (props) => {
  const { className, children } = props;
  const lang = className?.match(/language-(\w+)/)?.[1] || '';

  if (typeof children !== 'string') return null;
  
  if (lang === 'mermaid') {
    return <Mermaid>{children}</Mermaid>;
  }
  
  return <CodeHighlighter lang={lang}>{children}</CodeHighlighter>;
};

const markdown = `
\`\`\`mermaid
graph TD
    A[开始] --> B{条件判断}
    B -->|是 | C[执行操作 A]
    B -->|否 | D[执行操作 B]
    C --> E[结束]
    D --> E
\`\`\`
`;

const App = () => (
  <XMarkdown components={{ code: Code }}>{markdown}</XMarkdown>
);

export default App;
```

### 3. 思考过程组件

```tsx
import { Think } from '@ant-design/x';
import XMarkdown, { type ComponentProps } from '@ant-design/x-markdown';
import React from 'react';

const ThinkComponent = React.memo((props: ComponentProps) => {
  const [title, setTitle] = React.useState('思考中...');
  const [loading, setLoading] = React.useState(true);
  const [expand, setExpand] = React.useState(true);

  React.useEffect(() => {
    if (props.streamStatus === 'done') {
      setTitle('思考完成');
      setLoading(false);
      setExpand(false);
    }
  }, [props.streamStatus]);

  return (
    <Think title={title} loading={loading} expanded={expand} onClick={() => setExpand(!expand)}>
      {props.children}
    </Think>
  );
});

const markdown = `
<think>
这是深度思考的内容...
通过分析问题、检索知识、组织答案，最终得出结论。
</think>

# 结论

思考过程结束，这是最终答案。
`;

const App = () => (
  <XMarkdown components={{ think: ThinkComponent }}>{markdown}</XMarkdown>
);

export default App;
```

### 4. 数据图表（GPT-Vis）

```tsx
import XMarkdown from '@ant-design/x-markdown';
import { Line } from '@antv/gpt-vis';
import { Skeleton } from 'antd';

const LineChart = (props: Record<string, any>) => {
  const { children, streamstatus } = props;
  const resolvedAxisXTitle = props['data-axis-x-title'] || '';
  const resolvedAxisYTitle = props['data-axis-y-title'] || '';

  let jsonData: any = [];
  if (Array.isArray(children) && children.length > 0) {
    jsonData = children[0];
  } else if (typeof children === 'string') {
    jsonData = JSON.parse(children);
  }

  if (streamstatus === 'loading') {
    return <Skeleton.Image active style={{ width: 600, height: 400 }} />;
  }

  return (
    <Line 
      data={jsonData} 
      axisXTitle={resolvedAxisXTitle} 
      axisYTitle={resolvedAxisYTitle} 
    />
  );
};

const markdown = `
**GPT-Vis** 图表组件示例

<custom-line data-axis-x-title="年份" data-axis-y-title="销售额">
[{"time":2013,"value":59.3},{"time":2014,"value":64.4},{"time":2015,"value":68.9},{"time":2016,"value":74.4},{"time":2017,"value":82.7},{"time":2018,"value":91.9},{"time":2019,"value":99.1},{"time":2020,"value":101.6},{"time":2021,"value":114.4},{"time":2022,"value":121}]
</custom-line>
`;

const App = () => (
  <XMarkdown
    components={{ 'custom-line': LineChart }}
    paragraphTag="div"
  >
    {markdown}
  </XMarkdown>
);

export default App;
```

### 5. 来源引用

```tsx
import { Sources } from '@ant-design/x';
import XMarkdown from '@ant-design/x-markdown';

const sources = [
  {
    key: '1',
    title: 'Ant Design X 官方文档',
    url: 'https://x.ant.design',
  },
  {
    key: '2',
    title: 'React 文档',
    url: 'https://react.dev',
  },
];

const App = () => (
  <XMarkdown
    components={{
      sources: () => (
        <Sources
          title="参考来源"
          items={sources}
          onClick={(item) => window.open(item.url, '_blank')}
        />
      ),
    }}
  >
    {"根据搜索结果 [1][2]，这是详细的回答..."}
  </XMarkdown>
);

export default App;
```

---

## 流式处理

XMarkdown 专为流式渲染设计，支持动画效果、未完成语法处理等能力。

### 基础流式示例

```tsx
import { Bubble } from '@ant-design/x';
import XMarkdown from '@ant-design/x-markdown';
import { Button, Flex, Switch, Typography } from 'antd';
import { useState, useEffect, useRef } from 'react';

const text = `
# Ant Design X

AI 应用复合工具集，融合了 UI 组件库、流式 Markdown 渲染引擎和 AI SDK。

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
    <Flex vertical gap="small">
      <Switch
        checked={enableAnimation}
        onChange={setEnableAnimation}
        checkedChildren="动画"
        unCheckedChildren="无动画"
      />
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

### 未完成语法处理

当流式输出出现未闭合的 Markdown 语法时，可通过 `incompleteMarkdownComponentMap` 指定自定义组件：

```tsx
import { Skeleton } from 'antd';
import XMarkdown from '@ant-design/x-markdown';

const LoadingComponents = {
  'loading-link': () => (
    <Skeleton.Button active size="small" style={{ width: 60 }} />
  ),
  'loading-image': () => <Skeleton.Image active style={{ width: 60, height: 60 }} />,
};

const App = () => (
  <XMarkdown
    content="访问 [Ant Design](https://ant.design 查看文档"
    streaming={{
      hasNextChunk: true,
      incompleteMarkdownComponentMap: {
        link: 'loading-link',
        image: 'loading-image',
      },
    }}
    components={LoadingComponents}
  />
);

export default App;
```

**更详细的流式处理用法（动画效果、语法处理、性能监控）请参照：[流式处理指南](./guides/streaming.md)**

---

## 自定义组件

XMarkdown 支持使用自定义 React 组件替换标准 HTML 标签，实现高度定制化。

### 基本用法

```tsx
import XMarkdown from '@ant-design/x-markdown';

const CustomHeading = ({ children, ...props }) => (
  <h1 style={{ color: '#1890ff' }} {...props}>
    {children}
  </h1>
);

const App = () => (
  <XMarkdown
    content="# Hello World"
    components={{ h1: CustomHeading }}
  />
);

export default App;
```

### 性能优化

```tsx
// ❌ 错误：每次渲染创建新组件
<XMarkdown components={{ h1: (props) => <h1 {...props} /> }} />;

// ✅ 正确：使用预定义组件
const Heading = (props) => <h1 {...props} />;
<XMarkdown components={{ h1: Heading }} />;

// ✅ 使用 React.memo
const StaticContent = React.memo(({ children }) => (
  <div className="static">{children}</div>
));
```

### 流式渲染处理

XMarkdown 会给组件传递 `streamStatus` 属性标识流式状态：

```tsx
import XMarkdown, { type ComponentProps } from '@ant-design/x-markdown';

const StreamingComponent = ({ streamStatus, children }) => {
  if (streamStatus === 'loading') {
    return <div className="loading">加载中...</div>;
  }
  return <div>{children}</div>;
};

const App = () => (
  <XMarkdown
    content="内容..."
    components={{ p: StreamingComponent }}
    streaming={{ hasNextChunk: true }}
  />
);

export default App;
```

### 数据获取

组件支持自主发起网络请求：

```tsx
import XMarkdown, { type ComponentProps } from '@ant-design/x-markdown';
import { useEffect, useState } from 'react';

const UserCard = ({ domNode, streamStatus }: ComponentProps) => {
  const [user, setUser] = useState<any>(null);
  const username = domNode?.attribs?.['data-username'];

  useEffect(() => {
    if (username && streamStatus === 'done') {
      fetch(`/api/users/${username}`)
        .then((r) => r.json())
        .then(setUser);
    }
  }, [username, streamStatus]);

  if (!user) return <div>加载中...</div>;

  return (
    <div className="user-card">
      <img src={user.avatar} alt={user.name} />
      <span>{user.name}</span>
    </div>
  );
};

const App = () => (
  <XMarkdown
    content='<user-card data-username="zhangsan"></user-card>'
    components={{ 'user-card': UserCard }}
  />
);

export default App;
```

**更详细的自定义组件用法（性能优化、流式处理、数据获取）请参照：[自定义组件指南](./guides/components.md)**

---

## 插件系统

XMarkdown 提供丰富的插件支持，可扩展 LaTeX 公式、代码高亮等功能。

### 使用插件

```tsx
import XMarkdown from '@ant-design/x-markdown';
import Latex from '@ant-design/x-markdown/plugins/latex';

const content = `
### LaTeX 公式

行内公式：$\\frac{df}{dt}$

块级公式：
$$
\\Delta t' = \\frac{\\Delta t}{\\sqrt{1 - \\frac{v^2}{c^2}}}
$$
`;

const App = () => (
  <XMarkdown
    config={{ extensions: Latex() }}
    content={content}
  />
);

export default App;
```

### 自定义插件

基于 Marked 插件系统自定义扩展：

```tsx
import XMarkdown from '@ant-design/x-markdown';

// 脚注插件
const footnoteExtension = {
  name: 'footnote',
  level: 'inline',
  start(src: string) {
    return src.match(/\[\^/)?.index;
  },
  tokenizer(src: string) {
    const rule = /^\[\^([^\]]+)\]/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'footnote',
        raw: match[0],
        text: match[1],
      };
    }
  },
  renderer(token: any) {
    return `<footnote>${token.text}</footnote>`;
  },
};

const App = () => (
  <XMarkdown
    content="这是一个脚注示例 [^1]"
    config={{ extensions: [footnoteExtension] }}
    components={{
      footnote: ({ children }) => (
        <sup style={{ color: 'blue' }}>{children}</sup>
      ),
    }}
  />
);

export default App;
```

**更详细的插件用法（内置插件、自定义插件、插件配置）请参照：[插件指南](./guides/plugins.md)**

---

## 主题配置

XMarkdown 提供内置主题，支持深度定制。

### 使用内置主题

```tsx
import XMarkdown from '@ant-design/x-markdown';
import '@ant-design/x-markdown/themes/light.css';
import '@ant-design/x-markdown/themes/dark.css';
import { theme } from 'antd';

const App = () => {
  const { theme: antdTheme } = theme.useToken();
  const className = antdTheme.id === 0 ? 'x-markdown-light' : 'x-markdown-dark';

  return (
    <XMarkdown
      content="# Hello XMarkdown!"
      className={className}
    />
  );
};

export default App;
```

### 自定义主题

```tsx
import XMarkdown from '@ant-design/x-markdown';

const customStyles = `
.x-markdown-custom {
  --x-markdown-color-text: #2c3e50;
  --x-markdown-color-bg: #f8fafc;
  --x-markdown-color-border: #e2e8f0;
  --x-markdown-color-primary: #0ea5e9;
}

.x-markdown-custom h1 {
  color: var(--x-markdown-color-primary);
  border-bottom: 2px solid var(--x-markdown-color-primary);
}

.x-markdown-custom pre {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}
`;

const App = () => (
  <>
    <style>{customStyles}</style>
    <XMarkdown
      content="# 自定义主题"
      className="x-markdown-custom"
    />
  </>
);

export default App;
```

---

## API 参考

### XMarkdownProps

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `content` | 需要渲染的 Markdown 内容 | `string` | - |
| `children` | Markdown 内容，作为 `content` 属性的别名 | `string` | - |
| `components` | 用于替换 HTML 元素的自定义 React 组件 | `Record<string, React.ComponentType<ComponentProps> \| keyof JSX.IntrinsicElements>` | - |
| `paragraphTag` | 段落元素的自定义 HTML 标签 | `keyof JSX.IntrinsicElements` | `'p'` |
| `streaming` | 流式渲染行为的配置 | `StreamingOption` | - |
| `config` | Markdown 解析和扩展的 Marked.js 配置 | [`MarkedExtension`](https://marked.js.org/using_advanced#options) | `{ gfm: true }` |
| `openLinksInNewTab` | 是否为所有 a 标签添加 `target="_blank"` | `boolean` | `false` |
| `dompurifyConfig` | HTML 净化和 XSS 防护的 DOMPurify 配置 | [`DOMPurify.Config`](https://github.com/cure53/DOMPurify#can-i-configure-dompurify) | - |
| `debug` | 是否启用调试模式（性能监控） | `boolean` | `false` |
| `className` | 根容器的额外 CSS 类名 | `string` | - |
| `rootClassName` | `className` 的别名 | `string` | - |
| `style` | 根容器的内联样式 | `CSSProperties` | - |
| `protectCustomTagNewlines` | 是否保护自定义标记中的换行符 | `boolean` | `false` |

### StreamingOption

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `hasNextChunk` | 是否还有后续内容块 | `boolean` | `false` |
| `enableAnimation` | 为块级元素启用文字淡入动画 | `boolean` | `false` |
| `animationConfig` | 文字出现动画效果的配置 | `AnimationConfig` | `{ fadeDuration: 200, opacity: 0.2 }` |
| `incompleteMarkdownComponentMap` | 未完成语法对应的自定义组件名 | `{ link?: string; image?: string; table?: string; html?: string }` | `{}` |

### AnimationConfig

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `fadeDuration` | 淡入动画的持续时间（毫秒） | `number` | `200` |
| `opacity` | 动画期间字符的初始透明度值（0-1） | `number` | `0.2` |

### ComponentProps

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `domNode` | 来自 html-react-parser 的组件 DOM 节点 | [`DOMNode`](https://github.com/remarkablemark/html-react-parser?tab=readme-ov-file#replace) | - |
| `streamStatus` | 流式渲染状态：`loading` 加载中，`done` 已完成 | `'loading' \| 'done'` | - |
| `lang` | 代码块语言标识 | `string` | - |
| `block` | 是否为块级 code | `boolean` | - |
| `children` | 包裹在组件中的内容 | `React.ReactNode` | - |
| `rest` | 组件属性，支持所有标准 HTML 属性 | `Record<string, any>` | - |

---

## 最佳实践

### 1. 完整 AI 对话示例

```tsx
import { Bubble, Think, CodeHighlighter, Mermaid } from '@ant-design/x';
import XMarkdown, { type ComponentProps } from '@ant-design/x-markdown';
import Latex from '@ant-design/x-markdown/plugins/latex';
import { Line } from '@antv/gpt-vis';
import { Skeleton, theme } from 'antd';
import { useState, useEffect, useRef } from 'react';

// 代码组件
const Code: React.FC<ComponentProps> = (props) => {
  const { className, children } = props;
  const lang = className?.match(/language-(\w+)/)?.[1] || '';

  if (typeof children !== 'string') return null;
  if (lang === 'mermaid') return <Mermaid>{children}</Mermaid>;
  return <CodeHighlighter lang={lang}>{children}</CodeHighlighter>;
};

// 思考过程组件
const ThinkComponent = React.memo((props: ComponentProps) => {
  const [title, setTitle] = useState('思考中...');
  const [loading, setLoading] = useState(true);
  const [expand, setExpand] = useState(true);

  useEffect(() => {
    if (props.streamStatus === 'done') {
      setTitle('思考完成');
      setLoading(false);
      setExpand(false);
    }
  }, [props.streamStatus]);

  return (
    <Think title={title} loading={loading} expanded={expand}>
      {props.children}
    </Think>
  );
});

// 图表组件
const LineChart = (props: Record<string, any>) => {
  const { children, streamstatus } = props;
  const axisXTitle = props['data-axis-x-title'] || '';
  const axisYTitle = props['data-axis-y-title'] || '';

  let jsonData: any = [];
  if (Array.isArray(children) && children.length > 0) {
    jsonData = children[0];
  } else if (typeof children === 'string') {
    jsonData = JSON.parse(children);
  }

  if (streamstatus === 'loading') {
    return <Skeleton.Image active style={{ width: 600, height: 400 }} />;
  }

  return <Line data={jsonData} axisXTitle={axisXTitle} axisYTitle={axisYTitle} />;
};

const App = () => {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(true);
  const { theme: antdTheme } = theme.useToken();
  const className = antdTheme.id === 0 ? 'x-markdown-light' : 'x-markdown-dark';

  const fullContent = `
<think>
用户询问关于数据可视化的问题，我需要提供 GPT-Vis 图表组件的使用示例。
</think>

# 数据可视化示例

下面是使用 **GPT-Vis** 渲染的图表：

<custom-line data-axis-x-title="年份" data-axis-y-title="销售额">
[{"time":2013,"value":59.3},{"time":2014,"value":64.4},{"time":2015,"value":68.9},{"time":2016,"value":74.4},{"time":2017,"value":82.7},{"time":2018,"value":91.9},{"time":2019,"value":99.1},{"time":2020,"value":101.6},{"time":2021,"value":114.4},{"time":2022,"value":121}]
</custom-line>

## 代码示例

\`\`\`python
def fibonacci(n):
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    else:
        a, b = 0, 1
        for _ in range(2, n+1):
            a, b = b, a + b
        return b
\`\`\`

## 流程图

\`\`\`mermaid
graph TD
    A[开始] --> B{条件判断}
    B -->|是 | C[执行操作]
    B -->|否 | D[结束]
\`\`\`
`;

  useEffect(() => {
    if (content.length >= fullContent.length) {
      setIsStreaming(false);
      return;
    }

    const timer = setTimeout(() => {
      setContent(fullContent.slice(0, content.length + 5));
    }, 20);

    return () => clearTimeout(timer);
  }, [content]);

  return (
    <Bubble
      content={content}
      contentRender={(c) => (
        <XMarkdown
          className={className}
          config={{ extensions: Latex() }}
          components={{
            code: Code,
            think: ThinkComponent,
            'custom-line': LineChart,
          }}
          paragraphTag="div"
          streaming={{
            hasNextChunk: isStreaming,
            enableAnimation: true,
          }}
        >
          {c}
        </XMarkdown>
      )}
    />
  );
};

export default App;
```

### 2. XSS 防护

```tsx
import XMarkdown from '@ant-design/x-markdown';

const maliciousContent = `
# Hello
<script>alert('XSS')</script>
`;

const App = () => (
  <XMarkdown
    content={maliciousContent}
    dompurifyConfig={{
      FORBID_TAGS: ['script', 'iframe', 'object'],
      FORBID_ATTR: ['onclick', 'onerror', 'onload'],
    }}
  />
);

export default App;
```

### 3. 链接新标签页打开

```tsx
import XMarkdown from '@ant-design/x-markdown';

const App = () => (
  <XMarkdown
    content="[Ant Design](https://ant.design)"
    openLinksInNewTab
  />
);

export default App;
```

---

## 相关资源

- [XMarkdown 官方文档](https://x.ant.design)
- [marked 文档](https://marked.js.org/)
- [DOMPurify 文档](https://github.com/cure53/DOMPurify)
- [GPT-Vis 图表库](https://github.com/antvis/GPT-Vis)

## 指南文档

- **[流式处理指南](./guides/streaming.md)** - 动画效果、语法处理、性能监控
- **[自定义组件指南](./guides/components.md)** - 组件替换、性能优化、数据获取
- **[插件指南](./guides/plugins.md)** - 内置插件、自定义插件、插件配置
