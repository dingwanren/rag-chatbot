import { convertToModelMessages, streamText, UIMessage } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { pinecone } from "@/lib/pinecone";

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY ?? "",
});
// 从消息中提取内容
const extractTextFromContent = (content: any): string => {
  // 如果是字符串，直接返回
  if (typeof content === "string") {
    return content;
  }

  // 如果是数组，提取文本部分
  if (Array.isArray(content)) {
    const textParts = content.filter(
      (part): part is { text: string } =>
        typeof part === "object" && part !== null && "text" in part,
    );
    return textParts.map((p) => p.text).join("\n");
  }

  return "";
};

const semanticSearch = async (query: string) => {
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
};

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const ModelMessage = await convertToModelMessages(messages);
  const lastMessage = extractTextFromContent(ModelMessage.at(-1)?.content);

  const context = await semanticSearch(lastMessage);

  const result = streamText({
    model: deepseek("deepseek-chat"),
    system: `You are a helpful assistant. here is the context:${context}`,
    messages: ModelMessage,
  });

  return result.toUIMessageStreamResponse();
}
