import { createClient } from './supabase/server'
import pdf from 'pdf-parse'
import { splitTextIntoChunks } from './chunk'
import { embedText } from './embedding'
import { pinecone } from './pinecone'

/**
 * 处理上传的 PDF 文件：从 Storage 下载并解析文本，生成 embedding 并写入 Pinecone
 * @param fileId - 数据库中的文件 ID
 * @returns PDF 文本内容
 */
export async function processFile(fileId: string): Promise<string> {
  try {
    const supabase = await createClient()

    // 1. 根据 fileId 从数据库查询文件记录（获取 file_url 和 knowledge_base_id）
    const { data: fileRecord, error: queryError } = await supabase
      .from('knowledge_files')
      .select('file_url, file_name, knowledge_base_id')
      .eq('id', fileId)
      .single()

    if (queryError || !fileRecord) {
      throw new Error(`查询文件记录失败：${queryError?.message || '文件不存在'}`)
    }

    if (!fileRecord.knowledge_base_id) {
      throw new Error('文件未关联知识库')
    }

    // 获取知识库的 user_id
    const { data: kbData, error: kbError } = await supabase
      .from('knowledge_bases')
      .select('user_id')
      .eq('id', fileRecord.knowledge_base_id)
      .single()

    if (kbError || !kbData) {
      throw new Error('查询知识库失败')
    }

    const userId = kbData.user_id

    console.log(`开始处理文件：${fileRecord.file_name}, URL: ${fileRecord.file_url}, knowledgeBaseId: ${fileRecord.knowledge_base_id}, userId: ${userId}`)

    // 2. 从 file_url 下载 PDF (public URL)
    const response = await fetch(fileRecord.file_url)
    if (!response.ok) {
      throw new Error(`下载 PDF 失败：${response.status} ${response.statusText}`)
    }

    // 3. 将文件转为 buffer
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 4. 使用 pdf-parse 解析
    const data = await pdf(buffer)

    // 5. 打印日志
    console.log('pdf text length:', data.text.length)

    // 6. 使用 splitTextIntoChunks 切分文本
    const chunks = splitTextIntoChunks(data.text, 500, 100)
    console.log('chunks:', chunks.length)

    if (chunks.length === 0) {
      console.warn('没有可处理的 chunks')
      return data.text
    }

    // 7. 对 chunks 做 embedding
    console.log('开始生成 embeddings...')
    const embeddings = await Promise.all(
      chunks.map(async (chunk) => {
        try {
          return await embedText(chunk)
        } catch (error) {
          console.error('embedText error for chunk:', error)
          throw new Error(`生成 embedding 失败：${error instanceof Error ? error.message : '未知错误'}`)
        }
      })
    )
    console.log('embeddings generated:', embeddings.length)

    // 8. 构建 Pinecone vectors（包含 userId 用于安全过滤）
    const vectors = chunks.map((chunk, index) => ({
      id: `${fileId}-${index}`,
      values: embeddings[index],
      metadata: {
        content: chunk,
        fileId: fileId,
        chunkIndex: index,
        fileName: fileRecord.file_name,
        knowledgeBaseId: fileRecord.knowledge_base_id,
        userId: userId,
      },
    }))
    console.log('vectors:', vectors.length)

    // 9. 批量写入 Pinecone（分批处理，每 50 条一次）
    const index = pinecone.index('rag-chatbot')
    const batchSize = 50

    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize)
      await index.upsert(batch)
      console.log(`upsert batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`)
    }

    console.log('pinecone upsert done')

    // 10. 返回文本内容
    return data.text
  } catch (error) {
    console.error('processFile error:', error)
    throw new Error(`文件处理失败：${error instanceof Error ? error.message : '未知错误'}`)
  }
}
