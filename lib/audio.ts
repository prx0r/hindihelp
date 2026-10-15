/**
 * TTS orchestration — tries Edge TTS first, falls back to browser speech synthesis.
 * Pattern from sanskrithelp lib/audio.ts
 */

let playingId: string | null = null;

interface BrowserSpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

interface BrowserSpeechRecognitionEvent extends Event {
  results: ArrayLike<ArrayLike<BrowserSpeechRecognitionResult>>;
}

interface BrowserSpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort?(): void;
}

export interface BrowserTranscription {
  transcript: Promise<string>;
  cancel(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  }
}

export function getSpeechRecognizer(): (new () => BrowserSpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function startBrowserTranscription(timeoutMs = 10000): BrowserTranscription {
  const Recognizer = getSpeechRecognizer();
  if (!Recognizer) {
    return {
      transcript: Promise.reject(new Error("Browser speech recognition is unavailable")),
      cancel() {},
    };
  }

  let cancelTranscription = () => {};
  const transcript = new Promise<string>((resolve, reject) => {
    const recognition = new Recognizer();
    let finished = false;
    recognition.lang = "hi-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const cancelRecognition = () => {
      try {
        if (typeof recognition.abort === "function") recognition.abort();
        else recognition.stop();
      } catch {}
    };
    const fail = (error: Error) => {
      if (!finished) {
        finished = true;
        window.clearTimeout(timer);
        cancelRecognition();
        reject(error);
      }
    };
    const timer = window.setTimeout(() => {
      fail(new Error("Browser speech recognition timed out"));
    }, timeoutMs);
    cancelTranscription = () => {
      if (!finished) {
        const cancelled = new Error("Browser speech recognition was cancelled");
        (cancelled as { cancelled?: boolean }).cancelled = true;
        fail(cancelled);
      }
    };

    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      const hasFinalResult = Array.from(event.results).some((result) =>
        Array.from(result).some((alternative) => alternative.isFinal)
      );
      if (text && hasFinalResult && !finished) {
        finished = true;
        window.clearTimeout(timer);
        try {
          recognition.stop();
        } catch {}
        resolve(text);
      }
    };
    recognition.onerror = () => {
      fail(new Error("Browser speech recognition failed"));
    };
    recognition.onend = () => {
      fail(new Error("Browser speech recognition produced no transcript"));
    };

    try {
      recognition.start();
    } catch (error) {
      window.clearTimeout(timer);
      reject(error instanceof Error ? error : new Error("Unable to start speech recognition"));
    }
  });

  return { transcript, cancel: () => cancelTranscription() };
}

export function transcribeWithBrowser(timeoutMs = 10000): Promise<string> {
  return startBrowserTranscription(timeoutMs).transcript;
}

export function isTranscriptionCancelled(error: unknown): boolean {
  return (
    error instanceof Error && (error as { cancelled?: boolean }).cancelled === true
  );
}

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
