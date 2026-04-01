import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pinecone } from '@/lib/pinecone'

/**
 * GET /api/test-data-flow
 * 
 * 验证数据链路完整性：
 * 1. knowledge_chunks 表有数据
 * 2. Pinecone 中有向量
 * 3. Pinecone ID 与 knowledge_chunks.id 一致
 */
export async function GET() {
  const results: Record<string, unknown> = {}

  try {
    const supabase = await createClient()

    // ========================================
    // 1. 检查 knowledge_chunks 表
    // ========================================
    console.log('[test-data-flow] Checking knowledge_chunks...')
    
    const { data: chunks, error: chunksError } = await supabase
      .from('knowledge_chunks')
      .select('id, file_id, chunk_index, content, metadata')
      .limit(10)

    if (chunksError) {
      results['knowledge_chunks'] = {
        status: 'error',
        error: chunksError.message,
      }
    } else {
      results['knowledge_chunks'] = {
        status: 'success',
        count: chunks?.length ?? 0,
        sample: chunks?.slice(0, 3).map(c => ({
          id: c.id,
          file_id: c.file_id,
          chunk_index: c.chunk_index,
          contentLength: c.content?.length,
          metadata: c.metadata,
        })),
      }
      console.log('[test-data-flow] knowledge_chunks:', chunks?.length ?? 0)
    }

    // ========================================
    // 2. 检查 Pinecone
    // ========================================
    console.log('[test-data-flow] Checking Pinecone...')

    try {
      const index = pinecone.index('rag-chatbot')

      // 使用 1024 维零向量进行查询（不使用 filter，测试能否查到数据）
      const queryVector = new Array(1024).fill(0)
      console.log('[test-data-flow] Query vector dimension:', queryVector.length)
      
      // 先不使用 filter，看看能否查到数据
      const { matches } = await index.query({
        vector: queryVector,
        topK: 10,
        includeMetadata: true,
      })

      results['pinecone'] = {
        status: 'success',
        count: matches?.length ?? 0,
        sample: matches?.slice(0, 3).map(m => ({
          id: m.id,
          score: m.score,
          metadata: {
            file_name: m.metadata?.file_name,
            chunk_index: m.metadata?.chunk_index,
            content_length: (m.metadata?.content as string)?.length,
            knowledge_base_id: m.metadata?.knowledge_base_id,
            user_id: m.metadata?.user_id,
          },
        })),
      }
      console.log('[test-data-flow] Pinecone matches:', matches?.length ?? 0)
      
      // 如果有数据，检查 ID 是否与 DB 匹配
      if (matches && matches.length > 0 && chunks && chunks.length > 0) {
        const dbIds = chunks.map(c => c.id)
        const pineconeIds = matches.map(m => m.id)
        const matchingIds = dbIds.filter(id => pineconeIds.includes(id))
        
        results['id_consistency'] = {
          db_ids_sample: dbIds.slice(0, 5),
          pinecone_ids_sample: pineconeIds.slice(0, 5),
          matching_count: matchingIds.length,
          status: matchingIds.length > 0 ? '✅ PASS' : '❌ FAIL (ID 不匹配，需要重新上传文件)',
        }
      }
    } catch (pineconeError) {
      const errorMessage = pineconeError instanceof Error ? pineconeError.message : 'Unknown error'
      results['pinecone'] = {
        status: 'error',
        error: errorMessage,
        hint: errorMessage.includes('dimension') ? 'Embedding 维度不匹配！请确认 Pinecone index 是 1024 维' : undefined,
      }
      console.error('[test-data-flow] Pinecone error:', pineconeError)
    }

    // ========================================
    // 3. 验证 ID 一致性
    // ========================================
    if (chunks && chunks.length > 0 && results['pinecone'] && typeof results['pinecone'] === 'object' && 'sample' in (results['pinecone'] as any)) {
      const dbIds = new Set(chunks.map(c => c.id))
      const pineconeIds = new Set((results['pinecone'] as any).sample?.map((m: any) => m.id) || [])
      
      const matchingIds = [...dbIds].filter(id => pineconeIds.has(id))
      
      results['id_consistency'] = {
        db_ids_sample: [...dbIds].slice(0, 5),
        pinecone_ids_sample: [...pineconeIds].slice(0, 5),
        matching_count: matchingIds.length,
        status: matchingIds.length > 0 ? '✅ PASS' : '❌ FAIL',
      }
    }

    // ========================================
    // 4. 检查 message_sources 表
    // ========================================
    console.log('[test-data-flow] Checking message_sources...')
    
    const { data: sources, error: sourcesError } = await supabase
      .from('message_sources')
      .select('id, message_id, chunk_id, score')
      .limit(10)

    if (sourcesError) {
      results['message_sources'] = {
        status: 'error',
        error: sourcesError.message,
      }
    } else {
      results['message_sources'] = {
        status: 'success',
        count: sources?.length ?? 0,
        sample: sources?.slice(0, 3),
      }
      console.log('[test-data-flow] message_sources:', sources?.length ?? 0)
    }

    // ========================================
    // 5. 总体评估
    // ========================================
    const chunksOk = (results['knowledge_chunks'] as any)?.count > 0
    const pineconeOk = (results['pinecone'] as any)?.count > 0
    const idMatch = (results['id_consistency'] as any)?.matching_count > 0
    
    results['summary'] = {
      overall: chunksOk && pineconeOk ? '✅ READY' : '❌ NOT READY',
      checks: {
        knowledge_chunks: chunksOk ? '✅' : '❌',
        pinecone: pineconeOk ? '✅' : '❌',
        id_match: idMatch ? '✅' : '❌',
      },
    }

  } catch (error) {
    console.error('[test-data-flow] Fatal error:', error)
    results['error'] = {
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  return NextResponse.json(results)
}
