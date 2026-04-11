import React from "react";
import { useAppSelector } from "../store/hooks";
import { selectScoreTotals } from "../store/selectors";
import "./ScoreDisplay.css";

export function ScoreDisplay() {
  const { correct, incorrect, rate } = useAppSelector(selectScoreTotals);

  return (
    <div className="score-display" data-test="score-display">
      <span className="score-correct" data-test="score-correct">{correct}</span>
      <span className="score-incorrect" data-test="score-incorrect">{incorrect}</span>
      <span className="score-rate" data-test="score-rate">{rate}%</span>
    </div>
  );
}
