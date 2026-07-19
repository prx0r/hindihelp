import { NextResponse } from "next/server";

const WHISPER_URL = "https://chutes-whisper-large-v3.chutes.ai/transcribe";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let audioB64 = body?.audio_b64 ?? body?.args?.audio_b64 ?? body?.audio_base64;

    if (!audioB64 || typeof audioB64 !== "string") {
      return NextResponse.json(
        { error: "Missing audio_b64" },
        { status: 400 }
      );
    }
    audioB64 = audioB64.replace(/\s/g, "");

    const apiKey = process.env.CHUTES_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        fallback: true,
        message: "Transcription not configured. Use browser SpeechRecognition.",
      });
    }

    const payload = { args: { audio_b64: audioB64 } };
    const res = await fetch(WHISPER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const contentType = res.headers.get("content-type") ?? "";
      let text = "";
      if (contentType.includes("text/plain")) {
        text = (await res.text()).trim();
      } else {
        const data = (await res.json()) as Record<string, unknown>;
        text = (data?.text as string) ?? "";
      }
      return NextResponse.json({ text });
    }

    const lastErr = await res.text();
    console.error("Whisper error:", lastErr);
    return NextResponse.json({ error: `Transcription failed` }, { status: 400 });
  } catch (error) {
    console.error("Transcribe error:", error);
    return NextResponse.json({
      fallback: true,
      message: "Transcription unavailable. Use browser SpeechRecognition.",
    });
  }
}
