"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Send, Bot, User, Loader2, Volume2, Mic, Square, CheckCircle2, Play, Sparkles } from "lucide-react";
import scenariosData from "@/data/campaign.json";
import { playHindiTTS } from "@/lib/audio";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  stage: number;
  objective: string;
  pattern: string;
  hints: string[];
  npcScript: { speaker: string; hindi: string; transliteration: string; english: string }[];
}

const scenarios = scenariosData as Scenario[];

function ScenarioSelector({ onPick }: { onPick: (s: Scenario) => void }) {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem("hindihelp_recent_scenarios") || "[]");
      setRecent(r);
    } catch {}
  }, []);

  const recentScenarios = recent
    .map((id) => scenarios.find((s) => s.id === id))
    .filter(Boolean) as Scenario[];

  return (
    <div className="min-h-[80vh]">
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold mb-1">नमस्ते! बोलिए</h1>
        <p className="text-muted-foreground text-sm">Pick a situation. Speak Hindi. The AI plays the other person.</p>
      </div>

      {recentScenarios.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Recent</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {recentScenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => onPick(s)}
                className="shrink-0 px-4 py-2 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-sm font-medium text-primary transition-colors"
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-2">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => onPick(s)}
            className="text-left w-full rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 p-4 transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                {s.stage}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold group-hover:text-primary">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.subtitle}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">{s.objective}</p>
              </div>
              <Play className="w-5 h-5 shrink-0 mt-1 text-muted-foreground group-hover:text-primary" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ScenarioChat({ scenario, onBack }: { scenario: Scenario; onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [phase, setPhase] = useState<"starting" | "active" | "feedback">("starting");
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [hintLevel, setHintLevel] = useState(0);
  const [showTranslit, setShowTranslit] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [feedback, setFeedback] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-play assistant audio
  useEffect(() => {
    if (!autoPlay) return;
    const last = messages[messages.length - 1];
    if (last?.role === "assistant") {
      const hindiMatch = last.content.match(/^([\u0900-\u097F\s]+)/m);
      if (hindiMatch) {
        const timeout = setTimeout(() => playHindiTTS(hindiMatch[1]), 400);
        return () => clearTimeout(timeout);
      }
    }
  }, [messages, autoPlay]);

  // Start scenario
  useEffect(() => {
    if (phase !== "starting") return;
    setPhase("active");
    setLoading(true);

    const npcLines = scenario.npcScript.slice(0, 2).map(d => `${d.speaker}: ${d.hindi}`);
    const sceneContext = scenario.npcScript.map(d =>
      `${d.speaker} ("${d.hindi}" — ${d.transliteration} — ${d.english})`
    ).join("\n");

    const scenarioPrompt = `You are playing a scene in Varanasi.

SCENARIO: ${scenario.title} — ${scenario.objective}
YOUR ROLE: The person Tom is talking to (${scenario.npcScript[0]?.speaker || "a local"}).

START: Greet Tom naturally and begin the scenario. Speak only your first line. Wait for his reply.

Here is the scene outline (use as reference, don't recite it):
${sceneContext}`;

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Start the scene. I'm Tom and I'm ready." }],
        systemPrompt: scenarioPrompt,
      }),
    })
      .then(async (res) => {
        const reader = res.body?.getReader();
        if (!reader) return;
        const decoder = new TextDecoder();
        let full = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed?.choices?.[0]?.delta?.content;
              if (delta) full += delta;
            } catch {}
          }
        }
        if (full) {
          setMessages([{ role: "assistant", content: full }]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [phase, scenario]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setHintLevel(0);
    setShowTranslit(false);
    setShowEnglish(false);

    const userMsg: Message = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    const chatHistory = updated.map(m => ({ role: m.role, content: m.content }));
    const npcContext = scenario.npcScript.map(d =>
      `${d.speaker} ("${d.hindi}" — ${d.english})`
    ).join("\n");

    const systemMsg = `You are the NPC in this Varanasi scene: "${scenario.title}".
Scene outline (reference): ${npcContext}

Rules:
- Speak one short Hindi turn, then wait.
- If Tom's Hindi is understandable, continue the scene naturally.
- If it's off but close, acknowledge then model the natural version briefly.
- If he's stuck, give a hint (just the key word).
- After 4-6 exchanges, wrap the scene naturally and offer to give feedback.
- Output should start with the Hindi line in Devanāgarī, then transliteration, then English.`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory, systemPrompt: systemMsg }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (delta) full += delta;
          } catch {}
        }
      }
      if (full) {
        setMessages(m => [...m, { role: "assistant", content: full }]);

        // Check if scene is wrapping up
        if (full.toLowerCase().includes("feedback") || messages.length > 10) {
          generateFeedback([...updated, { role: "assistant", content: full }]);
        }
      }
    } catch {}
    setLoading(false);
  }

  async function generateFeedback(msgs: Message[]) {
    try {
      const history = msgs.map(m => m.content).join("\n");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Review this Hindi conversation and give 2-3 sentences of encouraging feedback on what went well and one thing to improve:\n\n${history}` }],
          systemPrompt: "You are a Hindi teacher. Give brief, encouraging feedback on a spoken Hindi practice session. 2-3 sentences max.",
        }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (delta) full += delta;
          } catch {}
        }
      }
      if (full) setFeedback(full);
      setPhase("feedback");
    } catch {
      setFeedback("Great practice! Keep speaking — the more you try, the faster you improve.");
      setPhase("feedback");
    }
  }

  async function startRecording() {
    audioChunks.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
    mediaRecorder.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.current.push(e.data);
    };

    recorder.onstop = async () => {
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
        setTranscribing(false);
        if (transcript.trim()) {
          await sendMessage(transcript.trim());
        }
      } catch {
        setTranscribing(false);
      }
    };

    recorder.start();
    setRecording(true);
    setTimeout(() => {
      if (recorder.state !== "inactive") recorder.stop();
    }, 8000);
  }

  function stopRecording() {
    setRecording(false);
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
    }
  }

  const lastMsg = messages[messages.length - 1];

  if (phase === "feedback") {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-4" />
        <h2 className="text-xl font-bold mb-1">Practice Complete!</h2>
        <p className="text-sm text-muted-foreground mb-2">Scenario: {scenario.title}</p>
        {feedback && (
          <div className="max-w-md rounded-xl border border-border bg-card p-4 mb-6 text-sm">
            {feedback}
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={() => { setPhase("starting"); setMessages([]); setFeedback(""); }} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
            Try Again
          </button>
          <button onClick={onBack} className="px-5 py-2.5 rounded-xl border border-border text-sm">
            More Scenarios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-accent">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">{scenario.title}</h2>
          <p className="text-xs text-muted-foreground truncate">{scenario.objective}</p>
        </div>
        <button
          onClick={() => setAutoPlay(!autoPlay)}
          className={`text-xs px-2 py-1 rounded-lg border ${autoPlay ? "border-emerald-500/50 text-emerald-400" : "border-border text-muted-foreground"}`}
        >
          <Volume2 className="w-3 h-3 inline mr-1" />
          {autoPlay ? "Audio ON" : "OFF"}
        </button>
      </div>

      {/* Hint drawer */}
      {hintLevel > 0 && (
        <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          <p className="text-xs text-amber-400 mb-1">Hint {hintLevel}/{scenario.hints.length}</p>
          <p>{scenario.hints[hintLevel - 1]}</p>
        </div>
      )}

      {/* Recording indicator */}
      {recording && (
        <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 p-2 flex items-center justify-between">
          <span className="text-sm text-red-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Speak in Hindi...
          </span>
          <button onClick={stopRecording} className="text-sm text-red-400"><Square className="w-3 h-3" /></button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {loading && messages.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Starting scenario...
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-amber-400" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              m.role === "user"
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-card border border-border rounded-tl-sm"
            }`}>
              {m.role === "assistant" ? (
                <>
                  <p className={m.content.match(/[\u0900-\u097F]/) ? "text-base leading-relaxed" : ""}>
                    {m.content.split("\n")[0]}
                  </p>
                  {(showTranslit || showEnglish) && (
                    <div className="mt-1 pt-1 border-t border-border/50 space-y-0.5">
                      {showTranslit && m.content.split("\n")[1] && (
                        <p className="text-xs text-muted-foreground italic">{m.content.split("\n")[1]}</p>
                      )}
                      {showEnglish && m.content.split("\n")[2] && (
                        <p className="text-xs text-muted-foreground">{m.content.split("\n")[2]}</p>
                      )}
                    </div>
                  )}
                  {i === messages.length - 1 && (
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => setShowTranslit(!showTranslit)} className="text-[10px] text-muted-foreground hover:text-primary">
                        {showTranslit ? "Hide" : "Show"} translit
                      </button>
                      <button onClick={() => setShowEnglish(!showEnglish)} className="text-[10px] text-muted-foreground hover:text-primary">
                        {showEnglish ? "Hide" : "Show"} English
                      </button>
                      <button onClick={() => { const h = m.content.match(/[\u0900-\u097F\s]+/); if (h) playHindiTTS(h[0]); }} className="text-[10px] text-muted-foreground hover:text-primary">
                        <Volume2 className="w-3 h-3 inline" /> Hear
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p>{m.content}</p>
              )}
            </div>
            {m.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="rounded-xl bg-card border border-border px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
        {transcribing && (
          <div className="flex justify-end">
            <div className="rounded-xl bg-primary/20 px-3 py-2 text-sm text-muted-foreground flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Listening...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input area */}
      <div className="flex gap-2 shrink-0">
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={transcribing || loading}
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${
            recording
              ? "bg-red-600 text-white animate-pulse scale-110"
              : "bg-primary text-primary-foreground hover:bg-primary/80"
          } disabled:opacity-40`}
        >
          {recording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
            }}
            placeholder="Or type your reply..."
            rows={1}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm resize-none focus:outline-none focus:border-primary"
          />
        </div>
        <button
          onClick={() => {
            if (hintLevel < scenario.hints.length) setHintLevel(h => h + 1);
          }}
          className="w-12 h-12 rounded-xl border border-border hover:bg-accent flex items-center justify-center text-muted-foreground"
          title="Hint"
        >
          <Sparkles className="w-4 h-4" />
        </button>
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* End scene button */}
      {messages.length >= 4 && (
        <button
          onClick={() => generateFeedback(messages)}
          className="mt-2 text-xs text-muted-foreground hover:text-primary text-center"
        >
          End scene & get feedback →
        </button>
      )}
    </div>
  );
}

function ChatRouter() {
  const searchParams = useSearchParams();
  const [scenario, setScenario] = useState<Scenario | null>(null);

  useEffect(() => {
    const sid = searchParams.get("s");
    if (sid) {
      const found = scenarios.find(s => s.id === sid);
      if (found) setScenario(found);
    }
  }, [searchParams]);

  if (scenario) {
    return (
      <ScenarioChat
        scenario={scenario}
        onBack={() => {
          setScenario(null);
          try {
            const r = JSON.parse(localStorage.getItem("hindihelp_recent_scenarios") || "[]");
            const updated = [scenario.id, ...r.filter((x: string) => x !== scenario.id)].slice(0, 5);
            localStorage.setItem("hindihelp_recent_scenarios", JSON.stringify(updated));
          } catch {}
        }}
      />
    );
  }

  return <ScenarioSelector onPick={(s) => setScenario(s)} />;
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
      <ChatRouter />
    </Suspense>
  );
}
