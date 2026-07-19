"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, MessageSquare, Mic, ArrowRight, TrendingUp, Target } from "lucide-react";
import unitsData from "@/data/units.json";
import type { Unit } from "@/lib/types";

const units = unitsData as Unit[];

function getProgress(): string[] {
  try {
    const p = localStorage.getItem("hindihelp_progress");
    return p ? JSON.parse(p) : [];
  } catch { return []; }
}

export default function HomePage() {
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    setCompleted(getProgress());
  }, []);

  const nextUnit = units.find((u) => !completed.includes(u.id));

  return (
    <div className="min-h-[80vh]">
      {/* Header */}
      <div className="text-center py-8 mb-6">
        <h1 className="text-4xl font-bold mb-2">नमस्ते!</h1>
        <p className="text-muted-foreground">Learn practical Hindi with an AI tutor</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <BookOpen className="w-5 h-5 mx-auto mb-1 text-primary" />
          <div className="text-lg font-bold">{completed.length}/{units.length}</div>
          <div className="text-xs text-muted-foreground">Units done</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <MessageSquare className="w-5 h-5 mx-auto mb-1 text-amber-400" />
          <div className="text-lg font-bold">∞</div>
          <div className="text-xs text-muted-foreground">AI chat</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <Mic className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
          <div className="text-lg font-bold">✓</div>
          <div className="text-xs text-muted-foreground">Speech practice</div>
        </div>
      </div>

      {/* Continue / Start */}
      {nextUnit && (
        <Link
          href={`/learn/${nextUnit.id}`}
          className="block mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4 hover:bg-primary/10 transition-colors group"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Target className="w-4 h-4 text-primary" />
            Continue your journey
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">
                Unit {nextUnit.chapter}: {nextUnit.title}
              </div>
              <div className="text-sm text-muted-foreground">{nextUnit.subtitle}</div>
            </div>
            <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      )}

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 mb-6">
        <Link
          href="/learn"
          className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors group"
        >
          <BookOpen className="w-6 h-6 text-primary mb-2" />
          <h3 className="font-semibold group-hover:text-primary">All Units</h3>
          <p className="text-sm text-muted-foreground">12 units from beginner to intermediate</p>
        </Link>
        <Link
          href="/chat"
          className="rounded-xl border border-border bg-card p-4 hover:border-amber-500/50 transition-colors group"
        >
          <MessageSquare className="w-6 h-6 text-amber-400 mb-2" />
          <h3 className="font-semibold group-hover:text-amber-400">AI Tutor</h3>
          <p className="text-sm text-muted-foreground">Practice conversation anytime</p>
        </Link>
      </div>

      {/* Unit list preview */}
      <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">All Units</h2>
      <div className="space-y-1">
        {units.map((u) => {
          const done = completed.includes(u.id);
          return (
            <Link
              key={u.id}
              href={`/learn/${u.id}`}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                done
                  ? "bg-emerald-500/10 text-emerald-400/70"
                  : "hover:bg-accent text-foreground/80 hover:text-foreground"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                done ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"
              }`}>
                {done ? "✓" : u.chapter}
              </span>
              <span className={done ? "line-through opacity-60" : ""}>{u.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
