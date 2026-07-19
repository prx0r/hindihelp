/**
 * Zone progression DAG — prerequisites and unlock system.
 * Pattern from sanskrithelp lib/zoneProgress.ts
 */

import { getLessonProgress } from "./lessonProgress";

const STORAGE_KEY = "hindihelp_zone_progress";

export const ZONE_CONFIG: Record<string, { label: string; cefr: string; prerequisites: string[]; order: number; levelCount: number }> = {
  greetings: { label: "Greetings & Introductions", cefr: "A1", prerequisites: [], order: 1, levelCount: 3 },
  script: { label: "Devanagari Script & Nouns", cefr: "A1", prerequisites: ["greetings"], order: 2, levelCount: 3 },
  present: { label: "Present Tense & Daily Life", cefr: "A1", prerequisites: ["script"], order: 3, levelCount: 4 },
  shopping: { label: "Numbers & Shopping", cefr: "A1", prerequisites: ["present"], order: 4, levelCount: 3 },
  family: { label: "Family & Possessives", cefr: "A1", prerequisites: ["shopping"], order: 5, levelCount: 3 },
  future: { label: "Future Tense & Plans", cefr: "A2", prerequisites: ["family"], order: 6, levelCount: 4 },
  past: { label: "Past Tense & Experiences", cefr: "A2", prerequisites: ["future"], order: 7, levelCount: 4 },
  food: { label: "Food & Restaurants", cefr: "A2", prerequisites: ["past"], order: 8, levelCount: 3 },
  directions: { label: "Directions & Location", cefr: "A2", prerequisites: ["food"], order: 9, levelCount: 3 },
  imperatives: { label: "Commands & Requests", cefr: "A2", prerequisites: ["directions"], order: 10, levelCount: 3 },
  opinions: { label: "Opinions & Feelings", cefr: "B1", prerequisites: ["imperatives"], order: 11, levelCount: 3 },
  perfective: { label: "Perfective & Experiences", cefr: "B1", prerequisites: ["opinions"], order: 12, levelCount: 3 },
  compound: { label: "Compound Verbs & Ability", cefr: "B1", prerequisites: ["perfective"], order: 13, levelCount: 3 },
  comparisons: { label: "Comparisons & More", cefr: "B1", prerequisites: ["compound"], order: 14, levelCount: 3 },
  narratives: { label: "Narratives & Stories", cefr: "B1", prerequisites: ["comparisons"], order: 15, levelCount: 4 },
};

export type ZoneId = keyof typeof ZONE_CONFIG;

export interface ZoneProgress {
  completedZones: ZoneId[];
}

function load(): ZoneProgress {
  if (typeof window === "undefined") return { completedZones: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { completedZones: [] };
  } catch {
    return { completedZones: [] };
  }
}

function save(p: ZoneProgress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function isZoneUnlocked(zoneId: string): boolean {
  const cfg = ZONE_CONFIG[zoneId];
  if (!cfg) return false;
  if (cfg.prerequisites.length === 0) return true;
  const p = load();
  return cfg.prerequisites.every((preq) => p.completedZones.includes(preq as ZoneId));
}

export function isZoneTutorUnlocked(zoneId: string): boolean {
  return isZoneUnlocked(zoneId);
}

export function markZoneComplete(zoneId: string): void {
  const p = load();
  if (!p.completedZones.includes(zoneId as ZoneId)) {
    p.completedZones.push(zoneId as ZoneId);
    save(p);
  }
}

export function getCompletedZones(): ZoneId[] {
  return load().completedZones;
}

export function getUnlockedZones(): ZoneId[] {
  return (Object.keys(ZONE_CONFIG) as ZoneId[]).filter(isZoneUnlocked);
}
