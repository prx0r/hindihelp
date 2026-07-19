"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, BookOpen } from "lucide-react";
import unitsData from "@/data/units.json";
import type { Unit } from "@/lib/types";

const units = unitsData as Unit[];

function getProgress(): string[] {
  try {
    const p = localStorage.getItem("hindihelp_progress");
    return p ? JSON.parse(p) : [];
  } catch { return []; }
}

function markComplete(unitId: string) {
  try {
    const p = getProgress();
    if (!p.includes(unitId)) {
      p.push(unitId);
      localStorage.setItem("hindihelp_progress", JSON.stringify(p));
    }
  } catch {}
}

export default function LearnPage() {
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    setCompleted(getProgress());
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Learning Units</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {units.filter((u) => completed.includes(u.id)).length} of {units.length} completed
      </p>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-muted mb-6 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${(completed.length / units.length) * 100}%` }}
        />
      </div>

      <div className="grid gap-4">
        {units.map((u) => {
          const done = completed.includes(u.id);
          return (
            <Link
              key={u.id}
              href={`/learn/${u.id}`}
              className={`rounded-xl border p-4 transition-all group ${
                done
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg ${
                  done
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-primary/10 text-primary"
                }`}>
                  {done ? <CheckCircle2 className="w-5 h-5" /> : u.chapter}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className={`font-semibold ${done ? "text-emerald-400/70" : ""}`}>
                      {u.title}
                    </h3>
                    {done && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Done</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{u.subtitle}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {u.vocabulary.length} words · {u.dialogues.length} dialogues
                  </p>
                </div>
                <ArrowRight className={`w-5 h-5 shrink-0 mt-2 ${
                  done ? "text-emerald-400/50" : "text-muted-foreground group-hover:text-primary"
                } group-hover:translate-x-1 transition-all`} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
