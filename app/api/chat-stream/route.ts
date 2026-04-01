import { createClient } from '@/lib/supabase/server'
import { askQuestion, type CitationSource } from '@/lib/rag'
import { recordTokenUsage } from '@/lib/token-manager'
import { buildMessagesWithSummary, checkAndUpdateSummary } from '@/lib/chat-summary'

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

    if (!(quotaResult as { ok?: boolean })?.ok) {
      const result = quotaResult as Record<string, unknown>
      return new Response(
        JSON.stringify({
          error: (result.message as string) || '今日额度已用完',
          code: 'QUOTA_EXCEEDED',
          details: {
            type: (result.error_type as string) || 'requests',
            current: (result.current as number) ?? 0,
            limit: (result.limit as number) ?? 0,
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
        let ragSources: CitationSource[] | undefined

        try {
          if (!chat.knowledge_base_id) {
            // 🎯 普通聊天模式：使用真正的流式请求
            // 构建带总结的 messages
            const messages = await buildMessagesWithSummary(
              chatId,
              userContent,
              'You are a helpful assistant.'
            )

            console.log('[chat-stream] Messages with summary:', messages.length)

            const response = await fetch('https://api.deepseek.com/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
              },
              body: JSON.stringify({
                model: 'deepseek-chat',
                messages: messages,
                stream: true,
                stream_options: { include_usage: true },
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
                  } catch {
                    // 忽略解析错误
                  }
                }
              }
            }
          } else {
            // 🎯 RAG 模式：使用带总结的上下文
            // 构建带总结的 messages
            const messages = await buildMessagesWithSummary(
              chatId,
              userContent,
              '你是一个专业的知识库助手，请根据上下文回答用户的问题。'
            )

            console.log('[chat-stream] RAG mode with summary, messages:', messages.length)

            const ragResponse = await askQuestion(userContent, chat.knowledge_base_id, user.id, messages)

            if (ragResponse.error) {
              console.warn('[chat-stream] RAG error:', ragResponse.error)
            }

            const answer = ragResponse.answer
            ragSources = ragResponse.sources
            finalUsage = ragResponse.usage || null

            console.log('[chat-stream] RAG sources:', ragSources)

            // 🎯 写入 message_sources 表（用于后续追溯）
            if (ragSources && ragSources.length > 0) {
              try {
                const sourcesToInsert = ragSources
                  .filter((s): s is typeof s & { chunkId: string } => !!s.chunkId)
                  .map(s => ({
                    message_id: messageId,
                    chunk_id: s.chunkId,
                    score: s.score ?? null,
                  }))

                console.log('[chat-stream] Sources to insert:', sourcesToInsert)

                if (sourcesToInsert.length > 0) {
                  const insertResult = await supabase
                    .from('message_sources')
                    .insert(sourcesToInsert)
                  console.log('[chat-stream] message_sources insert result:', insertResult)
                  console.log('[chat-stream] message_sources inserted:', sourcesToInsert.length)
                }
              } catch (error) {
                console.error('[chat-stream] Failed to insert message_sources:', error)
                // 不阻塞主流程，继续执行
              }
            } else {
              console.log('[chat-stream] No sources to insert')
            }

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
              finalUsage
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

            // 🎯 发送完成信号（包含 usage 和 sources）
            controller.enqueue(
              encoder.encode(JSON.stringify({
                done: true,
                content: accumulatedContent,
                usage: usageInfo,
                sources: ragSources,
              }) + '\n')
            )
          } else {
            // 没有 usage，只发送完成信号（但也可能包含 sources）
            controller.enqueue(
              encoder.encode(JSON.stringify({
                done: true,
                content: accumulatedContent,
                sources: ragSources,
              }) + '\n')
            )
          }

          // 🧠 异步检查并更新对话总结（不阻塞响应）
          // 每 10 轮对话自动生成总结，减少 token 消耗
          checkAndUpdateSummary(chatId).catch(err => {
            console.error('[chat-stream] Summary check error:', err)
          })
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
