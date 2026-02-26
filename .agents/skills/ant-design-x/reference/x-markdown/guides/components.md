# XMarkdown 自定义组件指南

本指南详细介绍 XMarkdown 的自定义组件能力，包括组件替换、性能优化、流式处理、数据获取等功能。

---

## 目录

1. [基本用法](#基本用法)
2. [性能优化](#性能优化)
3. [流式渲染处理](#流式渲染处理)
4. [数据获取](#数据获取)
5. [支持的标签映射](#支持的标签映射)
6. [完整示例](#完整示例)

---

## 基本用法

`components` 属性允许你使用自定义 React 组件替换标准的 HTML 标签。

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

---

## 性能优化

### 1. 避免内联组件定义

```tsx
// ❌ 错误：每次渲染创建新组件，导致性能问题
<XMarkdown components={{ h1: (props) => <h1 {...props} /> }} />;

// ✅ 正确：使用预定义组件
const Heading = (props) => <h1 {...props} />;
<XMarkdown components={{ h1: Heading }} />;
```

### 2. 使用 React.memo

```tsx
import React from 'react';

const StaticContent = React.memo(({ children }) => (
  <div className="static">{children}</div>
));

const App = () => (
  <XMarkdown
    content="静态内容..."
    components={{ p: StaticContent }}
  />
);

export default App;
```

### 3. 代码高亮组件（带缓存）

```tsx
import { CodeHighlighter } from '@ant-design/x';
import XMarkdown, { type ComponentProps } from '@ant-design/x-markdown';
import React from 'react';

const Code: React.FC<ComponentProps> = React.memo((props) => {
  const { className, children } = props;
  const lang = className?.match(/language-(\w+)/)?.[1] || '';

  if (typeof children !== 'string') return null;
  return <CodeHighlighter lang={lang}>{children}</CodeHighlighter>;
});

const markdown = `
\`\`\`python
def hello():
    print('Hello World')
\`\`\`
`;

const App = () => (
  <XMarkdown components={{ code: Code }}>{markdown}</XMarkdown>
);

export default App;
```

---

## 流式渲染处理

XMarkdown 会默认给组件传递 `streamStatus` 属性，用于标识组件是否闭合，便于处理流式渲染。

### 状态判断

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

### 思考过程组件

配合 Think 组件在流式过程中自动打开，流式结束后自动关闭：

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

### 完整流式示例

```tsx
import { Bubble } from '@ant-design/x';
import XMarkdown, { type ComponentProps } from '@ant-design/x-markdown';
import { Button, Flex, Skeleton, Space, Switch, Typography } from 'antd';
import React, { useState, useEffect, useRef } from 'react';

const text = `
# Ant Design X

Ant Design X 是一款 AI 应用复合工具集。

![Ant Design X](https://mdn.alipayobjects.com/huamei_yz9z7c/afts/img/0lMhRYbo0-8AAAAAQDAAAAgADlJoAQFr/original)

访问 [Ant Design](https://ant.design) 查看文档。
`;

// 自定义加载组件
const LoadingComponents = {
  'loading-link': () => (
    <Skeleton.Button active size="small" style={{ margin: '4px 0', width: 16 }} />
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
    return () => clearTimeout(timer.current);
  }, [index]);

  return (
    <Flex vertical gap="middle">
      <Flex gap="small" justify="end">
        <Space>
          <Typography.Text>动画</Typography.Text>
          <Switch checked={enableAnimation} onChange={setEnableAnimation} />
        </Space>
        <Space>
          <Typography.Text>语法处理</Typography.Text>
          <Switch checked={enableCache} onChange={setEnableCache} />
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

---

## 数据获取

组件支持两种数据获取方式：直接解析 Markdown 中的数据，或自主发起网络请求。

### 基础数据获取

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

### 数据图表组件（GPT-Vis）

配合 GPT-VIS 在流式过程中展示 Loading 状态，流式结束后展示最终结果：

```tsx
import XMarkdown from '@ant-design/x-markdown';
import { Line } from '@antv/gpt-vis';
import { Skeleton } from 'antd';

const LineChart = (props: Record<string, any>) => {
  const { children, streamstatus } = props;
  const resolvedAxisXTitle = props['data-axis-x-title'] || '';
  const resolvedAxisYTitle = props['data-axis-y-title'] || '';
  const resolvedStreamStatus = streamstatus || 'done';

  // 从 children 中提取 JSON 数据
  let jsonData: any = [];
  if (Array.isArray(children) && children.length > 0) {
    jsonData = children[0];
  } else if (typeof children === 'string') {
    jsonData = JSON.parse(children);
  }

  if (resolvedStreamStatus === 'loading') {
    return <Skeleton.Image active style={{ width: 600, height: 400 }} />;
  }

  try {
    const parsedData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    return (
      <Line
        data={parsedData}
        axisXTitle={resolvedAxisXTitle}
        axisYTitle={resolvedAxisYTitle}
      />
    );
  } catch (error) {
    console.error('Failed to parse Line data:', jsonData, error);
    return <div>Error rendering chart</div>;
  }
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
    streaming={{ hasNextChunk: false }}
  >
    {markdown}
  </XMarkdown>
);

export default App;
```

### 来源引用组件

配合 Sources 组件渲染来源引用：

```tsx
import { Sources } from '@ant-design/x';
import XMarkdown from '@ant-design/x-markdown';

const sources = [
  {
    key: '1',
    title: 'Ant Design X 官方文档',
    url: 'https://x.ant.design',
    description: 'AI 组件库文档',
  },
  {
    key: '2',
    title: 'React 文档',
    url: 'https://react.dev',
    description: 'React 框架文档',
  },
];

const SourcesComponent = () => (
  <Sources
    title="参考来源"
    items={sources}
    onClick={(item) => window.open(item.url, '_blank')}
  />
);

const App = () => (
  <XMarkdown
    content="根据搜索结果 [1][2]，这是详细的回答..."
    components={{ sources: SourcesComponent }}
  />
);

export default App;
```

---

## 支持的标签映射

### 标准 HTML 标签

| 标签 | 组件名 |
|------|--------|
| `a` | `a` |
| `h1-h6` | `h1-h6` |
| `p` | `p` |
| `img` | `img` |
| `table` | `table` |
| `ul/ol/li` | `ul/ol/li` |
| `code/pre` | `code/pre` |
| `blockquote` | `blockquote` |
| `hr` | `hr` |
| `strong/b` | `strong` |
| `em/i` | `em` |

### 自定义标签

支持任意自定义标签：

```tsx
import XMarkdown from '@ant-design/x-markdown';

const MyComponent = ({ children }) => (
  <div className="my-component">{children}</div>
);

const UserCard = ({ children, domNode }) => (
  <div className="user-card">{children}</div>
);

const App = () => (
  <XMarkdown
    content={`
<my-component>自定义内容</my-component>
<user-card data-username="zhangsan">用户卡片</user-card>
    `}
    components={{
      'my-component': MyComponent,
      'user-card': UserCard,
    }}
  />
);

export default App;
```

---

## ComponentProps

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `domNode` | 来自 html-react-parser 的组件 DOM 节点，包含解析后的 DOM 节点信息 | [`DOMNode`](https://github.com/remarkablemark/html-react-parser?tab=readme-ov-file#replace) | - |
| `streamStatus` | 流式渲染状态：`loading` 表示内容正在加载中，`done` 表示加载已完成 | `'loading' \| 'done'` | - |
| `lang` | 代码块语言标识信息 | `string` | - |
| `block` | 是否为块级 code | `boolean` | - |
| `children` | 包裹在组件中的内容，包含 DOM 节点的文本内容 | `React.ReactNode` | - |
| `rest` | 组件属性，支持所有标准 HTML 属性（如 `href`、`title`、`className` 等）和自定义数据属性 | `Record<string, any>` | - |

---

## FAQ

### 块级 HTML 标签未正确闭合

块级 HTML 标签内部包含空行（\n\n），Markdown 解析器将空行视为新段落的开始，从而中断对原始 HTML 块的识别。

**示例问题：**

输入 Markdown：
```markdown
<think>
这是思考内容

思考内容包含空行
</think>

这是正文内容
```

错误输出：
```html
<think>
  这是思考内容

  <p>思考内容包含空行</p>
  <p>这是正文内容</p>
</think>
```

**根本原因：** 根据 CommonMark 规范，HTML 块的识别依赖于严格的格式规则。一旦在 HTML 块内部出现两个连续换行（即空行），且未满足特定 HTML 块类型的延续条件，解析器会终止当前 HTML 块。

**解决方案：**

1. **方案一**：移除标签内部所有空行
```markdown
<think>
这是思考内容
思考内容无空行
</think>
```

2. **方案二**：在 HTML 标签前后及内部添加空行，使其成为独立块
```markdown
<think>

这是思考内容

思考内容包含空行

</think>
```

---

## 相关资源

- [主文档](../skill.md)
- [流式处理指南](./streaming.md)
- [插件指南](./plugins.md)
