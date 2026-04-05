import React, { useEffect, useState, useCallback, useRef } from "react";
import type { WordEntry, StatsMap, QuizQuestion } from "./types";
import { allStrategies } from "./strategies";
import { loadStats, saveAnswer, resetStats } from "./stats-client";
import { parseCSV } from "./csv";
import { ProgressBar } from "./components/ProgressBar";
import { StrategySelector } from "./components/StrategySelector";
import { Feedback } from "./components/Feedback";
import type { FeedbackEntry } from "./components/Feedback";
import { QuizCard } from "./components/QuizCard";
import { ScoreDisplay } from "./components/ScoreDisplay";
import { ConfirmDialog } from "./components/ConfirmDialog";
import "./App.css";

export default function App() {
  const [words, setWords] = useState<WordEntry[]>([]);
  const [stats, setStats] = useState<StatsMap>({});
  const [strategyIndex, setStrategyIndex] = useState(0);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [errorLog, setErrorLog] = useState<FeedbackEntry[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);
  const [datasets, setDatasets] = useState<string[]>([]);
  const [dataset, setDataset] = useState<string>("top1000.csv");
  const errorLogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (errorLogRef.current) {
      errorLogRef.current.scrollTop = errorLogRef.current.scrollHeight;
    }
  }, [errorLog]);
  const [loading, setLoading] = useState(true);
  const [pressedKey, setPressedKey] = useState<number | null>(null);

  // Load datasets list once
  useEffect(() => {
    fetch("/api/datasets")
      .then((r) => r.json())
      .then((list: string[]) => {
        setDatasets(list);
        if (list.length > 0) setDataset(list[0]!);
      });
  }, []);

  // Load CSV + stats
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/words?dataset=${encodeURIComponent(dataset)}`).then((r) => r.text()),
      loadStats(dataset),
    ]).then(([csv, savedStats]) => {
      const parsed = parseCSV(csv);
      setWords(parsed);
      setStats(savedStats);
      setQuestion(null);
      setErrorLog([]);
      setLoading(false);
    });
  }, [dataset]);

  const generateNextQuestion = useCallback((withStats?: StatsMap) => {
    if (words.length === 0) return;
    const strategy = allStrategies[strategyIndex];
    if (!strategy) return;
    const q = strategy.generateQuestion(words, withStats ?? stats);
    setQuestion(q);
  }, [words, stats, strategyIndex]);

  // Generate question when ready or when question becomes null (reset, strategy change)
  useEffect(() => {
    if (!loading && words.length > 0 && !question) {
      generateNextQuestion();
    }
  }, [loading, words, question, generateNextQuestion]);

  const handleReset = useCallback(async () => {
    const newStats = await resetStats(dataset);
    setStats(newStats);
    setErrorLog([]);
    setQuestion(null);
    setConfirmReset(false);
  }, [dataset]);

  const handleAnswer = useCallback(
    async (userAnswer: string, wasCorrect: boolean) => {
      if (!question) return;
      if (!wasCorrect) {
        setErrorLog((prev) => [
          ...prev,
          { prompt: question.prompt, userAnswer, correctAnswer: question.correctAnswer },
        ]);
      }
      const newStats = await saveAnswer(question.wordKey, wasCorrect, dataset);
      setStats(newStats);
      generateNextQuestion(newStats);
    },
    [question, generateNextQuestion, dataset]
  );

  // Keyboard handler
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!question) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 6 && question.options[num - 1]) {
        setPressedKey(num);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (!question) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 6 && question.options[num - 1]) {
        setPressedKey(null);
        const opt = question.options[num - 1]!;
        handleAnswer(opt.label, opt.isCorrect);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [question, handleAnswer]);

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
              setErrorLog([]);
            }}
          />
          <ScoreDisplay stats={stats} />
          {datasets.length > 1 && (
            <select
              className="dataset-select"
              value={dataset}
              onChange={(e) => setDataset(e.target.value)}
            >
              {datasets.map((d) => (
                <option key={d} value={d}>{d.replace(/\.csv$/i, "")}</option>
              ))}
            </select>
          )}
          <button className="reset-btn" onClick={() => setConfirmReset(true)} title="Resetovat statistiky">↺</button>
        </div>
      </header>

      {confirmReset && (
        <ConfirmDialog onConfirm={handleReset} onCancel={() => setConfirmReset(false)} />
      )}

      <main className="main">
        <section className="top-half" ref={errorLogRef}>
          <div className="error-log">
            {errorLog.map((e, i) => (
              <Feedback key={i} feedback={e} isFirst={i === errorLog.length - 1} />
            ))}
          </div>
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
