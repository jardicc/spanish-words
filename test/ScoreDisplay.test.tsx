import { describe, it, expect } from "vitest";
import React from "react";
import { renderWithStore, q } from "./render";
import { ScoreDisplay } from "../src/components/ScoreDisplay";
import type { StatsMap } from "../src/types";

describe("ScoreDisplay", () => {
  it("renders zeros with empty stats", () => {
    const el = renderWithStore(<ScoreDisplay />, { stats: {}, strategyIndex: 0 });
    expect(q(el, "score-correct")!.textContent).toBe("0");
    expect(q(el, "score-incorrect")!.textContent).toBe("0");
    expect(q(el, "score-rate")!.textContent).toBe("0%");
  });

  it("sums correct and incorrect across all words", () => {
    const stats: StatsMap = {
      "es:casa": { correct: 5, incorrect: 2 },
      "es:perro": { correct: 3, incorrect: 1 },
    };
    const el = renderWithStore(<ScoreDisplay />, { stats, strategyIndex: 0 });
    expect(q(el, "score-correct")!.textContent).toBe("8");
    expect(q(el, "score-incorrect")!.textContent).toBe("3");
    expect(q(el, "score-rate")!.textContent).toBe("73%");
  });

  it("shows 100% when all correct", () => {
    const stats: StatsMap = {
      "es:casa": { correct: 10, incorrect: 0 },
    };
    const el = renderWithStore(<ScoreDisplay />, { stats, strategyIndex: 0 });
    expect(q(el, "score-correct")!.textContent).toBe("10");
    expect(q(el, "score-incorrect")!.textContent).toBe("0");
    expect(q(el, "score-rate")!.textContent).toBe("100%");
  });

  it("score-display element exists", () => {
    const el = renderWithStore(<ScoreDisplay />, { stats: {}, strategyIndex: 0 });
    expect(q(el, "score-display")).not.toBeNull();
  });

  it("only counts entries matching the keyPrefix", () => {
    const stats: StatsMap = {
      "es:casa": { correct: 4, incorrect: 0 },
      "cs:casa": { correct: 10, incorrect: 5 },
      "article:casa": { correct: 2, incorrect: 3 },
    };
    const el = renderWithStore(<ScoreDisplay />, { stats, strategyIndex: 0 });
    expect(q(el, "score-correct")!.textContent).toBe("4");
    expect(q(el, "score-incorrect")!.textContent).toBe("0");
  });
});
