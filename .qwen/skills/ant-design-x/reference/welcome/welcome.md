# Welcome 欢迎 - Skill 参考文档

## 组件概述

**Welcome** 是 Ant Design X 中用于清晰传达给用户可实现的意图范围和预期功能的欢迎推荐组件。

**安装依赖：**
```bash
npm install @ant-design/x
```

**基本导入：**
```tsx
import { Welcome } from '@ant-design/x';
```

---

## 使用场景

### 1. 新手引导
欢迎新用户，介绍产品功能。

### 2. 能力展示
展示 AI 助手可以执行的任务类型。

### 3. 空状态推荐
在对话开始前提供推荐操作。

### 4. 背景定制
根据品牌风格定制欢迎界面。

---

## 基础用法

### 基本使用

```tsx
import { Welcome } from '@ant-design/x';
import { BulbOutlined } from '@ant-design/icons';

const App = () => (
  <Welcome
    icon={<BulbOutlined />}
    title="你好，我是你的 AI 助手"
    description="我可以帮助你写作、编程、分析问题、创建图片等"
  />
);

export default App;
```

### 变体类型

```tsx
import { Welcome } from '@ant-design/x';
import { BulbOutlined } from '@ant-design/icons';

// filled (默认) - 填充样式
<Welcome
  icon={<BulbOutlined />}
  title="填充样式"
  description="这是默认的填充背景样式"
  variant="filled"
/>

// borderless - 无边框样式
<Welcome
  icon={<BulbOutlined />}
  title="无边框样式"
  description="没有背景边框的简洁样式"
  variant="borderless"
/>
```

### 背景定制

```tsx
import { Welcome } from '@ant-design/x';
import { BulbOutlined } from '@ant-design/icons';

const App = () => (
  <Welcome
    icon={<BulbOutlined />}
    title="自定义背景"
    description="可以自定义颜色、渐变等背景样式"
    styles={{
      root: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
      },
      title: {
        color: 'white',
      },
      description: {
        color: 'rgba(255, 255, 255, 0.9)',
      },
    }}
  />
);

export default App;
```

---

## 进阶功能

### 1. 带额外操作

```tsx
import { Welcome } from '@ant-design/x';
import { BulbOutlined } from '@ant-design/icons';
import { Button } from 'antd';

const App = () => (
  <Welcome
    icon={<BulbOutlined />}
    title="欢迎使用 AI 助手"
    description="开始你的第一次对话吧"
    extra={
      <>
        <Button type="primary">开始对话</Button>
        <Button>查看示例</Button>
      </>
    }
  />
);

export default App;
```

### 2. 与 Prompts 配合

```tsx
import { Welcome, Prompts } from '@ant-design/x';
import { BulbOutlined, EditOutlined, CodeOutlined } from '@ant-design/icons';
import { Flex } from 'antd';

const App = () => (
  <Flex vertical gap="large" style={{ padding: 40 }}>
    <Welcome
      icon={<BulbOutlined />}
      title="你好，我是你的 AI 助手"
      description="我可以帮助你完成各种任务"
    />

    <Prompts
      items={[
        {
          key: '1',
          icon: <EditOutlined />,
          label: '帮我写作',
          description: '文章、邮件、报告等',
        },
        {
          key: '2',
          icon: <CodeOutlined />,
          label: '帮我编程',
          description: '代码生成、解释、调试',
        },
        {
          key: '3',
          label: '分析问题',
          description: '数据分析、逻辑推理',
        },
        {
          key: '4',
          label: '创建图片',
          description: 'AI 绘画、设计',
        },
      ]}
      wrap
    />
  </Flex>
);

export default App;
```

### 3. 与 Bubble 配合

```tsx
import { Welcome, Bubble } from '@ant-design/x';
import { BulbOutlined } from '@ant-design/icons';
import { Flex } from 'antd';

const App = () => (
  <Flex vertical gap="large" style={{ padding: 20 }}>
    <Welcome
      icon={<BulbOutlined />}
      title="欢迎"
      description="有什么可以帮你的吗？"
    />

    <Bubble.List
      items={[
        {
          key: '1',
          role: 'ai',
          content: '你好！我是 AI 助手，可以帮你写作、编程、分析问题等。',
        },
      ]}
      style={{ height: 300 }}
    />
  </Flex>
);

export default App;
```

### 4. 自定义样式类名

```tsx
import { Welcome } from '@ant-design/x';
import { SmileOutlined } from '@ant-design/icons';

const App = () => (
  <Welcome
    icon={<SmileOutlined />}
    title="欢迎回来"
    description="今天有什么可以帮你的吗？"
    classNames={{
      root: 'custom-welcome',
      icon: 'custom-icon',
      title: 'custom-title',
      description: 'custom-description',
      extra: 'custom-extra',
    }}
    styles={{
      root: {
        maxWidth: 600,
        margin: '0 auto',
      },
    }}
  />
);

export default App;
```

### 5. 多语言欢迎

```tsx
import { Welcome } from '@ant-design/x';
import { BulbOutlined } from '@ant-design/icons';

const messages = {
  zh: {
    title: '你好，我是你的 AI 助手',
    description: '我可以帮助你写作、编程、分析问题等',
  },
  en: {
    title: 'Hello, I\'m your AI Assistant',
    description: 'I can help you with writing, coding, analysis, and more',
  },
  ja: {
    title: 'こんにちは、AI アシスタントです',
    description: '執筆、コーディング、分析などをお手伝いします',
  },
};

const App = ({ lang = 'zh' }) => {
  const msg = messages[lang];

  return (
    <Welcome
      icon={<BulbOutlined />}
      title={msg.title}
      description={msg.description}
    />
  );
};

export default App;
```

---

## API 参考

### WelcomeProps

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `classNames` | 自定义样式类名 | `Record<'icon' \| 'title' \| 'description' \| 'extra', string>` | - |
| `description` | 显示在提示列表中的描述 | `React.ReactNode` | - |
| `extra` | 显示在提示列表末尾的额外操作 | `React.ReactNode` | - |
| `icon` | 显示在提示列表前侧的图标 | `React.ReactNode` | - |
| `rootClassName` | 根节点的样式类名 | `string` | - |
| `styles` | 自定义样式 | `Record<'icon' \| 'title' \| 'description' \| 'extra', React.CSSProperties>` | - |
| `title` | 显示在提示列表顶部的标题 | `React.ReactNode` | - |
| `variant` | 变体类型 | `filled` \| `borderless` | `filled` |

### Semantic DOM

```typescript
type SemanticType = 'icon' | 'title' | 'description' | 'extra';
```

---

## 主题变量 (Design Token)

可通过 `XProvider` 自定义主题：

```tsx
import { XProvider } from '@ant-design/x';

<XProvider
  theme={{
    components: {
      Welcome: {
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

### 1. 完整的新手引导页面

```tsx
import { Welcome, Prompts } from '@ant-design/x';
import { BulbOutlined, EditOutlined, CodeOutlined, PictureOutlined } from '@ant-design/icons';
import { Flex, Divider } from 'antd';

const OnboardingPage = () => (
  <Flex
    vertical
    align="center"
    style={{ padding: '60px 20px', maxWidth: 800, margin: '0 auto' }}
    gap="large"
  >
    <Welcome
      icon={<BulbOutlined style={{ fontSize: 64, color: '#1890ff' }} />}
      title="欢迎使用 AI 助手"
      description="你的智能创作伙伴，帮助你高效完成各种任务"
    />

    <Divider orientation="center">我可以帮你</Divider>

    <Prompts
      items={[
        {
          key: 'write',
          icon: <EditOutlined />,
          label: '写作助手',
          description: '文章、邮件、报告、创意写作',
        },
        {
          key: 'code',
          icon: <CodeOutlined />,
          label: '编程助手',
          description: '代码生成、解释、调试、优化',
        },
        {
          key: 'image',
          icon: <PictureOutlined />,
          label: '图像创作',
          description: 'AI 绘画、设计、图像处理',
        },
        {
          key: 'analysis',
          label: '数据分析',
          description: '数据解读、图表生成、趋势分析',
        },
      ]}
      wrap
      styles={{
        item: {
          flex: '0 0 calc(25% - 16px)',
          maxWidth: 'calc(25% - 16px)',
        },
      }}
    />
  </Flex>
);

export default OnboardingPage;
```

### 2. 空状态欢迎

```tsx
import { Welcome, Sender } from '@ant-design/x';
import { BulbOutlined } from '@ant-design/icons';
import { Flex, Empty } from 'antd';

const ChatEmptyState = () => (
  <Flex
    vertical
    align="center"
    justify="center"
    style={{ height: '100%', padding: 40 }}
    gap="large"
  >
    <Welcome
      icon={<BulbOutlined style={{ fontSize: 48 }} />}
      title="开始新对话"
      description="输入你的问题，我来帮你解答"
      variant="borderless"
    />
    <Sender
      placeholder="输入你想了解的内容..."
      style={{ width: '100%', maxWidth: 600 }}
    />
  </Flex>
);

export default ChatEmptyState;
```

### 3. 品牌化欢迎

```tsx
import { Welcome } from '@ant-design/x';

const BrandedWelcome = () => (
  <Welcome
    icon={
      <img
        src="https://example.com/logo.svg"
        alt="Logo"
        style={{ width: 64, height: 64 }}
      />
    }
    title="欢迎使用我们的产品"
    description="探索无限可能，创造美好未来"
    styles={{
      root: {
        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
        color: 'white',
        borderRadius: 16,
        padding: 40,
      },
      title: {
        fontSize: 24,
        fontWeight: 600,
        color: 'white',
      },
      description: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
      },
    }}
  />
);

export default BrandedWelcome;
```

### 4. 响应式欢迎

```tsx
import { Welcome } from '@ant-design/x';
import { useResponsive } from 'ahooks';

const ResponsiveWelcome = () => {
  const { xs, sm, md, lg } = useResponsive();

  const getStyles = () => {
    if (xs) {
      return { padding: 20 };
    } else if (sm) {
      return { padding: 30 };
    } else if (md) {
      return { padding: 40 };
    }
    return { padding: 60 };
  };

  return (
    <Welcome
      icon={<span style={{ fontSize: '48px' }}>👋</span>}
      title="欢迎"
      description="开始你的探索之旅"
      styles={{
        root: getStyles(),
      }}
    />
  );
};

export default ResponsiveWelcome;
```

### 5. 带快捷操作的欢迎

```tsx
import { Welcome } from '@ant-design/x';
import { BulbOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';

const WelcomeWithActions = () => (
  <Welcome
    icon={<BulbOutlined />}
    title="欢迎使用"
    description="选择以下方式开始"
    extra={
      <Space>
        <Button type="primary">新建对话</Button>
        <Button>查看历史</Button>
        <Button>使用指南</Button>
      </Space>
    }
  />
);

export default WelcomeWithActions;
```

---

## 相关资源

- [Ant Design X 官方文档](https://x.ant.design)
- [Prompts 组件](../prompts/)
- [Bubble 组件](../bubble/)
- [Sender 组件](../sender/)
