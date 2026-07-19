/**
 * TTS orchestration — tries Edge TTS first, falls back to browser speech synthesis.
 * Pattern from sanskrithelp lib/audio.ts
 */

let playingId: string | null = null;

export function isAudioPlaying() {
  return playingId !== null;
}

export function getPlayingId() {
  return playingId;
}

export function setPlayingId(id: string | null) {
  playingId = id;
}

function speakBrowser(text: string): Promise<void> {
  return new Promise((resolve) => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "hi-IN";
    u.rate = 0.75;
    const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith("hi"));
    if (voices.length > 0) u.voice = voices[0];
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

export async function playHindiTTS(text: string): Promise<void> {
  if (!text) return;

  // Try Edge TTS API first
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: "hi-IN-SwaraNeural", rate: 0.8 }),
    });

    if (res.ok && res.headers.get("Content-Type")?.includes("audio")) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          reject();
        };
        audio.play().catch(reject);
      });
      return;
    }
  } catch {
    // fall through to browser
  }

  // Browser speech synthesis fallback
  await speakBrowser(text);
}
