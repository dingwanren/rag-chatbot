import { NextResponse } from 'next/server'
import { searchSimilarChunks } from '@/lib/pinecone'

/**
 * 测试向量检索
 * GET /api/test-query?q=xxx&kbId=xxx
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const kbId = searchParams.get('kbId')

    if (!query) {
      return NextResponse.json(
        { error: '缺少查询参数 q' },
        { status: 400 }
      )
    }

    if (!kbId) {
      return NextResponse.json(
        { error: '缺少知识库 ID 参数 kbId' },
        { status: 400 }
      )
    }

    console.log('=== 开始向量检索 ===')
    console.log('query:', query)
    console.log('kbId:', kbId)

    const matches = await searchSimilarChunks(query, kbId)

    console.log('=== 检索完成 ===')
    console.log('matches count:', matches.length)

    return NextResponse.json({
      success: true,
      query,
      knowledgeBaseId: kbId,
      matches,
    })
  } catch (error) {
    console.error('test-query error:', error)
    return NextResponse.json(
      {
        error: '检索失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}
