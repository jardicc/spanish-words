import React from "react";
import { useAppSelector } from "../store/hooks";
import {
  selectMasteredCount,
  selectAttemptedCount,
  selectTotalWords,
  selectProgressPercent,
} from "../store/selectors";
import "./ProgressBar.css";

export function ProgressBar() {
  const mastered = useAppSelector(selectMasteredCount);
  const attempted = useAppSelector(selectAttemptedCount);
  const totalWords = useAppSelector(selectTotalWords);
  const percent = useAppSelector(selectProgressPercent);

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
