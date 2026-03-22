import { createClient } from '@/lib/supabase/server'
import { deepseek } from '@ai-sdk/deepseek'
import { streamText } from 'ai'
import type { Message } from '@/lib/supabase/types'

// 节流间隔（毫秒）- 避免频繁更新数据库
const THROTTLE_INTERVAL = 500

export async function POST(req: Request) {
  try {
    const { chatId, messageId } = await req.json()

    if (!chatId || !messageId) {
      return new Response('Missing chatId or messageId', { status: 400 })
    }

    const supabase = await createClient()

    // 验证用户和消息权限
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // 验证 message 属于当前用户
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('id, chat_id, content')
      .eq('id', messageId)
      .eq('chat_id', chatId)
      .single()

    if (messageError || !message) {
      return new Response('Message not found', { status: 404 })
    }

    // 获取当前聊天的所有消息（用于上下文）
    const { data: messages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('chat_id', chatId)
      .eq('status', 'completed')
      .order('created_at', { ascending: true })
      .limit(20)

    // 构建消息历史 - 显式类型注解
    const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> =
      messages?.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })) ?? []

    // 获取最后一条用户消息（用于本次对话）
    const lastUserMessage = conversationHistory[conversationHistory.length - 1]

    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      return new Response('No user message found', { status: 400 })
    }

    // 创建 DeepSeek 模型
    const model = deepseek('deepseek-chat')

    // 流式调用 LLM
    const result = streamText({
      model,
      messages: [
        { role: 'system', content: '你是一个有帮助的 AI 助手。' },
        ...conversationHistory.slice(0, -1),
        { role: 'user', content: lastUserMessage.content },
      ],
    })

    // 创建 ReadableStream 用于响应
    const stream = new ReadableStream({
      async start(controller) {
        let accumulatedContent = ''
        let lastUpdateTime = Date.now()
        const encoder = new TextEncoder()

        try {
          // 处理流式响应
          for await (const chunk of result.textStream) {
            accumulatedContent += chunk

            // 发送 chunk 到前端
            controller.enqueue(
              encoder.encode(JSON.stringify({ chunk, content: accumulatedContent }) + '\n')
            )

            // 节流更新数据库
            const now = Date.now()
            if (now - lastUpdateTime >= THROTTLE_INTERVAL) {
              await supabase
                .from('messages')
                .update({
                  content: accumulatedContent,
                  status: 'streaming',
                })
                .eq('id', messageId)

              lastUpdateTime = now
            }
          }

          // 流结束，更新最终状态
          await supabase
            .from('messages')
            .update({
              content: accumulatedContent,
              status: 'completed',
            })
            .eq('id', messageId)

          // 发送完成信号
          controller.enqueue(
            encoder.encode(JSON.stringify({ done: true, content: accumulatedContent }) + '\n')
          )
        } catch (error) {
          // 流错误，更新状态为 completed
          await supabase
            .from('messages')
            .update({
              content: accumulatedContent,
              status: 'completed',
            })
            .eq('id', messageId)

          controller.enqueue(
            encoder.encode(
              JSON.stringify({ error: 'Streaming failed', content: accumulatedContent }) + '\n'
            )
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Streaming error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
