"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Mic, MessageSquare, Sparkles, ChevronRight, BookOpen } from "lucide-react";
import scenariosData from "@/data/campaign.json";

const scenarios = scenariosData as { id: string; title: string; subtitle: string; stage: number; objective: string }[];

export default function HomePage() {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem("hindihelp_recent_scenarios") || "[]"));
    } catch {}
  }, []);

  const recentScenarios = recent
    .map((id) => scenarios.find((s) => s.id === id))
    .filter(Boolean) as typeof scenarios;

  return (
    <div className="min-h-[80vh]">
      <div className="text-center py-6 mb-4">
        <h1 className="text-3xl font-bold mb-1">नमस्ते! बोलिए</h1>
        <p className="text-muted-foreground text-sm">Speak Hindi with AI-powered scenarios set in Varanasi</p>
      </div>

      {/* Primary CTA */}
      <Link
        href="/chat"
        className="block mb-6 rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 hover:bg-primary/10 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
            <Mic className="w-7 h-7 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold group-hover:text-primary">Start Speaking</h2>
            <p className="text-sm text-muted-foreground">Pick a situation, talk to the AI, get feedback</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </Link>

      {/* Recent */}
      {recentScenarios.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Continue</h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recentScenarios.map((s) => (
              <Link
                key={s.id}
                href={`/chat?s=${s.id}`}
                className="shrink-0 px-4 py-2 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-sm font-medium text-primary transition-colors"
              >
                <Sparkles className="w-3 h-3 inline mr-1" />
                {s.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Scenario grid */}
      <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Scenarios</h3>
      <div className="grid gap-2 mb-8">
        {scenarios.slice(0, 6).map((s) => (
          <Link
            key={s.id}
            href={`/chat?s=${s.id}`}
            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
              {s.stage}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm group-hover:text-primary">{s.title}</p>
              <p className="text-xs text-muted-foreground truncate">{s.objective.slice(0, 60)}...</p>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-primary" />
          </Link>
        ))}
      </div>

      {/* All scenarios link */}
      <Link
        href="/chat"
        className="block text-center py-3 rounded-xl border border-border hover:bg-accent text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        All {scenarios.length} scenarios →
      </Link>

      {/* Reference */}
      <details className="rounded-xl border border-border">
        <summary className="px-4 py-3 text-sm font-medium cursor-pointer hover:bg-accent rounded-xl">
          <BookOpen className="w-4 h-4 inline mr-2" /> Reference Units
        </summary>
        <div className="px-4 pb-3 space-y-1">
          {["Greetings", "Script & Nouns", "Present Tense", "Shopping", "Family", "Future", "Past", "Food", "Directions", "Commands", "Opinions", "Perfective", "Compound Verbs"].map((u) => (
            <Link key={u} href={`/learn`} className="block text-sm text-muted-foreground hover:text-foreground py-1">
              {u}
            </Link>
          ))}
          <p className="text-xs text-muted-foreground mt-2 italic">Text reference — practice scenarios first for speaking.</p>
        </div>
      </details>
    </div>
  );
}
