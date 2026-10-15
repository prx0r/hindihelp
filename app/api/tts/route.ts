import { NextResponse } from "next/server";

const EDGE_TTS_URL = "https://speech.platform.bing.com/recognize";

const ALLOWED_VOICES = new Set(["hi-IN-SwaraNeural", "hi-IN-MadhurNeural"]);

interface EdgeTTSOptions {
  text: string;
  voice?: string;
  rate?: number;
}

function buildSSML({ text, voice = "hi-IN-SwaraNeural", rate = 0.9 }: EdgeTTSOptions): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hi-IN">
  <voice name="${voice}">
    <prosody rate="${rate}">${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</prosody>
  </voice>
</speak>`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = String(body?.text ?? "").trim().slice(0, 1000);
    if (!text) {
      return NextResponse.json({ fallback: true, message: "Missing text" });
    }

    const requestedVoice = typeof body?.voice === "string" ? body.voice : "hi-IN-SwaraNeural";
    const voice = ALLOWED_VOICES.has(requestedVoice) ? requestedVoice : "hi-IN-SwaraNeural";
    const requestedRate = Number(body?.rate);
    const rate = Number.isFinite(requestedRate)
      ? Math.min(1.5, Math.max(0.5, requestedRate))
      : 0.9;
    const ssml = buildSSML({ text, voice, rate });

    try {
      const tokenRes = await fetch("https://edge-tts-server.com/token", {
        signal: AbortSignal.timeout(5000),
      });
      if (tokenRes.ok) {
        const { token } = await tokenRes.json();
        const audioRes = await fetch(EDGE_TTS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/ssml+xml",
            Authorization: `Bearer ${token}`,
            "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
          },
          body: ssml,
          signal: AbortSignal.timeout(10000),
        });
        if (audioRes.ok) {
          const audioBuffer = await audioRes.arrayBuffer();
          return new Response(audioBuffer, {
            headers: { "Content-Type": "audio/mpeg" },
          });
        }
      }
    } catch {}

    return NextResponse.json({
      fallback: true,
      text,
      voice: "hi-IN",
      message: "Use browser speech synthesis.",
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json({ fallback: true, message: "TTS unavailable" });
  }
}
