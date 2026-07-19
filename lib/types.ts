export type CEFRLevel = "A1" | "A2" | "B1";

export interface VocabEntry {
  hindi: string;
  transliteration: string;
  english: string;
}

export interface Dialogue {
  speaker: string;
  hindi: string;
  transliteration: string;
  english: string;
}

export interface Exercise {
  type: "translate" | "fill_blank" | "respond" | "speak";
  prompt: string;
  answer?: string;
}

export interface PathwayLevel {
  level: number;
  objectives: string[];
}

export interface Pathway {
  zone_id: string;
  label: string;
  cefr: CEFRLevel;
  levels: PathwayLevel[];
}

export interface Unit {
  id: string;
  title: string;
  subtitle: string;
  chapter: number;
  cefr: CEFRLevel;
  grammar: string;
  vocabulary: VocabEntry[];
  dialogues: Dialogue[];
  exercises: Exercise[];
}

export interface CampaignStage {
  id: string;
  title: string;
  subtitle: string;
  stage: number;
  objective: string;
  pattern: string;
  vocab: VocabEntry[];
  npcScript: Dialogue[];
  hints: string[];
}

export interface HintLevel {
  level: 1 | 2 | 3 | 4 | 5;
  content: string;
}

export type MasteryLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface MasteryRecord {
  chunkId: string;
  recognition: MasteryLevel;
  productionHint: MasteryLevel;
  productionIndependent: MasteryLevel;
  transfer: MasteryLevel;
  repair: MasteryLevel;
}

export interface GenerativeKernel {
  hindi: string;
  transliteration: string;
  english: string;
  usage: string;
}

export interface SanskritLesson {
  id: string;
  title: string;
  verse: string;
  transliteration: string;
  meaning: string;
  decomposition: string;
  rule: string;
  examples: { input: string; output: string; gloss: string }[];
  drills: { type: "recognise" | "produce"; prompt: string; answer: string }[];
}

export interface UnitProgress {
  completed: boolean;
  chapter: number;
}

export interface TutorProgress {
  topicsIntroduced: string[];
  topicsMastered: string[];
  lastTopic: string | null;
}

export interface AssessmentResult {
  transcript: string;
  correct: boolean;
  feedback: string;
  score: number;
}
