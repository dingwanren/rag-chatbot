import { convertToModelMessages, streamText, UIMessage } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { pinecone } from "@/lib/pinecone";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getUserPlan, recordUsage } from "@/lib/quota";

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY ?? "",
});

// 从消息中提取内容
const extractTextFromContent = (content: any): string => {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    const textParts = content.filter(
      (part): part is { text: string } =>
        typeof part === "object" && part !== null && "text" in part,
    );
    return textParts.map((p) => p.text).join("\n");
  }

  return "";
};

// 语义搜索（RAG 模式使用）
const semanticSearch = async (query: string) => {
  try {
    const results = await pinecone
      .index("chatbot")
      .namespace("pdf-doc")
      .searchRecords({
        query: {
          topK: 5,
          inputs: { text: query },
        },
      });

    return results.result.hits.map((hit: any) => hit.fields.text).join("\n");
  } catch (error) {
    console.error("semanticSearch error:", error);
    return "";
  }
};

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

/**
 * POST /api/chat
 *
 * 限额控制流程：
 * 1. 调用 check_and_consume RPC 检查并消耗配额
 * 2. 调用 LLM 获取回答
 * 3. 返回 answer + usage 信息
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    const {
      messages,
      chatId,
      mode = 'chat',
      knowledgeBaseId,
    }: {
      messages: UIMessage[];
      chatId?: string;
      mode?: 'chat' | 'rag';
      knowledgeBaseId?: string;
    } = await req.json();

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "消息不能为空" }),
        { status: 400 }
      );
    }

    // ========================================
    // 1. 调用 check_and_consume RPC（调用 LLM 前）
    // ========================================
    const { data: quotaResult, error: quotaError } = await supabase.rpc('check_and_consume', {
      p_user_id: user.id,
      p_tokens: 0, // 先只检查请求次数
    });

    if (quotaError) {
      console.error('[chat] check_and_consume error:', quotaError);
      return new Response(
        JSON.stringify({ 
          error: '系统繁忙，请稍后重试',
          code: 'INTERNAL_ERROR',
        }),
        { status: 500 }
      );
    }

    // 检查配额结果
    if (!(quotaResult as any)?.ok) {
      const result = quotaResult as any;
      console.log('[chat] Quota exceeded:', result);

      return new Response(
        JSON.stringify({ 
          error: result.message || '今日额度已用完',
          code: 'QUOTA_EXCEEDED',
          details: {
            type: result.error_type || 'requests',
            current: result.current ?? 0,
            limit: result.limit ?? 0,
            resetTime: new Date().toISOString().split('T')[0],
            plan: result.plan || 'free',
          }
        }),
        { status: 429 }
      );
    }

    console.log('[chat] Quota check passed');

    // ========================================
    // 2. 准备上下文（RAG 模式）
    // ========================================
    let context = "";
    const ModelMessage = await convertToModelMessages(messages);
    const lastMessage = extractTextFromContent(ModelMessage.at(-1)?.content);

    if (mode === 'rag' && knowledgeBaseId) {
      context = await semanticSearch(lastMessage);
      console.log('[chat] RAG mode, context length:', context.length);
    }

    // ========================================
    // 3. 创建流式响应
    // ========================================
    const result = streamText({
      model: deepseek("deepseek-chat"),
      system: mode === 'rag' && context
        ? `You are a helpful assistant. Please answer based on the following context:\n\n${context}`
        : `You are a helpful assistant.`,
      messages: ModelMessage,
      onFinish: async ({ totalUsage }) => {
        try {
          const promptTokens = totalUsage.inputTokens ?? 0;
          const completionTokens = totalUsage.outputTokens ?? 0;
          const totalTokens = totalUsage.totalTokens ?? 0;

          // 记录 usage 日志
          if (chatId) {
            await recordUsage(
              user.id,
              chatId,
              "deepseek-chat",
              promptTokens,
              completionTokens,
              totalTokens
            );
          }

          // 获取最新的使用量（用于返回给前端）
          const { data: usageData } = await supabase
            .from('user_usage')
            .select('daily_tokens, daily_requests')
            .eq('user_id', user.id)
            .single();

          const currentUsage = {
            daily_tokens: usageData?.daily_tokens ?? 0,
            daily_requests: usageData?.daily_requests ?? 0,
          };

          // 将 usage 信息附加到消息元数据中
          if (chatId) {
            await supabase
              .from('messages')
              .update({
                metadata: {
                  usage: currentUsage,
                },
              })
              .eq('chat_id', chatId)
              .eq('role', 'assistant')
              .order('created_at', { ascending: false })
              .limit(1);
          }
        } catch (error) {
          console.error("onFinish 回调中处理失败:", error);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("/api/chat 错误:", error);

    if (error instanceof Error) {
      if (error.message.includes("未登录")) {
        return new Response(JSON.stringify({ error: "请先登录" }), {
          status: 401,
        });
      }
    }

    return new Response(
      JSON.stringify({ error: "服务器内部错误" }),
      { status: 500 }
    );
  }
}
