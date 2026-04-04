import React from "react";
import type { StatsMap } from "../types";
import "./ScoreDisplay.css";

export function ScoreDisplay({ stats }: { stats: StatsMap }) {
  const totals = Object.values(stats).reduce(
    (acc, s) => ({ correct: acc.correct + s.correct, incorrect: acc.incorrect + s.incorrect }),
    { correct: 0, incorrect: 0 }
  );
  const total = totals.correct + totals.incorrect;
  const rate = total > 0 ? Math.round((totals.correct / total) * 100) : 0;

  return (
    <div className="score-display" data-test="score-display">
      <span className="score-correct" data-test="score-correct">{totals.correct}</span>
      <span className="score-incorrect" data-test="score-incorrect">{totals.incorrect}</span>
      <span className="score-rate" data-test="score-rate">{rate}%</span>
    </div>
  );
}
