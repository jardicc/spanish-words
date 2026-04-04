import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StrategySelector } from "../src/components/StrategySelector";
import type { Strategy } from "../src/types";

const mockStrategies: Strategy[] = [
  { name: "Strategie A", description: "Popis A", generateQuestion: () => null },
  { name: "Strategie B", description: "Popis B", generateQuestion: () => null },
  { name: "Strategie C", description: "Popis C", generateQuestion: () => null },
];

describe("StrategySelector", () => {
  it("renders all strategy buttons", () => {
    const html = renderToStaticMarkup(
      <StrategySelector strategies={mockStrategies} current={0} onChange={() => {}} />
    );
    expect(html).toContain("Strategie A");
    expect(html).toContain("Strategie B");
    expect(html).toContain("Strategie C");
  });

  it("marks the current strategy as active", () => {
    const html = renderToStaticMarkup(
      <StrategySelector strategies={mockStrategies} current={1} onChange={() => {}} />
    );
    // Button at index 1 should have "active" class
    expect(html).toContain('class="strategy-btn active"');
    // Buttons at other indices should not
    const activeCount = (html.match(/strategy-btn active/g) || []).length;
    expect(activeCount).toBe(1);
  });

  it("sets title from strategy description", () => {
    const html = renderToStaticMarkup(
      <StrategySelector strategies={mockStrategies} current={0} onChange={() => {}} />
    );
    expect(html).toContain('title="Popis A"');
    expect(html).toContain('title="Popis B"');
    expect(html).toContain('title="Popis C"');
  });

  it("renders empty when no strategies", () => {
    const html = renderToStaticMarkup(
      <StrategySelector strategies={[]} current={0} onChange={() => {}} />
    );
    expect(html).toContain("strategy-selector");
    expect(html).not.toContain("strategy-btn");
  });
});
