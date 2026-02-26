# Bubble 对话气泡组件 - Skill 参考文档

## 组件概述

**Bubble** 是 Ant Design X 中用于聊天场景的对话气泡组件，支持丰富的交互功能如打字动画、流式传输、编辑、自定义内容渲染等。

**安装依赖：**
```bash
npm install @ant-design/x
```

**基本导入：**
```tsx
import { Bubble } from '@ant-design/x';
```

---

## 使用场景

### 1. 基础聊天对话
最基本的聊天消息展示，支持左右 placement 区分发送方。

### 2. AI 对话流式输出
配合 `streaming` 和 `typing` 属性实现 AI 回复的打字机效果或流式数据传输。

### 3. Markdown 内容渲染
通过 `contentRender` 自定义渲染 Markdown 内容，支持代码高亮、表格等富文本。

### 4. 图表可视化
结合 `@antv/gpt-vis` 在气泡中渲染图表，适用于数据分析场景。

### 5. 可编辑消息
用户可编辑已发送的消息，支持确认/取消操作。

### 6. 消息列表
使用 `Bubble.List` 管理多条消息，支持自动滚动、角色配置、分割线、系统消息等。

---

## 基础用法

### 基本气泡

```tsx
import { Bubble } from '@ant-design/x';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';

// 最简单的使用
<Bubble content="Hello World" />

// 带位置和头像
<Bubble
  content="用户消息"
  placement="end"
  avatar={<Avatar icon={<UserOutlined />} />}
/>

// 完整示例：带头部、底部、头像
<Bubble
  content="消息内容"
  header={<h5>发送者名称</h5>}
  footer="底部信息"
  avatar={<Avatar icon={<UserOutlined />} />}
/>
```

### 变体与形状

```tsx
import { Bubble } from '@ant-design/x';
import { Flex } from 'antd';

<Flex vertical gap="small">
  {/* 样式变体 */}
  <Bubble content="filled 填充" variant="filled" />
  <Bubble content="outlined 描边" variant="outlined" />
  <Bubble content="shadow 阴影" variant="shadow" />
  <Bubble content="borderless 无边框" variant="borderless" />

  {/* 形状 */}
  <Bubble content="default 默认" shape="default" />
  <Bubble content="round 圆形" shape="round" />
  <Bubble content="corner 圆角" shape="corner" />
</Flex>
```

### 位置与布局

```tsx
import { Bubble } from '@ant-design/x';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';

<div style={{ width: '100%' }}>
  {/* 左侧气泡（默认） */}
  <Bubble
    content="左侧气泡"
    placement="start"
    header="header"
    avatar={<Avatar icon={<UserOutlined />} />}
  />
</div>

<div style={{ width: '100%' }}>
  {/* 右侧气泡 */}
  <Bubble
    content="右侧气泡"
    placement="end"
    header="header"
    avatar={<Avatar icon={<UserOutlined />} />}
  />
</div>
```

---

## 进阶功能

### 1. 打字动画效果

使用 `typing` 属性启用动画：

```tsx
import { Bubble } from '@ant-design/x';

// 简单启用
<Bubble content="动画文本" typing />

// 配置动画选项
<Bubble
  content="打字效果"
  typing={{
    effect: 'typing',      // 'typing' | 'fade-in'
    step: 3,               // 每次步进字符数
    interval: 50,          // 动画间隔 (ms)
    keepPrefix: true       // 保留公共前缀
  }}
  onTyping={(rendererContent, currentContent) => {
    console.log('typing...', currentContent);
  }}
  onTypingComplete={(content) => {
    console.log('typing complete', content);
  }}
/>
```

**完整动画示例（带控制）：**

```tsx
import { Bubble, XProvider } from '@ant-design/x';
import { Avatar, Button, Divider, Flex, Radio, Switch } from 'antd';
import { UserOutlined, CopyOutlined, RedoOutlined } from '@ant-design/icons';
import { Actions } from '@ant-design/x';
import { useState } from 'react';

const text = 'Ant Design X - Better UI toolkit for your AI Chat WebApp. '.repeat(5);

const actionItems = [
  { key: 'retry', icon: <RedoOutlined />, label: 'Retry' },
  { key: 'copy', icon: <CopyOutlined />, label: 'Copy' },
];

const AnimationExample = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState('');
  const [effect, setEffect] = useState<'fade-in' | 'typing' | 'custom-typing'>('fade-in');
  const [keepPrefix, setKeepPrefix] = useState(false);

  const loadAll = () => {
    setLoading(false);
    setData(text);
  };

  const replaceText = () => {
    setLoading(false);
    setData('Ant Design X - Build your AI Chat WebApp with an easier way. '.repeat(5));
  };

  return (
    <Flex vertical gap="small">
      <Flex gap="small" align="center">
        <span>非流式数据:</span>
        <Button type="primary" onClick={loadAll}>load data-1</Button>
        <Button onClick={replaceText}>load data-2</Button>
      </Flex>
      <Flex gap="small" align="center">
        <span>动画效果:</span>
        <Radio.Group value={effect} onChange={(e) => setEffect(e.target.value)}>
          <Radio value="fade-in">fade-in</Radio>
          <Radio value="typing">typing</Radio>
          <Radio value="custom-typing">typing with 💖</Radio>
        </Radio.Group>
      </Flex>
      <Flex gap="small" align="center">
        <span>保留公共前缀:</span>
        <Switch value={keepPrefix} onChange={setKeepPrefix} />
      </Flex>
      <Divider />
      <XProvider
        theme={{
          components: {
            Bubble: effect === 'custom-typing' ? { typingContent: '"💖"' } : {},
          },
        }}
      >
        <Bubble
          loading={loading}
          content={data}
          typing={{
            effect: effect === 'fade-in' ? effect : 'typing',
            interval: 50,
            step: 3,
            keepPrefix,
          }}
          header={<h5>ADX</h5>}
          footer={(content) => (
            <Actions items={actionItems} onClick={() => console.log(content)} />
          )}
          avatar={<Avatar icon={<UserOutlined />} />}
          onTyping={() => console.log('typing')}
          onTypingComplete={() => console.log('typing complete')}
        />
      </XProvider>
    </Flex>
  );
};

export default AnimationExample;
```

### 2. 流式传输

配合 `streaming` 属性处理流式数据：

```tsx
import { Bubble } from '@ant-design/x';
import { useState, useEffect } from 'react';

const StreamExample = () => {
  const [streamContent, setStreamContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // 模拟流式数据接收
  useEffect(() => {
    const fullText = '这是一段很长的流式文本...';
    let index = 0;
    setIsStreaming(true);
    
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setStreamContent(fullText.slice(0, index + 1));
        index++;
      } else {
        setIsStreaming(false);
        clearInterval(timer);
      }
    }, 50);

    return () => clearInterval(timer);
  }, []);

  return (
    <Bubble
      content={streamContent}
      streaming={isStreaming}  // 关键：通知 Bubble 当前是流式状态
      typing={{ effect: 'typing', step: 2, interval: 50 }}
    />
  );
};
```

**完整流式传输示例（带控制）：**

```tsx
import { Bubble, BubbleProps } from '@ant-design/x';
import { Avatar, Button, Divider, Flex, Switch, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const text = 'Ant Design X - Better UI toolkit for your AI Chat WebApp. '.repeat(5);

// 自定义 Hook：模拟流式内容
function useStreamContent(
  content: string,
  { step, interval }: { step: number; interval: number } = { step: 3, interval: 50 },
): [string, boolean] {
  const [streamContent, setStreamContent] = useState<string>('');
  const streamRef = useRef('');
  const done = useRef(true);
  const timer = useRef(-1);

  const setStreamContentCb = useCallback((next: string) => {
    setStreamContent(next);
    streamRef.current = next;
  }, []);

  useEffect(() => {
    if (content === streamRef.current) return;
    if (!content && streamRef.current) {
      setStreamContent('');
      done.current = true;
      clearInterval(timer.current);
    } else if (!streamRef.current && content) {
      clearInterval(timer.current);
      startStream(content);
    } else if (content.indexOf(streamRef.current) !== 0) {
      clearInterval(timer.current);
      startStream(content);
    }
  }, [content]);

  const startStream = (text: string) => {
    done.current = false;
    streamRef.current = '';
    timer.current = setInterval(() => {
      const len = streamRef.current.length + step;
      if (len <= text.length - 1) {
        setStreamContentCb(text.slice(0, len) || '');
      } else {
        setStreamContentCb(text);
        done.current = true;
        clearInterval(timer.current);
      }
    }, interval) as any;
  };

  return [streamContent, done.current];
}

const typingConfig: BubbleProps['typing'] = {
  effect: 'typing',
  step: 5,
  interval: 50,
  keepPrefix: true,
};

const StreamFullExample = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState('');
  const [streamConfig, setStreamConfig] = useState({ step: 2, interval: 100 });
  const [streamContent, isDone] = useStreamContent(data, streamConfig);
  const [typing, setTyping] = useState<boolean>(false);
  const [disableStreaming, setDisableStreaming] = useState(false);
  const [count, setCount] = useState(0);

  const loadStream = (step: number, interval: number) => {
    setLoading(false);
    setCount(0);
    setData(`${(Math.random() * 10).toFixed(0)} - ${text}`);
    setStreamConfig({ step, interval });
  };

  const props = useMemo(
    () => ({
      header: <h5>ADX</h5>,
      avatar: <Avatar icon={<UserOutlined />} />,
      onTyping: () => console.log('typing'),
      onTypingComplete: () => {
        setCount((c) => c + 1);
        console.log('typing complete');
      },
    }),
    [],
  );

  return (
    <Flex vertical gap="small">
      <Flex gap="small" align="center">
        <span>流式数据:</span>
        <Button type="primary" onClick={() => loadStream(2, 100)}>load slowly</Button>
        <Button onClick={() => loadStream(10, 50)}>load quickly</Button>
        <Button type="link" onClick={() => setData('')}>clear</Button>
      </Flex>
      <Flex gap="small" align="center">
        <span>强制关闭流式标志:</span>
        <Switch value={disableStreaming} onChange={setDisableStreaming} />
      </Flex>
      <Flex gap="small" align="center">
        <span>启用动画:</span>
        <Switch value={typing} onChange={setTyping} />
      </Flex>
      <Flex gap="small" align="center">
        <span>onTypingComplete 触发次数: <Typography.Text type="danger">{count}</Typography.Text></span>
      </Flex>
      <Divider />
      <Bubble
        loading={loading}
        content={streamContent}
        streaming={disableStreaming ? false : !isDone}
        typing={typing ? typingConfig : false}
        {...props}
      />
    </Flex>
  );
};

export default StreamFullExample;
```

**重要说明：**
- `streaming={true}` 时，即使内容已显示完毕也不会触发 `onTypingComplete`
- 只有当 `streaming` 变为 `false` 且内容全部输出后，才会触发 `onTypingComplete`
- 这避免了流式传输过程中多次触发回调的问题

### 3. 自定义内容渲染

通过 `contentRender` 自定义渲染逻辑：

```tsx
import { Bubble } from '@ant-design/x';
import { Button, Flex, Image } from 'antd';
import { useState } from 'react';

type CustomContentType = {
  imageUrl: string;
  text: string;
  actionNode: React.ReactNode;
};

const CustomContentExample = () => {
  const [content, setContent] = useState<CustomContentType>({
    imageUrl: 'https://example.com/image.png',
    text: 'Ant Design X',
    actionNode: <>Click Me</>,
  });

  return (
    <div style={{ height: 100 }}>
      <Bubble<CustomContentType>
        content={content}
        contentRender={(content) => (
          <Flex gap="middle" align="center">
            <Image height={50} src={content.imageUrl} />
            <span style={{ fontSize: 18, fontWeight: 'bold' }}>{content.text}</span>
          </Flex>
        )}
        footer={(content) => (
          <Button
            onClick={() => {
              setContent((ori) => ({
                ...ori,
                actionNode: <>🎉 Happy Ant Design X!</>,
              }));
            }}
            type="text"
          >
            {content?.actionNode}
          </Button>
        )}
      />
    </div>
  );
};
```

### 4. Markdown 渲染

结合 `@ant-design/x-markdown`：

```tsx
import { Bubble } from '@ant-design/x';
import XMarkdown from '@ant-design/x-markdown';
import { Typography } from 'antd';

const markdownText = `
> Render as markdown content to show rich text!

Link: [Ant Design X](https://x.ant.design)
`.trim();

const MarkdownExample = () => (
  <Bubble
    content={markdownText}
    contentRender={(content: string) => (
      <Typography>
        <XMarkdown content={content} />
      </Typography>
    )}
  />
);
```

### 5. 可编辑气泡

```tsx
import { Bubble } from '@ant-design/x';
import { Actions } from '@ant-design/x';
import { Avatar, Flex } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import { useState } from 'react';

const EditableExample = () => {
  const [editable, setEditable] = useState(false);
  const [content, setContent] = useState('可编辑内容');

  return (
    <Flex vertical gap="small" style={{ minHeight: 200 }}>
      <Bubble
        editable={editable}
        content={content}
        avatar={<Avatar icon={<UserOutlined />} />}
        footer={
          <Actions
            items={[{
              key: 'edit',
              icon: <EditOutlined />,
              label: 'edit',
            }]}
            onClick={() => setEditable(true)}
          />
        }
        onEditCancel={() => setEditable(false)}
        onEditConfirm={(val) => {
          setContent(val);
          setEditable(false);
        }}
      />
    </Flex>
  );
};
```

**带配置的编辑选项：**

```tsx
import { useState } from 'react';
import { Bubble } from '@ant-design/x';
import { Actions } from '@ant-design/x';
import { Avatar, Flex } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';

const EditableWithOptions = () => {
  const [editable, setEditable] = useState({ editing: false, okText: 'ok', cancelText: 'cancel' });
  const [content, setContent] = useState('可编辑内容');

  return (
    <Bubble
      editable={editable}
      content={content}
      avatar={<Avatar icon={<UserOutlined />} />}
      footer={
        <Actions
          items={[{
            key: 'edit',
            icon: <EditOutlined />,
            label: 'edit',
          }]}
          onClick={() => setEditable({ ...editable, editing: true })}
        />
      }
      onEditCancel={() => setEditable({ ...editable, editing: false })}
      onEditConfirm={(val) => {
        setContent(val);
        setEditable({ ...editable, editing: false });
      }}
    />
  );
};
```

---

## 插槽系统

### Header / Footer

```tsx
import { Bubble } from '@ant-design/x';
import { Actions } from '@ant-design/x';
import { Avatar, Flex } from 'antd';
import { UserOutlined, CopyOutlined, RedoOutlined } from '@ant-design/icons';

const actionItems = [
  { key: 'retry', icon: <RedoOutlined />, label: 'Retry' },
  { key: 'copy', icon: <CopyOutlined />, label: 'Copy' },
];

<Flex vertical gap="small">
  {/* 基础 header + footer */}
  <Bubble
    content="消息内容"
    header={<h5>发送者名称</h5>}
    footer={(content) => (
      <Actions items={actionItems} onClick={() => console.log(content)} />
    )}
    avatar={<Avatar icon={<UserOutlined />} />}
  />

  {/* Footer 位置控制 */}
  <Bubble
    content="inner footer"
    placement="end"
    footerPlacement="inner-end"
    header="header"
    avatar={<Avatar icon={<UserOutlined />} />}
    footer={(content) => (
      <Actions items={actionItems} onClick={() => console.log(content)} />
    )}
  />

  {/* outer-end */}
  <Bubble
    content="outer-end footer"
    footerPlacement="outer-end"
    header="header"
    avatar={<Avatar icon={<UserOutlined />} />}
    footer={(content) => (
      <Actions items={actionItems} onClick={() => console.log(content)} />
    )}
  />

  {/* inner-start */}
  <Bubble
    content="inner-start footer"
    placement="end"
    footerPlacement="inner-start"
    header="header"
    avatar={<Avatar icon={<UserOutlined />} />}
    footer={(content) => (
      <Actions items={actionItems} onClick={() => console.log(content)} />
    )}
  />
</Flex>
```

**Footer 位置选项：**
- `outer-start`: 外部左侧（默认）
- `outer-end`: 外部右侧
- `inner-start`: 内部左侧
- `inner-end`: 内部右侧

### Extra 插槽

```tsx
import { Bubble } from '@ant-design/x';
import { Button } from 'antd';

<Bubble
  content="消息"
  extra={<Button size="small">操作</Button>}
/>
```

---

## 特殊气泡类型

### Bubble.System - 系统消息

```tsx
import { Bubble } from '@ant-design/x';
import { Flex } from 'antd';

<Flex gap={16} vertical>
  <Bubble.System content="系统通知：欢迎使用 Ant Design X" />
  <Bubble.System content="自定义样式" variant="outlined" shape="round" />
</Flex>
```

### Bubble.Divider - 分割线

```tsx
import { Bubble } from '@ant-design/x';
import { Flex } from 'antd';

<Flex gap={16} vertical>
  <Bubble content="消息 1" />
  <Bubble.Divider content="Solid" />
  <Bubble content="消息 2" placement="end" />
  <Bubble.Divider content="Dashed" dividerProps={{ variant: 'dashed' }} />
  <Bubble content="消息 3" />
  <Bubble.Divider content="Dotted" dividerProps={{ variant: 'dotted' }} />
  <Bubble content="消息 4" placement="end" />
  <Bubble.Divider content="Plain Text" dividerProps={{ plain: true }} />
  <Bubble content="消息 5" />
</Flex>
```

---

## Bubble.List - 气泡列表

### 基础列表

```tsx
import { Bubble } from '@ant-design/x';

const items = [
  { key: '1', role: 'ai', content: 'AI 回复' },
  { key: '2', role: 'user', content: '用户消息', placement: 'end' },
  { key: '3', role: 'system', content: '系统消息' },
  { key: '4', role: 'divider', content: '分割线' },
];

<Bubble.List 
  items={items} 
  style={{ height: 500 }}
  autoScroll
/>
```

### 角色配置

```tsx
import { Bubble } from '@ant-design/x';
import { Actions, FileCard } from '@ant-design/x';
import { Avatar, Space, Typography, Link } from 'antd';
import { AntDesignOutlined, UserOutlined, LinkOutlined } from '@ant-design/icons';
import { useMemo } from 'react';

const roleConfig = useMemo(() => ({
  ai: {
    typing: true,
    header: 'AI 助手',
    avatar: () => <Avatar icon={<AntDesignOutlined />} />,
    variant: 'filled',
    footer: (content) => (
      <Actions items={[
        { key: 'copy', icon: <CopyOutlined />, label: 'Copy' },
      ]} />
    ),
  },
  user: {
    placement: 'end',
    typing: false,
    header: '用户',
    avatar: () => <Avatar icon={<UserOutlined />} />,
  },
  // 自定义角色
  reference: {
    variant: 'borderless',
    styles: { root: { margin: 0, marginBottom: -12 } },
    avatar: () => null,
    contentRender: (content) => (
      <Space>
        <LinkOutlined />
        <FileCard type="file" size="small" name={content.name} byte={content.byte} />
      </Space>
    ),
  },
}), []);

const items = [
  { key: '1', role: 'ai', content: 'AI 回复' },
  { key: '2', role: 'user', content: '用户消息' },
  { key: '3', role: 'reference', content: { name: 'document.pdf', byte: 1024 } },
];

<Bubble.List items={items} role={roleConfig} style={{ height: 600 }} autoScroll />
```

### 动态列表（完整示例）

```tsx
import { Bubble, BubbleListProps, BubbleItemType, FileCard, FileCardProps } from '@ant-design/x';
import XMarkdown from '@ant-design/x-markdown';
import { Avatar, Button, Flex, Space, Switch, Typography } from 'antd';
import { 
  AntDesignOutlined, UserOutlined, CopyOutlined, RedoOutlined, 
  EditOutlined, CheckOutlined, LinkOutlined 
} from '@ant-design/icons';
import { Actions } from '@ant-design/x';
import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import type { GetRef } from 'antd';

const actionItems = [
  { key: 'retry', icon: <RedoOutlined />, label: 'Retry' },
  { key: 'copy', icon: <CopyOutlined />, label: 'Copy' },
];

let id = 0;
const getKey = () => `bubble_${id++}`;

const genItem = (isAI: boolean, config?: Partial<BubbleItemType>): BubbleItemType => ({
  key: getKey(),
  role: isAI ? 'ai' : 'user',
  content: `${id} : ${isAI ? 'Mock AI content'.repeat(50) : 'Mock user content.'}`,
  ...config,
});

function useBubbleList(initialItems: BubbleItemType[] = []) {
  const [items, setItems] = useState<BubbleItemType[]>(initialItems);

  const add = useCallback((item: BubbleItemType) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const update = useCallback((key: string | number, data: Omit<Partial<BubbleItemType>, 'key' | 'role'>) => {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...data } : item)));
  }, []);

  return [items, setItems, add, update] as const;
}

const ListFullExample = () => {
  const listRef = useRef<GetRef<typeof Bubble.List>>(null);
  const [items, set, add, update] = useBubbleList();
  const [enableLocScroll, setEnableLocScroll] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    set([
      { key: getKey(), role: 'system', content: 'Welcome to use Ant Design X' },
      genItem(false, { typing: false }),
      genItem(true, { typing: false }),
      { key: getKey(), role: 'divider', content: 'divider' },
      genItem(false, { typing: false }),
      genItem(true, { typing: false, loading: true }),
    ]);
  }, []);

  const memoRole: BubbleListProps['role'] = useMemo(() => ({
    ai: {
      typing: true,
      header: 'AI',
      avatar: () => <Avatar icon={<AntDesignOutlined />} />,
      footer: (content) => <Actions items={actionItems} onClick={() => console.log(content)} />,
    },
    user: (data) => ({
      placement: 'end',
      typing: false,
      header: `User-${data.key}`,
      avatar: () => <Avatar icon={<UserOutlined />} />,
      footer: () => (
        <Actions
          items={[
            data.editable
              ? { key: 'done', icon: <CheckOutlined />, label: 'done' }
              : { key: 'edit', icon: <EditOutlined />, label: 'edit' },
          ]}
          onClick={({ key }) => update(data.key, { editable: key === 'edit' })}
        />
      ),
      onEditConfirm: (content) => {
        console.log(`editing User-${data.key}: `, content);
        update(data.key, { content, editable: false });
      },
      onEditCancel: () => update(data.key, { editable: false }),
    }),
    reference: {
      variant: 'borderless',
      styles: { root: { margin: 0, marginBottom: -12 } },
      avatar: () => '',
      contentRender: (content: FileCardProps) => (
        <Space>
          <LinkOutlined />
          <FileCard type="file" size="small" name={content.name} byte={content.byte} />
        </Space>
      ),
    },
  }), []);

  const scrollTo: GetRef<typeof Bubble.List>['scrollTo'] = (option) => {
    setTimeout(() => listRef.current?.scrollTo({ ...option, behavior: 'smooth' }));
  };

  return (
    <Flex vertical style={{ height: 720 }} gap={20}>
      <Flex vertical gap="small">
        <Space align="center">
          <Switch value={autoScroll} onChange={(v) => setAutoScroll(v)} />
          <span>启用 autoScroll</span>
        </Space>
        <Space align="center">
          <Switch value={enableLocScroll} onChange={(v) => setEnableLocScroll(v)} />
          <span>定位到新气泡</span>
        </Space>
      </Flex>
      <Flex gap="small" wrap>
        <Button
          type="primary"
          onClick={() => {
            const chatItems = items.filter((item) => item.role === 'ai' || item.role === 'user');
            const isAI = !!(chatItems.length % 2);
            add(genItem(isAI, { typing: { effect: 'fade-in', step: [20, 50] } }));
            if (enableLocScroll) scrollTo({ top: 'bottom' });
          }}
        >
          Add Bubble
        </Button>
        <Button
          onClick={() => {
            add({
              key: getKey(),
              role: 'ai',
              typing: { effect: 'fade-in', step: 6 },
              content: '> Markdown content',
              contentRender: (content: string) => (
                <Typography><XMarkdown content={content} /></Typography>
              ),
            });
            if (enableLocScroll) scrollTo({ top: 'bottom' });
          }}
        >
          Add Markdown
        </Button>
        <Button onClick={() => {
          set([...items, { key: getKey(), role: 'divider', content: 'Divider' }]);
          if (enableLocScroll) scrollTo({ top: 'bottom' });
        }}>Add Divider</Button>
        <Button onClick={() => {
          set([...items, { key: getKey(), role: 'system', content: 'System message' }]);
          if (enableLocScroll) scrollTo({ top: 'bottom' });
        }}>Add System</Button>
        <Button onClick={() => {
          const item = genItem(false);
          set((pre) => [item, genItem(true), genItem(false), ...pre]);
          if (enableLocScroll) scrollTo({ top: 'top' });
        }}>Add To Top</Button>
        <Button onClick={() => {
          set((pre) => [
            ...pre,
            { key: getKey(), role: 'reference', placement: 'end', content: { name: 'Ant-Design-X.pdf' } },
            genItem(false),
          ]);
          if (enableLocScroll) scrollTo({ top: 'bottom' });
        }}>Add With Ref</Button>
      </Flex>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Bubble.List
          style={{ height: 620 }}
          ref={listRef}
          role={memoRole}
          items={items}
          autoScroll={autoScroll}
        />
      </div>
    </Flex>
  );
};

export default ListFullExample;
```

### 滚动控制

```tsx
import { Bubble } from '@ant-design/x';
import { useRef } from 'react';

const ScrollExample = () => {
  const listRef = useRef(null);

  const addAndScroll = () => {
    const newItem = { key: 'new', role: 'ai', content: '新消息' };
    setItems([...items, newItem]);
    
    // 滚动到底部
    listRef.current?.scrollTo({ top: 'bottom', behavior: 'smooth' });
  };

  return (
    <>
      <Button onClick={addAndScroll}>添加并滚动</Button>
      <Bubble.List 
        ref={listRef}
        items={items} 
        style={{ height: 600 }}
        autoScroll
      />
    </>
  );
};
```

**注意：** Bubble.List 滚动托管需要自身或父容器设置明确的 `height`：

```tsx
// 方式 1：直接设置 style
<Bubble.List items={items} style={{ height: 500 }} autoScroll />

// 方式 2：父容器设置
<div style={{ height: 500 }}>
  <Bubble.List items={items} autoScroll />
</div>
```

---

## GPT-Vis 图表渲染

```tsx
import { Bubble } from '@ant-design/x';
import XMarkdown from '@ant-design/x-markdown';
import { Line } from '@antv/gpt-vis';
import { Button, Flex, Skeleton } from 'antd';
import { useEffect, useState, useRef } from 'react';

const markdownText = `
**GPT-Vis** 图表组件示例

<custom-line data-axis-x-title="year" data-axis-y-title="sale">
[{"time":2013,"value":59.3},{"time":2014,"value":64.4},{"time":2015,"value":68.9},{"time":2016,"value":74.4},{"time":2017,"value":82.7},{"time":2018,"value":91.9},{"time":2019,"value":99.1},{"time":2020,"value":101.6},{"time":2021,"value":114.4},{"time":2022,"value":121}]
</custom-line>
`;

const LineChart = (props: Record<string, any>) => {
  const { children, streamstatus } = props;
  const resolvedAxisXTitle = props['data-axis-x-title'] || '';
  const resolvedAxisYTitle = props['data-axis-y-title'] || '';

  let jsonData: any = [];
  if (Array.isArray(children) && children.length > 0) {
    jsonData = children[0];
  } else if (typeof children === 'string') {
    jsonData = children;
  }

  if (streamstatus === 'loading') {
    return <Skeleton.Image active style={{ width: 901, height: 408 }} />;
  }

  try {
    const parsedData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    return <Line data={parsedData} axisXTitle={resolvedAxisXTitle} axisYTitle={resolvedAxisYTitle} />;
  } catch (error) {
    return <div>Error rendering chart</div>;
  }
};

const GptVisExample = () => {
  const [index, setIndex] = useState(0);
  const [hasNextChunk, setHasNextChunk] = useState(true);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (index >= markdownText.length) return;
    timer.current = setTimeout(() => {
      setIndex(Math.min(index + 5, markdownText.length));
    }, 20);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [index]);

  useEffect(() => {
    if (index >= markdownText.length) {
      setHasNextChunk(false);
    } else if (!hasNextChunk) {
      setHasNextChunk(true);
    }
  }, [index, hasNextChunk]);

  return (
    <Flex vertical gap="small" style={{ height: 600, overflow: 'auto' }} ref={contentRef}>
      <Flex justify="flex-end">
        <Button onClick={() => { setIndex(0); setHasNextChunk(true); }}>Re-Render</Button>
      </Flex>
      <Bubble
        content={markdownText.slice(0, index)}
        contentRender={(content) => (
          <XMarkdown
            style={{ whiteSpace: 'normal' }}
            components={{ 'custom-line': LineChart }}
            paragraphTag="div"
            streaming={{ hasNextChunk }}
          >
            {content}
          </XMarkdown>
        )}
        variant="outlined"
      />
    </Flex>
  );
};

export default GptVisExample;
```

---

## API 参考

### Bubble 属性

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `placement` | 气泡位置 | `start` \| `end` | `start` |
| `content` | 气泡内容 | `ReactNode \| string \| number \| object` | - |
| `loading` | 加载状态 | `boolean` | - |
| `loadingRender` | 自定义加载渲染 | `() => ReactNode` | - |
| `contentRender` | 自定义内容渲染 | `(content, info) => ReactNode` | - |
| `typing` | 打字动画 | `boolean \| BubbleAnimationOption \| Function` | `false` |
| `streaming` | 流式传输状态 | `boolean` | `false` |
| `variant` | 样式变体 | `filled` \| `outlined` \| `shadow` \| `borderless` | `filled` |
| `shape` | 形状 | `default` \| `round` \| `corner` | `default` |
| `editable` | 可编辑 | `boolean \| EditableBubbleOption` | `false` |
| `header` | 头部插槽 | `ReactNode \| Function` | - |
| `footer` | 底部插槽 | `ReactNode \| Function` | - |
| `avatar` | 头像插槽 | `ReactNode \| Function` | - |
| `extra` | 额外插槽 | `ReactNode \| Function` | - |
| `footerPlacement` | 底部插槽位置 | `outer-start` \| `outer-end` \| `inner-start` \| `inner-end` | `outer-start` |
| `onTyping` | 动画执行回调 | `(rendererContent, currentContent) => void` | - |
| `onTypingComplete` | 动画结束回调 | `(content) => void` | - |
| `onEditConfirm` | 编辑确认回调 | `(content) => void` | - |
| `onEditCancel` | 编辑取消回调 | `() => void` | - |

### BubbleAnimationOption

```typescript
interface BubbleAnimationOption {
  effect: 'typing' | 'fade-in';     // 动画类型
  step?: number | [number, number]; // 步进单位，数组为随机区间
  interval?: number;                 // 间隔 (ms)
  keepPrefix?: boolean;              // 保留公共前缀
}
```

### EditableBubbleOption

```typescript
interface EditableBubbleOption {
  editing?: boolean;        // 是否正在编辑
  okText?: ReactNode;       // 确认按钮文本
  cancelText?: ReactNode;   // 取消按钮文本
}
```

### Bubble.List 属性

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `items` | 气泡数据列表 | `BubbleItemType[]` | - |
| `role` | 角色默认配置 | `Record<string, RoleProps>` | - |
| `autoScroll` | 自动滚动 | `boolean` | `true` |

### BubbleItemType

```typescript
type BubbleItemType = BubbleProps & {
  key: string | number;
  role: string;
  status?: MessageStatus;
  extraInfo?: AnyObject;
};

type MessageStatus = 'local' | 'loading' | 'updating' | 'success' | 'error' | 'abort';
```

### Bubble.System 属性

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `content` | 内容 | `ReactNode` | - |
| `variant` | 样式变体 | `filled` \| `outlined` \| `shadow` \| `borderless` | `shadow` |
| `shape` | 形状 | `default` \| `round` \| `corner` | `default` |

### Bubble.Divider 属性

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `content` | 内容 | `ReactNode` | - |
| `dividerProps` | Divider 组件属性 | `DividerProps` | - |

---

## 主题变量 (Design Token)

可通过 `XProvider` 或 `ConfigProvider` 自定义主题：

```tsx
import { XProvider } from '@ant-design/x';

<XProvider
  theme={{
    components: {
      Bubble: {
        // 自定义打字动画内容
        typingContent: '"💖"',
        // 其他 token...
      }
    }
  }}
>
  <App />
</XProvider>
```

---

## 最佳实践

### 1. 流式传输 + 动画组合

```tsx
// 推荐：流式传输时关闭动画，避免双重动画效果
<Bubble
  content={streamContent}
  streaming={isStreaming}
  typing={false}
/>

// 或者：仅使用动画模拟流式效果
<Bubble
  content={fullContent}
  typing={{ effect: 'typing', step: 3, interval: 50 }}
  streaming={false}
/>
```

### 2. 列表性能优化

```tsx
// 使用 useMemo 缓存 role 配置
const roleConfig = useMemo(() => ({
  ai: { typing: true, avatar: () => <Avatar /> },
  user: { placement: 'end' },
}), []);

<Bubble.List role={roleConfig} items={items} />
```

### 3. 滚动定位时机

```tsx
// 需要等待 Bubble 添加完成后再滚动
const addAndScroll = () => {
  setItems([...items, newItem]);
  setTimeout(() => {
    listRef.current?.scrollTo({ top: 'bottom' });
  }, 0);
};
```

### 4. 自定义内容类型安全

```tsx
// 使用泛型定义自定义内容类型
type ChartContent = {
  type: 'line' | 'bar';
  data: number[];
};

<Bubble<ChartContent>
  content={chartData}
  contentRender={(content) => (
    <Chart type={content.type} data={content.data} />
  )}
/>
```

---

## 相关资源

- [Ant Design X 官方文档](https://x.ant.design)
- [@antv/gpt-vis 图表库](https://github.com/antvis/GPT-Vis)
- [@ant-design/x-markdown](../x-markdown/)
