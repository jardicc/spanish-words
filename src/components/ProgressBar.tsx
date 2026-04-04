import React from "react";
import type { StatsMap } from "../types";
import "./ProgressBar.css";

export function ProgressBar({ stats, totalWords }: { stats: StatsMap; totalWords: number }) {
  const mastered = Object.values(stats).filter((s) => {
    const total = s.correct + s.incorrect;
    return total >= 3 && s.correct / total >= 0.999;
  }).length;

  const attempted = Object.keys(stats).length;
  const percent = totalWords > 0 ? Math.round((mastered / totalWords) * 100) : 0;

  return (
    <div className="progress-bar" data-test="progress-bar">
      <div className="progress-info">
        <span>Zvládnuto: <strong data-test="progress-mastered">{mastered}</strong> / <strong data-test="progress-total">{totalWords}</strong></span>
        <span>Procvičeno: <strong data-test="progress-attempted">{attempted}</strong></span>
        <span data-test="progress-percent">{percent}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" data-test="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
