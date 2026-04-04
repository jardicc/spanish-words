// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import React from "react";
import { render, q, qAll } from "./render";
import { StrategySelector } from "../src/components/StrategySelector";
import type { Strategy } from "../src/types";

const mockStrategies: Strategy[] = [
  { name: "Strategie A", description: "Popis A", generateQuestion: () => null },
  { name: "Strategie B", description: "Popis B", generateQuestion: () => null },
  { name: "Strategie C", description: "Popis C", generateQuestion: () => null },
];

describe("StrategySelector", () => {
  it("renders all strategy buttons", () => {
    const el = render(
      <StrategySelector strategies={mockStrategies} current={0} onChange={() => {}} />
    );
    const btns = qAll(el, "strategy-btn");
    expect(btns.length).toBe(3);
    expect(btns[0]!.textContent).toBe("Strategie A");
    expect(btns[1]!.textContent).toBe("Strategie B");
    expect(btns[2]!.textContent).toBe("Strategie C");
  });

  it("marks the current strategy as active", () => {
    const el = render(
      <StrategySelector strategies={mockStrategies} current={1} onChange={() => {}} />
    );
    const btns = qAll(el, "strategy-btn");
    expect(btns[0]!.getAttribute("data-active")).toBe("false");
    expect(btns[1]!.getAttribute("data-active")).toBe("true");
    expect(btns[2]!.getAttribute("data-active")).toBe("false");
  });

  it("sets title from strategy description", () => {
    const el = render(
      <StrategySelector strategies={mockStrategies} current={0} onChange={() => {}} />
    );
    const btns = qAll(el, "strategy-btn");
    expect(btns[0]!.getAttribute("title")).toBe("Popis A");
    expect(btns[1]!.getAttribute("title")).toBe("Popis B");
    expect(btns[2]!.getAttribute("title")).toBe("Popis C");
  });

  it("renders empty when no strategies", () => {
    const el = render(
      <StrategySelector strategies={[]} current={0} onChange={() => {}} />
    );
    expect(q(el, "strategy-selector")).not.toBeNull();
    expect(qAll(el, "strategy-btn").length).toBe(0);
  });
});
