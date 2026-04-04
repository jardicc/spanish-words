import React from "react";
import "./Feedback.css";

export interface FeedbackEntry {
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
}

export function Feedback({ feedback, isFirst }: { feedback: FeedbackEntry; isFirst: boolean }) {
  return (
    <div className="feedback feedback-incorrect" style={isFirst ? undefined : { opacity: 0.35 }}>
      <div className="feedback-content">
        <div className="feedback-icon">⚡</div>
        <div className="feedback-row">
          <span className="log-prompt">{feedback.prompt}</span>
          <span className="log-sep">·</span>
          <span className="log-wrong">{feedback.userAnswer}</span>
          <span className="log-arrow">→</span>
          <span className="log-correct">{feedback.correctAnswer}</span>
        </div>
      </div>
    </div>
  );
}
