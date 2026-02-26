# ThoughtChain 思维链 - Skill 参考文档

## 组件概述

**ThoughtChain** 是 Ant Design X 中用于可视化和追踪 Agent 对 Actions 和 Tools 的调用链的组件，支持节点状态、折叠、嵌套等功能。

**安装依赖：**
```bash
npm install @ant-design/x
```

**基本导入：**
```tsx
import { ThoughtChain } from '@ant-design/x';
```

---

## 使用场景

### 1. Agent 调用链追踪
调试和跟踪复杂 Agent System 中的调用链。

### 2. 工具调用可视化
展示 AI 调用外部工具的过程。

### 3. 任务执行流程
可视化任务执行的步骤和状态。

### 4. 类似链式场景
任何需要展示链式调用或步骤的场景。

---

## 基础用法

### 基本用法

```tsx
import { ThoughtChain } from '@ant-design/x';

const items = [
  {
    key: '1',
    title: '步骤 1',
    description: '初始化环境',
    content: '正在准备运行环境...',
    status: 'success',
  },
  {
    key: '2',
    title: '步骤 2',
    description: '加载数据',
    content: '从数据库加载数据...',
    status: 'success',
  },
  {
    key: '3',
    title: '步骤 3',
    description: '处理数据',
    content: '对数据进行处理和转换...',
    status: 'loading',
  },
  {
    key: '4',
    title: '步骤 4',
    description: '输出结果',
    content: '生成最终结果...',
    status: 'abort',
  },
];

const App = () => <ThoughtChain items={items} />;

export default App;
```

### 节点状态

```tsx
import { ThoughtChain } from '@ant-design/x';

const items = [
  {
    key: '1',
    title: '等待中',
    description: '尚未开始',
    content: '等待执行...',
    status: 'abort',
  },
  {
    key: '2',
    title: '执行中',
    description: '正在处理',
    content: '处理中...',
    status: 'loading',
  },
  {
    key: '3',
    title: '成功',
    description: '已完成',
    content: '执行成功！',
    status: 'success',
  },
  {
    key: '4',
    title: '失败',
    description: '发生错误',
    content: '执行失败：网络错误',
    status: 'error',
  },
];

const App = () => <ThoughtChain items={items} />;

export default App;
```

### 简洁思维链

```tsx
import { ThoughtChain } from '@ant-design/x';

const items = [
  {
    key: '1',
    title: '调用工具 A',
    status: 'success',
  },
  {
    key: '2',
    title: '调用工具 B',
    status: 'success',
  },
  {
    key: '3',
    title: '调用工具 C',
    status: 'loading',
  },
];

const App = () => (
  <ThoughtChain
    items={items}
    variant="text"
  />
);

export default App;
```

### 可折叠的

```tsx
import { ThoughtChain } from '@ant-design/x';

const items = [
  {
    key: '1',
    title: '步骤 1',
    description: '可折叠步骤',
    content: '这是详细内容...',
    collapsible: true,
  },
  {
    key: '2',
    title: '步骤 2',
    description: '可折叠步骤',
    content: '这是详细内容...',
    collapsible: true,
  },
  {
    key: '3',
    title: '步骤 3',
    description: '可折叠步骤',
    content: '这是详细内容...',
    collapsible: true,
  },
];

const App = () => <ThoughtChain items={items} />;

export default App;
```

### 受控折叠

```tsx
import { ThoughtChain } from '@ant-design/x';
import { useState } from 'react';

const App = () => {
  const [expandedKeys, setExpandedKeys] = useState(['1', '2']);

  const items = [
    {
      key: '1',
      title: '步骤 1',
      content: '内容 1',
      collapsible: true,
    },
    {
      key: '2',
      title: '步骤 2',
      content: '内容 2',
      collapsible: true,
    },
    {
      key: '3',
      title: '步骤 3',
      content: '内容 3',
      collapsible: true,
    },
  ];

  return (
    <ThoughtChain
      items={items}
      expandedKeys={expandedKeys}
      onExpand={setExpandedKeys}
    />
  );
};

export default App;
```

---

## 进阶功能

### 1. 客制化节点

```tsx
import { ThoughtChain } from '@ant-design/x';
import { Button, Progress } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

const items = [
  {
    key: '1',
    title: '任务 1',
    description: '自定义内容',
    content: (
      <div>
        <Progress percent={100} status="success" />
        <Button icon={<CheckOutlined />}>完成</Button>
      </div>
    ),
    status: 'success',
  },
  {
    key: '2',
    title: '任务 2',
    description: '自定义内容',
    content: (
      <div>
        <Progress percent={50} />
        <Button loading>执行中</Button>
      </div>
    ),
    status: 'loading',
  },
  {
    key: '3',
    title: '任务 3',
    description: '自定义内容',
    content: (
      <div>
        <Progress percent={0} status="exception" />
        <Button icon={<CloseOutlined />} danger>重试</Button>
      </div>
    ),
    status: 'error',
  },
];

const App = () => <ThoughtChain items={items} />;

export default App;
```

### 2. 嵌套使用

```tsx
import { ThoughtChain } from '@ant-design/x';

const items = [
  {
    key: '1',
    title: '主任务 1',
    description: '包含子任务',
    content: (
      <ThoughtChain
        items={[
          {
            key: '1-1',
            title: '子任务 1-1',
            content: '子任务内容',
            status: 'success',
          },
          {
            key: '1-2',
            title: '子任务 1-2',
            content: '子任务内容',
            status: 'loading',
          },
        ]}
      />
    ),
    status: 'loading',
  },
  {
    key: '2',
    title: '主任务 2',
    description: '独立任务',
    content: '任务内容',
    status: 'success',
  },
];

const App = () => <ThoughtChain items={items} />;

export default App;
```

### 3. 单行折叠

```tsx
import { ThoughtChain } from '@ant-design/x';

const items = [
  {
    key: '1',
    title: '步骤 1',
    description: '简短描述',
    content: '详细内容...',
    collapsible: true,
  },
  {
    key: '2',
    title: '步骤 2',
    description: '简短描述',
    content: '详细内容...',
    collapsible: true,
  },
];

const App = () => (
  <ThoughtChain
    items={items}
    variant="outlined"
  />
);

export default App;
```

### 4. 自定义图标

```tsx
import { ThoughtChain } from '@ant-design/x';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

const statusIcons = {
  success: <CheckCircleOutlined />,
  error: <CloseCircleOutlined />,
  loading: <LoadingOutlined spin />,
  abort: null,
};

const items = [
  {
    key: '1',
    title: '成功节点',
    content: '执行成功',
    status: 'success',
    icon: statusIcons.success,
  },
  {
    key: '2',
    title: '失败节点',
    content: '执行失败',
    status: 'error',
    icon: statusIcons.error,
  },
  {
    key: '3',
    title: '加载中节点',
    content: '正在执行',
    status: 'loading',
    icon: statusIcons.loading,
  },
  {
    key: '4',
    title: '无图标节点',
    content: '没有图标',
    status: 'abort',
    icon: false,
  },
];

const App = () => <ThoughtChain items={items} />;

export default App;
```

### 5. 自定义线条样式

```tsx
import { ThoughtChain } from '@ant-design/x';

const items = [
  { key: '1', title: '步骤 1', content: '内容' },
  { key: '2', title: '步骤 2', content: '内容' },
  { key: '3', title: '步骤 3', content: '内容' },
];

// 实线（默认）
<ThoughtChain items={items} line="solid" />

// 虚线
<ThoughtChain items={items} line="dashed" />

// 点线
<ThoughtChain items={items} line="dotted" />

// 不显示线条
<ThoughtChain items={items} line={false} />
```

### 6. 与 Bubble 配合展示思考链

```tsx
import { ThoughtChain, Bubble } from '@ant-design/x';
import { Flex } from 'antd';

const App = () => (
  <Flex vertical gap="middle">
    <ThoughtChain
      items={[
        {
          key: '1',
          title: '理解问题',
          description: '分析用户需求',
          content: '用户需要了解 ThoughtChain 组件的使用方法',
          status: 'success',
        },
        {
          key: '2',
          title: '检索知识',
          description: '查找相关文档',
          content: '从知识库中检索 ThoughtChain 的相关信息',
          status: 'success',
        },
        {
          key: '3',
          title: '生成回答',
          description: '组织答案内容',
          content: '正在生成详细的文档和示例...',
          status: 'loading',
        },
      ]}
    />

    <Bubble
      content="ThoughtChain 是用于可视化调用链的组件..."
    />
  </Flex>
);

export default App;
```

---

## API 参考

### ThoughtChainProps

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `items` | 思维节点集合 | `ThoughtChainItemType[]` | - |
| `defaultExpandedKeys` | 初始化展开的节点 | `string[]` | - |
| `expandedKeys` | 当前展开的节点 | `string[]` | - |
| `onExpand` | 展开节点变化回调 | `(expandedKeys: string[]) => void` | - |
| `line` | 线条样式 | `boolean \| 'solid' \| 'dashed' \| 'dotted'` | `'solid'` |
| `classNames` | 语义化结构的类名 | `Record<'root' \| 'item' \| 'itemIcon' \| 'itemHeader' \| 'itemContent' \| 'itemFooter', string>` | - |
| `prefixCls` | 自定义前缀 | `string` | - |
| `styles` | 语义化结构的样式 | `Record<'root' \| 'item' \| 'itemIcon' \| 'itemHeader' \| 'itemContent' \| 'itemFooter', React.CSSProperties>` | - |
| `rootClassName` | 根元素样式类名 | `string` | - |

### ThoughtChainItemType

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `content` | 思维节点内容 | `React.ReactNode` | - |
| `description` | 思维节点描述 | `React.ReactNode` | - |
| `footer` | 思维节点脚注 | `React.ReactNode` | - |
| `icon` | 思维节点图标 | `false \| React.ReactNode` | `DefaultIcon` |
| `key` | 思维节点唯一标识符 | `string` | - |
| `status` | 思维节点状态 | `'loading' \| 'success' \| 'error' \| 'abort'` | - |
| `title` | 思维节点标题 | `React.ReactNode` | - |
| `collapsible` | 思维节点是否可折叠 | `boolean` | `false` |
| `blink` | 闪动效果 | `boolean` | - |

### ThoughtChain.Item

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `prefixCls` | 自定义前缀 | `string` | - |
| `icon` | 思维链图标 | `React.ReactNode` | - |
| `title` | 思维链标题 | `React.ReactNode` | - |
| `description` | 思维链描述 | `React.ReactNode` | - |
| `status` | 思维链状态 | `'loading' \| 'success' \| 'error' \| 'abort'` | - |
| `variant` | 变体配置 | `'solid' \| 'outlined' \| 'text'` | - |
| `blink` | 闪动效果 | `boolean` | - |

---

## 主题变量 (Design Token)

可通过 `XProvider` 自定义主题：

```tsx
import { XProvider } from '@ant-design/x';

<XProvider
  theme={{
    components: {
      ThoughtChain: {
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

### 1. Agent 工具调用追踪

```tsx
import { ThoughtChain } from '@ant-design/x';
import { useEffect, useState } from 'react';

const useAgentTrace = () => {
  const [trace, setTrace] = useState([]);

  const addStep = (step) => {
    setTrace((prev) => [...prev, step]);
  };

  const updateStep = (key, updates) => {
    setTrace((prev) =>
      prev.map((step) =>
        step.key === key ? { ...step, ...updates } : step
      )
    );
  };

  return { trace, addStep, updateStep };
};

const App = () => {
  const { trace, addStep, updateStep } = useAgentTrace();

  useEffect(() => {
    // 模拟 Agent 调用过程
    addStep({
      key: '1',
      title: '调用搜索工具',
      description: 'SearchTool',
      content: '正在搜索相关信息...',
      status: 'loading',
    });

    setTimeout(() => {
      updateStep('1', {
        status: 'success',
        content: '搜索完成，找到 5 条结果',
      });
      addStep({
        key: '2',
        title: '调用分析工具',
        description: 'AnalysisTool',
        content: '正在分析搜索结果...',
        status: 'loading',
      });
    }, 2000);
  }, []);

  return <ThoughtChain items={trace} />;
};

export default App;
```

### 2. 带时间戳的执行链

```tsx
import { ThoughtChain } from '@ant-design/x';
import { Typography } from 'antd';

const TimedThoughtChain = ({ items }) => {
  const itemsWithTime = items.map((item) => ({
    ...item,
    title: (
      <>
        {item.title}
        <Typography.Text
          type="secondary"
          style={{ marginLeft: 8, fontSize: 12 }}
        >
          {new Date(item.timestamp).toLocaleTimeString()}
        </Typography.Text>
      </>
    ),
  }));

  return <ThoughtChain items={itemsWithTime} />;
};

const App = () => {
  const items = [
    {
      key: '1',
      title: '开始执行',
      content: '任务启动',
      status: 'success',
      timestamp: Date.now() - 3000,
    },
    {
      key: '2',
      title: '执行中',
      content: '处理数据',
      status: 'loading',
      timestamp: Date.now(),
    },
  ];

  return <TimedThoughtChain items={items} />;
};

export default App;
```

### 3. 可重放的执行链

```tsx
import { ThoughtChain } from '@ant-design/x';
import { Button, Flex } from 'antd';
import { useState } from 'react';

const App = () => {
  const [stepIndex, setStepIndex] = useState(0);

  const allSteps = [
    {
      key: '1',
      title: '步骤 1',
      content: '初始化',
      status: 'success',
    },
    {
      key: '2',
      title: '步骤 2',
      content: '加载数据',
      status: 'success',
    },
    {
      key: '3',
      title: '步骤 3',
      content: '处理数据',
      status: stepIndex >= 2 ? 'success' : 'abort',
    },
    {
      key: '4',
      title: '步骤 4',
      content: '输出结果',
      status: stepIndex >= 3 ? 'success' : 'abort',
    },
  ];

  return (
    <Flex vertical gap="middle">
      <ThoughtChain items={allSteps.slice(0, stepIndex + 1)} />
      <Flex gap="small">
        <Button
          onClick={() => setStepIndex(0)}
          disabled={stepIndex === 0}
        >
          重置
        </Button>
        <Button
          onClick={() => setStepIndex((p) => Math.min(p + 1, allSteps.length - 1))}
          disabled={stepIndex >= allSteps.length - 1}
          type="primary"
        >
          下一步
        </Button>
      </Flex>
    </Flex>
  );
};

export default App;
```

---

## 相关资源

- [Ant Design X 官方文档](https://x.ant.design)
- [Think 组件](../think/)
- [Bubble 组件](../bubble/)
