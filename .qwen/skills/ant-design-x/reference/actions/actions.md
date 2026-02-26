# Actions 操作列表 - Skill 参考文档

## 组件概述

**Actions** 是 Ant Design X 中用于 AI 场景下的操作按钮列表组件，支持预设模板、子菜单、反馈、复制、音频等多种操作类型。

**安装依赖：**
```bash
npm install @ant-design/x
```

**基本导入：**
```tsx
import { Actions } from '@ant-design/x';
```

---

## 使用场景

### 1. 基础操作菜单
展示一组操作按钮，如重试、编辑、复制等。

### 2. 反馈操作
提供点赞、点踩等反馈功能。

### 3. 复制功能
一键复制文本内容。

### 4. 音频播放
控制音频播放状态。

### 5. 自定义操作项
支持完全自定义的操作项渲染。

---

## 基础用法

### 基本操作列表

```tsx
import { Actions } from '@ant-design/x';
import { EditOutlined, RedoOutlined } from '@ant-design/icons';
import { message } from 'antd';

const actionItems = [
  {
    key: 'retry',
    icon: <RedoOutlined />,
    label: 'Retry',
  },
  {
    key: 'edit',
    icon: <EditOutlined />,
    label: 'Edit',
  },
];

const App = () => (
  <Actions
    items={actionItems}
    onClick={({ keyPath }) => {
      message.success(`you clicked ${keyPath.join(',')}`);
    }}
  />
);
```

### 预设模板（完整示例）

```tsx
import { Actions } from '@ant-design/x';
import { CheckOutlined, ShareAltOutlined } from '@ant-design/icons';
import { message, Pagination } from 'antd';
import { useState } from 'react';

const App = () => {
  const [curPage, setCurPage] = useState(1);
  const [feedbackStatus, setFeedbackStatus] = useState<'default' | 'like' | 'dislike'>('default');
  const [audioStatus, setAudioStatus] = useState<'default' | 'loading' | 'running' | 'error'>('default');
  const [shareStatus, setShareStatus] = useState<'default' | 'loading' | 'running' | 'error'>('default');

  const onClick = (type: 'share' | 'audio') => {
    let timer: NodeJS.Timeout | null = null;
    const dispatchFN = type === 'share' ? setShareStatus : setAudioStatus;
    const status = type === 'share' ? shareStatus : audioStatus;
    
    switch (status) {
      case 'default':
        dispatchFN('loading');
        timer = setTimeout(() => {
          timer && clearTimeout(timer);
          dispatchFN('running');
        }, 1500);
        break;
      case 'running':
        dispatchFN('loading');
        timer = setTimeout(() => {
          timer && clearTimeout(timer);
          dispatchFN('default');
        }, 1500);
        break;
    }
  };

  const items = [
    {
      key: 'pagination',
      actionRender: () => (
        <Pagination
          simple
          current={curPage}
          onChange={(page) => setCurPage(page)}
          total={5}
          pageSize={1}
        />
      ),
    },
    {
      key: 'feedback',
      actionRender: () => (
        <Actions.Feedback
          value={feedbackStatus}
          styles={{ liked: { color: '#f759ab' } }}
          onChange={(val) => {
            setFeedbackStatus(val);
            message.success(`Change feedback value to: ${val}`);
          }}
        />
      ),
    },
    {
      key: 'copy',
      label: 'copy',
      actionRender: () => <Actions.Copy text="copy value" />,
    },
    {
      key: 'audio',
      label: 'audio',
      actionRender: () => (
        <Actions.Audio onClick={() => onClick('audio')} status={audioStatus} />
      ),
    },
    {
      key: 'share',
      label: 'share',
      actionRender: () => (
        <Actions.Item
          onClick={() => onClick('share')}
          label={shareStatus}
          status={shareStatus}
          defaultIcon={<ShareAltOutlined />}
          runningIcon={<CheckOutlined />}
        />
      ),
    },
  ];

  return <Actions items={items} />;
};

export default App;
```

---

## 进阶功能

### 1. 子菜单项

```tsx
import { Actions } from '@ant-design/x';

const items = [
  {
    key: 'export',
    label: '导出',
    subItems: [
      { key: 'pdf', label: '导出为 PDF' },
      { key: 'word', label: '导出为 Word' },
      { key: 'excel', label: '导出为 Excel' },
    ],
  },
];

<Actions items={items} />;
```

### 2. 变体样式

```tsx
import { Actions } from '@ant-design/x';

// borderless (默认)
<Actions items={items} variant="borderless" />

// outlined
<Actions items={items} variant="outlined" />

// filled
<Actions items={items} variant="filled" />
```

### 3. 渐入效果

```tsx
import { Actions } from '@ant-design/x';

// 基础渐入
<Actions items={items} fadeIn />

// 从左到右渐入
<Actions items={items} fadeInLeft />
```

---

## 内置操作类型

### Actions.Feedback - 反馈组件

```tsx
import { Actions } from '@ant-design/x';

<Actions.Feedback
  value="default"  // 'default' | 'like' | 'dislike'
  onChange={(value) => {
    console.log('Feedback:', value);
  }}
  styles={{
    liked: { color: '#f759ab' },
    disliked: { color: '#ff4d4f' },
  }}
/>
```

### Actions.Copy - 复制组件

```tsx
import { Actions } from '@ant-design/x';

<Actions.Copy
  text="要复制的文本内容"
  icon={<CopyOutlined />}
  onCopy={() => console.log('Copied!')}
/>
```

### Actions.Audio - 音频组件

```tsx
import { Actions } from '@ant-design/x';

<Actions.Audio
  status="default"  // 'default' | 'loading' | 'running' | 'error'
  onClick={() => console.log('Audio clicked')}
/>
```

### Actions.Item - 自定义操作项

```tsx
import { Actions } from '@ant-design/x';
import { CheckOutlined } from '@ant-design/icons';

<Actions.Item
  status="running"  // 'default' | 'loading' | 'running' | 'error'
  label="分享"
  defaultIcon={<ShareAltOutlined />}
  runningIcon={<CheckOutlined />}
  onClick={() => console.log('Item clicked')}
/>
```

---

## API 参考

### ActionsProps

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `items` | 包含多个操作项的列表 | `(ItemType \| ReactNode)[]` | - |
| `onClick` | 组件被点击时的回调函数 | `function({ item, key, keyPath, domEvent })` | - |
| `dropdownProps` | 下拉菜单的配置属性 | `DropdownProps` | - |
| `variant` | 变体 | `borderless` \| `outlined` \| `filled` | `borderless` |
| `fadeIn` | 渐入效果 | `boolean` | - |
| `fadeInLeft` | 从左到右渐入效果 | `boolean` | - |

### ItemType

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `key` | 自定义操作的唯一标识 | `string` | - |
| `label` | 自定义操作的显示标签 | `string` | - |
| `icon` | 自定义操作的图标 | `ReactNode` | - |
| `onItemClick` | 点击自定义操作按钮时的回调函数 | `(info: ItemType) => void` | - |
| `danger` | 语法糖，设置危险 icon | `boolean` | `false` |
| `subItems` | 子操作项 | `Omit<ItemType, 'subItems' \| 'triggerSubMenuAction' \| 'actionRender'>[]` | - |
| `triggerSubMenuAction` | 触发子菜单的操作 | `hover` \| `click` | `hover` |
| `actionRender` | 自定义渲染操作项内容 | `(item: ItemType) => ReactNode` | - |

### Actions.Feedback Props

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `value` | 反馈状态值 | `like` \| `dislike` \| `default` | `default` |
| `onChange` | 反馈状态变化回调 | `(value: like \| dislike \| default) => void` | - |

### Actions.Copy Props

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `text` | 复制的文本 | `string` | `''` |
| `icon` | 复制按钮 | `React.ReactNode` | - |

### Actions.Audio Props

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `status` | 播放状态 | `loading` \| `error` \| `running` \| `default` | `default` |

### Actions.Item Props

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `status` | 状态 | `loading` \| `error` \| `running` \| `default` | `default` |
| `label` | 自定义操作的显示标签 | `string` | - |
| `defaultIcon` | 默认状态图标 | `React.ReactNode` | - |
| `runningIcon` | 执行状态图标 | `React.ReactNode` | - |

---

## 主题变量 (Design Token)

可通过 `XProvider` 或 `ConfigProvider` 自定义主题：

```tsx
import { XProvider } from '@ant-design/x';

<XProvider
  theme={{
    components: {
      Actions: {
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

### 1. 使用 actionRender 自定义复杂内容

```tsx
const items = [
  {
    key: 'custom',
    actionRender: () => (
      <Space>
        <Button size="small">操作 1</Button>
        <Button size="small">操作 2</Button>
      </Space>
    ),
  },
];

<Actions items={items} />;
```

### 2. 结合 Bubble 使用

```tsx
import { Bubble, Actions } from '@ant-design/x';
import { CopyOutlined, RedoOutlined } from '@ant-design/icons';

const actionItems = [
  { key: 'copy', icon: <CopyOutlined />, label: 'Copy' },
  { key: 'retry', icon: <RedoOutlined />, label: 'Retry' },
];

<Bubble
  content="AI 回复内容"
  footer={(content) => (
    <Actions items={actionItems} onClick={() => console.log(content)} />
  )}
/>
```

### 3. 状态管理

```tsx
const [status, setStatus] = useState<'default' | 'running'>('default');

<Actions.Item
  status={status}
  onClick={() => {
    setStatus('running');
    // 执行异步操作
    setTimeout(() => setStatus('default'), 2000);
  }}
/>
```

---

## 相关资源

- [Ant Design X 官方文档](https://x.ant.design)
