# XProvider 全局化配置 - Skill 参考文档

## 组件概述

**XProvider** 是 Ant Design X 的全局化配置组件，继承了 antd 的 ConfigProvider，为 @ant-design/x 中的所有组件提供统一的全局化配置，包括国际化、主题、组件配置等。

**安装依赖：**
```bash
npm install @ant-design/x antd
```

**基本导入：**
```tsx
import { XProvider } from '@ant-design/x';
```

---

## 使用场景

### 1. 国际化配置
为应用提供多语言支持。

### 2. 主题定制
统一配置应用的主题样式。

### 3. 组件全局配置
为所有 X 组件设置默认配置。

### 4. 快捷键配置
全局配置快捷键行为。

---

## 基础用法

### 基本使用

```tsx
import { XProvider } from '@ant-design/x';
import zhCN from 'antd/locale/zh_CN';
import zhCN_X from '@ant-design/x/locale/zh_CN';

const App = () => (
  <XProvider locale={{ ...zhCN_X, ...zhCN }}>
    <YourApp />
  </XProvider>
);

export default App;
```

### 主题配置

```tsx
import { XProvider } from '@ant-design/x';

const App = () => (
  <XProvider
    theme={{
      token: {
        colorPrimary: '#1890ff',
        borderRadius: 6,
      },
      components: {
        Bubble: {
          // Bubble 组件主题配置
        },
        Sender: {
          // Sender 组件主题配置
        },
      },
    }}
  >
    <YourApp />
  </XProvider>
);

export default App;
```

### 方向配置

```tsx
import { XProvider } from '@ant-design/x';

// 从左到右（默认）
<XProvider direction="ltr">
  <YourApp />
</XProvider>

// 从右到左
<XProvider direction="rtl">
  <YourApp />
</XProvider>
```

---

## 进阶功能

### 1. 完整国际化配置

```tsx
import { XProvider } from '@ant-design/x';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import zhCN_X from '@ant-design/x/locale/zh_CN';
import enUS_X from '@ant-design/x/locale/en_US';
import { useState } from 'react';

const App = () => {
  const [lang, setLang] = useState('zh');

  const locale = lang === 'zh' 
    ? { ...zhCN_X, ...zhCN }
    : { ...enUS_X, ...enUS };

  return (
    <XProvider locale={locale}>
      <YourApp />
    </XProvider>
  );
};

export default App;
```

### 2. 组件全局配置

```tsx
import { XProvider } from '@ant-design/x';

const App = () => (
  <XProvider
    bubble={{
      style: { maxWidth: 600 },
      classNames: { root: 'custom-bubble' },
    }}
    sender={{
      style: { marginBottom: 16 },
      placeholder: '输入消息...',
    }}
    conversations={{
      style: { width: 256 },
    }}
    prompts={{
      wrap: true,
    }}
    thoughtChain={{
      line: 'dashed',
    }}
    suggestion={{
      block: true,
    }}
    actions={{
      variant: 'outlined',
    }}
  >
    <YourApp />
  </XProvider>
);

export default App;
```

### 3. 快捷键全局配置

```tsx
import { XProvider } from '@ant-design/x';

const App = () => (
  <XProvider
    conversations={{
      shortcutKeys: {
        // Ctrl+1, Ctrl+2, Ctrl+3 切换会话
        items: ['Control', '1'],
        // Ctrl+N 创建新会话
        creation: ['Control', 'N'],
      },
    }}
  >
    <YourApp />
  </XProvider>
);

export default App;
```

### 4. 与 antd ConfigProvider 合并使用

```tsx
import { XProvider } from '@ant-design/x';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import zhCN_X from '@ant-design/x/locale/zh_CN';

const App = () => (
  <ConfigProvider
    locale={zhCN}
    theme={{
      algorithm: theme.darkAlgorithm,
      token: {
        colorPrimary: '#1890ff',
      },
    }}
  >
    <XProvider
      locale={zhCN_X}
      theme={{
        components: {
          Bubble: {
            // 自定义 Bubble 主题变量
          },
        },
      }}
    >
      <YourApp />
    </XProvider>
  </ConfigProvider>
);

export default App;
```

### 5. 动态主题切换

```tsx
import { XProvider } from '@ant-design/x';
import { Switch, theme } from 'antd';
import { useState } from 'react';

const App = () => {
  const [isDark, setIsDark] = useState(false);

  return (
    <>
      <Switch
        checked={isDark}
        onChange={setIsDark}
        checkedChildren="暗色"
        unCheckedChildren="亮色"
      />
      <XProvider
        theme={{
          algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: isDark ? '#177ddc' : '#1890ff',
          },
          components: {
            Bubble: {
              contentColor: isDark ? '#fff' : '#000',
            },
          },
        }}
      >
        <YourApp />
      </XProvider>
    </>
  );
};

export default App;
```

---

## API 参考

XProvider 完全继承 antd 的 ConfigProvider，属性参考：[Antd ConfigProvider](https://ant-design.antgroup.com/components/config-provider-cn#api)

### 组件配置

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `bubble` | 气泡组件的全局配置 | `{ style, styles, className, classNames }` | - |
| `conversations` | 会话组件的全局配置 | `{ style, styles, className, classNames, shortcutKeys }` | - |
| `prompts` | 提示集组件的全局配置 | `{ style, styles, className, classNames }` | - |
| `sender` | 输入框组件的全局配置 | `{ style, styles, className, classNames }` | - |
| `suggestion` | 建议组件的全局配置 | `{ style, className }` | - |
| `thoughtChain` | 思维链组件的全局配置 | `{ style, styles, className, classNames }` | - |
| `actions` | 操作列表组件的全局配置 | `{ style, className }` | - |

### ShortcutKeys

```typescript
type SignKeysType = {
  Ctrl: keyof KeyboardEvent;
  Alt: keyof KeyboardEvent;
  Meta: keyof KeyboardEvent;
  Shift: keyof KeyboardEvent;
};

type ShortcutKeys<CustomKey = number | 'number'> =
  | ['Ctrl' | 'Alt' | 'Meta' | 'Shift', 'Ctrl' | 'Alt' | 'Meta' | 'Shift', CustomKey]
  | ['Ctrl' | 'Alt' | 'Meta' | 'Shift', CustomKey];
```

### 国际化

如果项目使用了 antd，需要将 antd 的 locale 合并传入 XProvider：

```typescript
import { XProvider } from '@ant-design/x';
import zhCN from 'antd/locale/zh_CN';
import zhCN_X from '@ant-design/x/locale/zh_CN';

<XProvider locale={{ ...zhCN_X, ...zhCN }}>
  <App />
</XProvider>
```

---

## 支持的 Locale

@ant-design/x 提供以下语言包：

- `zh_CN` - 简体中文
- `en_US` - 英语
- `ja_JP` - 日语
- `ko_KR` - 韩语
- 更多语言包请参考官方文档

```tsx
import zhCN from '@ant-design/x/locale/zh_CN';
import enUS from '@ant-design/x/locale/en_US';
import jaJP from '@ant-design/x/locale/ja_JP';
import koKR from '@ant-design/x/locale/ko_KR';
```

---

## 最佳实践

### 1. 应用根组件配置

```tsx
// App.tsx
import { XProvider } from '@ant-design/x';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import zhCN_X from '@ant-design/x/locale/zh_CN';

const App = () => (
  <ConfigProvider locale={zhCN}>
    <XProvider
      locale={zhCN_X}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
      bubble={{
        style: { maxWidth: 600 },
      }}
      sender={{
        placeholder: '输入消息...',
      }}
    >
      <Routes />
    </XProvider>
  </ConfigProvider>
);

export default App;
```

### 2. 多语言切换

```tsx
import { XProvider } from '@ant-design/x';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import zhCN_X from '@ant-design/x/locale/zh_CN';
import enUS_X from '@ant-design/x/locale/en_US';
import { createContext, useContext, useState } from 'react';

const LocaleContext = createContext(null);

export const useLocale = () => useContext(LocaleContext);

const LocaleProvider = ({ children }) => {
  const [locale, setLocale] = useState('zh');

  const locales = {
    zh: { antd: zhCN, x: zhCN_X },
    en: { antd: enUS, x: enUS_X },
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <ConfigProvider locale={locales[locale].antd}>
        <XProvider locale={locales[locale].x}>
          {children}
        </XProvider>
      </ConfigProvider>
    </LocaleContext.Provider>
  );
};

// 使用
const App = () => {
  const { locale, setLocale } = useLocale();
  
  return (
    <Select value={locale} onChange={setLocale}>
      <Select.Option value="zh">中文</Select.Option>
      <Select.Option value="en">English</Select.Option>
    </Select>
  );
};
```

### 3. 主题预设

```tsx
import { XProvider } from '@ant-design/x';
import { theme } from 'antd';

const themePresets = {
  default: {
    algorithm: theme.defaultAlgorithm,
    token: { colorPrimary: '#1890ff' },
  },
  dark: {
    algorithm: theme.darkAlgorithm,
    token: { colorPrimary: '#177ddc' },
  },
  compact: {
    algorithm: theme.compactAlgorithm,
    token: { borderRadius: 4 },
  },
};

const App = ({ themeName = 'default' }) => (
  <XProvider theme={themePresets[themeName]}>
    <YourApp />
  </XProvider>
);
```

### 4. 组件配置继承

```tsx
import { XProvider, Bubble, Sender } from '@ant-design/x';

// 全局配置
<XProvider
  bubble={{
    style: { maxWidth: 500 },
    classNames: { root: 'global-bubble' },
  }}
  sender={{
    placeholder: '全局默认占位符',
  }}
>
  {/* 局部覆盖 */}
  <Bubble content="继承全局配置" />
  
  <Sender />
  
  {/* 局部覆盖全局配置 */}
  <Sender placeholder="自定义占位符" />
</XProvider>
```

### 5. 运行时主题更新

```tsx
import { XProvider } from '@ant-design/x';
import { theme } from 'antd';
import { useEffect, useState } from 'react';

const App = () => {
  const [systemDark, setSystemDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <XProvider
      theme={{
        algorithm: systemDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <YourApp />
    </XProvider>
  );
};

export default App;
```

---

## 注意事项

### 1. XProvider 与 ConfigProvider 的关系

XProvider 继承了 antd 的 ConfigProvider，如果你已经使用了 ConfigProvider，需要做如下变更：

```diff
- import { ConfigProvider } from 'antd';
+ import { XProvider } from '@ant-design/x';

const App = () => (
-  <ConfigProvider>
+  <XProvider>
     <YourApp />
-  </ConfigProvider>
+  </XProvider>
);
```

### 2. Locale 合并

如果你的项目同时使用了 antd 和 @ant-design/x，需要合并两个 locale：

```tsx
import { XProvider } from '@ant-design/x';
import zhCN from 'antd/locale/zh_CN';
import zhCN_X from '@ant-design/x/locale/zh_CN';

// 正确做法
<XProvider locale={{ ...zhCN_X, ...zhCN }}>

// 错误做法 - 只配置一个
<XProvider locale={zhCN_X}> {/* 缺少 antd 的 locale */}
```

---

## 相关资源

- [Ant Design X 官方文档](https://x.ant.design)
- [Ant Design ConfigProvider](https://ant-design.antgroup.com/components/config-provider-cn)
