import { createClient } from './supabase/server'
import pdf from 'pdf-parse'

/**
 * PDF 解析质量检测结果
 */
export interface PdfAnalysisResult {
  status: 'success' | 'warning' | 'error'
  message?: string
  textLength?: number
}

/**
 * 分析 PDF 文件质量（MVP 版本）
 * @param file - PDF 文件
 * @returns 质量检测结果
 */
export async function analyzePdf(file: File): Promise<PdfAnalysisResult> {
  try {
    // 1. 将 File 转为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 2. 使用 pdf-parse 解析 PDF
    const data = await pdf(buffer)
    const text = data.text.trim()
    const length = text.length

    console.log('[PDF Analysis] 文件:', file.name, '文本长度:', length)

    // 3. 质量分级规则（MVP）
    if (length === 0) {
      return {
        status: 'error',
        message: '未检测到有效文本，该 PDF 可能为扫描件或图片格式',
        textLength: length,
      }
    }

    if (length < 500) {
      return {
        status: 'warning',
        message: `文本内容较少（${length} 字符），可能影响问答效果`,
        textLength: length,
      }
    }

    return {
      status: 'success',
      textLength: length,
    }
  } catch (error) {
    console.error('[PDF Analysis] 解析失败:', error)
    return {
      status: 'error',
      message: `PDF 解析失败：${error instanceof Error ? error.message : '未知错误'}`,
    }
  }
}

/**
 * 从 Storage 下载并分析 PDF 文件质量
 * @param fileUrl - 文件 URL
 * @param fileName - 文件名
 * @returns 质量检测结果
 */
export async function analyzePdfFromUrl(
  fileUrl: string,
  fileName: string
): Promise<PdfAnalysisResult> {
  try {
    // 1. 下载 PDF
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`下载失败：${response.status} ${response.statusText}`)
    }

    // 2. 转为 buffer
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 3. 解析 PDF
    const data = await pdf(buffer)
    const text = data.text.trim()
    const length = text.length

    console.log('[PDF Analysis] 文件:', fileName, '文本长度:', length)

    // 4. 质量分级
    if (length === 0) {
      return {
        status: 'error',
        message: '未检测到有效文本，该 PDF 可能为扫描件或图片格式',
        textLength: length,
      }
    }

    if (length < 500) {
      return {
        status: 'warning',
        message: `文本内容较少（${length} 字符），可能影响问答效果`,
        textLength: length,
      }
    }

    return {
      status: 'success',
      textLength: length,
    }
  } catch (error) {
    console.error('[PDF Analysis] 分析失败:', error)
    return {
      status: 'error',
      message: `PDF 分析失败：${error instanceof Error ? error.message : '未知错误'}`,
    }
  }
}
