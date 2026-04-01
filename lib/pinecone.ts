import { Pinecone } from '@pinecone-database/pinecone'
import { embedText } from './embedding'

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
})

// 导出 Pinecone 客户端实例，供其他模块使用
export const pinecone = pc

// 导出 rag-chatbot index，用于测试
export const pineconeIndex = pc.index('rag-chatbot')

/**
 * 测试向量：将测试文本嵌入并 upsert 到 Pinecone
 */
export async function upsertTestVector() {
  try {
    const text = '这是一个测试文本'
    const embedding = await embedText(text)

    await pineconeIndex.upsert([
      {
        id: 'test-1',
        values: embedding,
        metadata: {
          content: text,
          type: 'test',
        },
      },
    ])

    console.log('upsert success')
    return { success: true, message: 'upsert success' }
  } catch (error) {
    console.error('upsert error:', error)
    throw new Error(`Pinecone upsert failed: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 检索与查询文本最相关的 chunks
 * @param query - 查询文本
 * @param knowledgeBaseId - 知识库 ID（用于过滤）
 * @param userId - 用户 ID（用于过滤，确保安全）
 * @param topK - 检索返回数量（可选，默认 5）
 * @param threshold - 相似度阈值（可选，默认 0.65）
 * @returns 相关的 chunks 及其相似度分数
 */
export async function searchSimilarChunks(
  query: string,
  knowledgeBaseId: string,
  userId: string,
  topK: number = 5,
  threshold: number = 0.65
) {
  try {
    console.log('[searchSimilarChunks] === Starting Search ===')
    console.log('[searchSimilarChunks] query:', query)
    console.log('[searchSimilarChunks] knowledgeBaseId:', knowledgeBaseId)
    console.log('[searchSimilarChunks] userId:', userId)
    console.log('[searchSimilarChunks] topK:', topK)
    console.log('[searchSimilarChunks] threshold:', threshold)

    // 1. 对 query 做 embedding
    const queryEmbedding = await embedText(query)
    console.log('[searchSimilarChunks] queryEmbedding length:', queryEmbedding.length)

    // 2. 调用 Pinecone query（带双重过滤：knowledge_base_id + user_id）
    const index = pinecone.index('rag-chatbot')
    const result = await index.query({
      vector: queryEmbedding,
      topK: topK,
      includeMetadata: true,
      filter: {
        knowledge_base_id: { $eq: knowledgeBaseId },  // ⭐ 使用下划线命名
        user_id: { $eq: userId },  // ⭐ 使用下划线命名
      },
    })

    // 3. 提取结果并根据 threshold 过滤
    const matches = result.matches || []
    console.log('[searchSimilarChunks] matches before threshold filter:', matches.length)
    console.log('[searchSimilarChunks] matches:', matches.map(m => ({ id: m.id, score: m.score })))

    // 4. 根据相似度阈值过滤（score 可能为 undefined，需要过滤）
    const filteredMatches = matches.filter(match => match.score !== undefined && match.score >= threshold)
    console.log('[searchSimilarChunks] matches after threshold filter:', filteredMatches.length)
    console.log('[searchSimilarChunks] filteredMatches:', filteredMatches.map(m => ({ id: m.id, score: m.score })))

    return filteredMatches.map((match) => ({
      content: (match.metadata?.content as string) || '',
      score: match.score || 0,
      fileId: (match.metadata?.file_id as string) || '',  // ⭐ 使用下划线命名
      chunkIndex: (match.metadata?.chunk_index as number) || 0,
      fileName: (match.metadata?.file_name as string) || '',
      pineconeId: match.id, // 🎯 返回 Pinecone ID（= knowledge_chunks.id）
    }))
  } catch (error) {
    console.error('[searchSimilarChunks] Error:', error)
    throw new Error(`检索失败：${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 删除 Pinecone 中指定文件的向量
 * @param fileId - 文件 ID
 * @returns 删除结果
 */
export async function deletePineconeVectors(fileId: string) {
  try {
    console.log('deletePineconeVectors: deleting vectors for fileId:', fileId)
    
    const index = pinecone.index('rag-chatbot')

    // 使用 delete 方法删除匹配 filter 的向量
    // @ts-ignore - Pinecone SDK type issue
    await index.delete({
      filter: {
        fileId: { $eq: fileId },
      },
    })
    
    console.log('deletePineconeVectors: success for fileId:', fileId)
    return { success: true }
  } catch (error) {
    console.error('deletePineconeVectors error:', error)
    throw new Error(`删除 Pinecone 向量失败：${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 删除 Pinecone 中指定知识库的所有向量
 * @param knowledgeBaseId - 知识库 ID
 * @returns 删除结果
 */
export async function deletePineconeKnowledgeBaseVectors(knowledgeBaseId: string) {
  try {
    console.log('deletePineconeKnowledgeBaseVectors: deleting vectors for knowledgeBaseId:', knowledgeBaseId)
    
    const index = pinecone.index('rag-chatbot')

    // 使用 delete 方法删除匹配 filter 的向量
    // @ts-ignore - Pinecone SDK type issue
    await index.delete({
      filter: {
        knowledgeBaseId: { $eq: knowledgeBaseId },
      },
    })
    
    console.log('deletePineconeKnowledgeBaseVectors: success for knowledgeBaseId:', knowledgeBaseId)
    return { success: true }
  } catch (error) {
    console.error('deletePineconeKnowledgeBaseVectors error:', error)
    throw new Error(`删除 Pinecone 知识库向量失败：${error instanceof Error ? error.message : '未知错误'}`)
  }
}
