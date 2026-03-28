# PDF 上传质量检测（MVP 版）实现文档

## 📋 功能概述

在 PDF 上传流程中增加解析质量检测机制，避免无效 PDF（如扫描件）进入知识库。

### 实现目标

1. ✅ PDF 解析
2. ✅ 文本长度检测
3. ✅ 分级处理（正常 / 警告 / 阻止）
4. ✅ 前端提示用户

---

## 🎯 质量分级规则（MVP）

| 状态 | 条件 | 处理方式 |
|------|------|----------|
| ❌ error | 文本长度 = 0 | 直接阻止，不允许上传 |
| ⚠️ warning | 文本长度 < 500 | 提示风险，用户确认后可上传 |
| ✅ success | 文本长度 ≥ 500 | 正常上传流程 |

---

## 📁 新增文件

### 1. `lib/pdf-analyzer.ts`

**功能：** PDF 质量检测核心逻辑

```typescript
export interface PdfAnalysisResult {
  status: 'success' | 'warning' | 'error'
  message?: string
  textLength?: number
}

export async function analyzePdf(file: File): Promise<PdfAnalysisResult>
export async function analyzePdfFromUrl(fileUrl: string, fileName: string): Promise<PdfAnalysisResult>
```

**实现逻辑：**
```typescript
const data = await pdfParse(buffer)
const text = data.text.trim()
const length = text.length

if (length === 0) {
  return { status: 'error', message: '未检测到有效文本...' }
}

if (length < 500) {
  return { status: 'warning', message: '文本内容较少...' }
}

return { status: 'success' }
```

---

## 🔧 修改的文件

### 2. `app/actions/knowledge-file.ts`

**新增：**
```typescript
export interface PdfQualityCheckResult {
  status: 'success' | 'warning' | 'error'
  message?: string
  textLength?: number
}

export async function analyzePdfAction(file: File): Promise<PdfQualityCheckResult>
```

**修改：**
```typescript
export async function uploadKnowledgeFile(
  knowledgeBaseId: string,
  file: File,
  skipQualityCheck: boolean = false  // 🆕 新增参数
): Promise<{ 
  data: KnowledgeFile | null
  error: Error | null
  qualityCheck?: PdfQualityCheckResult  // 🆕 新增返回
}> {
  // 🎯 1. PDF 质量检测（除非跳过）
  if (!skipQualityCheck && file.type === 'application/pdf') {
    qualityCheck = await analyzePdf(file)
    
    if (qualityCheck.status === 'error') {
      return { data: null, error: new Error(qualityCheck.message), qualityCheck }
    }
    
    if (qualityCheck.status === 'warning') {
      return { data: null, error: new Error('warning'), qualityCheck }
    }
  }
  
  // 2. 继续正常上传流程...
}
```

---

### 3. `components/knowledge/UploadModal.tsx`

**核心改动：**

#### A. 上传流程拆分

```typescript
const handleCustomRequest: UploadProps['customRequest'] = async ({ file }) => {
  // 🎯 1. PDF 质量检测
  if (file.type === 'application/pdf') {
    const qualityCheck = await analyzePdfAction(file)
    
    // ❌ 检测失败
    if (qualityCheck.status === 'error') {
      message.error(qualityCheck.message)
      return
    }
    
    // ⚠️ 警告 - 添加到待确认列表
    if (qualityCheck.status === 'warning') {
      setPendingFiles(prev => [...prev, { file, qualityCheck }])
      return
    }
    
    // ✅ 成功 - 继续上传
  }
  
  // 2. 非 PDF 或检测通过
  onSuccess('ok')
}
```

#### B. 用户确认逻辑

```typescript
const handleOk = () => {
  if (pendingFiles.length > 0) {
    // 显示确认框
    Modal.confirm({
      title: <Space><WarningOutlined /> 文件质量警告</Space>,
      content: (
        <div>
          <p>以下文件可能影响问答效果：</p>
          <ul>
            {pendingFiles.map(pf => (
              <li>
                <strong>{pf.file.name}</strong>
                <span>{pf.qualityCheck?.message}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
      okText: '仍然上传',
      cancelText: '取消',
      onOk: confirmUpload,
    })
  }
}
```

#### C. 待确认文件处理

```typescript
const handlePendingFiles = useCallback(async () => {
  for (const { file } of pendingFiles) {
    // skipQualityCheck: true - 跳过检测，直接上传
    const result = await uploadKnowledgeFile(knowledgeBaseId, file, true)
    
    if (result.error) {
      message.error(`${file.name}: 上传失败`)
    } else {
      message.success(`${file.name}: 上传成功`)
      onUpload([file])
    }
  }
  
  setPendingFiles([])
  onClose()
}, [pendingFiles, knowledgeBaseId, onUpload, onClose])
```

---

## 🔄 完整流程

### 成功流程（✅ success）

```
用户选择 PDF 文件
    ↓
handleCustomRequest
    ↓
analyzePdfAction(file)
    ↓
检测结果：{ status: 'success', textLength: 2000 }
    ↓
onSuccess({ qualityCheck })
    ↓
用户点击"确认上传"
    ↓
uploadKnowledgeFile(knowledgeBaseId, file, false)
    ↓
上传到 Supabase Storage
    ↓
写入数据库
    ↓
processFile 向量化
    ↓
✅ 完成
```

---

### 警告流程（⚠️ warning）

```
用户选择 PDF 文件
    ↓
handleCustomRequest
    ↓
analyzePdfAction(file)
    ↓
检测结果：{ status: 'warning', textLength: 300 }
    ↓
setPendingFiles([{ file, qualityCheck }])
    ↓
文件显示为黄色（待确认状态）
    ↓
用户点击"确认上传"
    ↓
Modal.confirm 显示警告
    ↓
用户点击"仍然上传"
    ↓
handlePendingFiles()
    ↓
uploadKnowledgeFile(knowledgeBaseId, file, true)  // skipQualityCheck: true
    ↓
上传到 Supabase Storage
    ↓
写入数据库
    ↓
processFile 向量化
    ↓
✅ 完成（带警告）
```

---

### 错误流程（❌ error）

```
用户选择 PDF 文件
    ↓
handleCustomRequest
    ↓
analyzePdfAction(file)
    ↓
检测结果：{ status: 'error', textLength: 0 }
    ↓
message.error('未检测到有效文本...')
    ↓
onError(new Error(qualityCheck.message))
    ↓
❌ 上传终止，文件不进入数据库
```

---

## 🎨 UI 状态

### 文件列表显示

| 状态 | 背景色 | 图标 | 文字 |
|------|--------|------|------|
| 检测通过 | bg-gray-50 | 📤 蓝色 | "检测通过" |
| 待确认 | bg-yellow-50 | ⚠️ 黄色 | 警告信息 |
| 上传中 | bg-gray-50 | 📤 蓝色 | 进度条 |
| 上传失败 | bg-gray-50 | ❌ 红色 | "上传失败" |

### 确认对话框

```
┌─────────────────────────────────────┐
│ ⚠️ 文件质量警告                     │
├─────────────────────────────────────┤
│ 以下文件可能影响问答效果：          │
│                                     │
│ • example.pdf                       │
│   文本内容较少（300 字符）...       │
│                                     │
│ • scan.pdf                          │
│   文本内容较少（100 字符）...       │
├─────────────────────────────────────┤
│           [仍然上传] [取消]         │
└─────────────────────────────────────┘
```

---

## 📊 代码结构

```
lib/
├── pdf-analyzer.ts          # 🆕 PDF 质量检测核心逻辑
└── process-file.ts          # 文件处理（向量化）

app/actions/
└── knowledge-file.ts        # Server Actions
    ├── analyzePdfAction()   # 🆕 PDF 检测
    └── uploadKnowledgeFile() # ✏️ 支持质量检测

components/knowledge/
└── UploadModal.tsx          # ✏️ 上传 UI
    ├── handleCustomRequest() # ✏️ 质量检测
    ├── handleOk()           # ✏️ 确认逻辑
    └── handlePendingFiles() # 🆕 待确认文件处理
```

---

## 🔧 使用示例

### 基础使用

```tsx
import { UploadModal } from '@/components/knowledge/UploadModal'

<UploadModal
  open={open}
  onClose={() => setOpen(false)}
  onUpload={(files) => {
    console.log('上传成功:', files)
  }}
  knowledgeBaseName="测试知识库"
  knowledgeBaseId="xxx"
/>
```

---

## ✅ 功能清单

- [x] PDF 解析质量检测
- [x] 文本长度检测
- [x] 分级处理（success/warning/error）
- [x] error 状态阻止上传
- [x] warning 状态用户确认
- [x] success 状态正常上传
- [x] 前端 UI 状态显示
- [x] 确认对话框
- [x] 待确认文件列表
- [x] 上传进度显示
- [x] 错误提示
- [x] 防止重复上传
- [x] TypeScript 类型完整

---

## 🚫 禁止事项（已遵守）

- ✅ 不会自动忽略 error 状态
- ✅ warning 时必须用户确认
- ✅ 检测失败时不写入数据库
- ✅ 不破坏现有逻辑
- ✅ 新增函数而非重写

---

## 📈 后续优化建议

### Phase 2（未来）

1. **更智能的检测**
   - 检测 PDF 是否为扫描件（使用 OCR）
   - 检测文本质量（重复率、语言识别）
   - 检测表格和图片比例

2. **更灵活的规则**
   - 允许管理员配置阈值
   - 按知识库类型设置不同规则
   - 支持批量上传时的跳过选项

3. **更好的 UX**
   - 检测进度显示
   - 预估处理时间
   - 检测报告下载

---

**实现日期：** 2026-03-28  
**状态：** ✅ MVP 完成  
**测试建议：** 上传不同类型的 PDF 进行测试
