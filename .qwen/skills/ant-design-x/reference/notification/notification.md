# Notification 系统通知 - Skill 参考文档

## 组件概述

**Notification** (XNotification) 是 Ant Design X 中用于系统级别发送在页面外部显示的通知组件，基于浏览器原生 Notification API 实现。

**安装依赖：**
```bash
npm install @ant-design/x
```

**基本导入：**
```tsx
import { XNotification, useNotification } from '@ant-design/x';
```

---

## 使用场景

### 1. 任务进度通知
在智能体执行复杂任务时，推送系统应用级别通知，使用户随时掌握任务进展。

### 2. 消息提醒
发送重要消息提醒，即使用户切换到其他标签页也能收到通知。

### 3. 长时间任务完成通知
当后台任务完成时，通知用户返回查看结果。

---

## 基础用法

### Hooks 调用

```tsx
import { useNotification } from '@ant-design/x';
import { Button, Flex } from 'antd';

const App = () => {
  const [{ permission }, { open, close, requestPermission }] = useNotification();

  const handleOpen = () => {
    open({
      openConfig: {
        title: '通知标题',
        body: '这是通知内容',
        icon: 'https://example.com/icon.png',
        duration: 5000, // 5 秒后自动关闭
        onClick: () => {
          console.log('通知被点击');
        },
        onClose: () => {
          console.log('通知已关闭');
        },
      },
    });
  };

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    console.log('权限状态:', result);
  };

  return (
    <Flex gap="middle">
      <Button onClick={handleRequestPermission}>
        请求通知权限 (当前：{permission})
      </Button>
      <Button type="primary" onClick={handleOpen}>
        打开通知
      </Button>
    </Flex>
  );
};

export default App;
```

### 自动关闭延迟

```tsx
import { useNotification } from '@ant-design/x';
import { Button } from 'antd';

const App = () => {
  const [{}, { open }] = useNotification();

  return (
    <Button
      onClick={() => {
        open({
          openConfig: {
            title: '持久通知',
            body: '这个通知会在 10 秒后自动关闭',
            duration: 10000, // 10 秒
          },
        });
      }}
    >
      发送通知
    </Button>
  );
};

export default App;
```

### 关闭指定通知

```tsx
import { useNotification } from '@ant-design/x';
import { Button, Flex } from 'antd';

const App = () => {
  const [{}, { open, close }] = useNotification();

  return (
    <Flex gap="middle">
      <Button
        onClick={() => {
          open({
            openConfig: {
              title: '通知 1',
              body: '这是第一个通知',
              tag: 'notification-1',
            },
          });
        }}
      >
        发送通知 1
      </Button>
      <Button
        onClick={() => {
          open({
            openConfig: {
              title: '通知 2',
              body: '这是第二个通知',
              tag: 'notification-2',
            },
          });
        }}
      >
        发送通知 2
      </Button>
      <Button
        danger
        onClick={() => {
          // 关闭指定标签的通知
          close(['notification-1']);
        }}
      >
        关闭通知 1
      </Button>
      <Button
        danger
        onClick={() => {
          // 关闭所有通知
          close();
        }}
      >
        关闭所有通知
      </Button>
    </Flex>
  );
};

export default App;
```

### 静态方法调用

```tsx
import { XNotification } from '@ant-design/x';
import { Button } from 'antd';

// 注意：使用前需要确保已获取通知权限
const App = () => (
  <Button
    onClick={async () => {
      // 请求权限
      const permission = await XNotification.requestPermission();
      
      if (permission === 'granted') {
        // 发送通知
        XNotification.open({
          openConfig: {
            title: '静态方法通知',
            body: '通过 XNotification 静态方法发送',
          },
        });
      } else {
        console.log('通知权限被拒绝');
      }
    }}
  >
    发送通知
  </Button>
);

export default App;
```

---

## 进阶功能

### 1. 完整通知示例（带所有回调）

```tsx
import { useNotification } from '@ant-design/x';
import { Button } from 'antd';

const App = () => {
  const [{}, { open }] = useNotification();

  const sendNotification = () => {
    open({
      openConfig: {
        title: '任务完成',
        body: '您的 AI 任务已成功完成！',
        icon: 'https://example.com/success-icon.png',
        badge: 'https://example.com/badge.png',
        lang: 'zh-CN',
        dir: 'ltr',
        requireInteraction: false,
        silent: false,
        tag: 'task-complete',
        data: { taskId: '12345', type: 'completion' },
        
        // 事件回调
        onShow: (event) => {
          console.log('通知已显示', event);
        },
        onClick: (event, closeFn) => {
          console.log('通知被点击', event);
          // 可以选择关闭通知
          closeFn?.();
          // 或者跳转到相关页面
          window.focus();
        },
        onClose: (event) => {
          console.log('通知已关闭', event);
        },
        onError: (event) => {
          console.error('通知出错', event);
        },
        
        // 自动关闭时间（毫秒）
        duration: 5000,
      },
    });
  };

  return <Button onClick={sendNotification}>发送任务完成通知</Button>;
};

export default App;
```

### 2. 权限检查与请求

```tsx
import { useNotification } from '@ant-design/x';
import { Button, Result, Spin } from 'antd';
import { useEffect, useState } from 'react';

const App = () => {
  const [{ permission }, { requestPermission }] = useNotification();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // 检查权限状态
    if (Notification.permission !== 'default') {
      setChecking(false);
    }
  }, []);

  if (checking) {
    return <Spin tip="检查权限..." />;
  }

  if (permission === 'granted') {
    return (
      <Result
        status="success"
        title="通知权限已授予"
        extra={
          <Button type="primary" onClick={() => {
            // 发送测试通知
          }}>
            发送测试通知
          </Button>
        }
      />
    );
  }

  if (permission === 'denied') {
    return (
      <Result
        status="error"
        title="通知权限被拒绝"
        subTitle="请在浏览器设置中允许通知权限"
      />
    );
  }

  return (
    <Result
      status="warning"
      title="需要通知权限"
      subTitle="允许通知后，您将收到任务完成等系统通知"
      extra={
        <Button type="primary" onClick={requestPermission}>
          请求权限
        </Button>
      }
    />
  );
};

export default App;
```

### 3. 任务进度通知

```tsx
import { useNotification } from '@ant-design/x';
import { Progress } from 'antd';
import { useEffect } from 'react';

const TaskProgress = ({ taskId, onComplete }) => {
  const [{}, { open }] = useNotification();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 10;
        
        if (next >= 100) {
          clearInterval(timer);
          // 发送完成通知
          open({
            openConfig: {
              title: '任务完成',
              body: `任务 ${taskId} 已完成！`,
              tag: `task-${taskId}`,
              duration: 5000,
            },
          });
          onComplete?.();
          return 100;
        }
        
        // 更新进行中的通知
        if (next % 25 === 0) {
          open({
            openConfig: {
              title: '任务进行中',
              body: `任务 ${taskId} 进度：${next}%`,
              tag: `task-${taskId}`,
              duration: 0, // 不自动关闭
            },
          });
        }
        
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return <Progress percent={progress} />;
};
```

---

## API 参考

### XNotification

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `permission` | 表明当前用户是否授予当前来源显示 web 通知的权限 | `NotificationPermission` | - |
| `requestPermission` | 向用户为当前来源请求显示通知的权限 | `() => Promise<NotificationPermission>` | - |
| `open` | 向用户推送一个通知 | `(config: XNotificationOpenArgs) => void` | - |
| `close` | 关闭已推送的通知 | `(config?: string[]) => void` | - |

### NotificationPermission

```typescript
type NotificationPermission =
  | 'granted'   // 用户已明确授予当前源显示系统通知的权限
  | 'denied'    // 用户已明确拒绝当前源显示系统通知的权限
  | 'default';  // 用户决定未知；这种情况下应用程序的行为就像权限被"拒绝"一样
```

### XNotificationOpenArgs

```typescript
type XNotificationOpenArgs = {
  openConfig: NotificationOptions & {
    title: string;
    onClick?: (event: Event, close?: () => void) => void;
    onClose?: (event: Event) => void;
    onError?: (event: Event) => void;
    onShow?: (event: Event) => void;
    duration?: number;
  };
  closeConfig: NotificationOptions['tag'][];
};
```

### NotificationOptions

```typescript
interface NotificationOptions {
  badge?: string;           // 徽章图标 URL
  body?: string;            // 通知正文内容
  data?: any;               // 自定义数据
  dir?: NotificationDirection; // 文本方向
  icon?: string;            // 图标 URL
  lang?: string;            // 语言
  requireInteraction?: boolean; // 是否需要用户交互
  silent?: boolean | null;  // 是否静音
  tag?: string;             // 标签，用于替换/关闭通知
}
```

### useNotification

```typescript
type useNotification = [
  { permission: NotificationPermission },
  {
    open: (config: XNotificationOpenArgs) => void;
    close: (tags?: string[]) => void;
    requestPermission: () => Promise<NotificationPermission>;
  },
];
```

---

## 注意事项

### 1. 权限限制

- **Notification 为系统通知，需要确保设备开启了对应浏览器应用的通知权限**
- 即使获取了当前来源 origin 显示系统通知的权限，如果浏览器应用的通知权限被关闭，通知也无法展示
- `onShow` 回调触发仅代表通知已发送，不代表一定能展示

### 2. 浏览器兼容性

- XNotification 由扩展 `window.Notification` 实现，如果浏览器环境不支持 Notification，调用将无任何效果
- 通知样式与效果以当前浏览器环境对 Notification 的支持为准
- `dir` 属性会被大部分浏览器忽略

### 3. 实例管理

- XNotification 仅对当前实例下的通知进行关闭管理
- 实例变更后（如浏览器页面刷新）对已发送的通知无管理关闭能力

---

## 系统权限设置

### Windows 通知设置

路径："开始"菜单 > "设置" > "系统" > "通知和操作"

可以对全局通知以及应用通知等进行操作。

### Mac 通知设置

路径："苹果"菜单 > "系统设置" > "通知"

可以设置勿扰时段，控制通知在通知中心的显示方式。

---

## 主题变量 (Design Token)

Notification 使用浏览器原生通知，不支持主题自定义。

---

## 最佳实践

### 1. 权限检查封装

```tsx
import { useNotification } from '@ant-design/x';

const useNotificationWithPermission = () => {
  const [{ permission }, { open, requestPermission }] = useNotification();

  const sendNotification = async (config) => {
    if (permission !== 'granted') {
      const result = await requestPermission();
      if (result !== 'granted') {
        console.warn('通知权限未授予');
        return false;
      }
    }
    open(config);
    return true;
  };

  return { sendNotification, permission };
};
```

### 2. 通知队列管理

```tsx
import { useNotification } from '@ant-design/x';
import { useRef } from 'react';

const useNotificationQueue = () => {
  const [{}, { open }] = useNotification();
  const queueRef = useRef([]);
  const isProcessingRef = useRef(false);

  const addToQueue = (config) => {
    queueRef.current.push(config);
    processQueue();
  };

  const processQueue = async () => {
    if (isProcessingRef.current || queueRef.current.length === 0) return;
    
    isProcessingRef.current = true;
    
    while (queueRef.current.length > 0) {
      const config = queueRef.current.shift();
      open(config);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    isProcessingRef.current = false;
  };

  return { addToQueue };
};
```

### 3. 与 AI 任务集成

```tsx
import { useNotification } from '@ant-design/x';

const useAITaskNotification = () => {
  const [{}, { open }] = useNotification();

  const notifyTaskStart = (taskName) => {
    open({
      openConfig: {
        title: '任务开始',
        body: `开始执行：${taskName}`,
        tag: `task-${Date.now()}`,
        duration: 3000,
      },
    });
  };

  const notifyTaskComplete = (taskName, result) => {
    open({
      openConfig: {
        title: '任务完成',
        body: `${taskName} 已完成`,
        tag: `task-${Date.now()}`,
        duration: 5000,
        data: { result },
      },
    });
  };

  const notifyTaskError = (taskName, error) => {
    open({
      openConfig: {
        title: '任务失败',
        body: `${taskName} 执行失败：${error.message}`,
        tag: `task-${Date.now()}`,
        duration: 8000,
      },
    });
  };

  return { notifyTaskStart, notifyTaskComplete, notifyTaskError };
};
```

---

## FAQ

### 已经获取了当前来源 origin 显示系统通知的权限，onShow 回调也触发了，为何还是无法展示推送的通知？

`Notification` 为系统通知，需要确保设备开启了对应浏览器应用的通知权限。即使网页获得了通知权限，如果用户在系统设置中关闭了浏览器的通知权限，通知也不会显示。

---

## 相关资源

- [Ant Design X 官方文档](https://x.ant.design)
- [MDN Notification API](https://developer.mozilla.org/zh-CN/docs/Web/API/Notification)
