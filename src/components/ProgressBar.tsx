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
    <div className="progress-bar">
      <div className="progress-info">
        <span>Zvládnuto: <strong>{mastered}</strong> / {totalWords}</span>
        <span>Procvičeno: <strong>{attempted}</strong></span>
        <span>{percent}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
