import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProgressBar } from "../src/components/ProgressBar";
import type { StatsMap } from "../src/types";

describe("ProgressBar", () => {
  it("renders with empty stats", () => {
    const html = renderToStaticMarkup(<ProgressBar stats={{}} totalWords={100} />);
    expect(html).toContain("Zvládnuto:");
    expect(html).toContain("<strong>0</strong>");
    expect(html).toContain("/ 100");
    expect(html).toContain("Procvičeno:");
    expect(html).toContain("0%");
  });

  it("shows mastered count for words with 100% rate and 3+ attempts", () => {
    const stats: StatsMap = {
      casa: { correct: 5, incorrect: 0 },
      perro: { correct: 3, incorrect: 0 },
      gato: { correct: 2, incorrect: 0 }, // not enough attempts
    };
    const html = renderToStaticMarkup(<ProgressBar stats={stats} totalWords={50} />);
    expect(html).toContain("<strong>2</strong> / 50"); // 2 mastered
    expect(html).toContain("Procvičeno: <strong>3</strong>");
    expect(html).toContain("4%"); // 2/50 = 4%
  });

  it("does not count words with errors as mastered", () => {
    const stats: StatsMap = {
      casa: { correct: 10, incorrect: 1 },
    };
    const html = renderToStaticMarkup(<ProgressBar stats={stats} totalWords={10} />);
    expect(html).toContain("<strong>0</strong> / 10");
    expect(html).toContain("0%");
  });

  it("renders progress fill width", () => {
    const stats: StatsMap = {
      casa: { correct: 3, incorrect: 0 },
    };
    const html = renderToStaticMarkup(<ProgressBar stats={stats} totalWords={10} />);
    expect(html).toContain('width:10%');
  });

  it("handles zero totalWords", () => {
    const html = renderToStaticMarkup(<ProgressBar stats={{}} totalWords={0} />);
    expect(html).toContain("0%");
    expect(html).toContain("/ 0");
  });
});
