import OpenAI from 'openai'

const openai = new OpenAI({
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: process.env.DASHSCOPE_API_KEY,
})

/**
 * 生成文本的 embedding 向量（阿里云百炼 text-embedding-v4）
 * @param text 输入文本
 * @returns 1024 维向量数组
 */
export async function embedText(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-v4',
      input: text,
      dimensions: 1024,
    })

    const embedding = response.data[0].embedding

    console.log('embedding length:', embedding.length)

    return embedding
  } catch (error) {
    console.error('embedText error:', error)
    throw new Error(`生成 embedding 失败：${error instanceof Error ? error.message : '未知错误'}`)
  }
}
