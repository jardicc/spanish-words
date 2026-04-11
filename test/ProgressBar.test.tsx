import { describe, it, expect } from "vitest";
import React from "react";
import { renderWithStore, q } from "./render";
import { ProgressBar } from "../src/components/ProgressBar";
import type { StatsMap, WordEntry } from "../src/types";

function makeWords(n: number): WordEntry[] {
  return Array.from({ length: n }, (_, i) => ({
    rank: i + 1,
    article: i % 2 === 0 ? "el" : "",
    word: `word${i}`,
    translation: `trans${i}`,
    partOfSpeech: "noun",
  }));
}

describe("ProgressBar", () => {
  it("renders with empty stats", () => {
    const el = renderWithStore(<ProgressBar />, { stats: {}, words: makeWords(100), strategyIndex: 0 });
    expect(q(el, "progress-bar")).not.toBeNull();
    expect(q(el, "progress-mastered")!.textContent).toBe("0");
    expect(q(el, "progress-total")!.textContent).toBe("100");
    expect(q(el, "progress-attempted")!.textContent).toBe("0");
    expect(q(el, "progress-percent")!.textContent).toBe("0%");
  });

  it("shows mastered count for words with 100% rate and 3+ attempts", () => {
    const stats: StatsMap = {
      "es:casa": { correct: 5, incorrect: 0 },
      "es:perro": { correct: 3, incorrect: 0 },
      "es:gato": { correct: 2, incorrect: 0 },
    };
    const el = renderWithStore(<ProgressBar />, { stats, words: makeWords(50), strategyIndex: 0 });
    expect(q(el, "progress-mastered")!.textContent).toBe("2");
    expect(q(el, "progress-total")!.textContent).toBe("50");
    expect(q(el, "progress-attempted")!.textContent).toBe("3");
    expect(q(el, "progress-percent")!.textContent).toBe("4%");
  });

  it("does not count word with <80% success rate as mastered", () => {
    const stats: StatsMap = {
      "es:casa": { correct: 3, incorrect: 2 },
    };
    const el = renderWithStore(<ProgressBar />, { stats, words: makeWords(10), strategyIndex: 0 });
    expect(q(el, "progress-mastered")!.textContent).toBe("0");
    expect(q(el, "progress-percent")!.textContent).toBe("0%");
  });

  it("counts word at exactly 80% success rate as mastered", () => {
    const stats: StatsMap = {
      "es:casa": { correct: 4, incorrect: 1 },
    };
    const el = renderWithStore(<ProgressBar />, { stats, words: makeWords(10), strategyIndex: 0 });
    expect(q(el, "progress-mastered")!.textContent).toBe("1");
    expect(q(el, "progress-percent")!.textContent).toBe("10%");
  });

  it("counts word above 80% success rate as mastered", () => {
    const stats: StatsMap = {
      "es:casa": { correct: 10, incorrect: 1 },
    };
    const el = renderWithStore(<ProgressBar />, { stats, words: makeWords(10), strategyIndex: 0 });
    expect(q(el, "progress-mastered")!.textContent).toBe("1");
  });

  it("renders progress fill width", () => {
    const stats: StatsMap = {
      "es:casa": { correct: 3, incorrect: 0 },
    };
    const el = renderWithStore(<ProgressBar />, { stats, words: makeWords(10), strategyIndex: 0 });
    const fill = q(el, "progress-fill") as HTMLElement;
    expect(fill.style.width).toBe("10%");
  });

  it("handles zero totalWords", () => {
    const el = renderWithStore(<ProgressBar />, { stats: {}, words: [], strategyIndex: 0 });
    expect(q(el, "progress-percent")!.textContent).toBe("0%");
    expect(q(el, "progress-total")!.textContent).toBe("0");
  });

  it("only counts entries matching the keyPrefix", () => {
    const stats: StatsMap = {
      "es:casa": { correct: 5, incorrect: 0 },
      "cs:casa": { correct: 5, incorrect: 0 },
      "article:casa": { correct: 5, incorrect: 0 },
    };
    const el = renderWithStore(<ProgressBar />, { stats, words: makeWords(10), strategyIndex: 0 });
    expect(q(el, "progress-mastered")!.textContent).toBe("1");
    expect(q(el, "progress-attempted")!.textContent).toBe("1");
  });
});
