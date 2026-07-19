import { streamChatCompletion, type ChatMessage } from "@/lib/ai";

const DEFAULT_SYSTEM = `You are a patient Hindi teacher helping someone learn conversational Hindi.
You speak in a mix of Hindi and simple English, always providing Devanagari, transliteration, and meaning.

RULES:
- Always include Devanagari (Hindi script), transliteration (roman), and English meaning
- Give 1-2 new phrases per exchange
- Correct gently when the user makes errors
- Keep responses conversational and practical
- Relate lessons to real-life situations
- If the user speaks Hindi, respond in Hindi with English support`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, systemPrompt } = body as { messages?: ChatMessage[]; systemPrompt?: string };

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Missing 'messages' array" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const systemMsg: ChatMessage = {
      role: "system",
      content: typeof systemPrompt === "string" && systemPrompt.trim() ? systemPrompt.trim() : DEFAULT_SYSTEM,
    };
    const allMessages = [systemMsg, ...messages];
    const stream = await streamChatCompletion(allMessages, { temperature: 0.7, maxTokens: 1024 });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
