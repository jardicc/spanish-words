import React, { useEffect, useState, useCallback } from "react";
import type { WordEntry, StatsMap, QuizQuestion, FeedbackState, Strategy } from "./types";
import { allStrategies } from "./strategies";
import { loadStats, saveAnswer } from "./stats-client";
import { parseCSV } from "./csv";

function ProgressBar({ stats, totalWords }: { stats: StatsMap; totalWords: number }) {
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

function StrategySelector({
  strategies,
  current,
  onChange,
}: {
  strategies: Strategy[];
  current: number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="strategy-selector">
      {strategies.map((s, i) => (
        <button
          key={s.name}
          className={`strategy-btn ${i === current ? "active" : ""}`}
          onClick={() => onChange(i)}
          title={s.description}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}

function Feedback({ feedback }: { feedback: FeedbackState }) {
  return (
    <div className={`feedback ${feedback.wasCorrect ? "feedback-correct" : "feedback-incorrect"}`}>
      {feedback.wasCorrect ? (
        <div className="feedback-content">
          <div className="feedback-icon">✓</div>
          <div className="feedback-text">
            <span className="correct-label">Správně!</span>
            <span className="answer-display correct-answer">{feedback.correctAnswer}</span>
          </div>
        </div>
      ) : (
        <div className="feedback-content">
          <div className="feedback-icon">✗</div>
          <div className="feedback-text">
            <div className="feedback-row">
              <span className="wrong-label">Vaše odpověď:</span>
              <span className="answer-display wrong-answer">{feedback.userAnswer}</span>
            </div>
            <div className="feedback-row">
              <span className="correct-reveal-label">Správná odpověď:</span>
              <span className="answer-display correct-reveal">{feedback.correctAnswer}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuizCard({
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

function ScoreDisplay({ stats }: { stats: StatsMap }) {
  const totals = Object.values(stats).reduce(
    (acc, s) => ({ correct: acc.correct + s.correct, incorrect: acc.incorrect + s.incorrect }),
    { correct: 0, incorrect: 0 }
  );
  const total = totals.correct + totals.incorrect;
  const rate = total > 0 ? Math.round((totals.correct / total) * 100) : 0;

  return (
    <div className="score-display">
      <span className="score-correct">✓ {totals.correct}</span>
      <span className="score-incorrect">✗ {totals.incorrect}</span>
      <span className="score-rate">{rate}%</span>
    </div>
  );
}

export default function App() {
  const [words, setWords] = useState<WordEntry[]>([]);
  const [stats, setStats] = useState<StatsMap>({});
  const [strategyIndex, setStrategyIndex] = useState(0);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [loading, setLoading] = useState(true);
  const [pressedKey, setPressedKey] = useState<number | null>(null);

  // Load CSV + stats
  useEffect(() => {
    Promise.all([
      fetch("/api/words").then((r) => r.text()),
      loadStats(),
    ]).then(([csv, savedStats]) => {
      const parsed = parseCSV(csv);
      setWords(parsed);
      setStats(savedStats);
      setLoading(false);
    });
  }, []);

  const generateNextQuestion = useCallback(() => {
    if (words.length === 0) return;
    const strategy = allStrategies[strategyIndex];
    const q = strategy.generateQuestion(words, stats);
    setQuestion(q);
  }, [words, stats, strategyIndex]);

  // Generate question when ready
  useEffect(() => {
    if (!loading && words.length > 0 && !question) {
      generateNextQuestion();
    }
  }, [loading, words, question, generateNextQuestion]);

  const handleAnswer = useCallback(
    async (userAnswer: string, wasCorrect: boolean) => {
      if (!question) return;

      setFeedback({
        correctAnswer: question.correctAnswer,
        userAnswer,
        wasCorrect,
      });

      const newStats = await saveAnswer(question.wordKey, wasCorrect);
      setStats(newStats);

      // Auto-advance after delay - longer for wrong answers (spaced learning)
      setTimeout(
        () => {
          setFeedback(null);
          setQuestion(null);
        },
        wasCorrect ? 800 : 2500
      );
    },
    [question]
  );

  // Keyboard handler
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!question || feedback) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 6 && question.options[num - 1]) {
        setPressedKey(num);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (!question || feedback) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 6 && question.options[num - 1]) {
        setPressedKey(null);
        const opt = question.options[num - 1];
        handleAnswer(opt.label, opt.isCorrect);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [question, feedback, handleAnswer]);

  if (loading) {
    return <div className="loading">Načítám slovíčka...</div>;
  }

  return (
    <div className="app">
      <header className="header">
        <ProgressBar stats={stats} totalWords={words.length} />
        <div className="header-row">
          <StrategySelector
            strategies={allStrategies}
            current={strategyIndex}
            onChange={(i) => {
              setStrategyIndex(i);
              setQuestion(null);
              setFeedback(null);
            }}
          />
          <ScoreDisplay stats={stats} />
        </div>
      </header>

      <main className="main">
        <section className="top-half">
          {feedback && <Feedback feedback={feedback} />}
        </section>

        <section className="bottom-half">
          {question ? (
            <QuizCard question={question} onAnswer={handleAnswer} pressedKey={pressedKey} />
          ) : (
            <div className="all-done">
              🎉 Všechna slovíčka zvládnuta! Zkuste jinou strategii.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
