# Conversations 管理对话 - Skill 参考文档

## 组件概述

**Conversations** 是 Ant Design X 中用于切换多个智能体、更新对话轮次、管理历史会话列表的组件。

**安装依赖：**
```bash
npm install @ant-design/x
```

**基本导入：**
```tsx
import { Conversations } from '@ant-design/x';
```

---

## 使用场景

### 1. 切换多个智能体
在多个 AI 助手之间快速切换。

### 2. 对话历史管理
查看和管理历史会话列表。

### 3. 新会话创建
快速创建新的对话。

### 4. 会话分组
按类型或时间对会话进行分组管理。

### 5. 会话操作
对会话进行删除、重命名等操作。

---

## 基础用法

### 基本使用

```tsx
import { Conversations } from '@ant-design/x';
import {
  CodeOutlined,
  FileImageOutlined,
  FileSearchOutlined,
  SignatureOutlined,
} from '@ant-design/icons';
import { Flex, Switch, theme } from 'antd';
import { useState } from 'react';

const App = () => {
  const { token } = theme.useToken();
  const [deepSearchChecked, setDeepSearchChecked] = useState(false);

  const style = {
    width: 256,
    background: token.colorBgContainer,
    borderRadius: token.borderRadius,
  };

  const items = [
    {
      key: 'write',
      label: 'Help Me Write',
      icon: <SignatureOutlined />,
    },
    {
      key: 'coding',
      label: 'AI Coding',
      icon: <CodeOutlined />,
    },
    {
      key: 'createImage',
      label: 'Create Image',
      icon: <FileImageOutlined />,
    },
    {
      key: 'deepSearch',
      disabled: !deepSearchChecked,
      label: (
        <Flex gap="small" align="center">
          Deep Search
          <Switch
            size="small"
            checked={deepSearchChecked}
            onChange={setDeepSearchChecked}
          />
        </Flex>
      ),
      icon: <FileSearchOutlined />,
    },
  ];

  return (
    <Conversations items={items} defaultActiveKey="write" style={style} />
  );
};

export default App;
```

### 受控模式

```tsx
import { Conversations } from '@ant-design/x';
import { SignatureOutlined } from '@ant-design/icons';
import { useState } from 'react';

const App = () => {
  const [activeKey, setActiveKey] = useState('write');

  const items = [
    { key: 'write', label: 'Help Me Write', icon: <SignatureOutlined /> },
    { key: 'chat', label: 'AI Chat', icon: <SignatureOutlined /> },
  ];

  return (
    <Conversations
      items={items}
      activeKey={activeKey}
      onActiveChange={(key) => setActiveKey(key)}
    />
  );
};

export default App;
```

### 会话操作菜单

```tsx
import { Conversations } from '@ant-design/x';
import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons';
import { message } from 'antd';

const App = () => {
  const items = [
    { key: '1', label: '会话 1' },
    { key: '2', label: '会话 2' },
    { key: '3', label: '会话 3' },
  ];

  const menu = {
    items: [
      {
        key: 'edit',
        label: '重命名',
        icon: <EditOutlined />,
      },
      {
        key: 'delete',
        label: '删除',
        icon: <DeleteOutlined />,
        danger: true,
      },
    ],
    onClick: ({ key, domEvent }) => {
      domEvent.stopPropagation();
      if (key === 'delete') {
        message.success('删除会话');
      } else if (key === 'edit') {
        message.success('重命名会话');
      }
    },
  };

  return <Conversations items={items} menu={menu} />;
};

export default App;
```

### 分组展示

```tsx
import { Conversations } from '@ant-design/x';
import { MessageOutlined } from '@ant-design/icons';

const items = [
  { key: '1', label: '会话 1', group: '今天' },
  { key: '2', label: '会话 2', group: '今天' },
  { key: '3', label: '会话 3', group: '昨天' },
  { key: '4', label: '会话 4', group: '昨天' },
  { key: '5', label: '会话 5', group: '更早' },
];

const App = () => (
  <Conversations
    items={items}
    groupable={{
      label: (group) => <span>{group}</span>,
      collapsible: true,
    }}
  />
);

export default App;
```

### 新会话创建

```tsx
import { Conversations } from '@ant-design/x';
import { PlusOutlined } from '@ant-design/icons';

const items = [
  { key: '1', label: '会话 1' },
  { key: '2', label: '会话 2' },
];

const App = () => (
  <Conversations
    items={items}
    creation={{
      label: '新会话',
      icon: <PlusOutlined />,
      onClick: () => console.log('创建新会话'),
    }}
  />
);

export default App;
```

### 快捷键操作

```tsx
import { Conversations } from '@ant-design/x';
import { useEffect } from 'react';

const App = () => {
  const items = [
    { key: '1', label: '会话 1' },
    { key: '2', label: '会话 2' },
    { key: '3', label: '会话 3' },
  ];

  return (
    <Conversations
      items={items}
      shortcutKeys={{
        // 按 Ctrl+1, Ctrl+2, Ctrl+3 切换对应会话
        items: ['Control', '1'],
        // 按 Ctrl+N 创建新会话
        creation: ['Control', 'N'],
      }}
    />
  );
};

export default App;
```

---

## 进阶功能

### 1. 自定义操作触发器

```tsx
import { Conversations } from '@ant-design/x';
import { MoreOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';

const items = [
  { key: '1', label: '会话 1' },
  { key: '2', label: '会话 2' },
];

const App = () => (
  <Conversations
    items={items}
    menu={{
      trigger: (conversation) => (
        <MoreOutlined
          onClick={(e) => e.stopPropagation()}
          style={{ cursor: 'pointer' }}
        />
      ),
      items: [
        { key: 'edit', label: '编辑' },
        { key: 'delete', label: '删除', danger: true },
      ],
    }}
  />
);

export default App;
```

### 2. 受控折叠模式

```tsx
import { Conversations } from '@ant-design/x';
import { useState } from 'react';

const App = () => {
  const [expandedKeys, setExpandedKeys] = useState(['今天', '昨天']);

  const items = [
    { key: '1', label: '会话 1', group: '今天' },
    { key: '2', label: '会话 2', group: '今天' },
    { key: '3', label: '会话 3', group: '昨天' },
    { key: '4', label: '会话 4', group: '更早' },
  ];

  return (
    <Conversations
      items={items}
      groupable={{
        collapsible: true,
        expandedKeys,
        onExpand: setExpandedKeys,
      }}
    />
  );
};

export default App;
```

### 3. 滚动加载

```tsx
import { Conversations } from '@ant-design/x';
import { useEffect, useState } from 'react';

const App = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const loadMore = async () => {
    if (loading) return;
    setLoading(true);
    // 模拟异步加载
    setTimeout(() => {
      const newItems = Array.from({ length: 10 }, (_, i) => ({
        key: `page${page}-item${i}`,
        label: `会话 ${page}-${i + 1}`,
      }));
      setItems((prev) => [...prev, ...newItems]);
      setPage((p) => p + 1);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    loadMore();
  }, []);

  return (
    <Conversations
      items={items}
      onScroll={(e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 50) {
          loadMore();
        }
      }}
    />
  );
};

export default App;
```

---

## API 参考

### ConversationsProps

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `items` | 会话列表数据源 | `ItemType[]` | - |
| `activeKey` | 当前选中的值 | `string` | - |
| `defaultActiveKey` | 初始化选中的值 | `string` | - |
| `onActiveChange` | 选中变更回调 | `(value: string) => void` | - |
| `menu` | 会话操作菜单 | `ItemMenuProps \| ((value) => ItemMenuProps)` | - |
| `groupable` | 是否支持分组 | `boolean \| GroupableProps` | - |
| `shortcutKeys` | 快捷键操作 | `{ creation?: ShortcutKeys; items?: ShortcutKeys \| ShortcutKeys[] }` | - |
| `creation` | 新会话操作配置 | `CreationProps` | - |
| `styles` | 语义化结构 style | `{ creation?: React.CSSProperties; item?: React.CSSProperties }` | - |
| `classNames` | 语义化结构 className | `{ creation?: string; item?: string }` | - |
| `rootClassName` | 根节点类名 | `string` | - |

### ItemType

```typescript
type ItemType = ConversationItemType | DividerItemType;
```

#### ConversationItemType

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `key` | 唯一标识 | `string` | - |
| `label` | 会话名称 | `React.ReactNode` | - |
| `group` | 会话分组类型 | `string` | - |
| `icon` | 会话图标 | `React.ReactNode` | - |
| `disabled` | 是否禁用 | `boolean` | `false` |

#### DividerItemType

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `type` | 会话列表分割线 | `'divider'` | `'divider'` |
| `dashed` | 是否虚线 | `boolean` | `false` |

### ItemMenuProps

继承 antd [MenuProps](https://ant.design/components/menu-cn#api) 属性。

```typescript
MenuProps & {
  trigger?:
    | React.ReactNode
    | ((conversation: ConversationItemType, info: { originNode: React.ReactNode }) => React.ReactNode);
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
};
```

### GroupableProps

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `label` | 分组标题 | `React.ReactNode \| ((group, info) => React.ReactNode)` | - |
| `collapsible` | 可折叠配置 | `boolean \| ((group) => boolean)` | - |
| `defaultExpandedKeys` | 默认展开或收起 | `string[]` | - |
| `onExpand` | 展开或收起 | `(expandedKeys: string[]) => void` | - |
| `expandedKeys` | 展开分组的 keys | `string[]` | - |

### CreationProps

新会话操作配置，支持 `label`、`icon`、`onClick` 等属性。

### ShortcutKeys

```typescript
type ShortcutKeys<CustomKey = number | 'number'> =
  | ['Ctrl' | 'Alt' | 'Meta' | 'Shift', 'Ctrl' | 'Alt' | 'Meta' | 'Shift', CustomKey]
  | ['Ctrl' | 'Alt' | 'Meta' | 'Shift', CustomKey];
```

---

## 主题变量 (Design Token)

可通过 `XProvider` 自定义主题：

```tsx
import { XProvider } from '@ant-design/x';

<XProvider
  theme={{
    components: {
      Conversations: {
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

### 1. 会话状态管理

```tsx
import { Conversations } from '@ant-design/x';
import { useState, useEffect } from 'react';

const App = () => {
  const [conversations, setConversations] = useState([]);
  const [activeKey, setActiveKey] = useState(null);

  // 加载会话列表
  useEffect(() => {
    fetchConversations().then((data) => {
      setConversations(data);
      if (data.length > 0) {
        setActiveKey(data[0].key);
      }
    });
  }, []);

  return (
    <Conversations
      items={conversations}
      activeKey={activeKey}
      onActiveChange={setActiveKey}
    />
  );
};
```

### 2. 删除确认

```tsx
const menu = {
  items: [
    {
      key: 'delete',
      label: '删除',
      danger: true,
      onClick: () => {
        Modal.confirm({
          title: '确认删除？',
          content: '删除后无法恢复',
          onOk: () => handleDelete(),
        });
      },
    },
  ],
};
```

### 3. 与 Bubble.List 配合

```tsx
import { Conversations, Bubble } from '@ant-design/x';
import { Flex } from 'antd';

const ChatLayout = () => {
  const [activeConversation, setActiveConversation] = useState('1');
  const [messages, setMessages] = useState([]);

  return (
    <Flex style={{ height: '100vh' }}>
      <div style={{ width: 256, borderRight: '1px solid #f0f0f0' }}>
        <Conversations
          items={conversations}
          activeKey={activeConversation}
          onActiveChange={(key) => {
            setActiveConversation(key);
            loadMessages(key);
          }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <Bubble.List items={messages} style={{ height: '100%' }} />
      </div>
    </Flex>
  );
};
```

---

## 相关资源

- [Ant Design X 官方文档](https://x.ant.design)
