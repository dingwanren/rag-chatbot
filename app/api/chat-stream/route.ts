import { createClient } from '@/lib/supabase/server'
import { askQuestion } from '@/lib/rag'
import type { Message } from '@/lib/supabase/types'

// 节流间隔（毫秒）- 避免频繁更新数据库
const THROTTLE_INTERVAL = 500

export async function POST(req: Request) {
  try {
    const { chatId, messageId } = await req.json()
    
    console.log('[chat-stream] Received request:', { chatId, messageId })

    if (!chatId || !messageId) {
      console.error('[chat-stream] Missing chatId or messageId')
      return new Response('Missing chatId or messageId', { status: 400 })
    }

    const supabase = await createClient()

    // 验证用户和消息权限
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[chat-stream] Auth error:', authError)
      return new Response('Unauthorized', { status: 401 })
    }

    // 验证 assistant message 属于当前用户
    const { data: assistantMessage, error: assistantMessageError } = await supabase
      .from('messages')
      .select('id, chat_id, role')
      .eq('id', messageId)
      .eq('chat_id', chatId)
      .single()

    if (assistantMessageError || !assistantMessage) {
      console.error('[chat-stream] Assistant message not found:', messageId, assistantMessageError)
      return new Response('Assistant message not found', { status: 404 })
    }
    
    console.log('[chat-stream] Assistant message verified:', assistantMessage)

    // 获取最后一条用户消息（用于本次对话）
    const { data: lastUserMessage, error: userMessageError } = await supabase
      .from('messages')
      .select('id, content')
      .eq('chat_id', chatId)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (userMessageError || !lastUserMessage) {
      console.error('[chat-stream] User message not found:', chatId, userMessageError)
      return new Response('No user message found', { status: 400 })
    }
    
    console.log('[chat-stream] Last user message:', { id: lastUserMessage.id, contentLength: lastUserMessage.content?.length })

    const userContent = lastUserMessage.content

    if (!userContent) {
      console.error('[chat-stream] User message content is empty')
      return new Response('No user message content', { status: 400 })
    }

    // 获取聊天信息（包括 knowledgeBaseId）
    const { data: chat } = await supabase
      .from('chats')
      .select('id, knowledge_base_id')
      .eq('id', chatId)
      .single()

    if (!chat) {
      console.error('[chat-stream] Chat not found:', chatId)
      return new Response('Chat not found', { status: 404 })
    }
    
    console.log('[chat-stream] Chat info:', { chatId, knowledgeBaseId: chat.knowledge_base_id })

    // 如果没有关联知识库，使用普通回答
    if (!chat.knowledge_base_id) {
      console.error('[chat-stream] Chat has no knowledge base:', chatId)
      return new Response(JSON.stringify({ error: 'No knowledge base associated' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log('[chat-stream] Calling askQuestion with:', { query: userContent.substring(0, 50), knowledgeBaseId: chat.knowledge_base_id, userId: user.id })

    // 调用 RAG 问答（传入 userId 用于安全过滤）
    const answer = await askQuestion(userContent, chat.knowledge_base_id, user.id)

    console.log('[chat-stream] Got answer, length:', answer.length)

    // 创建 ReadableStream 用于响应（模拟流式效果）
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        try {
          // 将回答分成小段模拟流式效果
          const chunkSize = 50
          let accumulatedContent = ''
          let lastUpdateTime = Date.now()

          for (let i = 0; i < answer.length; i += chunkSize) {
            const chunk = answer.slice(i, i + chunkSize)
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

            // 模拟打字延迟
            await new Promise(resolve => setTimeout(resolve, 50))
          }

          // 流结束，更新最终状态
          await supabase
            .from('messages')
            .update({
              content: answer,
              status: 'completed',
            })
            .eq('id', messageId)

          // 发送完成信号
          controller.enqueue(
            encoder.encode(JSON.stringify({ done: true, content: answer }) + '\n')
          )
        } catch (error) {
          console.error('RAG streaming error:', error)
          const errorMessage = error instanceof Error ? error.message : 'Streaming failed'
          // 流错误，更新状态为 completed
          await supabase
            .from('messages')
            .update({
              content: accumulatedContent || '生成回答时出现错误',
              status: 'completed',
            })
            .eq('id', messageId)

          controller.enqueue(
            encoder.encode(
              JSON.stringify({ error: errorMessage, content: accumulatedContent || '生成回答时出现错误' }) + '\n'
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
    console.error('RAG streaming error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
