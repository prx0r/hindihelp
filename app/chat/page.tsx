"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Send, Bot, User, Loader2, Volume2, Mic, Square } from "lucide-react";
import unitsData from "@/data/units.json";
import type { Unit } from "@/lib/types";

const units = unitsData as Unit[];

const DEFAULT_GURU = `You are a patient Hindi teacher. Help the user learn conversational Hindi.

RULES:
- Always include Devanagari, transliteration, and English meaning
- Teach 1-2 new phrases per response
- Correct gently when wrong
- Keep responses conversational and practical
- Relate to real-life situations in India
- If the user speaks Hindi, respond in Hindi with English support`;

function makeUnitPrompt(unit: Unit): string {
  return `You are a Hindi teacher helping with Unit ${unit.chapter}: "${unit.title}" (${unit.subtitle}).

Focus on these vocabulary words: ${unit.vocabulary.map(v => `${v.hindi} (${v.english})`).join(", ")}.

Grammar point: ${unit.grammar}

Practice the dialogue context: ${unit.dialogues.map(d => `${d.speaker}: ${d.hindi}`).join("; ")}

Keep the conversation focused on this unit's theme and vocabulary.`;
}

function speakHindi(text: string) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "hi-IN";
    u.rate = 0.75;
    const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith("hi"));
    if (voices.length > 0) u.voice = voices[0];
    speechSynthesis.speak(u);
  } catch {}
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
      <ChatContent />
    </Suspense>
  );
}

function ChatContent() {
  const searchParams = useSearchParams();
  const unitParam = searchParams.get("unit");
  const contextUnit = unitParam ? units.find(u => u.id === unitParam) : null;

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: contextUnit
        ? `नमस्ते! I'm your Hindi tutor. Let's practice Unit ${contextUnit.chapter}: "${contextUnit.title}".\n\nTry saying one of the words from this unit, or ask me a question about the grammar.`
        : `नमस्ते! (Namaste!) I'm your Hindi tutor. Tell me what you'd like to practice — greetings, ordering food, asking directions, or just chat with me in Hindi!\n\nI'll correct you gently and teach new phrases as we go.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const systemPrompt = contextUnit ? makeUnitPrompt(contextUnit) : DEFAULT_GURU;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && voiceEnabled) {
      const hindiMatch = last.content.match(/[ऀ-ॿ\s]+/);
      if (hindiMatch) setTimeout(() => speakHindi(hindiMatch[0]), 500);
    }
  }, [messages, voiceEnabled]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    await submitQuery(q);
  }

  async function submitQuery(q: string) {
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);
    let full = "";

    try {
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...history, { role: "user", content: q }], systemPrompt }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const text = line.slice(6);
          if (text === "[DONE]") continue;
          try {
            const parsed = JSON.parse(text);
            const delta = parsed.choices?.[0]?.delta?.content || "";
            full += delta;
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = { role: "assistant", content: full };
              return copy;
            });
          } catch {}
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Kṣamā kījie — I had trouble connecting. Please try again." },
      ]);
    } finally {
      setLoading(false);
      if (voiceEnabled) {
        const hindiMatch = full.match(/[ऀ-ॿ\s]+/);
        if (hindiMatch) setTimeout(() => speakHindi(hindiMatch[0]), 300);
      }
    }
  }

  const submittedRef = useRef(false);
  const recognitionRef = useRef<any>(null);

  async function startRecording() {
    submittedRef.current = false;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "hi-IN";
      recognition.interimResults = false;
      recognition.continuous = false;
      recognitionRef.current = recognition;
      setRecording(true);

      recognition.onresult = (event: any) => {
        if (submittedRef.current) return;
        submittedRef.current = true;
        const transcript = event.results[event.results.length - 1][0].transcript;
        if (transcript.trim()) {
          setRecording(false);
          submitQuery(transcript.trim());
        }
      };

      recognition.onerror = () => { setRecording(false); };

      recognition.start();
      setTimeout(() => {
        if (recognition && !submittedRef.current) {
          try { recognition.stop(); } catch {}
          startWhisperRecording();
        }
      }, 8000);
      return;
    }

    await startWhisperRecording();
  }

  async function startWhisperRecording() {
    if (submittedRef.current) return;
    try {
      audioChunks.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorder.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      recorder.onstop = async () => {
        if (submittedRef.current) return;
        stream.getTracks().forEach((t) => t.stop());
        setTranscribing(true);
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        const buffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const audioB64 = btoa(binary);

        try {
          const res = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio_b64: audioB64 }),
          });
          const data = await res.json();
          const transcript = data.text || "";
          if (transcript.trim() && !submittedRef.current) {
            submittedRef.current = true;
            await submitQuery(transcript.trim());
          }
        } catch {}
        setTranscribing(false);
      };

      recorder.start();
      setRecording(true);
      setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
      }, 8000);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Mic access needed. Please allow microphone permissions." }]);
    }
  }

  function stopRecording() {
    submittedRef.current = false;
    setRecording(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
    }
  }

  return (
    <div className="min-h-[80vh] py-6 flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <Link
          href={contextUnit ? `/learn/${contextUnit.id}` : "/"}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> {contextUnit ? `Back to ${contextUnit.title}` : "Back"}
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-4 shrink-0">
        <Bot className="w-5 h-5 text-amber-400" />
        <h1 className="text-xl font-bold">
          {contextUnit ? `${contextUnit.title} Tutor` : "Hindi Tutor"}
        </h1>
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`ml-auto text-xs px-2 py-1 rounded-lg border ${
            voiceEnabled ? "border-emerald-500/50 text-emerald-400" : "border-border text-muted-foreground"
          }`}
        >
          <Volume2 className="w-3 h-3 inline mr-1" />
          {voiceEnabled ? "Audio ON" : "Audio OFF"}
        </button>
      </div>

      {recording && (
        <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 flex items-center justify-between shrink-0">
          <span className="text-sm text-red-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Recording... speak in Hindi or English
          </span>
          <button onClick={stopRecording} className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1">
            <Square className="w-4 h-4" /> Stop
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-amber-400" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl p-3 text-sm whitespace-pre-line ${
                m.role === "user"
                  ? "bg-primary/20 text-primary-foreground rounded-tr-sm"
                  : "bg-card border border-border rounded-tl-sm"
              }`}
            >
              {m.content}
              {m.role === "assistant" && voiceEnabled && i === messages.length - 1 && (
                <button
                  onClick={() => {
                    const hindiMatch = m.content.match(/[ऀ-ॿ\s]+/);
                    if (hindiMatch) speakHindi(hindiMatch[0]);
                  }}
                  className="mt-1 text-xs text-muted-foreground hover:text-primary"
                >
                  <Volume2 className="w-3 h-3 inline mr-1" /> Hear Hindi
                </button>
              )}
            </div>
            {m.role === "user" && (
              <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
            )}
          </div>
        ))}
        {transcribing && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-amber-400" />
            </div>
            <div className="rounded-xl bg-card border border-border p-3 text-sm text-muted-foreground">
              Listening...
            </div>
          </div>
        )}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-amber-400" />
            </div>
            <div className="rounded-xl bg-card border border-border p-3">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2 shrink-0">
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={transcribing}
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
            recording
              ? "bg-red-600 text-white animate-pulse"
              : "bg-card border border-border hover:border-primary text-muted-foreground hover:text-primary"
          } disabled:opacity-40`}
        >
          {recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          }}
          placeholder="Type or tap the mic to speak..."
          rows={1}
          className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-card text-sm resize-none focus:outline-none focus:border-primary"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
