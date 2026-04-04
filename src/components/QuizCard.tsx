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
    <div className="quiz-card" data-test="quiz-card">
      <div className="quiz-prompt" data-test="quiz-prompt">{question.prompt}</div>
      <div className="quiz-options" data-test="quiz-options">
        {question.options.map((opt, i) => (
          <button
            key={`${opt.label}-${i}`}
            className={`option-btn${pressedKey === i + 1 ? (opt.isCorrect ? " option-btn-correct" : " option-btn-wrong") : ""}`}
            onClick={() => onAnswer(opt.label, opt.isCorrect)}
            data-test="option-btn"
            data-pressed={pressedKey === i + 1}
          >
            <span className="option-key" data-test="option-key">{i + 1}</span>
            <span className="option-label" data-test="option-label">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
