'use server'

import { embedText } from '@/lib/embedding'
import { pineconeIndex } from '@/lib/pinecone'

/**
 * 测试向量写入 Pinecone
 */
export async function upsertTestVector() {
  try {
    console.log('=== 开始测试向量 upsert ===')

    // 1. 生成 embedding
    const text = '这是一个测试文本'
    console.log('输入文本:', text)

    const embedding = await embedText(text)
    console.log('embedding 维度:', embedding.length)

    // 2. 构造 upsert 数据
    const vector = {
      id: 'test-1',
      values: embedding,
      metadata: {
        content: text,
        type: 'test',
      },
    }

    // 3. 写入 Pinecone
    console.log('开始 upsert 到 Pinecone...')
    const result = await pineconeIndex.upsert([vector])

    console.log('upsert success')
    console.log('upsert result:', result)

    return {
      success: true,
      message: '向量写入成功',
      embeddingLength: embedding.length,
    }
  } catch (error) {
    console.error('upsert error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }
  }
}
