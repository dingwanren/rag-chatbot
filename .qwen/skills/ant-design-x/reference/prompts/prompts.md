# Prompts 提示集 - Skill 参考文档

## 组件概述

**Prompts** 是 Ant Design X 中用于显示一组与当前上下文相关的预定义问题或建议的组件，帮助用户快速了解可执行的意图范围。

**安装依赖：**
```bash
npm install @ant-design/x
```

**基本导入：**
```tsx
import { Prompts } from '@ant-design/x';
```

---

## 使用场景

### 1. 新手引导
展示推荐问题，帮助用户快速了解系统功能。

### 2. 快捷建议
提供与当前上下文相关的快捷操作建议。

### 3. 智能体能力展示
展示 AI 智能体可以执行的任务类型。

### 4. 上下文推荐
根据当前对话内容推荐相关问题。

---

## 基础用法

### 基本使用

```tsx
import { Prompts } from '@ant-design/x';
import { BulbOutlined, FireOutlined } from '@ant-design/icons';

const items = [
  {
    key: '1',
    icon: <BulbOutlined />,
    label: '帮我写一篇文章',
    description: '关于人工智能的未来发展',
  },
  {
    key: '2',
    icon: <FireOutlined />,
    label: '解释量子计算',
    description: '用简单易懂的语言',
  },
  {
    key: '3',
    label: '生成代码',
    description: '创建一个 React 组件',
  },
];

const App = () => <Prompts items={items} />;

export default App;
```

### 不可用状态

```tsx
import { Prompts } from '@ant-design/x';

const items = [
  {
    key: '1',
    label: '可用提示',
    description: '这个提示可以点击',
  },
  {
    key: '2',
    label: '不可用提示',
    description: '这个提示被禁用',
    disabled: true,
  },
];

const App = () => <Prompts items={items} />;

export default App;
```

### 纵向展示

```tsx
import { Prompts } from '@ant-design/x';

const items = [
  {
    key: '1',
    label: '提示 1',
    description: '描述信息 1',
  },
  {
    key: '2',
    label: '提示 2',
    description: '描述信息 2',
  },
  {
    key: '3',
    label: '提示 3',
    description: '描述信息 3',
  },
];

const App = () => (
  <Prompts 
    items={items} 
    vertical 
    style={{ width: 300 }}
  />
);

export default App;
```

### 可换行展示

```tsx
import { Prompts } from '@ant-design/x';

const items = Array.from({ length: 10 }, (_, i) => ({
  key: `item-${i}`,
  label: `提示 ${i + 1}`,
  description: '这是描述信息',
}));

const App = () => (
  <Prompts 
    items={items} 
    wrap 
    style={{ maxWidth: 600 }}
  />
);

export default App;
```

### 固定宽度响应式

```tsx
import { Prompts } from '@ant-design/x';

const items = Array.from({ length: 8 }, (_, i) => ({
  key: `item-${i}`,
  label: `提示 ${i + 1}`,
  description: '描述',
}));

const App = () => (
  <Prompts 
    items={items} 
    wrap 
    styles={{
      item: {
        flex: '0 0 calc(33.333% - 8px)',
        maxWidth: 'calc(33.333% - 8px)',
      },
    }}
  />
);

export default App;
```

---

## 进阶功能

### 1. 嵌套组合

```tsx
import { Prompts } from '@ant-design/x';
import { CodeOutlined, EditOutlined } from '@ant-design/icons';

const items = [
  {
    key: 'write',
    icon: <EditOutlined />,
    label: '写作助手',
    description: '帮助我写内容',
    children: [
      {
        key: 'article',
        label: '写文章',
        description: '生成一篇关于 AI 的文章',
      },
      {
        key: 'email',
        label: '写邮件',
        description: '帮我写一封邮件',
      },
      {
        key: 'report',
        label: '写报告',
        description: '生成工作报告',
      },
    ],
  },
  {
    key: 'code',
    icon: <CodeOutlined />,
    label: '代码助手',
    description: '帮助我编写代码',
    children: [
      {
        key: 'react',
        label: 'React 组件',
        description: '生成 React 组件代码',
      },
      {
        key: 'python',
        label: 'Python 脚本',
        description: '生成 Python 脚本',
      },
    ],
  },
];

const App = () => <Prompts items={items} />;

export default App;
```

### 2. 渐入效果

```tsx
import { Prompts } from '@ant-design/x';

const items = [
  { key: '1', label: '提示 1' },
  { key: '2', label: '提示 2' },
  { key: '3', label: '提示 3' },
];

// 基础渐入
<Prompts items={items} fadeIn />

// 从左到右渐入
<Prompts items={items} fadeInLeft />
```

### 3. 点击回调

```tsx
import { Prompts } from '@ant-design/x';
import { message } from 'antd';

const items = [
  {
    key: 'write',
    label: '帮我写作',
    description: '点击开始写作',
  },
  {
    key: 'code',
    label: '帮我编程',
    description: '点击开始编程',
  },
];

const App = () => (
  <Prompts
    items={items}
    onItemClick={({ data }) => {
      message.success(`你选择了：${data.label}`);
      // 执行相应操作
    }}
  />
);

export default App;
```

### 4. 与 Sender 配合

```tsx
import { Prompts, Sender } from '@ant-design/x';
import { Flex } from 'antd';

const App = () => {
  const prompts = [
    { key: '1', label: '帮我写文章' },
    { key: '2', label: '解释代码' },
    { key: '3', label: '生成图片' },
  ];

  return (
    <Flex vertical gap="middle">
      <Prompts
        items={prompts}
        onItemClick={({ data }) => {
          // 将提示内容填入输入框
        }}
      />
      <Sender placeholder="输入你的问题..." />
    </Flex>
  );
};

export default App;
```

### 5. 与 Welcome 配合

```tsx
import { Prompts, Welcome } from '@ant-design/x';
import { BulbOutlined } from '@ant-design/icons';
import { Flex } from 'antd';

const App = () => (
  <Flex vertical gap="large" style={{ padding: 40 }}>
    <Welcome
      icon={<BulbOutlined />}
      title="你好，我是你的 AI 助手"
      description="我可以帮助你写作、编程、分析问题等"
    />
    <Prompts
      items={[
        {
          key: '1',
          label: '帮我写一封邮件',
          description: '给同事写一封工作邮件',
        },
        {
          key: '2',
          label: '解释这段代码',
          description: '粘贴代码我来解释',
        },
        {
          key: '3',
          label: '分析这个数据',
          description: '上传数据我来分析',
        },
      ]}
      wrap
    />
  </Flex>
);

export default App;
```

---

## API 参考

### PromptsProps

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `classNames` | 自定义样式类名 | `Record<SemanticType, string>` | - |
| `items` | 包含多个提示项的列表 | `PromptProps[]` | - |
| `prefixCls` | 样式类名的前缀 | `string` | - |
| `rootClassName` | 根节点的样式类名 | `string` | - |
| `styles` | 自定义样式 | `Record<SemanticType, React.CSSProperties>` | - |
| `title` | 显示在提示列表顶部的标题 | `React.ReactNode` | - |
| `vertical` | 设置为 `true` 时，提示列表将垂直排列 | `boolean` | `false` |
| `wrap` | 设置为 `true` 时，提示列表将自动换行 | `boolean` | `false` |
| `onItemClick` | 提示项被点击时的回调函数 | `(info: { data: PromptProps }) => void` | - |
| `fadeIn` | 渐入效果 | `boolean` | - |
| `fadeInLeft` | 从左到右渐入效果 | `boolean` | - |

### PromptProps

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `children` | 嵌套的子提示项 | `PromptProps[]` | - |
| `description` | 提示描述，提供额外的信息 | `React.ReactNode` | - |
| `disabled` | 设置为 `true` 时禁用点击事件 | `boolean` | `false` |
| `icon` | 提示图标，显示在提示项的左侧 | `React.ReactNode` | - |
| `key` | 唯一标识，用于区分每个提示项 | `string` | - |
| `label` | 提示标签，显示提示的主要内容 | `React.ReactNode` | - |

### SemanticType

```typescript
type SemanticType = 'item' | 'itemIcon' | 'itemLabel' | 'itemDescription';
```

---

## 主题变量 (Design Token)

可通过 `XProvider` 自定义主题：

```tsx
import { XProvider } from '@ant-design/x';

<XProvider
  theme={{
    components: {
      Prompts: {
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

### 1. 动态加载提示

```tsx
import { Prompts } from '@ant-design/x';
import { useEffect, useState } from 'react';

const App = ({ context }) => {
  const [prompts, setPrompts] = useState([]);

  useEffect(() => {
    // 根据上下文动态加载提示
    fetchPrompts(context).then(setPrompts);
  }, [context]);

  return <Prompts items={prompts} />;
};

// 模拟获取提示
const fetchPrompts = async (context) => {
  // 根据上下文返回相关提示
  return [
    { key: '1', label: `关于${context}的问题` },
    { key: '2', label: `分析${context}` },
  ];
};
```

### 2. 提示分类展示

```tsx
import { Prompts } from '@ant-design/x';
import { Collapse } from 'antd';

const CategorizedPrompts = ({ categories }) => {
  return (
    <Collapse
      items={categories.map((category) => ({
        key: category.key,
        label: category.title,
        children: (
          <Prompts
            items={category.items}
            wrap
            styles={{
              item: {
                flex: '0 0 calc(50% - 8px)',
                maxWidth: 'calc(50% - 8px)',
              },
            }}
          />
        ),
      }))}
    />
  );
};
```

### 3. 与 Bubble 配合展示推荐问题

```tsx
import { Bubble, Prompts } from '@ant-design/x';
import { Flex } from 'antd';

const App = () => {
  const suggestions = [
    { key: '1', label: '什么是人工智能？' },
    { key: '2', label: '如何学习编程？' },
    { key: '3', label: '推荐几本好书' },
  ];

  return (
    <Flex vertical gap="middle">
      <Bubble content="你好！我是 AI 助手，有什么可以帮你的吗？" />
      <Prompts
        items={suggestions}
        wrap
        onItemClick={({ data }) => {
          // 发送用户选择的问题
          sendMessage(data.label);
        }}
      />
    </Flex>
  );
};
```

### 4. 自定义提示样式

```tsx
import { Prompts } from '@ant-design/x';

const CustomPrompts = () => (
  <Prompts
    items={[
      { key: '1', label: '提示 1', description: '描述' },
      { key: '2', label: '提示 2', description: '描述' },
    ]}
    styles={{
      item: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: 12,
      },
      itemLabel: {
        fontWeight: 'bold',
      },
      itemDescription: {
        opacity: 0.8,
      },
    }}
  />
);
```

### 5. 响应式布局

```tsx
import { Prompts } from '@ant-design/x';
import { useResponsive } from 'ahooks';

const ResponsivePrompts = ({ items }) => {
  const { md, lg } = useResponsive();

  const getFlexBasis = () => {
    if (lg) return 'calc(25% - 8px)';
    if (md) return 'calc(33.333% - 8px)';
    return 'calc(50% - 8px)';
  };

  return (
    <Prompts
      items={items}
      wrap
      styles={{
        item: {
          flex: `0 0 ${getFlexBasis()}`,
          maxWidth: getFlexBasis(),
        },
      }}
    />
  );
};
```

---

## 相关资源

- [Ant Design X 官方文档](https://x.ant.design)
- [Welcome 组件](../welcome/)
- [Sender 组件](../sender/)
