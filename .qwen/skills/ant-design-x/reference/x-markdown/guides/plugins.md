# XMarkdown 插件指南

本指南详细介绍 XMarkdown 的插件系统，包括内置插件、自定义插件、插件配置等内容。

---

## 目录

1. [插件总览](#插件总览)
2. [如何使用插件](#如何使用插件)
3. [Latex 公式插件](#latex 公式插件)
4. [自定义插件](#自定义插件)
5. [完整示例](#完整示例)

---

## 插件总览

使用插件可以使 `@ant-design/x-markdown` 支持更多的扩展功能，比如：Latex 公式、代码高亮等。

### 内置插件列表

| 插件名 | 功能描述 | 引入路径 |
|--------|----------|----------|
| **Latex** | LaTeX 公式渲染 | `@ant-design/x-markdown/plugins/latex` |
| **CodeHighlighter** | 代码高亮（配合 CodeHighlighter 组件） | 内置支持 |
| **Mermaid** | Mermaid 图表渲染（配合 Mermaid 组件） | 内置支持 |

---

## 如何使用插件

### 从 npm 引入插件

可从 `@ant-design/x-markdown/plugins/插件名` 引入插件：

```tsx
import Latex from '@ant-design/x-markdown/plugins/latex';
```

### 从浏览器引入

在浏览器中使用 script 和 link 标签直接引入文件，并使用插件名作为全局变量：

```html
<script src="**/dist/plugins/latex.min.js"></script>
<script>
  const Latex = window.Latex;
</script>
```

---

## Latex 公式插件

### 何时使用

Markdown 中需要渲染 LaTeX 公式时使用。

### 基础用法

```tsx
import XMarkdown from '@ant-design/x-markdown';
import Latex from '@ant-design/x-markdown/plugins/latex';

const content = `
### LaTeX 公式

#### 行内公式

标准格式：$\\frac{df}{dt}$

另一种格式：\\(\\frac{df}{dt}\\)

#### 块级公式

标准格式：
$$
\\Delta t' = \\frac{\\Delta t}{\\sqrt{1 - \\frac{v^2}{c^2}}}
$$

另一种格式：
\\[
\\Delta t' = \\frac{\\Delta t}{\\sqrt{1 - \\frac{v^2}{c^2}}}
\\]
`;

const App = () => (
  <XMarkdown
    content={content}
    config={{ extensions: Latex() }}
  />
);

export default App;
```

### API

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `replaceAlignStart` | 是否将公式中的 `align*` 替换为 `aligned`（因为 katex 不支持 `align*`） | `boolean` | `true` |
| `katexOptions` | Katex 配置 | [`KatexOptions`](https://katex.org/docs/options) | `{ output: 'mathml' }` |

### KatexOptions 常用配置

```typescript
interface KatexOptions {
  output?: 'mathml' | 'html' | 'htmlAndMathml';
  displayMode?: boolean;
  leqno?: boolean;
  fleqn?: boolean;
  throwOnError?: boolean;
  errorColor?: string;
  macros?: Record<string, any>;
  colorIsTextColor?: boolean;
  maxSize?: number;
  maxExpand?: number;
  strict?: boolean | string | Function;
  trust?: boolean | Function;
}
```

### 自定义 Katex 配置

```tsx
import XMarkdown from '@ant-design/x-markdown';
import Latex from '@ant-design/x-markdown/plugins/latex';

const content = `
$$
\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
$$
`;

const App = () => (
  <XMarkdown
    content={content}
    config={{
      extensions: Latex({
        replaceAlignStart: true,
        katexOptions: {
          output: 'html',
          displayMode: true,
          throwOnError: false,
          errorColor: '#ff0000',
        },
      }),
    }}
  />
);

export default App;
```

---

## 自定义插件

### 何时使用

- 需要扩展 Markdown 语法
- 需要自定义渲染逻辑
- 内置插件无法满足需求时

### 基于 Marked 插件系统

使用 [Marked](https://marked.js.org/using_advanced#extensions) 插件系统来自定义扩展。

### 自定义插件示例：脚注

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

// 自定义脚注组件
const CustomFootnote = ({ children }: { children: React.ReactNode }) => (
  <sup
    className="footnote-ref"
    style={{ color: '#1890ff', cursor: 'pointer' }}
    onClick={() => console.log('点击脚注:', children)}
  >
    {children}
  </sup>
);

const App = () => (
  <XMarkdown
    content="这是一个脚注示例 [^1]，这是另一个 [^2]"
    config={{ extensions: [footnoteExtension] }}
    components={{
      footnote: CustomFootnote,
    }}
  />
);

export default App;
```

### 自定义插件示例：高亮标记

```tsx
import XMarkdown from '@ant-design/x-markdown';

// 高亮标记插件
const highlightExtension = {
  name: 'highlight',
  level: 'inline',
  start(src: string) {
    return src.match(/==/)?.index;
  },
  tokenizer(src: string) {
    const rule = /^==([^=]+)==/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'highlight',
        raw: match[0],
        text: match[1],
      };
    }
  },
  renderer(token: any) {
    return `<mark>${token.text}</mark>`;
  },
};

// 自定义高亮组件
const CustomMark = ({ children }: { children: React.ReactNode }) => (
  <mark
    style={{
      backgroundColor: '#fffbe6',
      padding: '2px 4px',
      borderRadius: 2,
    }}
  >
    {children}
  </mark>
);

const App = () => (
  <XMarkdown
    content="这是 ==高亮文本== 的示例"
    config={{ extensions: [highlightExtension] }}
    components={{
      mark: CustomMark,
    }}
  />
);

export default App;
```

### 自定义插件示例：警告框

```tsx
import XMarkdown from '@ant-design/x-markdown';
import { Alert } from 'antd';

// 警告框插件
const alertExtension = {
  name: 'alert',
  level: 'block',
  start(src: string) {
    return src.match(/^:::/)?.index;
  },
  tokenizer(src: string) {
    const rule = /^:::(\w+)\n([\s\S]*?)\n:::/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'alert',
        raw: match[0],
        alertType: match[1],
        text: match[2],
      };
    }
  },
  renderer(token: any) {
    return `<alert type="${token.alertType}">${token.text}</alert>`;
  },
};

// 自定义警告框组件
const CustomAlert = ({ children, domNode }: any) => {
  const type = domNode?.attribs?.type || 'info';
  return (
    <Alert
      message={children}
      type={type as 'success' | 'info' | 'warning' | 'error'}
      style={{ margin: '16px 0' }}
    />
  );
};

const markdown = `
:::warning
这是一个警告消息！
:::

:::info
这是一个提示消息！
:::
`;

const App = () => (
  <XMarkdown
    content={markdown}
    config={{ extensions: [alertExtension] }}
    components={{
      alert: CustomAlert,
    }}
  />
);

export default App;
```

---

## 完整示例

结合 Latex 公式、代码高亮、Mermaid 图表的完整示例：

```tsx
import { CodeHighlighter, Mermaid } from '@ant-design/x';
import XMarkdown, { type ComponentProps } from '@ant-design/x-markdown';
import Latex from '@ant-design/x-markdown/plugins/latex';
import { theme } from 'antd';
import React from 'react';

// 代码组件：支持普通代码块和 Mermaid 图表
const Code: React.FC<ComponentProps> = (props) => {
  const { className, children } = props;
  const lang = className?.match(/language-(\w+)/)?.[1] || '';

  if (typeof children !== 'string') return null;
  
  if (lang === 'mermaid') {
    return <Mermaid>{children}</Mermaid>;
  }
  
  return <CodeHighlighter lang={lang}>{children}</CodeHighlighter>;
};

const content = `
# 技术文档示例

## LaTeX 公式

### 行内公式

爱因斯坦质能方程：$E = mc^2$

欧拉恒等式：$e^{i\\pi} + 1 = 0$

### 块级公式

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

$$
\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}
$$

## 代码示例

### Python 代码

\`\`\`python
def fibonacci(n):
    """
    计算第 n 个斐波那契数
    """
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    else:
        a, b = 0, 1
        for _ in range(2, n+1):
            a, b = b, a + b
        return b

# 测试
for i in range(1, 11):
    print(f"fibonacci({i}) = {fibonacci(i)}")
\`\`\`

### JavaScript 代码

\`\`\`javascript
const factorial = (n) => {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
};

console.log(factorial(5)); // 120
\`\`\`

## 流程图

\`\`\`mermaid
graph TD
    A[开始] --> B{条件判断}
    B -->|是 | C[执行操作 A]
    B -->|否 | D[执行操作 B]
    C --> E[结束]
    D --> E
\`\`\`

## 时序图

\`\`\`mermaid
sequenceDiagram
    participant 用户
    participant 前端
    participant 后端
    participant 数据库

    用户->>前端：提交请求
    前端->>后端：API 调用
    后端->>数据库：查询数据
    数据库-->>后端：返回数据
    后端-->>前端：响应结果
    前端-->>用户：展示结果
\`\`\`
`;

const App: React.FC = () => {
  const { theme: antdTheme } = theme.useToken();
  const className = antdTheme.id === 0 ? 'x-markdown-light' : 'x-markdown-dark';

  return (
    <XMarkdown
      className={className}
      config={{ extensions: Latex() }}
      components={{
        code: Code,
      }}
    >
      {content}
    </XMarkdown>
  );
};

export default App;
```

---

## FAQ

### Components 与 Config Marked Extensions 的区别

#### Config Marked Extensions（插件扩展）

`config` 属性中的 `extensions` 用于扩展 Markdown 解析器的功能，它们在 **Markdown 转换为 HTML 的过程中** 起作用：

- **作用阶段**：Markdown 解析阶段
- **功能**：识别和转换特殊的 Markdown 语法
- **示例**：将 `[^1]` 脚注语法转换为 `<footnote>1</footnote>` HTML 标签
- **使用场景**：扩展 Markdown 语法，支持更多标记格式

```typescript
// 插件示例：脚注扩展
const footnoteExtension = {
  name: 'footnote',
  level: 'inline',
  start(src) { return src.match(/\[\^/)?.index; },
  tokenizer(src) {
    const rule = /^\[\^([^\]]+)\]/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'footnote',
        raw: match[0],
        text: match[1]
      };
    }
  },
  renderer(token) {
    return `<footnote>${token.text}</footnote>`;
  }
};

// 使用插件
<XMarkdown
  content="这是一个脚注示例 [^1]"
  config={{ extensions: [footnoteExtension] }}
/>
```

### Components（组件替换）

`components` 属性用于将已生成的 HTML 标签替换为自定义的 React 组件：

- **作用阶段**：HTML 渲染阶段
- **功能**：将 HTML 标签替换为 React 组件
- **示例**：将 `<footnote>1</footnote>` 替换为 `<CustomFootnote>1</CustomFootnote>`
- **使用场景**：自定义标签的渲染样式和交互行为

```typescript
// 自定义脚注组件
const CustomFootnote = ({ children, ...props }) => (
  <sup
    className="footnote-ref"
    onClick={() => console.log('点击脚注:', children)}
    style={{ color: 'blue', cursor: 'pointer' }}
  >
    {children}
  </sup>
);

// 使用组件替换
<XMarkdown
  content="<footnote>1</footnote>"
  components={{ footnote: CustomFootnote }}
/>
```

---

## 相关资源

- [主文档](../skill.md)
- [流式处理指南](./streaming.md)
- [自定义组件指南](./components.md)
- [Marked 插件文档](https://marked.js.org/using_pro#extensions)
- [KaTeX 文档](https://katex.org/docs/options)
