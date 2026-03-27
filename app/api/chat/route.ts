import { convertToModelMessages, streamText, UIMessage } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { pinecone } from "@/lib/pinecone";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUser,
  getUserPlan,
  checkAndUpdateLimits,
  recordUsage,
} from "@/lib/quota";

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
    return ""; // 搜索失败时返回空字符串
  }
};

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

/**
 * POST /api/chat
 *
 * 支持两种模式：
 * - 普通聊天：直接调用 LLM
 * - RAG 聊天：先检索知识库，再调用 LLM
 *
 * 请求参数：
 * - messages: 消息列表
 * - chatId: 聊天 ID（可选）
 * - mode: 聊天模式 'chat' | 'rag'（可选，默认'chat'）
 * - knowledgeBaseId: 知识库 ID（RAG 模式需要）
 */
export async function POST(req: Request) {
  try {
    // ========================================
    // 1. 验证用户登录
    // ========================================
    const supabase = await createClient();
    const user = await getCurrentUser();

    // ========================================
    // 2. 解析请求参数
    // ========================================
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
    // 3. 获取用户等级
    // ========================================
    const plan = await getUserPlan(user.id);

    // ========================================
    // 4. 预处理：预估 token 消耗（简单估算）
    // ========================================
    const ModelMessage = await convertToModelMessages(messages);
    const lastMessage = extractTextFromContent(ModelMessage.at(-1)?.content);
    const estimatedTokens = Math.ceil(lastMessage.length / 4); // 粗略估算

    // ========================================
    // 5. 检查限额（非 super 用户）
    // ========================================
    if (plan !== "super") {
      const limitCheck = await checkAndUpdateLimits(
        user.id,
        plan,
        estimatedTokens
      );

      if (!limitCheck.success) {
        return new Response(JSON.stringify({ error: limitCheck.error }), {
          status: 429, // Too Many Requests
        });
      }
    }

    // ========================================
    // 6. 根据模式执行不同逻辑
    // ========================================
    let context = "";
    
    if (mode === 'rag' && knowledgeBaseId) {
      // RAG 模式：执行语义搜索
      context = await semanticSearch(lastMessage);
      console.log('[chat] RAG mode, context length:', context.length);
    } else {
      // 普通聊天模式：不使用知识库
      console.log('[chat] Normal chat mode');
    }

    // ========================================
    // 7. 创建流式响应
    // ========================================
    const result = streamText({
      model: deepseek("deepseek-chat"),
      system: mode === 'rag' && context
        ? `You are a helpful assistant. Please answer based on the following context:\n\n${context}`
        : `You are a helpful assistant.`,
      messages: ModelMessage,
      // 在流完成后记录 usage
      onFinish: async ({ totalUsage }) => {
        try {
          const promptTokens = totalUsage.inputTokens ?? 0;
          const completionTokens = totalUsage.outputTokens ?? 0;
          const totalTokens = totalUsage.totalTokens ?? 0;

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
        } catch (error) {
          console.error("onFinish 回调中记录 usage 失败:", error);
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
