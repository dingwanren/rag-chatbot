import OpenAI from 'openai'
import { searchSimilarChunks } from './pinecone'

const openai = new OpenAI({
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: process.env.DASHSCOPE_API_KEY,
})

/**
 * RAG 问答：基于知识库检索生成回答
 * @param query - 用户问题
 * @param knowledgeBaseId - 知识库 ID
 * @param userId - 用户 ID（用于 Pinecone 过滤，确保安全）
 * @returns AI 生成的回答
 */
export async function askQuestion(
  query: string,
  knowledgeBaseId: string,
  userId: string
): Promise<string> {
  try {
    console.log('=== RAG 问答开始 ===')
    console.log('query:', query)
    console.log('knowledgeBaseId:', knowledgeBaseId)
    console.log('userId:', userId)

    // 1. 调用检索（带 userId 过滤）
    const matches = await searchSimilarChunks(query, knowledgeBaseId, userId)
    console.log('检索到 matches:', matches.length)

    if (matches.length === 0) {
      return '未在知识库中找到相关信息，无法回答您的问题。'
    }

    // 2. 拼接上下文（最多取前 5 条）
    const topMatches = matches.slice(0, 5)
    const context = topMatches
      .map((m, i) => `【${i + 1}】${m.content}`)
      .join('\n\n')

    console.log('context length:', context.length)

    // 3. 构建 prompt
    const prompt = `
你是一个基于知识库的 AI 助手。

请基于以下知识库内容回答用户问题：
- 如果知识库内容足以回答问题，请给出准确、简洁的回答
- 如果知识库内容与问题无关或无法从中得到答案，请说"未在知识库中找到相关信息"
- 不要编造知识库中没有的信息
- 回答要简洁明了，避免冗长

知识库内容：
${context}

用户问题：
${query}
`

    // 4. 调用 LLM（阿里百炼）
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

    console.log('=== RAG 问答完成 ===')
    console.log('answer length:', answer.length)

    return answer
  } catch (error) {
    console.error('askQuestion error:', error)
    throw new Error(`RAG 问答失败：${error instanceof Error ? error.message : '未知错误'}`)
  }
}
