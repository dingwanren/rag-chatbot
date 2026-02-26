# Sender 输入框 - Skill 参考文档

## 组件概述

**Sender** 是 Ant Design X 中用于对话场景的输入框组件，支持语音输入、快捷指令、词槽模式、文件粘贴等丰富功能。

**安装依赖：**
```bash
npm install @ant-design/x
```

**基本导入：**
```tsx
import { Sender } from '@ant-design/x';

// 子组件
import { Sender } from '@ant-design/x';
<Sender.Header />
<Sender.Switch />
```

---

## 使用场景

### 1. 聊天输入框
构建对话场景下的基础输入功能。

### 2. 语音输入
支持语音输入功能。

### 3. 快捷指令
提供快捷命令输入支持。

### 4. 文件粘贴
支持粘贴图片等文件。

### 5. 结构化输入
通过词槽模式支持结构化输入。

---

## 基础用法

### 基本用法

```tsx
import { Sender } from '@ant-design/x';

const App = () => (
  <Sender
    placeholder="输入消息..."
    onSubmit={(message) => {
      console.log('发送消息:', message);
    }}
  />
);

export default App;
```

### 受控模式

```tsx
import { Sender } from '@ant-design/x';
import { useState } from 'react';

const App = () => {
  const [value, setValue] = useState('');

  return (
    <Sender
      value={value}
      onChange={setValue}
      onSubmit={() => {
        console.log('发送:', value);
        setValue('');
      }}
    />
  );
};

export default App;
```

### 功能开关

```tsx
import { Sender } from '@ant-design/x';
import { Flex, Switch } from 'antd';
import { useState } from 'react';

const App = () => {
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);

  return (
    <Flex vertical gap="middle">
      <Sender
        loading={loading}
        disabled={disabled}
        placeholder="输入消息..."
        onSubmit={() => console.log('发送')}
      />
      <Flex gap="middle">
        <Switch
          checked={loading}
          onChange={setLoading}
          checkedChildren="加载中"
          unCheckedChildren="非加载"
        />
        <Switch
          checked={disabled}
          onChange={setDisabled}
          checkedChildren="已禁用"
          unCheckedChildren="未禁用"
        />
      </Flex>
    </Flex>
  );
};

export default App;
```

### 提交方式

```tsx
import { Sender } from '@ant-design/x';

const App = () => (
  <Sender
    // Enter 发送（默认）
    submitType="enter"
    
    // Shift+Enter 发送
    submitType="shiftEnter"
    
    onSubmit={(message) => console.log(message)}
  />
);

export default App;
```

### 发送控制

```tsx
import { Sender } from '@ant-design/x';
import { useState } from 'react';

const App = () => {
  const [value, setValue] = useState('');

  return (
    <Sender
      value={value}
      onChange={setValue}
      // 当输入为空时禁用发送按钮
      onSubmit={value.trim() ? () => console.log(value) : undefined}
    />
  );
};

export default App;
```

---

## 进阶功能

### 1. 语音输入

```tsx
import { Sender } from '@ant-design/x';

const App = () => (
  <Sender
    allowSpeech
    placeholder="点击麦克风图标开始语音输入..."
    onSubmit={(message) => console.log(message)}
  />
);

export default App;
```

### 2. 自定义语音输入

```tsx
import { Sender } from '@ant-design/x';
import { useState } from 'react';

const App = () => {
  const [recording, setRecording] = useState(false);

  return (
    <Sender
      allowSpeech={{
        recording,
        onRecordingChange: setRecording,
      }}
      placeholder={recording ? '正在录音...' : '点击录音'}
      onSubmit={(message) => console.log(message)}
    />
  );
};

export default App;
```

### 3. 词槽模式

```tsx
import { Sender } from '@ant-design/x';

const slotConfig = [
  { type: 'text', value: '@' },
  { type: 'tag', key: 'mention', props: { label: '@某人', value: 'user' } },
  { type: 'text', value: ' 请查看 ' },
  { type: 'input', key: 'content', props: { placeholder: '输入内容' } },
];

const App = () => (
  <Sender
    slotConfig={slotConfig}
    onSubmit={(value, _, slotConfig) => {
      console.log('结构化数据:', slotConfig);
    }}
  />
);

export default App;
```

### 4. 技能配置

```tsx
import { Sender } from '@ant-design/x';

const App = () => (
  <Sender
    skill={{
      title: 'AI 助手',
      value: 'assistant',
      closable: true,
    }}
    onSubmit={(value, _, __, skill) => {
      console.log('技能:', skill);
    }}
  />
);

export default App;
```

### 5. 展开面板

```tsx
import { Sender } from '@ant-design/x';
import { CloudUploadOutlined } from '@ant-design/icons';
import { Attachments } from '@ant-design/x';
import { useState } from 'react';

const App = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  const header = (
    <Sender.Header
      title="附件"
      open={open}
      onOpenChange={setOpen}
    >
      <Attachments
        beforeUpload={() => false}
        items={items}
        onChange={({ fileList }) => setItems(fileList)}
        placeholder={{
          icon: <CloudUploadOutlined />,
          title: '上传文件',
        }}
      />
    </Sender.Header>
  );

  return (
    <Sender
      header={header}
      placeholder="输入消息..."
      onSubmit={(message) => {
        console.log('发送:', message, '附件:', items);
        setItems([]);
      }}
    />
  );
};

export default App;
```

### 6. 自定义后缀

```tsx
import { Sender } from '@ant-design/x';
import { SettingOutlined } from '@ant-design/icons';
import { Button } from 'antd';

const App = () => (
  <Sender
    suffix={(oriNode, { components }) => (
      <>
        <Button type="text" icon={<SettingOutlined />} />
        {oriNode}
      </>
    )}
    placeholder="输入消息..."
  />
);

export default App;
```

### 7. 自定义底部内容

```tsx
import { Sender } from '@ant-design/x';
import { Button, Flex } from 'antd';

const App = () => (
  <Sender
    footer={(oriNode) => (
      <>
        <Flex gap="small" style={{ padding: 8 }}>
          <Button size="small">快捷短语 1</Button>
          <Button size="small">快捷短语 2</Button>
        </Flex>
        {oriNode}
      </>
    )}
    placeholder="输入消息..."
  />
);

export default App;
```

### 8. 黏贴图片

```tsx
import { Sender } from '@ant-design/x';
import { message } from 'antd';

const App = () => (
  <Sender
    onPasteFile={(files) => {
      const file = files[0];
      if (file && file.type.startsWith('image/')) {
        message.success(`粘贴图片：${file.name}`);
        // 处理图片上传
      }
    }}
    placeholder="支持粘贴图片..."
  />
);

export default App;
```

### 9. 实例方法调用

```tsx
import { Sender } from '@ant-design/x';
import { Button, Flex } from 'antd';
import { useRef } from 'react';

const App = () => {
  const senderRef = useRef(null);

  return (
    <Flex gap="middle" vertical>
      <Sender ref={senderRef} placeholder="输入消息..." />
      <Flex gap="middle">
        <Button onClick={() => senderRef.current?.focus()}>
          聚焦
        </Button>
        <Button onClick={() => senderRef.current?.blur()}>
          失焦
        </Button>
        <Button onClick={() => senderRef.current?.clear()}>
          清空
        </Button>
        <Button
          onClick={() =>
            senderRef.current?.insert('要插入的文本')
          }
        >
          插入文本
        </Button>
        <Button
          onClick={() => {
            const { value, slotConfig } = senderRef.current?.getValue() || {};
            console.log('当前值:', value, slotConfig);
          }}
        >
          获取值
        </Button>
      </Flex>
    </Flex>
  );
};

export default App;
```

### 10. Switch 开关

```tsx
import { Sender } from '@ant-design/x';
import { useState } from 'react';

const App = () => {
  const [checked, setChecked] = useState(false);

  return (
    <Sender
      prefix={
        <Sender.Switch
          checked={checked}
          onChange={setChecked}
          checkedChildren="联网"
          unCheckedChildren="本地"
        />
      }
      placeholder="输入消息..."
    />
  );
};

export default App;
```

---

## API 参考

### SenderProps

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `allowSpeech` | 是否允许语音输入 | `boolean \| SpeechConfig` | `false` |
| `classNames` | 样式类名 | 见 Semantic DOM | - |
| `components` | 自定义组件 | `Record<'input', ComponentType>` | - |
| `defaultValue` | 输入框默认值 | `string` | - |
| `disabled` | 是否禁用 | `boolean` | `false` |
| `loading` | 是否加载中 | `boolean` | `false` |
| `suffix` | 后缀内容 | `React.ReactNode \| false \| Function` | `oriNode` |
| `header` | 头部面板 | `React.ReactNode \| false \| Function` | `false` |
| `prefix` | 前缀内容 | `React.ReactNode \| false \| Function` | `false` |
| `footer` | 底部内容 | `React.ReactNode \| false \| Function` | `false` |
| `readOnly` | 是否让输入框只读 | `boolean` | `false` |
| `rootClassName` | 根元素样式类 | `string` | - |
| `styles` | 语义化定义样式 | 见 Semantic DOM | - |
| `submitType` | 提交模式 | `enter` \| `shiftEnter` | `enter` |
| `value` | 输入框值 | `string` | - |
| `onSubmit` | 点击发送按钮的回调 | `(message, slotConfig, skill) => void` | - |
| `onChange` | 输入框值改变的回调 | `(value, event, slotConfig, skill) => void` | - |
| `onCancel` | 点击取消按钮的回调 | `() => void` | - |
| `onPaste` | 粘贴回调 | `React.ClipboardEventHandler` | - |
| `onPasteFile` | 黏贴文件的回调 | `(files: FileList) => void` | - |
| `onKeyDown` | 键盘按下回调 | `(event) => void \| false` | - |
| `onFocus` | 获取焦点回调 | `React.FocusEventHandler` | - |
| `onBlur` | 失去焦点回调 | `React.FocusEventHandler` | - |
| `placeholder` | 输入框占位符 | `string` | - |
| `autoSize` | 自适应内容高度 | `boolean \| { minRows?: number; maxRows?: number }` | `{ maxRows: 8 }` |
| `slotConfig` | 词槽配置 | `SlotConfigType[]` | - |
| `skill` | 技能配置 | `SkillType` | - |

### SpeechConfig

```typescript
type SpeechConfig = {
  recording?: boolean;
  onRecordingChange?: (recording: boolean) => void;
};
```

### SkillType

```typescript
interface SkillType {
  title?: React.ReactNode;
  value: string;
  toolTip?: TooltipProps;
  closable?: boolean | {
    closeIcon?: React.ReactNode;
    onClose?: React.MouseEventHandler<HTMLDivElement>;
    disabled?: boolean;
  };
}
```

### Sender Ref

| 属性 | 说明 | 类型 |
|------|------|------|
| `inputElement` | 输入框元素 | `HTMLTextAreaElement` |
| `nativeElement` | 外层容器 | `HTMLDivElement` |
| `focus` | 获取焦点 | `(option?: { preventScroll?: boolean, cursor?: 'start' \| 'end' \| 'all' \| 'slot' }) => void` |
| `blur` | 取消焦点 | `() => void` |
| `insert` | 插入文本或插槽 | `(value: string) => void \| (slotConfig, position, replaceCharacters, preventScroll) => void` |
| `clear` | 清空内容 | `() => void` |
| `getValue` | 获取当前内容 | `() => { value: string; slotConfig: SlotConfigType[]; skill: SkillType }` |

### SlotConfigType

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `type` | 节点类型 | `'text' \| 'input' \| 'select' \| 'tag' \| 'content' \| 'custom'` | - |
| `key` | 唯一标识 | `string` | - |
| `formatResult` | 格式化最终结果 | `(value: any) => string` | - |

#### text 节点属性

| 属性 | 说明 | 类型 |
|------|------|------|
| `value` | 文本内容 | `string` |

#### input 节点属性

| 属性 | 说明 | 类型 |
|------|------|------|
| `props.placeholder` | 占位符 | `string` |
| `props.defaultValue` | 默认值 | `string \| number` |

#### select 节点属性

| 属性 | 说明 | 类型 |
|------|------|------|
| `props.options` | 选项数组 | `string[]` |
| `props.placeholder` | 占位符 | `string` |
| `props.defaultValue` | 默认值 | `string` |

#### tag 节点属性

| 属性 | 说明 | 类型 |
|------|------|------|
| `props.label` | 标签内容 | `ReactNode` |
| `props.value` | 标签值 | `string` |

#### custom 节点属性

| 属性 | 说明 | 类型 |
|------|------|------|
| `props.defaultValue` | 默认值 | `any` |
| `customRender` | 自定义渲染函数 | `(value, onChange, props, item) => ReactNode` |

### Sender.Header

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `children` | 面板内容 | `ReactNode` | - |
| `classNames` | 样式类名 | 见 Semantic DOM | - |
| `closable` | 是否可关闭 | `boolean` | `true` |
| `forceRender` | 强制渲染 | `boolean` | `false` |
| `open` | 是否展开 | `boolean` | - |
| `styles` | 语义化定义样式 | 见 Semantic DOM | - |
| `title` | 标题 | `ReactNode` | - |
| `onOpenChange` | 展开状态改变回调 | `(open: boolean) => void` | - |

### Sender.Switch

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `children` | 通用内容 | `ReactNode` | - |
| `checkedChildren` | 选中时的内容 | `ReactNode` | - |
| `unCheckedChildren` | 非选中时的内容 | `ReactNode` | - |
| `icon` | 设置图标组件 | `ReactNode` | - |
| `disabled` | 是否禁用 | `boolean` | `false` |
| `loading` | 加载中的开关 | `boolean` | - |
| `defaultValue` | 默认选中状态 | `boolean` | - |
| `value` | 开关的值 | `boolean` | `false` |
| `onChange` | 变化时的回调 | `function(checked: boolean)` | - |
| `rootClassName` | 根元素样式类 | `string` | - |

---

## 词槽模式注意事项

**词槽模式下，`value` 和 `defaultValue` 属性无效**，请使用 `ref` 及回调事件获取输入框的值和词槽配置。

```tsx
// ❌ 错误用法
const [config, setConfig] = useState([]);
<Sender
  slotConfig={config}
  onChange={(value, e, config) => {
    setConfig(config); // 不应该这样用
  }}
/>

// ✅ 正确用法
const [key, setKey] = useState('initial');
<Sender
  key={key}
  slotConfig={config}
  onChange={(value, _e, config) => {
    // 仅用于获取结构化内容
    setKey('new_key'); // 通过改变 key 来重置
  }}
/>
```

---

## 主题变量 (Design Token)

可通过 `XProvider` 自定义主题：

```tsx
import { XProvider } from '@ant-design/x';

<XProvider
  theme={{
    components: {
      Sender: {
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

### 1. 与 Bubble.List 配合

```tsx
import { Sender, Bubble } from '@ant-design/x';
import { Flex } from 'antd';
import { useState } from 'react';

const ChatApp = () => {
  const [messages, setMessages] = useState([]);

  return (
    <Flex vertical style={{ height: '100vh' }}>
      <Bubble.List
        items={messages}
        style={{ flex: 1, overflow: 'auto' }}
      />
      <Sender
        placeholder="输入消息..."
        onSubmit={(message) => {
          setMessages([
            ...messages,
            { key: Date.now(), role: 'user', content: message },
          ]);
          // 调用 AI 接口获取回复
        }}
      />
    </Flex>
  );
};
```

### 2. 快捷短语

```tsx
import { Sender } from '@ant-design/x';
import { Button, Flex } from 'antd';

const quickPhrases = ['你好', '谢谢', '再见', '帮助我'];

const App = () => (
  <Sender
    footer={() => (
      <Flex gap="small" wrap style={{ padding: 8 }}>
        {quickPhrases.map((phrase) => (
          <Button
            key={phrase}
            size="small"
            onClick={() => {
              // 发送快捷短语
            }}
          >
            {phrase}
          </Button>
        ))}
      </Flex>
    )}
  />
);

export default App;
```

### 3. 输入验证

```tsx
import { Sender } from '@ant-design/x';
import { message } from 'antd';

const App = () => (
  <Sender
    onSubmit={(text) => {
      if (!text.trim()) {
        message.warning('请输入内容');
        return;
      }
      if (text.length > 1000) {
        message.warning('内容不能超过 1000 字');
        return;
      }
      // 发送消息
    }}
  />
);
```

---

## 相关资源

- [Ant Design X 官方文档](https://x.ant.design)
- [Attachments 组件](../attachments/)
- [Suggestion 组件](../suggestion/)
