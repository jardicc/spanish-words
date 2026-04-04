import React from "react";
import "./Feedback.css";

export interface FeedbackEntry {
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
}

export function Feedback({ feedback, isFirst }: { feedback: FeedbackEntry; isFirst: boolean }) {
  return (
    <div className="feedback feedback-incorrect" data-test="feedback" data-first={isFirst} style={isFirst ? undefined : { opacity: 0.35 }}>
      <div className="feedback-content">
        <div className="feedback-icon" data-test="feedback-icon">⚡</div>
        <div className="feedback-row">
          <span className="log-prompt" data-test="feedback-prompt">{feedback.prompt}</span>
          <span className="log-arrow">→</span>
          <span className="log-correct" data-test="feedback-correct">{feedback.correctAnswer}</span>
          <span className="log-sep">·</span>
          <span className="log-wrong" data-test="feedback-wrong">{feedback.userAnswer}</span>
        </div>
      </div>
    </div>
  );
}
