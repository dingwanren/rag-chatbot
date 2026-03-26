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
 * @returns 相关的 chunks 及其相似度分数
 */
export async function searchSimilarChunks(
  query: string,
  knowledgeBaseId: string,
  userId: string
) {
  try {
    console.log('query:', query)
    console.log('knowledgeBaseId:', knowledgeBaseId)
    console.log('userId:', userId)

    // 1. 对 query 做 embedding
    const queryEmbedding = await embedText(query)

    // 2. 调用 Pinecone query（带双重过滤：knowledgeBaseId + userId）
    const index = pinecone.index('rag-chatbot')
    const result = await index.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
      filter: {
        knowledgeBaseId: { $eq: knowledgeBaseId },
        userId: { $eq: userId },
      },
    })

    // 3. 提取结果
    const matches = result.matches || []
    console.log('matches:', matches.length)

    return matches.map((match) => ({
      content: (match.metadata?.content as string) || '',
      score: match.score,
      fileId: (match.metadata?.fileId as string) || '',
      chunkIndex: (match.metadata?.chunkIndex as number) || 0,
      fileName: (match.metadata?.fileName as string) || '',
    }))
  } catch (error) {
    console.error('searchSimilarChunks error:', error)
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
