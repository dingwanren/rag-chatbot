# Think 思考过程 - Skill 参考文档

## 组件概述

**Think** 是 Ant Design X 中用于展示大模型深度思考过程的组件，支持展开/折叠、状态显示、加载动画等功能。

**安装依赖：**
```bash
npm install @ant-design/x
```

**基本导入：**
```tsx
import { Think } from '@ant-design/x';
```

---

## 使用场景

### 1. 思考过程展示
展示 AI 模型的深度思考过程。

### 2. 推理链可视化
可视化展示 AI 的推理步骤。

### 3. 加载状态提示
在 AI 思考时显示加载状态。

---

## 基础用法

### 基本用法

```tsx
import { Think } from '@ant-design/x';

const App = () => (
  <Think title="思考过程">
    这是一个复杂的推理过程：
    1. 首先分析问题...
    2. 然后收集相关信息...
    3. 最后得出结论...
  </Think>
);

export default App;
```

### 设置状态

```tsx
import { Think } from '@ant-design/x';

const App = () => (
  <>
    {/* 思考中 */}
    <Think
      title="正在思考"
      loading
    >
      分析用户问题中...
    </Think>

    {/* 思考完成 */}
    <Think
      title="思考完成"
      loading={false}
    >
      已完成分析，得出结论...
    </Think>
  </>
);

export default App;
```

### 展开/折叠控制

```tsx
import { Think } from '@ant-design/x';
import { useState } from 'react';

const App = () => {
  const [expanded, setExpanded] = useState(true);

  return (
    <Think
      title="思考过程"
      expanded={expanded}
      onExpand={setExpanded}
    >
      这里是详细的思考过程内容...
      可以包含多个步骤和推理链...
    </Think>
  );
};

export default App;
```

---

## 进阶功能

### 1. 自定义图标

```tsx
import { Think } from '@ant-design/x';
import { BulbOutlined } from '@ant-design/icons';

const App = () => (
  <Think
    title="创意构思"
    icon={<BulbOutlined />}
  >
    正在生成创意...
  </Think>
);

export default App;
```

### 2. 闪动模式

```tsx
import { Think } from '@ant-design/x';

const App = () => (
  <Think
    title="正在思考"
    loading
    blink
  >
    思考内容会带有闪动效果吸引注意
  </Think>
);

export default App;
```

### 3. 与 Bubble 配合

```tsx
import { Bubble, Think } from '@ant-design/x';
import { Flex } from 'antd';

const App = () => (
  <Flex vertical gap="middle">
    <Think
      title="思考过程"
      loading
      defaultExpanded={false}
    >
      1. 理解问题：用户询问关于 React 的知识
      2. 检索信息：从知识库中查找 React 相关内容
      3. 组织答案：整理信息形成结构化回答
    </Think>

    <Bubble
      content="React 是一个用于构建用户界面的 JavaScript 库..."
    />
  </Flex>
);

export default App;
```

### 4. 多步骤思考

```tsx
import { Think } from '@ant-design/x';
import { Flex } from 'antd';

const App = () => (
  <Flex vertical gap="small">
    <Think
      title="步骤 1: 问题分析"
      defaultExpanded={false}
    >
      用户需要解决一个关于状态管理的问题...
    </Think>

    <Think
      title="步骤 2: 方案对比"
      defaultExpanded={false}
    >
      方案 A: 使用 Redux - 优点：成熟稳定；缺点：样板代码多
      方案 B: 使用 Zustand - 优点：简洁易用；缺点：生态较小
      方案 C: 使用 Context - 优点：原生支持；缺点：性能问题
    </Think>

    <Think
      title="步骤 3: 最终建议"
      defaultExpanded
    >
      根据项目规模和需求，推荐使用 Zustand...
    </Think>
  </Flex>
);

export default App;
```

### 5. 自定义样式

```tsx
import { Think } from '@ant-design/x';

const App = () => (
  <Think
    title="自定义样式"
    styles={{
      root: {
        border: '1px solid #1890ff',
        borderRadius: 8,
      },
      header: {
        background: '#e6f7ff',
      },
      content: {
        padding: 16,
      },
    }}
    classNames={{
      root: 'custom-think',
    }}
  >
    这里是自定义样式的内容
  </Think>
);

export default App;
```

### 6. 思考过程流

```tsx
import { Think } from '@ant-design/x';
import { Flex } from 'antd';
import { useEffect, useState } from 'react';

const App = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);

  const steps = [
    { title: '接收问题', content: '正在理解用户的问题...' },
    { title: '分析意图', content: '分析用户真实需求...' },
    { title: '检索知识', content: '从知识库中检索相关信息...' },
    { title: '组织答案', content: '整理信息形成回答...' },
    { title: '完成', content: '思考完成，准备输出答案。', loading: false },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(timer);
          setLoading(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  return (
    <Flex vertical gap="small">
      {steps.slice(0, step + 1).map((s, index) => (
        <Think
          key={index}
          title={s.title}
          loading={s.loading !== false && loading}
          defaultExpanded={false}
        >
          {s.content}
        </Think>
      ))}
    </Flex>
  );
};

export default App;
```

---

## API 参考

### ThinkProps

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `classNames` | 样式类名 | `Record<SemanticDOM, string>` | - |
| `styles` | 样式 style | `Record<SemanticDOM, CSSProperties>` | - |
| `children` | 内容 | `React.ReactNode` | - |
| `title` | 状态文本 | `React.ReactNode` | - |
| `icon` | 状态图标 | `React.ReactNode` | - |
| `loading` | 加载中 | `boolean \| React.ReactNode` | `false` |
| `defaultExpanded` | 默认是否展开 | `boolean` | `true` |
| `expanded` | 是否展开 | `boolean` | - |
| `onExpand` | 展开事件 | `(expand: boolean) => void` | - |
| `blink` | 闪动模式 | `boolean` | - |

### Semantic DOM

```typescript
type SemanticDOM = 'root' | 'header' | 'content';
```

---

## 主题变量 (Design Token)

可通过 `XProvider` 自定义主题：

```tsx
import { XProvider } from '@ant-design/x';

<XProvider
  theme={{
    components: {
      Think: {
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

### 1. 与 ThoughtChain 配合

```tsx
import { Think, ThoughtChain } from '@ant-design/x';
import { Flex } from 'antd';

const App = () => (
  <Flex vertical gap="middle">
    <Think title="思考过程" defaultExpanded={false}>
      正在分析复杂问题...
    </Think>

    <ThoughtChain
      items={[
        {
          key: '1',
          title: '步骤 1',
          description: '问题理解',
          content: '理解用户需求',
          status: 'success',
        },
        {
          key: '2',
          title: '步骤 2',
          description: '信息检索',
          content: '检索相关知识',
          status: 'success',
        },
        {
          key: '3',
          title: '步骤 3',
          description: '答案生成',
          content: '生成最终答案',
          status: 'loading',
        },
      ]}
    />
  </Flex>
);

export default App;
```

### 2. 实时思考状态

```tsx
import { Think } from '@ant-design/x';
import { useEffect, useState } from 'react';

const useThinking = (initialContent) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < initialContent.length) {
      const timer = setTimeout(() => {
        setContent(initialContent.slice(0, index + 1));
        setIndex(index + 1);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, [index, initialContent]);

  return { content, loading };
};

const App = () => {
  const thoughtContent = `
    1. 分析问题：用户需要了解 Think 组件的使用方法
    2. 整理结构：按照概述、使用场景、基础用法、进阶功能组织内容
    3. 编写示例：提供多个实用的代码示例
    4. 补充 API：完善属性说明和类型定义
  `;

  const { content, loading } = useThinking(thoughtContent);

  return (
    <Think title="正在思考" loading={loading}>
      {content || '思考中...'}
    </Think>
  );
};

export default App;
```

### 3. 可折叠的思考步骤

```tsx
import { Think } from '@ant-design/x';
import { Collapse } from 'antd';

const App = () => {
  const steps = [
    {
      key: '1',
      title: '问题定义',
      content: '明确需要解决的问题是什么',
    },
    {
      key: '2',
      title: '方案探索',
      content: '探索可能的解决方案',
    },
    {
      key: '3',
      title: '方案评估',
      content: '评估各个方案的优缺点',
    },
    {
      key: '4',
      title: '最终决策',
      content: '选择最优方案并实施',
    },
  ];

  return (
    <Think
      title="完整思考过程"
      header={
        <Collapse
          items={steps.map((s) => ({
            key: s.key,
            label: s.title,
            children: s.content,
          }))}
          bordered={false}
        />
      }
    >
      点击展开查看详细思考步骤
    </Think>
  );
};

export default App;
```

### 4. 带时间戳的思考

```tsx
import { Think } from '@ant-design/x';
import { Typography } from 'antd';

const TimedThink = ({ title, children, timestamp }) => (
  <Think
    title={
      <>
        {title}
        <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
          {new Date(timestamp).toLocaleTimeString()}
        </Typography.Text>
      </>
    }
  >
    {children}
  </Think>
);

const App = () => (
  <TimedThink
    title="思考过程"
    timestamp={Date.now()}
  >
    思考内容...
  </TimedThink>
);

export default App;
```

---

## 相关资源

- [Ant Design X 官方文档](https://x.ant.design)
- [ThoughtChain 组件](../thought-chain/)
- [Bubble 组件](../bubble/)
