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
