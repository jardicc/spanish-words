// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import React from "react";
import { render, q } from "./render";
import { ProgressBar } from "../src/components/ProgressBar";
import type { StatsMap } from "../src/types";

describe("ProgressBar", () => {
  it("renders with empty stats", () => {
    const el = render(<ProgressBar stats={{}} totalWords={100} />);
    expect(q(el, "progress-bar")).not.toBeNull();
    expect(q(el, "progress-mastered")!.textContent).toBe("0");
    expect(q(el, "progress-total")!.textContent).toBe("100");
    expect(q(el, "progress-attempted")!.textContent).toBe("0");
    expect(q(el, "progress-percent")!.textContent).toBe("0%");
  });

  it("shows mastered count for words with 100% rate and 3+ attempts", () => {
    const stats: StatsMap = {
      casa: { correct: 5, incorrect: 0 },
      perro: { correct: 3, incorrect: 0 },
      gato: { correct: 2, incorrect: 0 }, // not enough attempts
    };
    const el = render(<ProgressBar stats={stats} totalWords={50} />);
    expect(q(el, "progress-mastered")!.textContent).toBe("2");
    expect(q(el, "progress-total")!.textContent).toBe("50");
    expect(q(el, "progress-attempted")!.textContent).toBe("3");
    expect(q(el, "progress-percent")!.textContent).toBe("4%");
  });

  it("does not count words with errors as mastered", () => {
    const stats: StatsMap = {
      casa: { correct: 10, incorrect: 1 },
    };
    const el = render(<ProgressBar stats={stats} totalWords={10} />);
    expect(q(el, "progress-mastered")!.textContent).toBe("0");
    expect(q(el, "progress-percent")!.textContent).toBe("0%");
  });

  it("renders progress fill width", () => {
    const stats: StatsMap = {
      casa: { correct: 3, incorrect: 0 },
    };
    const el = render(<ProgressBar stats={stats} totalWords={10} />);
    const fill = q(el, "progress-fill") as HTMLElement;
    expect(fill.style.width).toBe("10%");
  });

  it("handles zero totalWords", () => {
    const el = render(<ProgressBar stats={{}} totalWords={0} />);
    expect(q(el, "progress-percent")!.textContent).toBe("0%");
    expect(q(el, "progress-total")!.textContent).toBe("0");
  });
});
