import { createClient } from './supabase/server'

/**
 * 默认配置（当知识库没有配置时使用）
 */
export const DEFAULT_RAG_CONFIG = {
  top_k: 5,
  threshold: 0.65,
  chunk_size: 500,
}

/**
 * 配置验证范围
 */
export const RAG_CONFIG_LIMITS = {
  top_k: { min: 1, max: 20 },
  threshold: { min: 0, max: 1 },
  chunk_size: { min: 100, max: 2000 },
}

/**
 * RAG 配置类型
 */
export interface RagConfigData {
  top_k: number
  threshold: number
  chunk_size: number
}

/**
 * 获取 RAG 配置（知识库级别）
 * 
 * 使用 .maybeSingle() 允许无数据，返回默认值兜底
 * 用户从未打开过设置页面也能正常问答
 * 
 * @param knowledgeBaseId - 知识库 ID
 * @returns RAG 配置
 */
export async function getRagConfig(knowledgeBaseId: string): Promise<RagConfigData> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rag_configs')
    .select('top_k, threshold, chunk_size')
    .eq('knowledge_base_id', knowledgeBaseId)
    .maybeSingle()

  if (error) {
    console.error('[getRagConfig] Error:', error)
    throw new Error(`获取 RAG 配置失败：${error.message}`)
  }

  // 没有配置时返回默认值
  return data ?? DEFAULT_RAG_CONFIG
}

/**
 * 保存 RAG 配置（知识库级别）
 * 
 * 使用 upsert 统一处理新增和更新，避免竞态条件
 * onConflict 指定 knowledge_base_id 字段
 * 
 * @param knowledgeBaseId - 知识库 ID
 * @param config - 配置对象
 * @returns 保存后的配置和是否需要重新索引
 */
export async function saveRagConfig(
  knowledgeBaseId: string,
  config: RagConfigData
): Promise<RagConfigData & { needReindex: boolean }> {
  const supabase = await createClient()

  // 验证配置范围
  const validation = validateRagConfig(config)
  if (!validation.valid) {
    throw new Error(validation.errors.join('；'))
  }

  // 获取旧配置，判断是否需要重新索引
  const oldConfig = await getRagConfig(knowledgeBaseId)
  const needReindex = oldConfig.chunk_size !== config.chunk_size

  // 使用 upsert 统一处理新增/更新
  const { data, error } = await supabase
    .from('rag_configs')
    .upsert(
      {
        knowledge_base_id: knowledgeBaseId,
        top_k: config.top_k,
        threshold: config.threshold,
        chunk_size: config.chunk_size,
      },
      {
        onConflict: 'knowledge_base_id',
      }
    )
    .select('top_k, threshold, chunk_size')
    .single()

  if (error) {
    console.error('[saveRagConfig] Error:', error)
    throw new Error(`保存 RAG 配置失败：${error.message}`)
  }

  return {
    ...data,
    needReindex,
  }
}

/**
 * 验证配置值是否在有效范围内
 */
export function validateRagConfig(
  config: Partial<RagConfigData>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (config.top_k !== undefined) {
    if (config.top_k < RAG_CONFIG_LIMITS.top_k.min || config.top_k > RAG_CONFIG_LIMITS.top_k.max) {
      errors.push(`Top-K 必须在 ${RAG_CONFIG_LIMITS.top_k.min} 到 ${RAG_CONFIG_LIMITS.top_k.max} 之间`)
    }
  }

  if (config.threshold !== undefined) {
    if (config.threshold < RAG_CONFIG_LIMITS.threshold.min || config.threshold > RAG_CONFIG_LIMITS.threshold.max) {
      errors.push(`Threshold 必须在 ${RAG_CONFIG_LIMITS.threshold.min} 到 ${RAG_CONFIG_LIMITS.threshold.max} 之间`)
    }
  }

  if (config.chunk_size !== undefined) {
    if (config.chunk_size < RAG_CONFIG_LIMITS.chunk_size.min || config.chunk_size > RAG_CONFIG_LIMITS.chunk_size.max) {
      errors.push(`Chunk Size 必须在 ${RAG_CONFIG_LIMITS.chunk_size.min} 到 ${RAG_CONFIG_LIMITS.chunk_size.max} 之间`)
    }
  }

  return { valid: errors.length === 0, errors }
}
