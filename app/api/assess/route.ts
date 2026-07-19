import { chatCompletion } from "@/lib/ai";

const ASSESS_PROMPT = `You are a Hindi pronunciation and grammar coach. Assess the user's spoken Hindi.

Given the user's spoken transcript and the target phrase they were trying to say, evaluate:
1. Accuracy — did they get the words right?
2. Grammar — any errors in verb conjugation, postpositions, gender agreement?
3. Pronunciation notes — common issues for learners

Return a JSON response:
{
  "correct": boolean,
  "score": number (0-100),
  "feedback": string (2-3 sentences of encouraging, specific feedback),
  "errors": string[] (list of specific errors, if any)
}

Be encouraging but honest. If they got it mostly right, say so.`;

export async function POST(req: Request) {
  try {
    const { transcript, target } = await req.json();
    if (!transcript || !target) {
      return new Response(JSON.stringify({ error: "Missing transcript or target" }), { status: 400 });
    }

    const response = await chatCompletion([
      { role: "system", content: ASSESS_PROMPT },
      {
        role: "user",
        content: `Target phrase: "${target}"\nUser said: "${transcript}"\n\nEvaluate this attempt.`,
      },
    ], { temperature: 0.3, maxTokens: 512 });

    try {
      const parsed = JSON.parse(response);
      return new Response(JSON.stringify(parsed), {
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({
        correct: false,
        score: 50,
        feedback: "I heard you. Keep practicing — try matching the exact words next time.",
        errors: ["Could not parse assessment"],
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Assessment error:", error);
    return new Response(JSON.stringify({
      correct: false,
      score: 0,
      feedback: "Assessment service unavailable. Keep practicing!",
      errors: [],
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
