/**
 * Lesson/unit progress tracking.
 * Pattern from sanskrithelp lib/lessonProgress.ts
 */

const KEY = "hindihelp_lesson_progress";

export interface LessonProgress {
  completedUnits: string[];
}

function load(): LessonProgress {
  if (typeof window === "undefined") return { completedUnits: [] };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { completedUnits: [], ...JSON.parse(raw) } : { completedUnits: [] };
  } catch {
    return { completedUnits: [] };
  }
}

export function getLessonProgress(): LessonProgress {
  return load();
}

export function markUnitComplete(unitId: string): void {
  const p = load();
  if (!p.completedUnits.includes(unitId)) {
    p.completedUnits.push(unitId);
    localStorage.setItem(KEY, JSON.stringify(p));
  }
}

export function isUnitComplete(unitId: string): boolean {
  return load().completedUnits.includes(unitId);
}
