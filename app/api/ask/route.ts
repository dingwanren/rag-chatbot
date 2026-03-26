import { NextRequest, NextResponse } from 'next/server'
import { askQuestion } from '@/lib/rag'

/**
 * RAG 问答 API
 * POST /api/ask
 * 
 * Request Body:
 * {
 *   "query": "用户问题",
 *   "knowledgeBaseId": "知识库 ID"
 * }
 * 
 * Response:
 * {
 *   "answer": "AI 生成的回答",
 *   "query": "用户问题",
 *   "knowledgeBaseId": "知识库 ID"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, knowledgeBaseId } = body

    // 参数验证
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: '缺少查询参数 query 或参数类型错误' },
        { status: 400 }
      )
    }

    if (!knowledgeBaseId || typeof knowledgeBaseId !== 'string') {
      return NextResponse.json(
        { error: '缺少知识库 ID 参数 knowledgeBaseId 或参数类型错误' },
        { status: 400 }
      )
    }

    console.log('=== 收到 RAG 问答请求 ===')
    console.log('query:', query)
    console.log('knowledgeBaseId:', knowledgeBaseId)

    // 调用 RAG 问答
    const answer = await askQuestion(query, knowledgeBaseId)

    console.log('=== RAG 问答响应 ===')
    console.log('answer preview:', answer.slice(0, 100))

    return NextResponse.json({
      success: true,
      answer,
      query,
      knowledgeBaseId,
    })
  } catch (error) {
    console.error('/api/ask error:', error)
    return NextResponse.json(
      {
        error: '问答失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}
