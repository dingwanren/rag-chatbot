# Sources 来源引用 - Skill 参考文档

## 组件概述

**Sources** 是 Ant Design X 中用于展示引用的数据来源地址的组件，适用于联网搜索模式下展示引用的数据来源。

**安装依赖：**
```bash
npm install @ant-design/x
```

**基本导入：**
```tsx
import { Sources } from '@ant-design/x';
```

---

## 使用场景

### 1. 搜索结果引用
在联网搜索模式下展示引用的数据来源地址。

### 2. 参考来源展示
展示 AI 回答所参考的文档、网页等来源。

### 3. 行内引用模式
在文本中嵌入引用来源标记。

---

## 基础用法

### 基础用法

```tsx
import { Sources } from '@ant-design/x';

const items = [
  {
    key: '1',
    title: 'Ant Design X 官方文档',
    url: 'https://x.ant.design',
    icon: 'https://x.ant.design/favicon.ico',
    description: 'Ant Design X 组件库文档',
  },
  {
    key: '2',
    title: 'React 官方文档',
    url: 'https://react.dev',
    icon: 'https://react.dev/favicon.ico',
    description: 'React 框架官方文档',
  },
  {
    key: '3',
    title: 'TypeScript 文档',
    url: 'https://www.typescriptlang.org',
    description: 'TypeScript 编程语言文档',
  },
];

const App = () => (
  <Sources
    title="参考来源"
    items={items}
    onClick={(item) => {
      window.open(item.url, '_blank');
    }}
  />
);

export default App;
```

### 使用图标

```tsx
import { Sources } from '@ant-design/x';
import { LinkOutlined } from '@ant-design/icons';

const items = [
  {
    key: '1',
    title: '来源 1',
    url: 'https://example.com/1',
    icon: <LinkOutlined />,
  },
  {
    key: '2',
    title: '来源 2',
    url: 'https://example.com/2',
    icon: <LinkOutlined />,
  },
];

const App = () => (
  <Sources
    title="引用来源"
    items={items}
    expandIconPosition="start"
  />
);

export default App;
```

### 展开/折叠模式

```tsx
import { Sources } from '@ant-design/x';
import { useState } from 'react';

const items = [
  { key: '1', title: '来源 1', url: 'https://example.com/1' },
  { key: '2', title: '来源 2', url: 'https://example.com/2' },
  { key: '3', title: '来源 3', url: 'https://example.com/3' },
  { key: '4', title: '来源 4', url: 'https://example.com/4' },
];

const App = () => {
  const [expanded, setExpanded] = useState(true);

  return (
    <Sources
      title="参考来源"
      items={items}
      expanded={expanded}
      onExpand={setExpanded}
      expandIconPosition="end"
    />
  );
};

export default App;
```

### 行内模式

```tsx
import { Sources } from '@ant-design/x';

const items = [
  { key: '1', title: '来源 1', url: 'https://example.com/1' },
  { key: '2', title: '来源 2', url: 'https://example.com/2' },
  { key: '3', title: '来源 3', url: 'https://example.com/3' },
];

const App = () => (
  <Sources
    items={items}
    inline
    activeKey="1"
    onClick={(item) => {
      console.log('点击来源:', item);
    }}
  />
);

export default App;
```

---

## 进阶功能

### 1. 与 Bubble 配合展示引用

```tsx
import { Bubble, Sources } from '@ant-design/x';

const sources = [
  {
    key: '1',
    title: 'Ant Design X',
    url: 'https://x.ant.design',
    description: 'AI 组件库',
  },
  {
    key: '2',
    title: 'React 文档',
    url: 'https://react.dev',
    description: 'React 框架',
  },
];

const App = () => (
  <Bubble
    content="根据搜索结果，Ant Design X 是一个专为 AI 应用设计的组件库..."
    footer={
      <Sources
        title="参考来源"
        items={sources}
        onClick={(item) => window.open(item.url, '_blank')}
      />
    }
  />
);

export default App;
```

### 2. 自定义展开图标位置

```tsx
import { Sources } from '@ant-design/x';

const items = [
  { key: '1', title: '来源 1', url: 'https://example.com/1' },
  { key: '2', title: '来源 2', url: 'https://example.com/2' },
];

// 图标在开始位置
<Sources items={items} expandIconPosition="start" />

// 图标在结束位置
<Sources items={items} expandIconPosition="end" />
```

### 3. 受控展开状态

```tsx
import { Sources } from '@ant-design/x';
import { useState } from 'react';

const App = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Sources
      title="参考来源"
      items={[
        { key: '1', title: '来源 1', url: 'https://example.com/1' },
        { key: '2', title: '来源 2', url: 'https://example.com/2' },
      ]}
      expanded={expanded}
      onExpand={setExpanded}
    />
  );
};

export default App;
```

### 4. 自定义样式

```tsx
import { Sources } from '@ant-design/x';

const items = [
  { key: '1', title: '来源 1', url: 'https://example.com/1' },
  { key: '2', title: '来源 2', url: 'https://example.com/2' },
];

const App = () => (
  <Sources
    title="参考来源"
    items={items}
    styles={{
      root: {
        background: '#f5f5f5',
        borderRadius: 8,
        padding: 16,
      },
      title: {
        fontWeight: 'bold',
        marginBottom: 12,
      },
      item: {
        padding: '8px 12px',
        borderRadius: 4,
      },
    }}
    classNames={{
      item: 'custom-source-item',
    }}
  />
);

export default App;
```

---

## API 参考

### SourcesProps

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `classNames` | 样式类名 | `Record<SemanticDOM, string>` | - |
| `styles` | 样式 style | `Record<SemanticDOM, CSSProperties>` | - |
| `title` | 标题内容 | `React.ReactNode` | - |
| `items` | 来源内容 | `SourcesItem[]` | - |
| `expandIconPosition` | 折叠图标位置 | `start` \| `end` | `start` |
| `defaultExpanded` | 默认是否展开 | `boolean` | `true` |
| `expanded` | 是否展开 | `boolean` | - |
| `onExpand` | 展开事件 | `(expand: boolean) => void` | - |
| `onClick` | 点击事件 | `(item: SourcesItem) => void` | - |
| `inline` | 行内模式 | `boolean` | `false` |
| `activeKey` | 行内模式，激活的 key | `React.Key` | - |
| `popoverOverlayWidth` | 弹出层宽度 | `number \| string` | `300` |

### SourcesItem

```typescript
interface SourcesItem {
  key?: React.Key;
  title: React.ReactNode;
  url?: string;
  icon?: React.ReactNode;
  description?: React.ReactNode;
}
```

### Semantic DOM

```typescript
type SemanticDOM = 'root' | 'title' | 'item' | 'itemIcon' | 'itemTitle' | 'itemDescription';
```

---

## 主题变量 (Design Token)

可通过 `XProvider` 自定义主题：

```tsx
import { XProvider } from '@ant-design/x';

<XProvider
  theme={{
    components: {
      Sources: {
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

### 1. 来源数据格式化

```tsx
const formatSources = (urls: string[]) => {
  return urls.map((url, index) => ({
    key: `source-${index}`,
    title: new URL(url).hostname,
    url,
    icon: `https://www.google.com/s2/favicons?domain=${url}`,
  }));
};

const sources = formatSources([
  'https://x.ant.design',
  'https://react.dev',
  'https://ant.design',
]);

<Sources items={sources} />;
```

### 2. 与 Think 配合展示思考过程和引用

```tsx
import { Think, Sources, Bubble } from '@ant-design/x';
import { Flex } from 'antd';

const App = () => (
  <Flex vertical gap="middle">
    <Think
      title="思考过程"
      defaultExpanded={false}
    >
      正在分析用户问题，搜索相关知识...
    </Think>
    
    <Bubble
      content="根据搜索结果，这是一个详细的回答..."
      footer={
        <Sources
          title="参考来源"
          items={[
            { key: '1', title: '来源 1', url: 'https://example.com/1' },
            { key: '2', title: '来源 2', url: 'https://example.com/2' },
          ]}
        />
      }
    />
  </Flex>
);

export default App;
```

### 3. 行内引用标记

```tsx
import { Sources } from '@ant-design/x';
import { Typography } from 'antd';

const App = () => {
  const sources = [
    { key: '1', title: 'React 文档', url: 'https://react.dev' },
    { key: '2', title: 'Vue 文档', url: 'https://vuejs.org' },
  ];

  return (
    <>
      <Typography.Paragraph>
        React 是一个用于构建用户界面的 JavaScript 库 [1]。
        Vue 是一个渐进式 JavaScript 框架 [2]。
      </Typography.Paragraph>
      
      <Sources
        items={sources}
        inline
        activeKey="1"
      />
    </>
  );
};

export default App;
```

### 4. 点击打开链接

```tsx
import { Sources } from '@ant-design/x';

const App = ({ items }) => (
  <Sources
    title="参考来源"
    items={items}
    onClick={(item) => {
      if (item.url) {
        window.open(item.url, '_blank', 'noopener,noreferrer');
      }
    }}
  />
);

export default App;
```

---

## 相关资源

- [Ant Design X 官方文档](https://x.ant.design)
- [Bubble 组件](../bubble/)
- [Think 组件](../think/)
