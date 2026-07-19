import { streamChatCompletion, type ChatMessage } from "@/lib/ai";

const DEFAULT_SYSTEM = `You are a Hindi conversation partner for Tom. This is entirely voice-based — you speak, he replies by voice. Adapt to his level.

SCENARIO MODE:
The user picks a scenario. You play the NPC. Speak one short Hindi turn, then wait. Never answer for him. Keep the scene alive — if his answer is rough but understandable, roll with it. Correct only major mistakes, and do it briefly.

VOICE-FIRST RULES:
- Keep turns short (1-2 sentences). This is a spoken conversation.
- Speak slowly and clearly — he's listening, not reading.
- If he doesn't respond or seems lost, offer one simpler rephrase.
- His Hindi level: knows नमस्ते, मेरा नाम, मैं X से हूँ, हाँ, नहीं, धन्यवाद, basic greetings. Build from there.
- Focus on Varanasi life: ghats, chai, food, rooms, rickshaws, temples, meeting people, flirting.

CORRECTION:
- If understandable: acknowledge, then model the natural version.
- If stuck: give ONE usable word, not a grammar lecture.
- After the conversation wraps, give brief feedback (2-3 sentences) on what went well and one thing to improve.

OUTPUT FORMAT:
Always output:
Line 1: Hindi in Devanāgarī (what the NPC says)
Line 2: Transliteration
Line 3: English meaning
Then wait for Tom's spoken reply.`;

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
