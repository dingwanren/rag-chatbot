import { NextResponse } from 'next/server'
import { embedText } from '@/lib/embedding'
import { pineconeIndex } from '@/lib/pinecone'

export async function GET() {
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
    await pineconeIndex.upsert([vector])

    console.log('upsert success')

    return NextResponse.json({
      success: true,
      message: '向量写入成功',
      embeddingLength: embedding.length,
      vectorId: vector.id,
    })
  } catch (error) {
    console.error('upsert error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
