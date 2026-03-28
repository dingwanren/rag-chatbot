import OpenAI from 'openai'
import { searchSimilarChunks } from './pinecone'
import { estimateTokens } from './token-manager'

const openai = new OpenAI({
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: process.env.DASHSCOPE_API_KEY,
})

/**
 * RAG 问答返回结果（包含 token 信息）
 */
export interface RAGResponse {
  answer: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  error?: {
    code: 'TOKEN_LIMIT' | 'LLM_ERROR' | 'NO_CONTEXT'
    message: string
  }
}

/**
 * 构建 RAG prompt（控制长度，防止 token 爆炸）
 * @param query - 用户问题
 * @param context - 检索到的上下文
 * @param maxContextLength - 最大上下文长度（默认 2000 字符）
 */
function buildRAGPrompt(
  query: string,
  context: string,
  maxContextLength: number = 2000
): string {
  // 限制上下文长度，防止 token 爆炸
  const truncatedContext = context.length > maxContextLength
    ? context.substring(0, maxContextLength) + '...'
    : context

  return `
你是一个基于知识库的 AI 助手。

请基于以下知识库内容回答用户问题：
- 如果知识库内容足以回答问题，请给出准确、简洁的回答
- 如果知识库内容与问题无关或无法从中得到答案，请说"未在知识库中找到相关信息"
- 不要编造知识库中没有的信息
- 回答要简洁明了，避免冗长

知识库内容：
${truncatedContext}

用户问题：
${query}
`
}

/**
 * RAG 问答：基于知识库检索生成回答
 * @param query - 用户问题
 * @param knowledgeBaseId - 知识库 ID
 * @param userId - 用户 ID（用于 Pinecone 过滤，确保安全）
 * @returns RAGResponse（包含回答和 token 使用）
 */
export async function askQuestion(
  query: string,
  knowledgeBaseId: string,
  userId: string
): Promise<RAGResponse> {
  try {
    console.log('=== RAG 问答开始 ===')
    console.log('query:', query)
    console.log('knowledgeBaseId:', knowledgeBaseId)
    console.log('userId:', userId)

    // 1. 调用检索（带 userId 过滤）
    const matches = await searchSimilarChunks(query, knowledgeBaseId, userId)
    console.log('检索到 matches:', matches.length)

    if (matches.length === 0) {
      return {
        answer: '未在知识库中找到相关信息，无法回答您的问题。',
        error: {
          code: 'NO_CONTEXT',
          message: '未在知识库中找到相关信息',
        },
      }
    }

    // 2. 拼接上下文（最多取前 3 条，防止 token 爆炸）
    const topMatches = matches.slice(0, 3)
    const context = topMatches
      .map((m, i) => `【${i + 1}】${m.content}`)
      .join('\n\n')

    console.log('context length:', context.length)

    // 3. 构建 prompt（控制长度）
    const prompt = buildRAGPrompt(query, context, 2000)

    // 4. 预估 token（用于限额检查）
    const estimatedTokens = estimateTokens(prompt)
    console.log('estimated tokens:', estimatedTokens)

    // 5. 调用 LLM（阿里百炼）
    const completion = await openai.chat.completions.create({
      model: 'qwen-plus',
      messages: [
        { role: 'system', content: '你是一个专业的知识库助手，基于提供的知识库内容回答问题。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    })

    const answer = completion.choices[0].message.content || '抱歉，生成回答时出现错误。'
    
    // 6. 获取真实 token 使用
    const usage = completion.usage || {
      prompt_tokens: estimatedTokens,
      completion_tokens: Math.ceil(answer.length / 4),
      total_tokens: estimatedTokens + Math.ceil(answer.length / 4),
    }

    console.log('=== RAG 问答完成 ===')
    console.log('answer length:', answer.length)
    console.log('usage:', usage)

    return {
      answer,
      usage,
    }
  } catch (error) {
    console.error('askQuestion error:', error)
    
    // 判断是否是 token 限额错误
    if (error instanceof Error && error.message.includes('token')) {
      return {
        answer: '⚠️ 今日 token 已用完，请明天再试或升级账户',
        error: {
          code: 'TOKEN_LIMIT',
          message: '今日 token 已用完',
        },
      }
    }
    
    return {
      answer: '抱歉，生成回答时出现错误。',
      error: {
        code: 'LLM_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      },
    }
  }
}
