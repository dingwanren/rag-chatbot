import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRagConfig } from '@/lib/rag-config'
import { embedText } from '@/lib/embedding'
import { pinecone } from '@/lib/pinecone'

/**
 * POST /api/rag/test-search
 * 测试检索功能，验证配置是否生效
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 验证用户登录
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    // 解析请求体
    const body = await request.json()
    const { query, knowledgeBaseId } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: '缺少查询词' },
        { status: 400 }
      )
    }

    if (!knowledgeBaseId) {
      return NextResponse.json(
        { error: '缺少知识库 ID' },
        { status: 400 }
      )
    }

    // 验证知识库是否属于当前用户
    const { data: kbData, error: kbVerifyError } = await supabase
      .from('knowledge_bases')
      .select('id, name')
      .eq('id', knowledgeBaseId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (kbVerifyError || !kbData) {
      return NextResponse.json(
        { 
          error: '知识库不存在或无权访问', 
          data: { matches: [] } 
        },
        { status: 200 }
      )
    }

    // 获取知识库配置
    const config = await getRagConfig(knowledgeBaseId)

    // 生成 embedding
    const queryEmbedding = await embedText(query)

    // Pinecone 检索
    const index = pinecone.index('rag-chatbot')
    const result = await index.query({
      vector: queryEmbedding,
      topK: config.top_k,
      includeMetadata: true,
      filter: {
        knowledge_base_id: { $eq: knowledgeBaseId },  // ⭐ 使用下划线命名
        user_id: { $eq: user.id },  // ⭐ 添加 user_id 过滤
      },
    })

    console.log('[test-search] Pinecone query result:', result.matches?.length ?? 0, 'matches')
    console.log('[test-search] Matches:', result.matches?.map(m => ({ 
      id: m.id, 
      score: m.score, 
      metadata: m.metadata 
    })))

    // 根据 threshold 过滤
    const allMatches = result.matches || []
    const filteredMatches = allMatches
      .filter(match => match.score !== undefined && match.score >= config.threshold)
      .map(match => ({
        content: (match.metadata?.content as string) || '',
        score: match.score || 0,
        fileId: (match.metadata?.file_id as string) || '',  // ⭐ 使用下划线命名
        chunkIndex: (match.metadata?.chunk_index as number) || 0,
        fileName: (match.metadata?.file_name as string) || '',
      }))

    return NextResponse.json({
      success: true,
      data: {
        matches: filteredMatches,
        debug: {
          totalMatches: allMatches.length,
          filteredMatches: filteredMatches.length,
          knowledgeBaseId: knowledgeBaseId,
          knowledgeBaseName: kbData.name,
          allScores: allMatches.map(m => m.score?.toFixed(4) || 'N/A'),
          threshold: config.threshold,
          top_k: config.top_k,
        },
      },
      message: filteredMatches.length > 0 
        ? `找到 ${filteredMatches.length} 个匹配结果` 
        : `未找到匹配结果（共 ${allMatches.length} 条，低于阈值 ${config.threshold}）`,
    })
  } catch (error) {
    console.error('[POST /api/rag/test-search] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '检索测试失败',
      },
      { status: 500 }
    )
  }
}
