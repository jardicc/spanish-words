import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ScoreDisplay } from "../src/components/ScoreDisplay";
import type { StatsMap } from "../src/types";

describe("ScoreDisplay", () => {
  it("renders zeros with empty stats", () => {
    const html = renderToStaticMarkup(<ScoreDisplay stats={{}} />);
    expect(html).toContain("✓ 0");
    expect(html).toContain("✗ 0");
    expect(html).toContain("0%");
  });

  it("sums correct and incorrect across all words", () => {
    const stats: StatsMap = {
      casa: { correct: 5, incorrect: 2 },
      perro: { correct: 3, incorrect: 1 },
    };
    const html = renderToStaticMarkup(<ScoreDisplay stats={stats} />);
    expect(html).toContain("✓ 8");
    expect(html).toContain("✗ 3");
    expect(html).toContain("73%"); // 8/11 = 72.7 → 73
  });

  it("shows 100% when all correct", () => {
    const stats: StatsMap = {
      casa: { correct: 10, incorrect: 0 },
    };
    const html = renderToStaticMarkup(<ScoreDisplay stats={stats} />);
    expect(html).toContain("✓ 10");
    expect(html).toContain("✗ 0");
    expect(html).toContain("100%");
  });

  it("has correct CSS classes", () => {
    const html = renderToStaticMarkup(<ScoreDisplay stats={{}} />);
    expect(html).toContain("score-display");
    expect(html).toContain("score-correct");
    expect(html).toContain("score-incorrect");
    expect(html).toContain("score-rate");
  });
});
