/**
 * Per-unit pathway objectives for the AI tutor.
 * Pattern from sanskrithelp lib/tutorPathwayFallback.ts
 */

import type { Pathway } from "./types";

export const PATHWAYS: Record<string, Pathway> = {
  greetings: {
    zone_id: "greetings", label: "Greetings & Introductions", cefr: "A1",
    levels: [
      { level: 1, objectives: ["Greet someone with नमस्ते and ask how they are"] },
      { level: 2, objectives: ["Ask and give your name using आपका नाम क्या है"] },
      { level: 3, objectives: ["Say where you're from and introduce someone else"] },
    ],
  },
  script: {
    zone_id: "script", label: "Devanagari Script & Nouns", cefr: "A1",
    levels: [
      { level: 1, objectives: ["Read and write basic Hindi vowels (अ, आ, इ, ई, उ, ऊ)"] },
      { level: 2, objectives: ["Read and write basic Hindi consonants (क-म)"] },
      { level: 3, objectives: ["Read simple Hindi words and identify masculine/feminine nouns"] },
    ],
  },
  present: {
    zone_id: "present", label: "Present Tense & Daily Life", cefr: "A1",
    levels: [
      { level: 1, objectives: ["Conjugate हूँ/है/हैं correctly with subjects"] },
      { level: 2, objectives: ["Use -ता हूँ/-ती हूँ pattern for daily actions"] },
      { level: 3, objectives: ["Describe your daily routine in simple sentences"] },
      { level: 4, objectives: ["Ask others what they do using क्या करते हो"] },
    ],
  },
  shopping: {
    zone_id: "shopping", label: "Numbers & Shopping", cefr: "A1",
    levels: [
      { level: 1, objectives: ["Count from 1-20 in Hindi"] },
      { level: 2, objectives: ["Count from 20-100 and ask prices using कितने का"] },
      { level: 3, objectives: ["Bargain and complete a purchase in Hindi"] },
    ],
  },
  family: {
    zone_id: "family", label: "Family & Possessives", cefr: "A1",
    levels: [
      { level: 1, objectives: ["Name family members (माँ, पिता, भाई, बहन)"] },
      { level: 2, objectives: ["Use possessives मेरा/मेरी, तुम्हारा/तुम्हारी correctly"] },
      { level: 3, objectives: ["Describe your family using simple sentences"] },
    ],
  },
  future: {
    zone_id: "future", label: "Future Tense & Plans", cefr: "A2",
    levels: [
      { level: 1, objectives: ["Form future tense -ऊँगा/-एगा/-एँगे"] },
      { level: 2, objectives: ["Make plans using time words (कल, आज, बाद में)"] },
      { level: 3, objectives: ["Ask about others' plans"] },
      { level: 4, objectives: ["Use शायद and ज़रूर to express certainty"] },
    ],
  },
  past: {
    zone_id: "past", label: "Past Tense & Experiences", cefr: "A2",
    levels: [
      { level: 1, objectives: ["Form simple past tense -आ/-ए/-ई"] },
      { level: 2, objectives: ["Use ने with transitive verbs in past"] },
      { level: 3, objectives: ["Describe what you did yesterday"] },
      { level: 4, objectives: ["Answer and ask past tense questions"] },
    ],
  },
  food: {
    zone_id: "food", label: "Food & Restaurants", cefr: "A2",
    levels: [
      { level: 1, objectives: ["Name common foods and drinks"] },
      { level: 2, objectives: ["Order food at a restaurant using चाहिए and लूँगा"] },
      { level: 3, objectives: ["State dietary preferences (शाकाहारी) and ask about menu"] },
    ],
  },
  directions: {
    zone_id: "directions", label: "Directions & Location", cefr: "A2",
    levels: [
      { level: 1, objectives: ["Use postpositions में, पर, से, को"] },
      { level: 2, objectives: ["Ask and give directions (दाएँ, बाएँ, सीधा)"] },
      { level: 3, objectives: ["Describe where things are located"] },
    ],
  },
  imperatives: {
    zone_id: "imperatives", label: "Commands & Requests", cefr: "A2",
    levels: [
      { level: 1, objectives: ["Form polite imperatives with -इए"] },
      { level: 2, objectives: ["Use informal imperatives with -ओ"] },
      { level: 3, objectives: ["Make negative commands with मत"] },
    ],
  },
  opinions: {
    zone_id: "opinions", label: "Opinions & Feelings", cefr: "B1",
    levels: [
      { level: 1, objectives: ["Express likes using पसंद है and अच्छा लगना"] },
      { level: 2, objectives: ["Use मुझे लगता है for opinions"] },
      { level: 3, objectives: ["Discuss feelings and reactions"] },
    ],
  },
  perfective: {
    zone_id: "perfective", label: "Perfective & Experiences", cefr: "B1",
    levels: [
      { level: 1, objectives: ["Form present perfect with -आ है/-ए हैं"] },
      { level: 2, objectives: ["Ask about experiences using कभी"] },
      { level: 3, objectives: ["Describe life experiences"] },
    ],
  },
  compound: {
    zone_id: "compound", label: "Compound Verbs & Ability", cefr: "B1",
    levels: [
      { level: 1, objectives: ["Use सकना for ability (can)"] },
      { level: 2, objectives: ["Use कर लेना/देना for completed actions"] },
      { level: 3, objectives: ["Form compound verbs naturally in conversation"] },
    ],
  },
  comparisons: {
    zone_id: "comparisons", label: "Comparisons & More", cefr: "B1",
    levels: [
      { level: 1, objectives: ["Make comparisons using से and like सबसे"] },
      { level: 2, objectives: ["Use relative-correlative structures (जो-वह)"] },
      { level: 3, objectives: ["Express preferences between options"] },
    ],
  },
  narratives: {
    zone_id: "narratives", label: "Narratives & Stories", cefr: "B1",
    levels: [
      { level: 1, objectives: ["Tell a simple story in sequence"] },
      { level: 2, objectives: ["Use connectors (फिर, तब, इसलिए)"] },
      { level: 3, objectives: ["Narrate past experiences in detail"] },
      { level: 4, objectives: ["Summarize a short text or conversation"] },
    ],
  },
};

export function getPathway(zoneId: string): Pathway | null {
  return PATHWAYS[zoneId] ?? null;
}

export function getUnitConstraint(zoneId: string): string {
  const constraints: Record<string, string> = {
    greetings: `CRITICAL: You are teaching Hindi greetings and introductions.
DO teach: नमस्ते, नमस्कार, आप कैसे हैं, मैं ठीक हूँ, आपका नाम क्या है, मेरा नाम ___ है, आपसे मिलकर खुशी हुई, धन्यवाद.
DO NOT teach: past tense, future tense, complex grammar.`,

    present: `CRITICAL: You are teaching Hindi present tense.
DO teach: हूँ/है/हैं conjugation, -ता है pattern, daily routine verbs (सीखना, बोलना, पढ़ना, लिखना, समझना).
DO NOT teach: past tense, future tense, postpositions.`,

    past: `CRITICAL: You are teaching Hindi past tense.
DO teach: simple past -आ/-ए/-ई, ने-construction with transitive verbs, किया/खाया/गया/देखा.
DO NOT teach: present perfect, compound verbs, conditional.`,

    future: `CRITICAL: You are teaching Hindi future tense.
DO teach: -ऊँगा/-एगा/-एँगे endings, time words (कल, आज, बाद में).
DO NOT teach: past tense, perfective aspect.`,

    food: `CRITICAL: You are teaching Hindi food and restaurant vocabulary.
DO teach: चाहिए, लूँगा/लूँगी, food vocabulary (दाल, रोटी, चावल, सब्ज़ी, पानी).
DO NOT teach: unrelated grammar topics.`,

    directions: `CRITICAL: You are teaching Hindi location words and directions.
DO teach: में/पर/के पास/के सामने, दाएँ/बाएँ/सीधा, कहाँ questions.
DO NOT teach: verb conjugation beyond what's needed.`,

    opinions: `CRITICAL: You are teaching expressing opinions in Hindi.
DO teach: पसंद है, अच्छा/बुरा लगना, मुझे लगता है, राय.
DO NOT teach: complex grammar structures beyond B1 level.`,

    perfective: `CRITICAL: You are teaching Hindi perfective aspect.
DO teach: -आ है/-ए हैं/-ई है pattern, कभी (ever), experience-based questions.
DO NOT teach: B2 level structures.`,

    compound: `CRITICAL: You are teaching Hindi compound verbs and ability.
DO teach: सकना (can), कर लेना (finish for self), कर देना (do completely).
DO NOT teach: passive voice, subjunctive mood.`,
  };

  return constraints[zoneId] || "";
}
