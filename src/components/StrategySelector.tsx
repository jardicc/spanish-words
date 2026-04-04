import React from "react";
import type { Strategy } from "../types";
import "./StrategySelector.css";

export function StrategySelector({
  strategies,
  current,
  onChange,
}: {
  strategies: Strategy[];
  current: number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="strategy-selector" data-test="strategy-selector">
      {strategies.map((s, i) => (
        <button
          key={s.name}
          className={`strategy-btn ${i === current ? "active" : ""}`}
          onClick={() => onChange(i)}
          title={s.description}
          data-test="strategy-btn"
          data-active={i === current}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}
