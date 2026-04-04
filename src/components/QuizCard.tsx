import React from "react";
import type { QuizQuestion } from "../types";
import "./QuizCard.css";

export function QuizCard({
  question,
  onAnswer,
  pressedKey,
}: {
  question: QuizQuestion;
  onAnswer: (option: string, correct: boolean) => void;
  pressedKey: number | null;
}) {
  return (
    <div className="quiz-card">
      <div className="quiz-prompt">{question.prompt}</div>
      <div className="quiz-options">
        {question.options.map((opt, i) => (
          <button
            key={`${opt.label}-${i}`}
            className={`option-btn${pressedKey === i + 1 ? " option-btn-pressed" : ""}`}
            onClick={() => onAnswer(opt.label, opt.isCorrect)}
          >
            <span className="option-key">{i + 1}</span>
            <span className="option-label">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
