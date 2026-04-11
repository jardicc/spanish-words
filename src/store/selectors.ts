import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "./index";
import { allStrategies } from "../strategies";
import { MASTERY_THRESHOLD, MASTERY_MIN_ATTEMPTS } from "../constants";

export const selectQuiz = (state: RootState) => state.quiz;
export const selectWords = (state: RootState) => state.quiz.words;
export const selectStats = (state: RootState) => state.quiz.stats;
export const selectStrategyIndex = (state: RootState) => state.quiz.strategyIndex;
export const selectQuestion = (state: RootState) => state.quiz.question;
export const selectErrorLog = (state: RootState) => state.quiz.errorLog;
export const selectConfirmReset = (state: RootState) => state.quiz.confirmReset;
export const selectDatasets = (state: RootState) => state.quiz.datasets;
export const selectDataset = (state: RootState) => state.quiz.dataset;
export const selectLoading = (state: RootState) => state.quiz.loading;
export const selectPressedKey = (state: RootState) => state.quiz.pressedKey;

export const selectCurrentStrategy = createSelector(
  [selectStrategyIndex],
  (index) => allStrategies[index]!,
);

export const selectKeyPrefix = createSelector(
  [selectCurrentStrategy],
  (strategy) => strategy.keyPrefix,
);

export const selectTotalWords = createSelector(
  [selectWords, selectCurrentStrategy],
  (words, strategy) =>
    strategy.wordsFilter ? strategy.wordsFilter(words).length : words.length,
);

export const selectStrategyStats = createSelector(
  [selectStats, selectKeyPrefix],
  (stats, prefix) => {
    const p = prefix + ":";
    const result: Record<string, { correct: number; incorrect: number }> = {};
    for (const [key, value] of Object.entries(stats)) {
      if (key.startsWith(p)) {
        result[key] = value;
      }
    }
    return result;
  },
);

export const selectScoreTotals = createSelector(
  [selectStrategyStats],
  (strategyStats) => {
    const values = Object.values(strategyStats);
    const correct = values.reduce((sum, s) => sum + s.correct, 0);
    const incorrect = values.reduce((sum, s) => sum + s.incorrect, 0);
    const total = correct + incorrect;
    const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, incorrect, rate };
  },
);

export const selectMasteredCount = createSelector(
  [selectStrategyStats],
  (strategyStats) =>
    Object.values(strategyStats).filter((s) => {
      const total = s.correct + s.incorrect;
      return total >= MASTERY_MIN_ATTEMPTS && s.correct / total >= MASTERY_THRESHOLD;
    }).length,
);

export const selectAttemptedCount = createSelector(
  [selectStrategyStats],
  (strategyStats) => Object.keys(strategyStats).length,
);

export const selectProgressPercent = createSelector(
  [selectMasteredCount, selectTotalWords],
  (mastered, total) => (total > 0 ? Math.round((mastered / total) * 100) : 0),
);

export const selectHasMultipleDatasets = createSelector(
  [selectDatasets],
  (datasets) => datasets.length > 1,
);
