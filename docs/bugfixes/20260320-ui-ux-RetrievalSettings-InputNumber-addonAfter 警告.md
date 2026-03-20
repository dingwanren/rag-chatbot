# RetrievalSettings 组件 InputNumber addonAfter 警告

## 基本信息

- **日期**: 2026-03-20 15:30:00
- **问题类型**: ui-ux
- **严重等级**: P3-轻微
- **涉及模块**: `components/knowledge/RetrievalSettings.tsx`
- **相关 Issue**: N/A

## 问题描述

### 现象

在运行应用时，控制台出现 Ant Design 警告信息：

```
Warning: [antd: InputNumber] `addonAfter` is deprecated. Please use `Space.Compact` instead.
```

### 复现步骤

1. 启动开发服务器 `pnpm dev`
2. 导航到知识库管理页面 `/knowledge`
3. 选择任意知识库进入详情页
4. 点击"检索设置" Tab
5. 查看浏览器控制台警告

### 错误信息

```
Warning: [antd: InputNumber] `addonAfter` is deprecated. Please use `Space.Compact` instead.

    at RetrievalSettings (components/knowledge/RetrievalSettings.tsx:131:13)
    at KnowledgeDetailView (components/knowledge/KnowledgeDetailView.tsx:344:13)
```

### 环境信息

- 操作系统：Windows 11
- Node.js 版本：v20.x
- Ant Design 版本：^6.3.1
- Next.js 版本：16.1.6

## 根因分析

**关键代码位置**: `components/knowledge/RetrievalSettings.tsx:127-145`

```tsx
<InputNumber
  min={100}
  max={2000}
  step={50}
  style={{ width: '100%' }}
  addonAfter="字符"  // ← 问题所在
/>
```

**原因**: 

Ant Design 6.x 版本中，`InputNumber` 组件的 `addonAfter` 和 `addonBefore` 属性已被弃用。官方推荐使用 `Space.Compact` 组件来实现类似的输入框前后缀效果。

## 修复方案

### 方案描述

使用 `Space.Compact` 组件包裹 `InputNumber` 和后缀文本，替代已弃用的 `addonAfter` 属性。

### 关键代码变更

**修改前**:

```tsx
<InputNumber
  min={100}
  max={2000}
  step={50}
  style={{ width: '100%' }}
  addonAfter="字符"
/>
```

**修改后**:

```tsx
<Space.Compact style={{ width: '100%' }}>
  <InputNumber
    min={100}
    max={2000}
    step={50}
    style={{ flex: 1 }}
  />
  <div className="flex items-center px-3 bg-gray-50 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-500">
    字符
  </div>
</Space.Compact>
```

### 文件变更清单

| 文件路径 | 变更类型 | 说明 |
|---------|---------|------|
| `components/knowledge/RetrievalSettings.tsx` | 修改 | 替换 `addonAfter` 为 `Space.Compact` |
| `components/knowledge/RetrievalSettings.tsx` | 修改 | 导入 `Space as AntSpace` |

## 验证方式

### 测试步骤

1. 启动开发服务器 `pnpm dev`
2. 导航到知识库管理页面 `/knowledge`
3. 选择任意知识库进入详情页
4. 点击"检索设置" Tab
5. 查看浏览器控制台是否还有警告

### 预期结果

- 控制台不再出现 `addonAfter is deprecated` 警告
- "最大分块大小"和"分块重叠"输入框右侧仍显示"字符"单位
- 样式与之前保持一致

### 实际结果

✅ 警告已消除，UI 显示正常

## 预防措施

- [x] 使用 Ant Design 官方推荐的 API
- [ ] 在团队代码审查中注意检查已弃用属性的使用
- [ ] 考虑添加 ESLint 规则检测 Ant Design 弃用 API

## 相关知识库

- [Ant Design Space.Compact 文档](https://ant.design/components/space-cn#spacecompact)
- [Ant Design InputNumber 文档](https://ant.design/components/input-number-cn#api)

## 备注

此问题不影响功能使用，仅为控制台警告。但及时修复可避免未来版本升级后可能出现的兼容性问题。
