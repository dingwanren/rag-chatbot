# CodeHighlighter 代码高亮 - Skill 参考文档

## 组件概述

**CodeHighlighter** 是 Ant Design X 中用于展示带有语法高亮的代码片段的组件，提供复制功能及头部语言信息显示。

**安装依赖：**
```bash
npm install @ant-design/x
```

**基本导入：**
```tsx
import { CodeHighlighter } from '@ant-design/x';
```

---

## 使用场景

### 1. 代码片段展示
展示带语法高亮的代码，支持多种编程语言。

### 2. 与 Markdown 配合
与 XMarkdown 结合使用，在 Markdown 内容中渲染代码块。

### 3. 自定义 Header
自定义代码块头部信息，如文件名、操作按钮等。

---

## 基础用法

### 基本使用

```tsx
import { CodeHighlighter } from '@ant-design/x';

const code = `import React from 'react';
import { Button } from 'antd';

const App = () => (
  <div>
    <Button type="primary">Primary Button</Button>
  </div>
);

export default App;`;

const App = () => (
  <div>
    <h3 style={{ marginBottom: 8 }}>JavaScript 代码</h3>
    <CodeHighlighter lang="javascript">{code}</CodeHighlighter>

    <h3 style={{ margin: '8px 0' }}>CSS 代码</h3>
    <CodeHighlighter lang="css">
      {`.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}`}
    </CodeHighlighter>

    <h3 style={{ margin: '8px 0' }}>HTML 代码</h3>
    <CodeHighlighter lang="html">
      {`<!DOCTYPE html>
<html>
<head>
  <title>My Page</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>`}
    </CodeHighlighter>
  </div>
);

export default App;
```

### 自定义 Header

```tsx
import { CodeHighlighter } from '@ant-design/x';
import { CopyOutlined } from '@ant-design/icons';
import { Button } from 'antd';

const code = `function hello() {
  console.log('Hello, World!');
}`;

const App = () => (
  <CodeHighlighter
    lang="javascript"
    header={
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>example.js</span>
        <Button
          type="text"
          icon={<CopyOutlined />}
          onClick={() => navigator.clipboard.writeText(code)}
        />
      </div>
    }
  >
    {code}
  </CodeHighlighter>
);

export default App;
```

### 与 XMarkdown 配合使用

```tsx
import { CodeHighlighter } from '@ant-design/x';
import XMarkdown from '@ant-design/x-markdown';

const markdownContent = `
# 示例代码

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

\`\`\`typescript
interface User {
  id: number;
  name: string;
}
\`\`\`
`;

const App = () => (
  <XMarkdown
    components={{
      code: ({ children, className }) => {
        const lang = className?.replace('language-', '') || 'text';
        return (
          <CodeHighlighter lang={lang}>
            {String(children).replace(/\n$/, '')}
          </CodeHighlighter>
        );
      },
    }}
  >
    {markdownContent}
  </XMarkdown>
);

export default App;
```

---

## API 参考

### CodeHighlighterProps

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `lang` | 语言 | `string` | - |
| `children` | 代码内容 | `string` | - |
| `header` | 顶部 | `React.ReactNode \| null` | `React.ReactNode` |
| `className` | 样式类名 | `string` | - |
| `classNames` | 样式类名 | `string` | - |
| `highlightProps` | 代码高亮配置 | [`highlightProps`](https://github.com/react-syntax-highlighter/react-syntax-highlighter?tab=readme-ov-file#props) | - |

### CodeHighlighterRef

| 属性 | 说明 | 类型 |
|------|------|------|
| `nativeElement` | 获取原生节点 | `HTMLElement` |

---

## 支持的语言

CodeHighlighter 支持多种编程语言，包括但不限于：

- `javascript` / `js`
- `typescript` / `ts`
- `jsx`
- `tsx`
- `css`
- `html`
- `python`
- `java`
- `go`
- `rust`
- `sql`
- `json`
- `yaml`
- `markdown`
- `shell` / `bash`

---

## 主题变量 (Design Token)

可通过 `XProvider` 自定义主题：

```tsx
import { XProvider } from '@ant-design/x';

<XProvider
  theme={{
    components: {
      CodeHighlighter: {
        // 自定义主题变量
      }
    }
  }}
>
  <App />
</XProvider>
```

---

## 最佳实践

### 1. 代码复制功能

```tsx
import { CodeHighlighter } from '@ant-design/x';
import { message } from 'antd';

const CodeWithCopy = ({ code, lang }) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      message.success('复制成功');
    } catch (err) {
      message.error('复制失败');
    }
  };

  return (
    <CodeHighlighter
      lang={lang}
      header={
        <button onClick={handleCopy} style={{ cursor: 'pointer' }}>
          复制代码
        </button>
      }
    >
      {code}
    </CodeHighlighter>
  );
};
```

### 2. 动态语言检测

```tsx
const detectLanguage = (filename) => {
  const ext = filename.split('.').pop();
  const langMap = {
    js: 'javascript',
    ts: 'typescript',
    jsx: 'jsx',
    tsx: 'tsx',
    py: 'python',
    java: 'java',
    go: 'go',
    rs: 'rust',
    css: 'css',
    html: 'html',
  };
  return langMap[ext] || 'text';
};

<CodeHighlighter lang={detectLanguage('example.tsx')}>
  {code}
</CodeHighlighter>
```

### 3. 代码块折叠

```tsx
import { useState } from 'react';
import { CodeHighlighter } from '@ant-design/x';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

const CollapsibleCode = ({ code, lang, title }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div>
      <div
        style={{ cursor: 'pointer', padding: '8px' }}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <DownOutlined /> : <UpOutlined />} {title}
      </div>
      {!collapsed && (
        <CodeHighlighter lang={lang}>{code}</CodeHighlighter>
      )}
    </div>
  );
};
```

---

## 相关资源

- [Ant Design X 官方文档](https://x.ant.design)
- [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)
- [@ant-design/x-markdown](../x-markdown/)
