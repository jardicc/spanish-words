import { describe, it, expect } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import quizReducer, { type QuizState } from "../src/store/quizSlice";
import {
  selectStrategyStats,
  selectScoreTotals,
  selectMasteredCount,
  selectAttemptedCount,
  selectProgressPercent,
  selectTotalWords,
  selectHasMultipleDatasets,
} from "../src/store/selectors";
import type { RootState } from "../src/store/index";

function makeState(partial: Partial<QuizState>): RootState {
  const base = quizReducer(undefined, { type: "@@INIT" });
  return { quiz: { ...base, ...partial } } as RootState;
}

describe("selectStrategyStats", () => {
  it("filters stats by current strategy keyPrefix", () => {
    const state = makeState({
      strategyIndex: 0, // keyPrefix "es"
      stats: {
        "es:gato": { correct: 3, incorrect: 1 },
        "es:casa": { correct: 2, incorrect: 0 },
        "cs:gato": { correct: 1, incorrect: 1 },
        "article:gato": { correct: 5, incorrect: 0 },
      },
    });
    const result = selectStrategyStats(state);
    expect(Object.keys(result)).toEqual(["es:gato", "es:casa"]);
  });

  it("returns stats for cs: prefix when strategy 1 is active", () => {
    const state = makeState({
      strategyIndex: 1, // keyPrefix "cs"
      stats: {
        "es:gato": { correct: 3, incorrect: 1 },
        "cs:gato": { correct: 1, incorrect: 1 },
        "cs:casa": { correct: 2, incorrect: 0 },
      },
    });
    const result = selectStrategyStats(state);
    expect(Object.keys(result)).toEqual(["cs:gato", "cs:casa"]);
  });

  it("returns empty object when no stats match prefix", () => {
    const state = makeState({
      strategyIndex: 2, // keyPrefix "article"
      stats: {
        "es:gato": { correct: 3, incorrect: 1 },
      },
    });
    const result = selectStrategyStats(state);
    expect(result).toEqual({});
  });
});

describe("selectScoreTotals", () => {
  it("sums correct and incorrect across strategy stats", () => {
    const state = makeState({
      strategyIndex: 0,
      stats: {
        "es:gato": { correct: 3, incorrect: 1 },
        "es:casa": { correct: 2, incorrect: 2 },
      },
    });
    const { correct, incorrect, rate } = selectScoreTotals(state);
    expect(correct).toBe(5);
    expect(incorrect).toBe(3);
    expect(rate).toBe(63); // 5/8 = 62.5 → rounds to 63
  });

  it("returns rate 0 when no attempts", () => {
    const state = makeState({ strategyIndex: 0, stats: {} });
    const { correct, incorrect, rate } = selectScoreTotals(state);
    expect(correct).toBe(0);
    expect(incorrect).toBe(0);
    expect(rate).toBe(0);
  });
});

describe("selectMasteredCount", () => {
  it("counts words with ≥80% success and ≥3 attempts", () => {
    const state = makeState({
      strategyIndex: 0,
      stats: {
        "es:gato": { correct: 4, incorrect: 1 },   // 80%, 5 attempts → mastered
        "es:casa": { correct: 3, incorrect: 0 },    // 100%, 3 attempts → mastered
        "es:perro": { correct: 2, incorrect: 1 },   // 67%, 3 attempts → not mastered
        "es:mesa": { correct: 2, incorrect: 0 },    // 100%, 2 attempts → not enough attempts
      },
    });
    expect(selectMasteredCount(state)).toBe(2);
  });
});

describe("selectAttemptedCount", () => {
  it("counts number of words with any stats for this strategy", () => {
    const state = makeState({
      strategyIndex: 0,
      stats: {
        "es:gato": { correct: 1, incorrect: 0 },
        "es:casa": { correct: 0, incorrect: 1 },
        "cs:gato": { correct: 5, incorrect: 0 },
      },
    });
    expect(selectAttemptedCount(state)).toBe(2); // only es: prefix
  });
});

describe("selectProgressPercent", () => {
  it("returns percentage of mastered words", () => {
    const words = [
      { rank: 1, article: "el", word: "gato", translation: "kočka", partOfSpeech: "noun" },
      { rank: 2, article: "la", word: "casa", translation: "dům", partOfSpeech: "noun" },
      { rank: 3, article: "", word: "correr", translation: "běžet", partOfSpeech: "verb" },
      { rank: 4, article: "el", word: "perro", translation: "pes", partOfSpeech: "noun" },
    ];
    const state = makeState({
      strategyIndex: 0,
      words,
      stats: {
        "es:gato": { correct: 5, incorrect: 0 },  // mastered
        "es:casa": { correct: 5, incorrect: 0 },   // mastered
        "es:correr": { correct: 0, incorrect: 3 }, // not mastered
      },
    });
    expect(selectProgressPercent(state)).toBe(50); // 2/4
  });

  it("returns 0 when no words loaded", () => {
    const state = makeState({ strategyIndex: 0, words: [], stats: {} });
    expect(selectProgressPercent(state)).toBe(0);
  });
});

describe("selectTotalWords", () => {
  it("returns all words count for strategies without wordsFilter", () => {
    const words = [
      { rank: 1, article: "el", word: "gato", translation: "kočka", partOfSpeech: "noun" },
      { rank: 2, article: "", word: "correr", translation: "běžet", partOfSpeech: "verb" },
    ];
    const state = makeState({ strategyIndex: 0, words });
    expect(selectTotalWords(state)).toBe(2);
  });

  it("returns filtered count for article strategy (only nouns with articles)", () => {
    const words = [
      { rank: 1, article: "el", word: "gato", translation: "kočka", partOfSpeech: "noun" },
      { rank: 2, article: "", word: "correr", translation: "běžet", partOfSpeech: "verb" },
      { rank: 3, article: "la", word: "casa", translation: "dům", partOfSpeech: "noun" },
    ];
    const state = makeState({ strategyIndex: 2, words }); // article strategy
    expect(selectTotalWords(state)).toBe(2); // only gato and casa
  });
});

describe("selectHasMultipleDatasets", () => {
  it("returns true for 2+ datasets", () => {
    const state = makeState({ datasets: ["a.csv", "b.csv"] });
    expect(selectHasMultipleDatasets(state)).toBe(true);
  });

  it("returns false for 0 or 1 dataset", () => {
    expect(selectHasMultipleDatasets(makeState({ datasets: [] }))).toBe(false);
    expect(selectHasMultipleDatasets(makeState({ datasets: ["a.csv"] }))).toBe(false);
  });
});
