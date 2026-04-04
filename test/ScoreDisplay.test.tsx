// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import React from "react";
import { render, q } from "./render";
import { ScoreDisplay } from "../src/components/ScoreDisplay";
import type { StatsMap } from "../src/types";

describe("ScoreDisplay", () => {
  it("renders zeros with empty stats", () => {
    const el = render(<ScoreDisplay stats={{}} />);
    expect(q(el, "score-correct")!.textContent).toBe("0");
    expect(q(el, "score-incorrect")!.textContent).toBe("0");
    expect(q(el, "score-rate")!.textContent).toBe("0%");
  });

  it("sums correct and incorrect across all words", () => {
    const stats: StatsMap = {
      casa: { correct: 5, incorrect: 2 },
      perro: { correct: 3, incorrect: 1 },
    };
    const el = render(<ScoreDisplay stats={stats} />);
    expect(q(el, "score-correct")!.textContent).toBe("8");
    expect(q(el, "score-incorrect")!.textContent).toBe("3");
    expect(q(el, "score-rate")!.textContent).toBe("73%");
  });

  it("shows 100% when all correct", () => {
    const stats: StatsMap = {
      casa: { correct: 10, incorrect: 0 },
    };
    const el = render(<ScoreDisplay stats={stats} />);
    expect(q(el, "score-correct")!.textContent).toBe("10");
    expect(q(el, "score-incorrect")!.textContent).toBe("0");
    expect(q(el, "score-rate")!.textContent).toBe("100%");
  });

  it("score-display element exists", () => {
    const el = render(<ScoreDisplay stats={{}} />);
    expect(q(el, "score-display")).not.toBeNull();
  });
});
