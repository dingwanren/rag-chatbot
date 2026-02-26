# Suggestion 快捷指令 - Skill 参考文档

## 组件概述

**Suggestion** 是 Ant Design X 中用于给予用户快捷提示的组件，通常与输入框配合使用，提供命令式的快捷操作建议。

**安装依赖：**
```bash
npm install @ant-design/x
```

**基本导入：**
```tsx
import { Suggestion } from '@ant-design/x';
```

---

## 使用场景

### 1. 快捷命令输入
提供 `/` 等快捷命令触发建议列表。

### 2. 智能提示
根据用户输入提供智能建议。

### 3. 自定义触发器
自定义触发建议面板的元素。

---

## 基础用法

### 基本用法

```tsx
import { Suggestion } from '@ant-design/x';
import { Input } from 'antd';
import { useState } from 'react';

const App = () => {
  const [value, setValue] = useState('');

  const items = [
    { label: '帮我写作', value: 'write', icon: '📝' },
    { label: '生成代码', value: 'code', icon: '💻' },
    { label: '创建图片', value: 'image', icon: '🎨' },
    { label: '深度搜索', value: 'search', icon: '🔍' },
  ];

  return (
    <Suggestion
      items={items}
      onSelect={(val) => {
        console.log('选择:', val);
        setValue('/' + val + ' ');
      }}
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="输入 / 触发快捷命令"
      />
    </Suggestion>
  );
};

export default App;
```

### 整行宽度

```tsx
import { Suggestion } from '@ant-design/x';
import { Input } from 'antd';

const App = () => (
  <Suggestion
    block
    items={[
      { label: '选项 1', value: 'opt1' },
      { label: '选项 2', value: 'opt2' },
      { label: '选项 3', value: 'opt3' },
    ]}
    onSelect={(val) => console.log(val)}
  >
    <Input placeholder="输入命令" />
  </Suggestion>
);

export default App;
```

### 自定义触发器

```tsx
import { Suggestion } from '@ant-design/x';
import { Button, Input, Space } from 'antd';
import { useState } from 'react';

const App = () => {
  const [value, setValue] = useState('');
  const [trigger, setTrigger] = useState(null);

  const items = [
    { label: '写作助手', value: 'write' },
    { label: '代码生成', value: 'code' },
  ];

  return (
    <Suggestion
      items={items}
      open={trigger !== null}
      onOpenChange={(open) => {
        if (!open) setTrigger(null);
      }}
      onSelect={(val) => {
        setValue((v) => v + val + ' ');
        setTrigger(null);
      }}
    >
      <Space>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="输入内容"
          onKeyDown={(e) => {
            if (e.key === '/') {
              setTrigger({ type: 'keyboard' });
            }
          }}
        />
        <Button
          onClick={() => setTrigger({ type: 'button' })}
        >
          快捷命令
        </Button>
      </Space>
    </Suggestion>
  );
};

export default App;
```

---

## 进阶功能

### 1. 多级菜单

```tsx
import { Suggestion } from '@ant-design/x';
import { Input } from 'antd';

const items = [
  {
    label: '写作',
    value: 'write',
    children: [
      { label: '写文章', value: 'article' },
      { label: '写邮件', value: 'email' },
      { label: '写报告', value: 'report' },
    ],
  },
  {
    label: '编程',
    value: 'code',
    children: [
      { label: 'React 组件', value: 'react' },
      { label: 'Python 脚本', value: 'python' },
    ],
  },
  {
    label: '设计',
    value: 'design',
    children: [
      { label: '生成图片', value: 'image' },
      { label: '设计 Logo', value: 'logo' },
    ],
  },
];

const App = () => (
  <Suggestion
    items={items}
    onSelect={(val, selectedOptions) => {
      console.log('选择:', val, selectedOptions);
    }}
  >
    <Input placeholder="输入 / 触发命令" />
  </Suggestion>
);

export default App;
```

### 2. 带图标的建议项

```tsx
import { Suggestion } from '@ant-design/x';
import { Input } from 'antd';
import {
  EditOutlined,
  CodeOutlined,
  PictureOutlined,
  SearchOutlined,
} from '@ant-design/icons';

const items = [
  {
    label: '帮我写作',
    value: 'write',
    icon: <EditOutlined />,
    extra: 'AI 写作助手',
  },
  {
    label: '生成代码',
    value: 'code',
    icon: <CodeOutlined />,
    extra: '代码生成',
  },
  {
    label: '创建图片',
    value: 'image',
    icon: <PictureOutlined />,
    extra: 'AI 绘画',
  },
  {
    label: '深度搜索',
    value: 'search',
    icon: <SearchOutlined />,
    extra: '联网搜索',
  },
];

const App = () => (
  <Suggestion items={items} onSelect={console.log}>
    <Input placeholder="输入 / 触发命令" />
  </Suggestion>
);

export default App;
```

### 3. 动态建议列表

```tsx
import { Suggestion } from '@ant-design/x';
import { Input } from 'antd';
import { useState } from 'react';

const App = () => {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);

  const allItems = [
    { label: '写作助手', value: 'write' },
    { label: '代码生成', value: 'code' },
    { label: '图片生成', value: 'image' },
    { label: '数据分析', value: 'analyze' },
    { label: '翻译', value: 'translate' },
  ];

  // 根据输入过滤建议
  const filteredItems = value.startsWith('/')
    ? allItems.filter((item) =>
        item.label.toLowerCase().includes(value.slice(1).toLowerCase())
      )
    : [];

  return (
    <Suggestion
      items={filteredItems}
      open={open && filteredItems.length > 0}
      onOpenChange={setOpen}
      onSelect={(val) => {
        setValue('/' + val + ' ');
        setOpen(false);
      }}
    >
      <Input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(e.target.value.startsWith('/'));
        }}
        placeholder="输入 / 触发快捷命令"
      />
    </Suggestion>
  );
};

export default App;
```

### 4. 与 Sender 配合

```tsx
import { Suggestion, Sender } from '@ant-design/x';
import { useState } from 'react';

const App = () => {
  const [trigger, setTrigger] = useState(null);

  const items = [
    { label: '@提及', value: 'mention' },
    { label: '#标签', value: 'tag' },
    { label: '快捷短语', value: 'phrase' },
  ];

  return (
    <Suggestion
      items={items}
      open={trigger !== null}
      onOpenChange={(open) => {
        if (!open) setTrigger(null);
      }}
      onSelect={(val) => {
        // 插入到输入框
        setTrigger(null);
      }}
    >
      <Sender
        placeholder="输入 / 触发命令"
        onKeyDown={(e) => {
          if (e.key === '/') {
            setTrigger({ type: 'keyboard' });
          }
        }}
      />
    </Suggestion>
  );
};

export default App;
```

### 5. 受控模式

```tsx
import { Suggestion } from '@ant-design/x';
import { Input } from 'antd';
import { useState } from 'react';

const App = () => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  const items = [
    { label: '选项 1', value: 'opt1' },
    { label: '选项 2', value: 'opt2' },
  ];

  return (
    <>
      <button onClick={() => setOpen(true)}>打开建议</button>
      <Suggestion
        items={items}
        open={open}
        onOpenChange={setOpen}
        onSelect={(val) => {
          setValue(val);
          setOpen(false);
        }}
      >
        <Input value={value} onChange={(e) => setValue(e.target.value)} />
      </Suggestion>
    </>
  );
};

export default App;
```

---

## API 参考

### SuggestionProps

更多配置请参考 [CascaderProps](https://ant.design/components/cascader-cn#api)

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `block` | 是否整行宽度 | `boolean` | `false` |
| `children` | 自定义输入框 | `({ onTrigger, onKeyDown }) => ReactElement` | - |
| `items` | 建议项列表 | `SuggestionItem[] \| ((info: T) => SuggestionItem[])` | - |
| `open` | 受控打开面板 | `boolean` | - |
| `rootClassName` | 根元素样式类名 | `string` | - |
| `onSelect` | 选中建议项回调 | `(value: string, selectedOptions: SuggestionItem[]) => void` | - |
| `onOpenChange` | 面板打开状态变化回调 | `(open: boolean) => void` | - |
| `getPopupContainer` | 菜单渲染父节点 | `(triggerNode: HTMLElement) => HTMLElement` | `() => document.body` |

### onTrigger

```typescript
type onTrigger<T> = (info: T | false) => void;
```

Suggestion 接受泛型以自定义传递给 `items` renderProps 的参数类型，当传递 `false` 时，则关闭建议面板。

### SuggestionItem

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `children` | 子项目 | `SuggestionItem[]` | - |
| `extra` | 建议项额外内容 | `ReactNode` | - |
| `icon` | 建议项图标 | `ReactNode` | - |
| `label` | 建议项显示内容 | `ReactNode` | - |
| `value` | 建议项值 | `string` | - |

---

## 主题变量 (Design Token)

可通过 `XProvider` 自定义主题：

```tsx
import { XProvider } from '@ant-design/x';

<XProvider
  theme={{
    components: {
      Suggestion: {
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

### 1. 命令前缀触发

```tsx
import { Suggestion } from '@ant-design/x';
import { Input } from 'antd';
import { useState } from 'react';

const App = () => {
  const [value, setValue] = useState('');

  const commands = [
    { label: '帮助', value: 'help' },
    { label: '设置', value: 'settings' },
    { label: '刷新', value: 'refresh' },
  ];

  return (
    <Suggestion
      items={commands}
      onSelect={(val) => {
        setValue('');
        console.log('执行命令:', val);
      }}
    >
      <Input
        prefix=":"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="输入命令"
      />
    </Suggestion>
  );
};

export default App;
```

### 2. 智能补全

```tsx
import { Suggestion } from '@ant-design/x';
import { Input } from 'antd';
import { useState, useMemo } from 'react';

const App = () => {
  const [value, setValue] = useState('');

  const allCommands = [
    'help', 'settings', 'refresh', 'logout', 'profile',
    'notifications', 'security', 'privacy', 'billing'
  ];

  const suggestions = useMemo(() => {
    if (!value) return [];
    return allCommands
      .filter((cmd) => cmd.startsWith(value))
      .map((cmd) => ({ label: cmd, value: cmd }));
  }, [value]);

  return (
    <Suggestion
      items={suggestions}
      onSelect={(val) => {
        setValue(val + ' ');
      }}
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value.toLowerCase())}
        placeholder="输入命令..."
      />
    </Suggestion>
  );
};

export default App;
```

### 3. 键盘导航

```tsx
import { Suggestion } from '@ant-design/x';
import { Input } from 'antd';
import { useRef, useState } from 'react';

const App = () => {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const items = [
    { label: '选项 1', value: 'opt1' },
    { label: '选项 2', value: 'opt2' },
    { label: '选项 3', value: 'opt3' },
  ];

  return (
    <Suggestion
      items={items}
      open={open}
      onOpenChange={setOpen}
      onSelect={(val) => {
        console.log(val);
        setOpen(false);
        inputRef.current?.focus();
      }}
    >
      <Input
        ref={inputRef}
        placeholder="按 / 打开建议"
        onKeyDown={(e) => {
          if (e.key === '/' && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      />
    </Suggestion>
  );
};

export default App;
```

### 4. 分组建议

```tsx
import { Suggestion } from '@ant-design/x';

const items = [
  {
    label: '常用命令',
    value: 'common',
    children: [
      { label: '帮助', value: 'help' },
      { label: '设置', value: 'settings' },
    ],
  },
  {
    label: '文件操作',
    value: 'file',
    children: [
      { label: '新建', value: 'new' },
      { label: '打开', value: 'open' },
      { label: '保存', value: 'save' },
    ],
  },
  {
    label: '编辑操作',
    value: 'edit',
    children: [
      { label: '撤销', value: 'undo' },
      { label: '重做', value: 'redo' },
      { label: '剪切', value: 'cut' },
      { label: '复制', value: 'copy' },
      { label: '粘贴', value: 'paste' },
    ],
  },
];

<Suggestion items={items} onSelect={console.log}>
  <Input placeholder="输入命令" />
</Suggestion>;
```

---

## 相关资源

- [Ant Design X 官方文档](https://x.ant.design)
- [Sender 组件](../sender/)
- [antd Cascader](https://ant.design/components/cascader-cn)
