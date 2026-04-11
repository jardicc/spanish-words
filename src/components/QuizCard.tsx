import React from "react";
import type { QuizQuestion } from "../types";
import "./QuizCard.css";

export function QuizCard({
  question,
  onAnswer,
  onPressStart,
  pressedKey,
}: {
  question: QuizQuestion;
  onAnswer: (option: string, correct: boolean) => void;
  onPressStart: (optionIndex: number) => void;
  pressedKey: number | null;
}) {
  const pressedIsWrong = pressedKey !== null && !question.options[pressedKey - 1]?.isCorrect;

  return (
    <div className="quiz-card" data-test="quiz-card">
      <div className="quiz-prompt" data-test="quiz-prompt">{question.prompt}</div>
      <div className="quiz-options" data-test="quiz-options">
        {question.options.map((opt, i) => {
          const isPressed = pressedKey === i + 1;
          let extra = "";
          if (isPressed) {
            extra = opt.isCorrect ? " option-btn-correct" : " option-btn-wrong";
          } else if (pressedIsWrong && opt.isCorrect) {
            extra = " option-btn-correct";
          }
          const stateAttr =
            isPressed ? (opt.isCorrect ? "correct" : "wrong") :
            (pressedIsWrong && opt.isCorrect) ? "correct-hint" : undefined;
          return (
            <button
              key={`${opt.label}-${i}`}
              className={`option-btn${extra}`}
              onMouseDown={() => onPressStart(i + 1)}
              onMouseUp={() => onAnswer(opt.label, opt.isCorrect)}
              data-test="option-btn"
              data-pressed={isPressed}
              data-state={stateAttr}
            >
              <span className="option-key" data-test="option-key">{i + 1}</span>
              <span className="option-label" data-test="option-label">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
