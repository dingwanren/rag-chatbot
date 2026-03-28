import { createClient } from '@/lib/supabase/server'
import { askQuestion } from '@/lib/rag'
import { getUserPlan } from '@/lib/quota'
import { recordTokenUsage } from '@/lib/token-manager'
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

    // 验证用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // 验证消息权限
    const { data: assistantMessage } = await supabase
      .from('messages')
      .select('id, chat_id, role')
      .eq('id', messageId)
      .eq('chat_id', chatId)
      .single()

    if (!assistantMessage) {
      return new Response('Assistant message not found', { status: 404 })
    }

    // 获取最后一条用户消息
    const { data: lastUserMessage } = await supabase
      .from('messages')
      .select('id, content')
      .eq('chat_id', chatId)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!lastUserMessage || !lastUserMessage.content) {
      return new Response('No user message content', { status: 400 })
    }

    const userContent = lastUserMessage.content

    // 获取聊天信息
    const { data: chat } = await supabase
      .from('chats')
      .select('id, knowledge_base_id')
      .eq('id', chatId)
      .single()

    if (!chat) {
      return new Response('Chat not found', { status: 404 })
    }

    // ========================================
    // 1. 调用 check_and_consume RPC（调用 LLM 前）
    // ========================================
    const { data: quotaResult, error: quotaError } = await supabase.rpc('check_and_consume', {
      p_user_id: user.id,
      p_tokens: 0,
    })

    if (quotaError) {
      console.error('[chat-stream] check_and_consume error:', quotaError)
      return new Response(
        JSON.stringify({
          error: '系统繁忙，请稍后重试',
          code: 'INTERNAL_ERROR',
        }),
        { status: 500 }
      )
    }

    if (!(quotaResult as any)?.ok) {
      const result = quotaResult as any
      return new Response(
        JSON.stringify({
          error: result.message || '今日额度已用完',
          code: 'QUOTA_EXCEEDED',
          details: {
            type: result.error_type || 'requests',
            current: result.current ?? 0,
            limit: result.limit ?? 0,
            resetTime: new Date().toISOString().split('T')[0],
          },
        }),
        { status: 429 }
      )
    }

    console.log('[chat-stream] Quota check passed')

    // ========================================
    // 2. 创建真正的流式响应
    // ========================================
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let accumulatedContent = ''
        let lastUpdateTime = Date.now()
        let finalUsage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null = null

        try {
          if (!chat.knowledge_base_id) {
            // 🎯 普通聊天模式：使用真正的流式请求
            const response = await fetch('https://api.deepseek.com/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
              },
              body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                  { role: 'system', content: 'You are a helpful assistant.' },
                  { role: 'user', content: userContent },
                ],
                stream: true, // ✅ 启用流式
                stream_options: { include_usage: true }, // ✅ 包含 usage
              }),
            })

            if (!response.ok) {
              throw new Error('AI API request failed')
            }

            if (!response.body) {
              throw new Error('No response body')
            }

            // 🎯 读取 LLM 的流式响应并实时转发给前端
            const reader = response.body.getReader()
            const decoder = new TextDecoder()

            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const text = decoder.decode(value)
              const lines = text.split('\n').filter(line => line.trim())

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6)
                  
                  if (data === '[DONE]') {
                    continue
                  }

                  try {
                    const parsed = JSON.parse(data)
                    const delta = parsed.choices?.[0]?.delta?.content
                    
                    if (delta) {
                      accumulatedContent += delta

                      // 发送 chunk 到前端
                      controller.enqueue(
                        encoder.encode(JSON.stringify({
                          chunk: delta,
                          content: accumulatedContent,
                        }) + '\n')
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

                    // 保存 usage
                    if (parsed.usage) {
                      finalUsage = parsed.usage
                    }
                  } catch (e) {
                    // 忽略解析错误
                  }
                }
              }
            }
          } else {
            // 🎯 RAG 模式：暂时使用假流式（后续优化）
            const ragResponse = await askQuestion(userContent, chat.knowledge_base_id, user.id)

            if (ragResponse.error) {
              console.warn('[chat-stream] RAG error:', ragResponse.error)
            }

            const answer = ragResponse.answer
            finalUsage = ragResponse.usage || null

            // 模拟流式效果
            const chunkSize = 50
            for (let i = 0; i < answer.length; i += chunkSize) {
              const chunk = answer.slice(i, i + chunkSize)
              accumulatedContent += chunk

              controller.enqueue(
                encoder.encode(JSON.stringify({
                  chunk,
                  content: accumulatedContent,
                }) + '\n')
              )

              await new Promise(resolve => setTimeout(resolve, 30))
            }
          }

          // ========================================
          // 3. 流完成：记录日志并更新状态
          // ========================================
          console.log('[chat-stream] Stream completed, content length:', accumulatedContent.length)
          
          // 更新数据库为 completed（无论有没有 usage）
          await supabase
            .from('messages')
            .update({
              content: accumulatedContent,
              status: 'completed',
            })
            .eq('id', messageId)

          console.log('[chat-stream] Database updated')

          // 如果有 usage，记录日志
          if (finalUsage) {
            await recordTokenUsage(
              user.id,
              chatId,
              finalUsage,
              chat.knowledge_base_id ? 'qwen-plus' : 'deepseek-chat'
            )

            // 更新 user_usage
            const totalTokens = finalUsage.total_tokens ?? 0
            await supabase.rpc('increment_tokens', {
              p_user_id: user.id,
              p_tokens: totalTokens,
            })

            // 获取最新使用量
            const { data: usageData } = await supabase
              .from('user_usage')
              .select('daily_tokens, daily_requests')
              .eq('user_id', user.id)
              .single()

            const usageInfo = {
              daily_tokens: usageData?.daily_tokens ?? 0,
              daily_requests: usageData?.daily_requests ?? 0,
            }

            // 发送完成信号（包含 usage）
            controller.enqueue(
              encoder.encode(JSON.stringify({
                done: true,
                content: accumulatedContent,
                usage: usageInfo,
              }) + '\n')
            )
          } else {
            // 没有 usage，只发送完成信号
            controller.enqueue(
              encoder.encode(JSON.stringify({
                done: true,
                content: accumulatedContent,
              }) + '\n')
            )
          }
        } catch (error) {
          console.error('Streaming error:', error)

          await supabase
            .from('messages')
            .update({
              content: accumulatedContent || '生成回答时出现错误',
              status: 'completed',
            })
            .eq('id', messageId)

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                error: error instanceof Error ? error.message : 'Streaming failed',
                content: accumulatedContent || '生成回答时出现错误',
              }) + '\n'
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

    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal Server Error',
      code: 'LLM_ERROR',
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}
