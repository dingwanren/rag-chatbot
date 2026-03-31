import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRagConfig, saveRagConfig } from '@/lib/rag-config'

/**
 * GET /api/rag/config
 * 获取指定知识库的 RAG 检索配置
 * Query: ?knowledgeBaseId=xxx
 */
export async function GET(request: NextRequest) {
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

    // 获取知识库 ID
    const searchParams = request.nextUrl.searchParams
    const knowledgeBaseId = searchParams.get('knowledgeBaseId')

    if (!knowledgeBaseId) {
      return NextResponse.json(
        { error: '缺少知识库 ID' },
        { status: 400 }
      )
    }

    // 验证知识库是否属于当前用户
    const { data: kbData, error: kbError } = await supabase
      .from('knowledge_bases')
      .select('id, name')
      .eq('id', knowledgeBaseId)
      .eq('user_id', user.id)
      .single()

    if (kbError || !kbData) {
      return NextResponse.json(
        { error: '知识库不存在或无权访问' },
        { status: 404 }
      )
    }

    // 获取配置
    const config = await getRagConfig(knowledgeBaseId)

    return NextResponse.json({
      success: true,
      data: {
        knowledgeBaseId,
        knowledgeBaseName: kbData.name,
        ...config,
      },
    })
  } catch (error) {
    console.error('[GET /api/rag/config] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '获取配置失败',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/rag/config
 * 更新指定知识库的 RAG 检索配置
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
    const { knowledgeBaseId, top_k, threshold, chunk_size } = body

    // 验证必填字段
    if (!knowledgeBaseId) {
      return NextResponse.json(
        { error: '缺少知识库 ID' },
        { status: 400 }
      )
    }

    if (top_k === undefined || threshold === undefined || chunk_size === undefined) {
      return NextResponse.json(
        { error: '缺少必填字段：top_k, threshold, chunk_size' },
        { status: 400 }
      )
    }

    // 验证知识库是否属于当前用户
    const { data: kbData, error: kbError } = await supabase
      .from('knowledge_bases')
      .select('id, name')
      .eq('id', knowledgeBaseId)
      .eq('user_id', user.id)
      .single()

    if (kbError || !kbData) {
      return NextResponse.json(
        { error: '知识库不存在或无权访问' },
        { status: 404 }
      )
    }

    // 保存配置（upsert 模式，自动处理新增/更新）
    const result = await saveRagConfig(knowledgeBaseId, { top_k, threshold, chunk_size })

    return NextResponse.json({
      success: true,
      data: {
        knowledgeBaseId,
        knowledgeBaseName: kbData.name,
        top_k: result.top_k,
        threshold: result.threshold,
        chunk_size: result.chunk_size,
        needReindex: result.needReindex,
      },
      message: result.needReindex
        ? '配置已更新，修改分块大小需要重新上传文档才能生效'
        : '配置已保存',
    })
  } catch (error) {
    console.error('[POST /api/rag/config] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '更新配置失败',
      },
      { status: 500 }
    )
  }
}
