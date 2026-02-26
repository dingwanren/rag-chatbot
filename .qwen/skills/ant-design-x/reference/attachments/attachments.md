# Attachments 输入附件 - Skill 参考文档

## 组件概述

**Attachments** 是 Ant Design X 中用于展示一组附件信息集合的组件，继承 antd Upload 属性，支持拖拽上传、文件列表展示等功能。

**安装依赖：**
```bash
npm install @ant-design/x
```

**基本导入：**
```tsx
import { Attachments } from '@ant-design/x';
```

---

## 使用场景

### 1. 文件上传列表
展示已上传的文件列表，支持删除、预览等操作。

### 2. 拖拽上传
提供拖拽区域，用户可拖拽文件上传。

### 3. 与输入框组合
与 Sender 输入框组合使用，用于聊天场景的文件上传。

### 4. 分类型文件选择
支持按类型选择文件（图片、视频、文档等）。

---

## 基础用法

### 基本使用

```tsx
import { Attachments } from '@ant-design/x';
import { CloudUploadOutlined } from '@ant-design/icons';
import { message } from 'antd';

const App = () => (
  <Attachments
    beforeUpload={() => false}  // 模拟不实际上传
    onChange={({ file }) => {
      message.info(`Mock upload: ${file.name}`);
    }}
    placeholder={{
      icon: <CloudUploadOutlined />,
      title: '拖拽文件到这里',
      description: '支持文件类型：图片、视频、音频、文档等',
    }}
  />
);
```

### 与 Sender 组合使用（完整示例）

```tsx
import { Attachments, Sender } from '@ant-design/x';
import { CloudUploadOutlined, LinkOutlined } from '@ant-design/icons';
import { App, Badge, Button, Flex, Typography } from 'antd';
import { useState, useRef, useEffect } from 'react';

const App = () => {
  const { notification } = App.useApp();
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const senderRef = useRef(null);

  useEffect(() => {
    return () => {
      // 清理创建的对象 URL
      items.forEach((item) => {
        if (item.url?.startsWith('blob:')) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, []);

  const senderHeader = (
    <Sender.Header
      title="附件"
      open={open}
      onOpenChange={setOpen}
      styles={{ content: { padding: 0 } }}
    >
      <Attachments
        beforeUpload={() => false}
        items={items}
        onChange={({ file, fileList }) => {
          const updatedFileList = fileList.map((item) => {
            if (item.uid === file.uid && file.status !== 'removed' && item.originFileObj) {
              // 清理旧 URL
              if (item.url?.startsWith('blob:')) {
                URL.revokeObjectURL(item.url);
              }
              // 创建新预览 URL
              return {
                ...item,
                url: URL.createObjectURL(item.originFileObj),
              };
            }
            return item;
          });
          setItems(updatedFileList);
        }}
        placeholder={(type) =>
          type === 'drop'
            ? { title: '拖拽文件到此处' }
            : {
                icon: <CloudUploadOutlined />,
                title: '上传文件',
                description: '点击或拖拽文件到此区域上传',
              }
        }
        getDropContainer={() => senderRef.current?.nativeElement}
      />
    </Sender.Header>
  );

  return (
    <Flex style={{ minHeight: 250 }} align="flex-end">
      <Sender
        ref={senderRef}
        header={senderHeader}
        prefix={
          <Badge dot={items.length > 0 && !open}>
            <Button onClick={() => setOpen(!open)} icon={<LinkOutlined />} />
          </Badge>
        }
        value={text}
        onChange={setText}
        onSubmit={() => {
          notification.info({
            title: '模拟提交',
            description: (
              <Typography>
                <ul>
                  <li>你说：{text}</li>
                  <li>
                    附件数量：{items.length}
                    <ul>
                      {items.map((item) => (
                        <li key={item.uid}>{item.name}</li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </Typography>
            ),
          });
          setItems([]);
          setText('');
        }}
      />
    </Flex>
  );
};

export default App;
```

---

## 进阶功能

### 1. 占位信息自定义

```tsx
import { Attachments } from '@ant-design/x';
import { CloudUploadOutlined } from '@ant-design/icons';

<Attachments
  placeholder={{
    icon: <CloudUploadOutlined />,
    title: '上传文件',
    description: '点击或拖拽文件到此区域上传，支持多种文件格式',
  }}
/>
```

### 2. 超出样式

```tsx
import { Attachments } from '@ant-design/x';

// 换行显示
<Attachments items={items} overflow="wrap" />

// 横向滚动
<Attachments items={items} overflow="scrollX" />

// 纵向滚动
<Attachments items={items} overflow="scrollY" />
```

### 3. 分类型选择文件

```tsx
import { Attachments } from '@ant-design/x';
import { Button } from 'antd';

const App = () => {
  const attachmentsRef = useRef(null);

  return (
    <>
      <Attachments
        ref={attachmentsRef}
        beforeUpload={() => false}
        items={items}
        onChange={({ fileList }) => setItems(fileList)}
      />
      
      <Button
        onClick={() => {
          attachmentsRef.current?.select({
            accept: 'image/*',
            multiple: true,
          });
        }}
      >
        选择图片
      </Button>
      
      <Button
        onClick={() => {
          attachmentsRef.current?.select({
            accept: '.pdf,.doc,.docx',
            multiple: true,
          });
        }}
      >
        选择文档
      </Button>
    </>
  );
};
```

### 4. 全屏拖拽区域

```tsx
import { Attachments, Sender } from '@ant-design/x';
import { CloudUploadOutlined } from '@ant-design/icons';
import { Flex, Switch } from 'antd';
import { useRef, useState } from 'react';

const App = () => {
  const [fullScreenDrop, setFullScreenDrop] = useState(false);
  const divRef = useRef(null);

  return (
    <Flex vertical gap="middle" align="flex-start" ref={divRef}>
      <Sender
        prefix={
          <Attachments
            beforeUpload={() => false}
            onChange={({ file }) => console.log(file.name)}
            getDropContainer={() => (fullScreenDrop ? document.body : divRef.current)}
            placeholder={{
              icon: <CloudUploadOutlined />,
              title: '拖拽文件到这里',
              description: '支持文件类型：图片、视频、音频、文档等',
            }}
          />
        }
      />

      <Switch
        checked={fullScreenDrop}
        onChange={setFullScreenDrop}
        checkedChildren="全屏拖拽"
        unCheckedChildren="局部拖拽"
      />
    </Flex>
  );
};
```

---

## API 参考

### AttachmentsProps

继承 antd [Upload](https://ant.design/components/upload) 属性。

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `classNames` | 自定义样式类名 | `Record<string, string>` | - |
| `disabled` | 是否禁用 | `boolean` | `false` |
| `maxCount` | 最大上传文件数量 | `number` | - |
| `getDropContainer` | 设置拖拽时，可以释放文件的区域 | `() => HTMLElement` | - |
| `items` | 附件列表，同 Upload `fileList` | `Attachment[]` | - |
| `overflow` | 文件列表超出时样式 | `wrap` \| `scrollX` \| `scrollY` | - |
| `placeholder` | 没有文件时的占位信息 | `PlaceholderType \| ((type: 'inline' \| 'drop') => PlaceholderType)` | - |
| `rootClassName` | 根节点的样式类名 | `string` | - |
| `styles` | 自定义样式对象 | `Record<string, React.CSSProperties>` | - |
| `imageProps` | 图片属性，同 antd Image 属性 | `ImageProps` | - |

### PlaceholderType

```typescript
interface PlaceholderType {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
}
```

### Attachment

```typescript
interface Attachment<T = any> extends UploadFile<T>, Omit<FileCardProps, 'size' | 'byte' | 'type'> {
  description?: React.ReactNode;
  cardType?: FileCardProps['type'];
}
```

### AttachmentsRef

| 属性 | 说明 | 类型 |
|------|------|------|
| `nativeElement` | 获取原生节点 | `HTMLElement` |
| `fileNativeElement` | 获取文件上传原生节点 | `HTMLElement` |
| `upload` | 手工调用上传文件 | `(file: File) => void` |
| `select` | 手工调用选择文件 | `(options: { accept?: string; multiple?: boolean; }) => void` |

---

## 主题变量 (Design Token)

可通过 `XProvider` 或 `ConfigProvider` 自定义主题：

```tsx
import { XProvider } from '@ant-design/x';

<XProvider
  theme={{
    components: {
      Attachments: {
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

### 1. 文件预览 URL 管理

```tsx
useEffect(() => {
  return () => {
    // 组件卸载时清理创建的对象 URL
    items.forEach((item) => {
      if (item.url?.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
    });
  };
}, []);
```

### 2. 文件类型限制

```tsx
<Attachments
  accept="image/png,image/jpeg"
  beforeUpload={(file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB!');
    }
    return isImage && isLt2M;
  }}
/>
```

### 3. 与 Bubble 结合展示附件

```tsx
import { Bubble, FileCard } from '@ant-design/x';

<Bubble
  content="我上传了一个文件"
  footer={
    <FileCard.List
      items={attachments.map((item) => ({
        name: item.name,
        byte: item.size,
        type: 'file',
      }))}
    />
  }
/>
```

---

## 相关资源

- [Ant Design X 官方文档](https://x.ant.design)
- [antd Upload](https://ant.design/components/upload)
