import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pinecone } from '@/lib/pinecone'

/**
 * POST /api/rag/reindex
 * 重建指定知识库的索引
 * 
 * TODO: 完整实现需要：
 * 1. 删除 Pinecone 中该知识库的所有向量
 * 2. 重新读取知识库下的所有文件
 * 3. 重新处理文件（chunk -> embedding -> upsert）
 * 
 * 目前仅实现删除向量功能，重新处理需要前端触发文件重新上传
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
    const { knowledgeBaseId } = body

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

    // TODO: 完整重建索引流程
    // 1. 获取知识库下所有文件
    // 2. 删除 Pinecone 中的向量
    // 3. 重新处理每个文件

    // 当前仅实现：删除 Pinecone 中的向量
    const index = pinecone.index('rag-chatbot')
    
    // 删除该知识库的所有向量
    // @ts-ignore - Pinecone SDK type issue
    await index.delete({
      filter: {
        knowledgeBaseId: { $eq: knowledgeBaseId },
      },
    })

    // 更新文件状态为 pending，触发重新处理
    await supabase
      .from('knowledge_files')
      .update({ status: 'pending' })
      .eq('knowledge_base_id', knowledgeBaseId)

    return NextResponse.json({
      success: true,
      message: '已删除旧索引，请重新上传文件以生成新索引',
      data: {
        knowledgeBaseId,
        knowledgeBaseName: kbData.name,
      },
    })
  } catch (error) {
    console.error('[POST /api/rag/reindex] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '重建索引失败',
      },
      { status: 500 }
    )
  }
}
