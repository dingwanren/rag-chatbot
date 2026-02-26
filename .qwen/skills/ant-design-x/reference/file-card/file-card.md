# FileCard 文件卡片 - Skill 参考文档

## 组件概述

**FileCard** 是 Ant Design X 中用于以卡片形式展示文件的组件，支持多种文件类型（文档、图片、音频、视频等）的展示。

**安装依赖：**
```bash
npm install @ant-design/x
```

**基本导入：**
```tsx
import { FileCard } from '@ant-design/x';

// 文件列表
import { FileCard } from '@ant-design/x';
<FileCard.List items={files} />
```

---

## 使用场景

### 1. 文件展示
在对话或输入时展示单个文件。

### 2. 文件列表
展示多个文件的列表。

### 3. 图片预览
支持图片文件的预览功能。

### 4. 音视频播放
支持音频和视频文件的播放。

### 5. 文件上传状态
展示文件上传进度、加载状态等。

---

## 基础用法

### 基本使用

```tsx
import { FileCard } from '@ant-design/x';
import { Flex } from 'antd';

const App = () => (
  <Flex vertical gap="middle">
    <FileCard name="excel-has-long-long-long-name.xlsx" byte={1024} />
    <FileCard name="word-file.docx" byte={1024} />
    <FileCard name="pdf-file.pdf" byte={1024} />
    <FileCard name="ppt-file.pptx" byte={1024} />
    <FileCard name="zip-file.zip" byte={1024} />
    <FileCard name="txt-file.txt" byte={1024} />
    <FileCard name="markdown-file.md" byte={1024} />
    <FileCard name="java-file.java" byte={1024} />
    <FileCard name="javascript-file.js" byte={1024} />
    <FileCard name="python-file.py" byte={1024} />
    <FileCard name="excel-file.xlsx" byte={1024} />
  </Flex>
);

export default App;
```

### 卡片大小

```tsx
import { FileCard } from '@ant-design/x';
import { Flex } from 'antd';

const App = () => (
  <Flex gap="middle">
    {/* 默认大小 */}
    <FileCard name="document.pdf" byte={2048} size="default" />
    
    {/* 小尺寸 */}
    <FileCard name="document.pdf" byte={2048} size="small" />
  </Flex>
);

export default App;
```

### 图片文件

```tsx
import { FileCard } from '@ant-design/x';
import { Flex } from 'antd';

const App = () => (
  <Flex gap="middle">
    <FileCard
      name="image.png"
      type="image"
      src="https://example.com/image.png"
      byte={102400}
    />
  </Flex>
);

export default App;
```

### 图片加载状态

```tsx
import { FileCard } from '@ant-design/x';

const App = () => (
  <FileCard
    name="loading-image.png"
    type="image"
    src="https://example.com/image.png"
    loading
  />
);

export default App;
```

### 音视频类型

```tsx
import { FileCard } from '@ant-design/x';
import { Flex } from 'antd';

const App = () => (
  <Flex gap="middle">
    {/* 音频文件 */}
    <FileCard
      name="audio.mp3"
      type="audio"
      src="https://example.com/audio.mp3"
      byte={5242880}
      audioProps={{
        controls: true,
        style: { width: '100%' },
      }}
    />

    {/* 视频文件 */}
    <FileCard
      name="video.mp4"
      type="video"
      src="https://example.com/video.mp4"
      byte={10485760}
      videoProps={{
        controls: true,
        style: { width: '100%' },
      }}
    />
  </Flex>
);

export default App;
```

### 使用遮罩

```tsx
import { FileCard } from '@ant-design/x';
import { Button } from 'antd';

const App = () => (
  <FileCard
    name="document.pdf"
    type="file"
    byte={1024}
    mask={
      <Button type="primary" size="small">
        预览
      </Button>
    }
  />
);

export default App;
```

### 自定义图标

```tsx
import { FileCard } from '@ant-design/x';
import { StarOutlined } from '@ant-design/icons';

const App = () => (
  <FileCard
    name="custom-file.txt"
    byte={512}
    icon={<StarOutlined />}
  />
);

export default App;
```

---

## 进阶功能

### 1. 文件列表

```tsx
import { FileCard } from '@ant-design/x';
import { Flex } from 'antd';

const files = [
  { name: 'file1.pdf', byte: 1024 },
  { name: 'file2.docx', byte: 2048 },
  { name: 'file3.xlsx', byte: 3072 },
  { name: 'file4.pptx', byte: 4096 },
];

const App = () => (
  <FileCard.List
    items={files}
    size="default"
    overflow="wrap"
  />
);

export default App;
```

### 2. 可删除的文件列表

```tsx
import { FileCard } from '@ant-design/x';
import { message } from 'antd';
import { useState } from 'react';

const App = () => {
  const [files, setFiles] = useState([
    { name: 'file1.pdf', byte: 1024 },
    { name: 'file2.docx', byte: 2048 },
    { name: 'file3.xlsx', byte: 3072 },
  ]);

  return (
    <FileCard.List
      items={files}
      removable
      onRemove={(item) => {
        setFiles(files.filter((f) => f.name !== item.name));
        message.success(`删除 ${item.name}`);
      }}
    />
  );
};

export default App;
```

### 3. 超出样式

```tsx
import { FileCard } from '@ant-design/x';

const files = Array.from({ length: 20 }, (_, i) => ({
  name: `file${i + 1}.pdf`,
  byte: 1024 * (i + 1),
}));

// 横向滚动
<FileCard.List items={files} overflow="scrollX" />

// 纵向滚动
<FileCard.List items={files} overflow="scrollY" />

// 换行显示
<FileCard.List items={files} overflow="wrap" />
```

### 4. 带扩展内容的列表

```tsx
import { FileCard } from '@ant-design/x';
import { Button } from 'antd';

const files = [
  { name: 'file1.pdf', byte: 1024 },
  { name: 'file2.docx', byte: 2048 },
];

const App = () => (
  <FileCard.List
    items={files}
    extension={
      <Button type="primary" size="small">
        查看全部
      </Button>
    }
  />
);

export default App;
```

### 5. 预设图标类型

```tsx
import { FileCard } from '@ant-design/x';
import { Flex } from 'antd';

const App = () => (
  <Flex vertical gap="middle">
    {/* 默认文件图标 */}
    <FileCard name="file.txt" byte={100} icon="default" />
    
    {/* Excel 文件图标 */}
    <FileCard name="data.xlsx" byte={100} icon="excel" />
    
    {/* 图片文件图标 */}
    <FileCard name="photo.png" byte={100} icon="image" />
    
    {/* Markdown 文件图标 */}
    <FileCard name="readme.md" byte={100} icon="markdown" />
    
    {/* PDF 文件图标 */}
    <FileCard name="doc.pdf" byte={100} icon="pdf" />
    
    {/* PPT 文件图标 */}
    <FileCard name="slides.pptx" byte={100} icon="ppt" />
    
    {/* Word 文件图标 */}
    <FileCard name="doc.docx" byte={100} icon="word" />
    
    {/* 压缩文件图标 */}
    <FileCard name="archive.zip" byte={100} icon="zip" />
    
    {/* 视频文件图标 */}
    <FileCard name="movie.mp4" byte={100} icon="video" />
    
    {/* 音频文件图标 */}
    <FileCard name="song.mp3" byte={100} icon="audio" />
    
    {/* Java 文件图标 */}
    <FileCard name="App.java" byte={100} icon="java" />
    
    {/* JavaScript 文件图标 */}
    <FileCard name="index.js" byte={100} icon="javascript" />
    
    {/* Python 文件图标 */}
    <FileCard name="script.py" byte={100} icon="python" />
  </Flex>
);

export default App;
```

---

## API 参考

### FileCardProps

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `name` | 文件名称 | `string` | - |
| `byte` | 文件大小（字节） | `number` | - |
| `size` | 卡片大小 | `small` \| `default` | `default` |
| `description` | 文件描述 | `React.ReactNode` | - |
| `loading` | 是否处于加载状态 | `boolean` | `false` |
| `type` | 文件类型 | `file` \| `image` \| `audio` \| `video` \| `string` | - |
| `src` | 图片或文件地址 | `string` | - |
| `mask` | 遮罩内容 | `React.ReactNode` | - |
| `icon` | 自定义图标 | `React.ReactNode \| PresetIcons` | - |
| `imageProps` | 图片属性，同 antd Image 属性 | `ImageProps` | - |
| `videoProps` | 视频属性配置 | `Partial<React.JSX.IntrinsicElements['video']>` | - |
| `audioProps` | 音频属性配置 | `Partial<React.JSX.IntrinsicElements['audio']>` | - |
| `spinProps` | 加载中属性 | `SpinProps & { showText?: boolean; icon?: React.ReactNode }` | - |
| `onClick` | 点击事件回调 | `() => void` | - |
| `styles` | 自定义样式 | `Record<string, React.CSSProperties>` | - |
| `classNames` | 自定义样式类名 | `Record<string, string>` | - |

### PresetIcons

预设图标类型：

```typescript
type PresetIcons =
  | 'default'      // 默认文件图标
  | 'excel'        // Excel 文件图标
  | 'image'        // 图片文件图标
  | 'markdown'     // Markdown 文件图标
  | 'pdf'          // PDF 文件图标
  | 'ppt'          // PowerPoint 文件图标
  | 'word'         // Word 文件图标
  | 'zip'          // 压缩文件图标
  | 'video'        // 视频文件图标
  | 'audio'        // 音频文件图标
  | 'java'         // Java 文件图标
  | 'javascript'   // JavaScript 文件图标
  | 'python';      // Python 文件图标
```

### FileCard.List

文件列表组件属性：

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `items` | 文件列表数据 | `FileCardProps[]` | - |
| `size` | 卡片大小 | `small` \| `default` | `default` |
| `removable` | 是否可删除 | `boolean \| ((item) => boolean)` | `false` |
| `onRemove` | 删除事件回调 | `(item: FileCardProps) => void` | - |
| `extension` | 扩展内容 | `React.ReactNode` | - |
| `overflow` | 超出展示方式 | `scrollX` \| `scrollY` \| `wrap` | `wrap` |
| `styles` | 自定义样式 | `Record<string, React.CSSProperties>` | - |
| `classNames` | 自定义样式类名 | `Record<string, string>` | - |

---

## 主题变量 (Design Token)

可通过 `XProvider` 自定义主题：

```tsx
import { XProvider } from '@ant-design/x';

<XProvider
  theme={{
    components: {
      FileCard: {
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

### 1. 文件大小格式化

```tsx
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

<FileCard name="file.pdf" byte={1048576} description={formatFileSize(1048576)} />
// 显示：1 MB
```

### 2. 与 Attachments 配合

```tsx
import { Attachments, FileCard } from '@ant-design/x';

const App = () => {
  const [items, setItems] = useState([]);

  return (
    <>
      <Attachments
        items={items}
        onChange={({ fileList }) => setItems(fileList)}
        placeholder={{ title: '上传文件' }}
      />
      
      {items.length > 0 && (
        <FileCard.List
          items={items.map((item) => ({
            name: item.name,
            byte: item.size,
            type: item.type?.startsWith('image/') ? 'image' : 'file',
            src: item.url,
          }))}
          removable
          onRemove={(item) => {
            setItems(items.filter((f) => f.name !== item.name));
          }}
        />
      )}
    </>
  );
};
```

### 3. 与 Bubble 配合展示附件

```tsx
import { Bubble, FileCard } from '@ant-design/x';

const attachments = [
  { name: 'doc1.pdf', size: 1024 },
  { name: 'doc2.docx', size: 2048 },
];

<Bubble
  content="我发送了两个文件"
  footer={
    <FileCard.List
      items={attachments}
      size="small"
      overflow="scrollX"
    />
  }
/>
```

### 4. 图片预览配置

```tsx
<FileCard
  name="photo.png"
  type="image"
  src="https://example.com/photo.png"
  imageProps={{
    preview: {
      mask: '预览',
      toolbarRender: () => '自定义工具栏',
    },
  }}
/>
```

---

## 相关资源

- [Ant Design X 官方文档](https://x.ant.design)
- [antd Image](https://ant.design/components/image)
