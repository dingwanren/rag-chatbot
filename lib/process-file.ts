import { createClient } from './supabase/server'
import pdf from 'pdf-parse'
import { splitTextIntoChunks } from './chunk'
import { embedText } from './embedding'
import { pinecone } from './pinecone'
import { getRagConfig } from './rag-config'
import type { KnowledgeChunkInsert } from './supabase/types'

/**
 * 处理上传的 PDF 文件：
 * 1. 从 Storage 下载并解析文本
 * 2. 写入 knowledge_chunks 表
 * 3. 生成 embedding 并写入 Pinecone（使用数据库 chunk id）
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
    const knowledgeBaseId = fileRecord.knowledge_base_id

    // 获取知识库的 RAG 配置（使用 chunk_size）
    const ragConfig = await getRagConfig(knowledgeBaseId)
    console.log(`[processFile] RAG config for KB ${knowledgeBaseId}: top_k=${ragConfig.top_k}, threshold=${ragConfig.threshold}, chunk_size=${ragConfig.chunk_size}`)

    console.log(`[processFile] 开始处理文件：${fileRecord.file_name}, URL: ${fileRecord.file_url}, knowledgeBaseId: ${knowledgeBaseId}, userId: ${userId}`)

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
    console.log('[processFile] pdf text length:', data.text.length)

    // 6. 使用 splitTextIntoChunks 切分文本（使用知识库配置的 chunk_size）
    const chunks = splitTextIntoChunks(data.text, ragConfig.chunk_size, 100)
    console.log('[processFile] chunks count:', chunks.length)

    if (chunks.length === 0) {
      console.warn('[processFile] 没有可处理的 chunks')
      return data.text
    }

    // ========================================
    // 7. 🎯 先写入 knowledge_chunks 表（获取数据库 id）
    // ========================================
    console.log('[processFile] Writing to knowledge_chunks...')
    
    const chunksToInsert: KnowledgeChunkInsert[] = chunks.map((chunk, index) => ({
      file_id: fileId,
      chunk_index: index,
      content: chunk,
      metadata: {
        file_name: fileRecord.file_name,
        chunk_index: index,
        knowledge_base_id: knowledgeBaseId,
        user_id: userId,
      },
    }))

    const { data: insertedChunks, error: insertError } = await supabase
      .from('knowledge_chunks')
      .insert(chunksToInsert)
      .select('id, chunk_index, content')

    if (insertError || !insertedChunks) {
      console.error('[processFile] Failed to insert chunks:', insertError)
      throw new Error(`写入 knowledge_chunks 失败：${insertError?.message || '未知错误'}`)
    }

    console.log('[processFile] Inserted chunks to DB:', insertedChunks.length)
    console.log('[processFile] Chunk IDs:', insertedChunks.map(c => c.id))

    // ========================================
    // 8. 对 chunks 做 embedding
    // ========================================
    console.log('[processFile] Generating embeddings...')
    const embeddings = await Promise.all(
      chunks.map(async (chunk) => {
        try {
          return await embedText(chunk)
        } catch (error) {
          console.error('[processFile] embedText error for chunk:', error)
          throw new Error(`生成 embedding 失败：${error instanceof Error ? error.message : '未知错误'}`)
        }
      })
    )
    console.log('[processFile] Embeddings generated:', embeddings.length)

    // ========================================
    // 9. 🎯 构建 Pinecone vectors（使用数据库 chunk id）
    // ========================================
    const vectors = insertedChunks.map((chunk, index) => {
      const vector = {
        id: chunk.id, // ⭐ 关键：使用数据库 id，保证 pinecone.id === knowledge_chunks.id
        values: embeddings[index],
        metadata: {
          content: chunk.content,
          file_id: fileId,
          chunk_index: chunk.chunk_index,
          file_name: fileRecord.file_name,
          knowledge_base_id: knowledgeBaseId,
          user_id: userId,
        },
      }
      console.log(`[processFile] Vector ${index}: id=${chunk.id}, values_length=${embeddings[index].length}`)
      return vector
    })
    console.log('[processFile] Vectors to upsert:', vectors.length)

    // ========================================
    // 10. 批量写入 Pinecone（分批处理，每 50 条一次）
    // ========================================
    console.log('[processFile] Starting Pinecone upsert...')
    const index = pinecone.index('rag-chatbot')
    const batchSize = 50

    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize)
      console.log(`[processFile] Upsert batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}, batch size: ${batch.length}`)
      
      try {
        const upsertResult = await index.upsert(batch)
        console.log('[processFile] Upsert result:', upsertResult)
      } catch (upsertError) {
        console.error('[processFile] Pinecone upsert error for batch:', upsertError)
        console.error('[processFile] Batch vectors:', batch.map(v => ({
          id: v.id,
          values_length: v.values.length,
          metadata: v.metadata
        })))
        throw new Error(`Pinecone upsert 失败：${upsertError instanceof Error ? upsertError.message : '未知错误'}`)
      }
    }

    console.log('[processFile] Pinecone upsert done')

    // ========================================
    // 11. 验证数据一致性
    // ========================================
    console.log('[processFile] === Data Flow Verification ===')
    console.log('[processFile] DB chunks count:', insertedChunks.length)
    console.log('[processFile] Pinecone vectors count:', vectors.length)
    console.log('[processFile] ID match check:', insertedChunks[0]?.id === vectors[0]?.id ? '✅ PASS' : '❌ FAIL')
    
    // 验证 Pinecone 中是否有数据
    try {
      const verifyQuery = await index.query({
        vector: new Array(1024).fill(0),
        topK: 1,
        filter: { file_id: { $eq: fileId } }
      })
      console.log('[processFile] Pinecone verification query:', verifyQuery.matches?.length ?? 0, 'matches')
    } catch (verifyError) {
      console.error('[processFile] Pinecone verification error:', verifyError)
    }

    // 12. 返回文本内容
    return data.text
  } catch (error) {
    console.error('[processFile] Error:', error)
    throw new Error(`文件处理失败：${error instanceof Error ? error.message : '未知错误'}`)
  }
}
