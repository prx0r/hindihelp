/**
 * Tutor progress tracking — localStorage-based.
 * Pattern from sanskrithelp lib/tutor.ts
 */

import type { TutorProgress } from "./types";

const STORAGE_KEY = "hindihelp_tutor_progress";
const MESSAGES_KEY = "hindihelp_tutor_messages";

export const DEFAULT_PROGRESS: TutorProgress = {
  topicsIntroduced: [],
  topicsMastered: [],
  lastTopic: null,
};

export function getTutorMessages(): Array<{ role: string; content: string }> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTutorMessages(msgs: Array<{ role: string; content: string }>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs.slice(-40)));
}

export function getTutorProgress(): TutorProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PROGRESS, ...JSON.parse(raw) } : DEFAULT_PROGRESS;
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveTutorProgress(p: Partial<TutorProgress>): void {
  if (typeof window === "undefined") return;
  const next = { ...getTutorProgress(), ...p };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
