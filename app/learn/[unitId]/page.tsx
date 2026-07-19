"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import { ArrowLeft, Volume2, Mic, Square, Loader2, CheckCircle2, ChevronRight, BookOpen, MessageSquare } from "lucide-react";
import unitsData from "@/data/units.json";
import type { Unit, AssessmentResult } from "@/lib/types";

const units = unitsData as Unit[];

interface Props {
  params: Promise<{ unitId: string }>;
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

async function playTTS(text: string): Promise<void> {
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
      await audio.play();
      return;
    }
  } catch {}
  speakHindi(text);
}

function useProgress() {
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    try {
      setCompleted(JSON.parse(localStorage.getItem("hindihelp_progress") || "[]"));
    } catch { setCompleted([]); }
  }, []);

  const markComplete = (id: string) => {
    try {
      const p = JSON.parse(localStorage.getItem("hindihelp_progress") || "[]");
      if (!p.includes(id)) {
        p.push(id);
        localStorage.setItem("hindihelp_progress", JSON.stringify(p));
        setCompleted(p);
      }
    } catch {}
  };

  return { completed, markComplete };
}

export default function UnitPage({ params }: Props) {
  const resolved = use(params);
  const unit = units.find((u) => u.id === resolved.unitId);
  const { completed, markComplete } = useProgress();

  const [tab, setTab] = useState<"vocab" | "dialogue" | "practice">("vocab");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [currentPhrase, setCurrentPhrase] = useState<string>("");
  const [exerciseAnswer, setExerciseAnswer] = useState("");
  const [exerciseFeedback, setExerciseFeedback] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  if (!unit) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Unit not found</p>
          <Link href="/learn" className="text-primary hover:underline">← Back to units</Link>
        </div>
      </div>
    );
  }

  const isDone = completed.includes(unit.id);

  async function startRecording(target?: string) {
    if (target) setCurrentPhrase(target);
    setResult(null);
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
        const tres = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio_b64: audioB64 }),
        });
        const tdata = await tres.json();
        const transcript = tdata.text || "";
        setTranscribing(false);

        if (transcript && currentPhrase) {
          setAssessing(true);
          const ares = await fetch("/api/assess", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript, target: currentPhrase }),
          });
          const aresult = await ares.json();
          setResult(aresult);
          setAssessing(false);
        } else if (transcript) {
          // No target, just show transcript
          setResult({ transcript, correct: true, feedback: "Heard you!", score: 100 });
        } else {
          setResult({ transcript: "", correct: false, feedback: "Couldn't hear clearly. Try again.", score: 0 });
        }
      } catch {
        setTranscribing(false);
        setResult({ transcript: "", correct: false, feedback: "Transcription failed. Try again.", score: 0 });
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

  return (
    <div className="min-h-[80vh] pb-20">
      {/* Header */}
      <div className="mb-6">
        <Link href="/learn" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to units
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Unit {unit.chapter}</p>
            <h1 className="text-2xl font-bold">{unit.title}</h1>
            <p className="text-sm text-muted-foreground">{unit.subtitle}</p>
          </div>
          {isDone ? (
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Completed
            </span>
          ) : null}
        </div>

        {/* Grammar tip */}
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">📖 Grammar</p>
          <p className="text-sm">{unit.grammar}</p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 mb-4 border-b border-border">
        {(["vocab", "dialogue", "practice"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors -mb-[1px] ${
              tab === t
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "vocab" ? "📝 Words" : t === "dialogue" ? "💬 Dialogue" : "🎤 Practice"}
          </button>
        ))}
      </div>

      {/* Vocabulary tab */}
      {tab === "vocab" && (
        <div className="space-y-2">
          {unit.vocabulary.map((v, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-xs w-5">{i + 1}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => playTTS(v.hindi)} className="hover:text-primary transition-colors">
                        <Volume2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
                      </button>
                      <span className="font-semibold text-lg">{v.hindi}</span>
                    </div>
                    <p className="text-xs text-muted-foreground italic ml-7">{v.transliteration}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-right">{v.english}</p>
              </div>
            </div>
          ))}

          {/* Mark buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                setTab("dialogue");
              }}
              className="flex-1 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 text-sm font-medium"
            >
              <ChevronRight className="w-4 h-4 inline mr-1" /> Next: Dialogue
            </button>
          </div>
        </div>
      )}

      {/* Dialogue tab */}
      {tab === "dialogue" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-1">
            Read the dialogue. Tap <Volume2 className="w-3 h-3 inline" /> to hear.
          </p>
          {unit.dialogues.map((d, i) => (
            <div key={i} className={`rounded-xl border p-3 ${
              i % 2 === 0 ? "border-amber-500/20 bg-amber-500/5" : "border-emerald-500/20 bg-emerald-500/5"
            }`}>
              <div className="flex items-start gap-2">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${
                  i % 2 === 0 ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                }`}>
                  {d.speaker}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <button onClick={() => playTTS(d.hindi)} className="hover:text-primary">
                      <Volume2 className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                    </button>
                    <span className="font-medium">{d.hindi}</span>
                  </div>
                  <p className="text-xs text-muted-foreground italic">{d.transliteration}</p>
                  <p className="text-xs text-muted-foreground">{d.english}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setTab("vocab")}
              className="px-4 py-2.5 rounded-xl border border-border hover:bg-accent text-sm"
            >
              ← Words
            </button>
            <button
              onClick={() => setTab("practice")}
              className="flex-1 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 text-sm font-medium"
            >
              <ChevronRight className="w-4 h-4 inline mr-1" /> Next: Practice & Speak
            </button>
          </div>
        </div>
      )}

      {/* Practice tab */}
      {tab === "practice" && (
        <div className="space-y-4">
          {/* Speak practice */}
          <div>
            <h3 className="font-semibold mb-2">🎤 Speak & Get Assessed</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Tap record, speak the phrase in Hindi, get feedback on your pronunciation.
            </p>

            {/* Current phrase */}
            <div className="rounded-xl border border-border bg-card p-4 mb-3">
              <p className="text-xs text-muted-foreground mb-1">Say this in Hindi:</p>
              <div className="flex items-center gap-2 mb-1">
                <button onClick={() => playTTS(unit.vocabulary[0]?.hindi || unit.dialogues[0]?.hindi)}>
                  <Volume2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
                </button>
                <span className="text-lg font-semibold">{currentPhrase || unit.vocabulary[0]?.hindi || unit.dialogues[0]?.hindi}</span>
              </div>
              <p className="text-xs text-muted-foreground italic">
                {unit.vocabulary.find(v => v.hindi === currentPhrase)?.transliteration || 
                 unit.dialogues.find(d => d.hindi === currentPhrase)?.transliteration || 
                 unit.vocabulary[0]?.transliteration || unit.dialogues[0]?.transliteration}
              </p>
            </div>

            {/* Word selection */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {unit.vocabulary.slice(0, 5).map((v, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentPhrase(v.hindi);
                    setResult(null);
                  }}
                  className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                    currentPhrase === v.hindi
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  {v.hindi}
                </button>
              ))}
              {unit.dialogues.slice(0, 2).map((d, i) => (
                <button
                  key={`d${i}`}
                  onClick={() => {
                    setCurrentPhrase(d.hindi);
                    setResult(null);
                  }}
                  className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                    currentPhrase === d.hindi
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  {d.hindi}
                </button>
              ))}
            </div>

            {/* Record button */}
            <div className="flex gap-2 items-center">
              <button
                onClick={recording ? stopRecording : () => startRecording(currentPhrase || unit.vocabulary[0]?.hindi)}
                className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  recording
                    ? "bg-red-600 text-white animate-pulse"
                    : "bg-primary text-primary-foreground hover:bg-primary/80"
                }`}
              >
                {recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {recording ? "Stop" : "Record"}
              </button>
              {recording && (
                <span className="text-sm text-red-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Recording...
                </span>
              )}
            </div>

            {/* Transcribing / Assessing states */}
            {transcribing && (
              <div className="mt-3 rounded-xl border border-border bg-card p-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Transcribing your speech...
              </div>
            )}
            {assessing && (
              <div className="mt-3 rounded-xl border border-border bg-card p-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> AI is assessing your pronunciation...
              </div>
            )}

            {/* Result */}
            {result && !transcribing && !assessing && (
              <div className={`mt-3 rounded-xl border p-4 ${
                result.correct
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-amber-500/30 bg-amber-500/10"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {result.correct ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <span className="text-amber-400 text-lg">💪</span>
                  )}
                  <span className="font-semibold">
                    {result.correct ? "Great job!" : "Keep practicing!"}
                  </span>
                  <span className="text-xs ml-auto px-2 py-0.5 rounded-full bg-card border border-border">
                    Score: {result.score}/100
                  </span>
                </div>
                {result.transcript && (
                  <p className="text-sm text-muted-foreground">
                    Heard: <span className="italic">"{result.transcript}"</span>
                  </p>
                )}
                <p className="text-sm mt-1">{result.feedback}</p>
              </div>
            )}
          </div>

          {/* Exercises */}
          <div className="border-t border-border pt-4 mt-4">
            <h3 className="font-semibold mb-2">✍️ Quick Exercises</h3>
            <div className="space-y-2">
              {unit.exercises.slice(0, 3).map((ex, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                      {ex.type}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm">{ex.prompt}</p>
                      {ex.type === "speak" ? (
                        <button
                          onClick={() => {
                            const targetPhrase = unit.vocabulary[0]?.hindi || "";
                            setCurrentPhrase(targetPhrase);
                            if (!recording) startRecording(targetPhrase);
                          }}
                          className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30"
                        >
                          <Mic className="w-3 h-3 inline mr-1" /> Practice Speaking
                        </button>
                      ) : ex.type === "translate" || ex.type === "fill_blank" ? (
                        <div className="mt-2">
                          <input
                            value={exerciseAnswer}
                            onChange={(e) => setExerciseAnswer(e.target.value)}
                            placeholder="Type your answer..."
                            className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
                          />
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => setShowAnswer(true)}
                              className="text-xs text-primary hover:underline"
                            >
                              Show answer
                            </button>
                          </div>
                          {showAnswer && ex.answer && (
                            <p className="text-xs text-emerald-400 mt-1">
                              Answer: {ex.answer}
                            </p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setTab("dialogue");
                          }}
                          className="mt-2 text-xs text-primary hover:underline"
                        >
                          Practice dialogue →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Complete unit button */}
          <button
            onClick={() => markComplete(unit.id)}
            disabled={isDone}
            className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
              isDone
                ? "bg-emerald-600/30 text-emerald-400 cursor-default"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            {isDone ? "Completed ✓" : "Mark Unit Complete"}
          </button>

          {/* Chat with AI about this unit */}
          <Link
            href={`/chat?unit=${unit.id}`}
            className="block w-full py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-center font-medium transition-colors"
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Practice this unit with the AI Tutor
          </Link>
        </div>
      )}
    </div>
  );
}
