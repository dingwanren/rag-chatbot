import { NextResponse } from 'next/server'
import { parsePdfFromStorage } from '@/lib/pdf'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // 从数据库获取一个已上传的 PDF 文件路径
    const supabase = await createClient()

    const { data: file, error: queryError } = await supabase
      .from('knowledge_files')
      .select('file_url, file_name')
      .eq('status', 'processed')
      .limit(1)
      .single()

    let targetFile = file

    if (queryError || !file) {
      // 尝试获取任意文件
      const { data: anyFile } = await supabase
        .from('knowledge_files')
        .select('file_url, file_name')
        .limit(1)
        .single()

      if (!anyFile) {
        return NextResponse.json(
          { error: '没有找到 PDF 文件，请先上传文件到知识库' },
          { status: 404 }
        )
      }
      targetFile = anyFile
    }

    console.log('测试文件:', targetFile?.file_name, 'URL:', targetFile?.file_url)

    const text = await parsePdfFromStorage(targetFile!.file_url)

    return NextResponse.json({
      fileName: targetFile!.file_name,
      fileUrl: targetFile!.file_url,
      length: text.length,
      preview: text.slice(0, 200),
    })
  } catch (error) {
    console.error('test-pdf error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF 解析失败' },
      { status: 500 }
    )
  }
}

// 使用 Node.js runtime（pdf-parse 需要）
export const runtime = 'nodejs'
