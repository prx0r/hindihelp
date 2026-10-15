/**
 * Tutor progress tracking — localStorage-based.
 * Pattern from sanskrithelp lib/tutor.ts
 */

import type { Dialogue, LocalAssessment, Scenario, TutorProgress, Unit } from "./types";

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

export function scenarioFromUnit(unit: Unit): Scenario {
  const npcScript: Dialogue[] =
    unit.dialogues.length > 0
      ? unit.dialogues
      : unit.vocabulary.slice(0, 5).map((entry) => ({
          speaker: "Tutor",
          hindi: entry.hindi,
          transliteration: entry.transliteration,
          english: entry.english,
        }));
  const firstLine = npcScript[0];
  const keyWords = unit.vocabulary
    .slice(0, 4)
    .map((entry) => entry.hindi)
    .join(" · ");

  return {
    id: `unit-${unit.id}`,
    title: unit.title,
    subtitle: unit.subtitle,
    stage: unit.chapter,
    objective: `Practice ${unit.title}: use its vocabulary and dialogue naturally.`,
    pattern: firstLine?.hindi ?? "",
    vocab: unit.vocabulary,
    npcScript,
    hints: [
      `Start with this unit pattern: ${firstLine?.hindi ?? ""}`,
      keyWords ? `Use these key words: ${keyWords}.` : "Use short Hindi sentences from this unit.",
      "Answer in Hindi, then ask one follow-up question.",
    ],
  };
}

function scriptedNpcLines(scenario: Scenario): Dialogue[] {
  const lines = scenario.npcScript.filter(
    (line) => line.speaker.trim().toLowerCase() !== "you"
  );
  if (lines.length > 0) return lines;
  return [
    {
      speaker: "Partner",
      hindi: "समझ गया। और बताइए।",
      transliteration: "Samajh gayā. Aur batāie.",
      english: "Understood. Tell me more.",
    },
  ];
}

export function nextScriptedReply(scenario: Scenario, assistantTurns: number): string {
  const lines = scriptedNpcLines(scenario);
  const line = lines[assistantTurns % lines.length];
  return [
    line.hindi,
    line.transliteration || line.hindi,
    line.english || "Let's keep practicing.",
  ].join("\n");
}

export function normalizeHindi(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[।.,!?;:"'“”‘’()[\]{}<>_\-–—/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function assessLocally(transcript: string, target: string): LocalAssessment {
  const heard = normalizeHindi(transcript);
  const expected = normalizeHindi(target);
  if (!heard) {
    return {
      transcript,
      correct: false,
      score: 0,
      feedback: "I didn't hear any words. Try again a little louder and slower.",
      offline: true,
      missing: expected.split(" ").filter(Boolean),
    };
  }

  const heardTokens = heard.split(" ").filter(Boolean);
  const expectedTokens = expected.split(" ").filter(Boolean);
  const heardSet = new Set(heardTokens);
  const matched = expectedTokens.filter((token) => heardSet.has(token));
  const missing = expectedTokens.filter((token) => !heardSet.has(token));
  const score =
    expectedTokens.length > 0 ? Math.round((matched.length / expectedTokens.length) * 100) : 0;
  const correct = heard === expected || (expectedTokens.length > 0 && missing.length === 0);

  return {
    transcript,
    correct,
    score,
    feedback: correct
      ? "Good match. Your words line up with the target phrase."
      : `I heard “${transcript}”. Focus on: ${missing.slice(0, 5).join(" ") || target}.`,
    offline: true,
    missing: missing.slice(0, 8),
  };
}

export function offlineFeedback(
  scenario: Scenario,
  messages: Array<{ role: string; content: string }>
): string {
  const hindiTurns = messages.filter(
    (message) => message.role === "user" && /[\u0900-\u097F]/.test(message.content)
  ).length;
  return `Good practice in “${scenario.title}”. You produced ${hindiTurns} Hindi turn${
    hindiTurns === 1 ? "" : "s"
  }. Keep practicing this pattern: ${scenario.pattern}`;
}
