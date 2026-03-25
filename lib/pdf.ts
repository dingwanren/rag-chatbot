import { createClient } from './supabase/server'
import pdf from 'pdf-parse'

/**
 * 从 Supabase Storage 下载并解析 PDF 文件
 * @param filepath - Storage 内部路径（格式：userId/xxx.pdf）
 * @returns PDF 文本内容
 */
export async function parsePdfFromStorage(filepath: string): Promise<string> {
  try {
    const supabase = await createClient()

    // 1. 从 Supabase Storage 下载文件
    const { data: file, error: downloadError } = await supabase.storage
      .from('rag-files')
      .download(filepath)

    if (downloadError || !file) {
      throw new Error(`下载 PDF 失败：${downloadError?.message || '文件不存在'}`)
    }

    // 2. 将 Blob 转为 Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 3. 使用 pdf-parse 解析
    const data = await pdf(buffer)

    console.log('pdf text length:', data.text.length)

    return data.text
  } catch (error) {
    console.error('parsePdfFromStorage error:', error)
    throw new Error(`PDF 解析失败：${error instanceof Error ? error.message : '未知错误'}`)
  }
}
