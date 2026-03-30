# Vercel 部署后样式丢失

## 基本信息

- **日期**: 2026-03-30 14:30:00
- **问题类型**: bug
- **严重等级**: P1-严重
- **涉及模块**: `app/layout.tsx`, `app/globals.css`
- **相关 Issue**: 无

## 问题描述

### 现象

项目在本地开发环境运行正常，样式显示正确。但部署到 Vercel 后，页面样式完全丢失，只显示无样式的 HTML 内容。

### 复现步骤

1. 本地运行 `pnpm dev`，访问 http://localhost:3000，样式正常
2. 执行 `pnpm build`，构建成功
3. 部署到 Vercel
4. 访问 Vercel 线上地址，样式丢失

### 错误信息

浏览器控制台无 JavaScript 错误，但 Network 面板显示 CSS 文件体积异常小（仅几 KB），说明 Tailwind CSS 样式未被打包。

### 环境信息

- 操作系统：Windows 11
- Node.js 版本：v20.x
- Next.js 版本：16.1.6
- Tailwind CSS 版本：v4
- 部署平台：Vercel

## 根因分析

**关键代码位置**: `app/layout.tsx:1`

**问题代码**:
```typescript
// ❌ 缺少 CSS 导入
import type { Metadata } from "next";
import QueryClientProvider from "@/QueryClientProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <QueryClientProvider>{children}</QueryClientProvider>
      </body>
    </html>
  );
}
```

**原因**:

1. **开发环境 vs 生产环境的差异**
   - 开发环境 (next dev)：HMR 热更新机制可能通过其他路径注入了 CSS
   - 生产环境 (next build)：静态分析只打包明确导入的模块

2. **Tailwind CSS v4 的导入要求**
   - v4 版本使用 `@import "tailwindcss"` 语法
   - 需要明确的导入链才能正确打包 `@base` 和 `@utilities` 层

3. **Tree Shaking 优化**
   - 生产构建会移除"未使用"的代码
   - 没有显式导入 `globals.css`，导致 Tailwind 样式未被识别为"已使用"

4. **Vercel 部署特性**
   - Vercel 执行干净的 `next build`
   - 无本地缓存，完全依赖代码中的导入关系

## 修复方案

### 方案描述

在 `app/layout.tsx` 中显式导入 `globals.css`，确保生产构建时 CSS 被正确打包。

### 关键代码变更

**修改前**:
```typescript
import type { Metadata } from "next";
import QueryClientProvider from "@/QueryClientProvider";
```

**修改后**:
```typescript
import type { Metadata } from "next";
import QueryClientProvider from "@/QueryClientProvider";
import "./globals.css"; // ✅ 添加 CSS 导入
```

### 文件变更清单

| 文件路径 | 变更类型 | 说明 |
|---------|---------|------|
| `app/layout.tsx` | 修改 | 添加 `import "./globals.css"` |

## 验证方式

### 测试步骤

1. 本地执行 `pnpm build`
2. 检查 `.next` 输出目录中 CSS 文件体积（应包含 Tailwind 样式）
3. 提交代码到 Git
4. 推送到 Vercel 触发部署
5. 访问 Vercel 线上地址

### 预期结果

- 构建成功，无警告
- CSS bundle 体积正常（包含 Tailwind 样式）
- Vercel 部署后页面样式正常显示

### 实际结果

✅ 修复后验证通过：
- 本地构建成功
- Vercel 部署成功
- 样式正常显示

## 预防措施

为避免同类问题再次发生，采取以下措施：

- [x] **添加类型检查** - TypeScript 会提示未使用的导入
- [ ] **添加构建检查** - CI/CD 流程中检查 CSS bundle 体积
- [x] **更新文档** - 在 README 中说明 Root Layout 必须导入全局样式
- [ ] **代码审查检查点** - 新建 layout 时必须检查是否导入全局样式

## 相关知识库

### Next.js CSS 处理机制

- [Next.js - Adding Global Styles](https://nextjs.org/docs/app/building-your-application/styling/css-modules#global-styles)
- [Next.js - Importing Global CSS](https://nextjs.org/docs/messages/css-global)

### Tailwind CSS v4 变化

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs/v4)
- [Tailwind CSS v4 Migration Guide](https://tailwindcss.com/docs/upgrade-guide)

### Vercel 部署最佳实践

- [Vercel - Next.js Build Output](https://vercel.com/docs/frameworks/nextjs)
- [Vercel - Troubleshooting Builds](https://vercel.com/docs/deployments/troubleshoot-a-build)

## 备注

### 为什么本地开发环境没问题？

1. **HMR 热更新**：开发服务器的热模块替换可能通过其他路径注入了 CSS
2. **浏览器缓存**：本地浏览器可能缓存了之前的样式文件
3. **开发服务器宽松处理**：`next dev` 对导入链的要求不如 `next build` 严格

### 经验教训

- ✅ **永远不要依赖开发环境的"隐式行为"**
- ✅ **生产构建才是检验代码正确性的标准**
- ✅ **全局样式必须在 Root Layout 中显式导入**
- ✅ **本地测试通过后，务必验证生产构建**

### 类似陷阱

以下情况也可能出现"本地正常，线上异常"：

1. 环境变量未正确配置（`.env.local` vs Vercel Environment Variables）
2. 依赖了本地全局安装的包
3. 使用了未声明的隐式依赖
4. 文件系统大小写敏感问题（Windows vs Linux）
