import type { WordEntry, QuizQuestion, QuizOption, StatsMap, Strategy } from "./types";
import { findSimilarWords } from "./levenshtein";
import { MASTERY_THRESHOLD, MASTERY_MIN_ATTEMPTS } from "./constants";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getSuccessRate(stats: StatsMap, key: string): number {
  const s = stats[key];
  if (!s || s.correct + s.incorrect === 0) return 0;
  return s.correct / (s.correct + s.incorrect);
}

function pickWord(words: WordEntry[], stats: StatsMap): WordEntry | null {
  const eligible = words.filter((w) => {
    const key = w.word;
    const s = stats[key];
    if (!s) return true;
    const total = s.correct + s.incorrect;
    if (total < MASTERY_MIN_ATTEMPTS) return true;
    return getSuccessRate(stats, key) < MASTERY_THRESHOLD;
  });

  if (eligible.length === 0) return null;

  // Weight words with lower success rates higher
  const weighted = eligible.map((w) => {
    const rate = getSuccessRate(stats, w.word);
    const s = stats[w.word];
    const total = s ? s.correct + s.incorrect : 0;
    // New words (never seen) get high weight, failed words get higher weight
    const weight = total === 0 ? 5 : Math.max(1, 10 * (1 - rate));
    return { word: w, weight };
  });

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;
  for (const { word, weight } of weighted) {
    random -= weight;
    if (random <= 0) return word;
  }

  return eligible[0];
}

function generateOptions(
  correctAnswer: string,
  allOptions: string[],
  targetField: "word" | "translation",
  words: WordEntry[]
): QuizOption[] {
  const others = allOptions.filter((o) => o !== correctAnswer);

  // 3 similar (Levenshtein)
  const similar = findSimilarWords(correctAnswer, others, 3);

  // 3 random (not already selected)
  const remaining = others.filter((o) => !similar.includes(o));
  const randomPicks = shuffle(remaining).slice(0, 3);

  const distractors = [...similar, ...randomPicks].slice(0, 5);

  const options: QuizOption[] = [
    { label: correctAnswer, isCorrect: true },
    ...distractors.map((d) => ({ label: d, isCorrect: false })),
  ];

  return shuffle(options);
}

// Strategy: Spanish → Czech (translate Spanish word to Czech)
export const spanishToCzechStrategy: Strategy = {
  name: "Španělsky → Česky",
  description: "Zobrazí španělské slovo, vyberte český překlad",
  generateQuestion(words, stats) {
    const entry = pickWord(words, stats);
    if (!entry) return null;

    const allTranslations = words.map((w) => w.translation);
    const options = generateOptions(entry.translation, allTranslations, "translation", words);

    const prompt = entry.article
      ? `${entry.article} ${entry.word}`
      : entry.word;

    return {
      prompt,
      correctAnswer: entry.translation,
      options,
      wordKey: entry.word,
    };
  },
};

// Strategy: Czech → Spanish
export const czechToSpanishStrategy: Strategy = {
  name: "Česky → Španělsky",
  description: "Zobrazí český překlad, vyberte španělské slovo",
  generateQuestion(words, stats) {
    const entry = pickWord(words, stats);
    if (!entry) return null;

    const allWords = words.map((w) =>
      w.article ? `${w.article} ${w.word}` : w.word
    );
    const correctLabel = entry.article
      ? `${entry.article} ${entry.word}`
      : entry.word;
    const options = generateOptions(correctLabel, allWords, "word", words);

    return {
      prompt: entry.translation,
      correctAnswer: correctLabel,
      options,
      wordKey: entry.word,
    };
  },
};

// Strategy: Articles (only nouns with articles)
export const articleStrategy: Strategy = {
  name: "Členy",
  description: "Vyberte správný člen pro podstatné jméno",
  generateQuestion(words, stats) {
    const nouns = words.filter((w) => w.article !== "");
    const entry = pickWord(nouns, stats);
    if (!entry) return null;

    const options: QuizOption[] = [
      { label: "el", isCorrect: entry.article === "el" },
      { label: "la", isCorrect: entry.article === "la" },
    ];

    return {
      prompt: `___ ${entry.word} (${entry.translation})`,
      correctAnswer: entry.article,
      options,
      wordKey: `article:${entry.word}`,
    };
  },
};

export const allStrategies: Strategy[] = [
  spanishToCzechStrategy,
  czechToSpanishStrategy,
  articleStrategy,
];
