import React, { useEffect, useCallback, useRef } from "react";
import { allStrategies } from "./strategies";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
  fetchDatasets,
  fetchWordsAndStats,
  submitAnswer,
  resetQuizStats,
  setStrategyIndex,
  setConfirmReset,
  setPressedKey,
  setDataset,
} from "./store/quizSlice";
import {
  selectQuestion,
  selectErrorLog,
  selectConfirmReset,
  selectDatasets,
  selectDataset,
  selectLoading,
  selectPressedKey,
  selectStrategyIndex,
  selectHasMultipleDatasets,
} from "./store/selectors";
import { ProgressBar } from "./components/ProgressBar";
import { StrategySelector } from "./components/StrategySelector";
import { Feedback } from "./components/Feedback";
import { QuizCard } from "./components/QuizCard";
import { ScoreDisplay } from "./components/ScoreDisplay";
import { ConfirmDialog } from "./components/ConfirmDialog";
import "./App.css";

export default function App() {
  const dispatch = useAppDispatch();
  const question = useAppSelector(selectQuestion);
  const errorLog = useAppSelector(selectErrorLog);
  const confirmReset = useAppSelector(selectConfirmReset);
  const datasets = useAppSelector(selectDatasets);
  const dataset = useAppSelector(selectDataset);
  const loading = useAppSelector(selectLoading);
  const pressedKey = useAppSelector(selectPressedKey);
  const strategyIndex = useAppSelector(selectStrategyIndex);
  const hasMultipleDatasets = useAppSelector(selectHasMultipleDatasets);
  const errorLogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (errorLogRef.current) {
      errorLogRef.current.scrollTop = errorLogRef.current.scrollHeight;
    }
  }, [errorLog]);

  // Load datasets list once
  useEffect(() => {
    dispatch(fetchDatasets());
  }, [dispatch]);

  // Load CSV + stats when dataset changes
  useEffect(() => {
    dispatch(fetchWordsAndStats(dataset));
  }, [dispatch, dataset]);

  const handleAnswer = useCallback(
    (userAnswer: string, wasCorrect: boolean) => {
      dispatch(submitAnswer({ userAnswer, wasCorrect }));
    },
    [dispatch],
  );

  // Keyboard handler
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!question) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 6 && question.options[num - 1]) {
        dispatch(setPressedKey(num));
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (!question) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 6 && question.options[num - 1]) {
        dispatch(setPressedKey(null));
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
  }, [question, handleAnswer, dispatch]);

  if (loading) {
    return <div className="loading">Načítám slovíčka…</div>;
    // test
  }

  return (
    <div className="app">
      <header className="header">
        <ProgressBar />
        <div className="header-row">
          <StrategySelector
            strategies={allStrategies}
            current={strategyIndex}
            onChange={(i) => dispatch(setStrategyIndex(i))}
          />
          <ScoreDisplay />
          {hasMultipleDatasets && (
            <select
              className="dataset-select"
              value={dataset}
              onChange={(e) => dispatch(setDataset(e.target.value))}
            >
              {datasets.map((d) => (
                <option key={d} value={d}>{d.replace(/\.csv$/i, "")}</option>
              ))}
            </select>
          )}
          <button className="reset-btn" onClick={() => dispatch(setConfirmReset(true))} title="Resetovat statistiky">↺</button>
        </div>
      </header>

      {confirmReset && (
        <ConfirmDialog
          onConfirm={() => dispatch(resetQuizStats())}
          onCancel={() => dispatch(setConfirmReset(false))}
        />
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
