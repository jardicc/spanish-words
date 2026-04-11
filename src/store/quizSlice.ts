import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { WordEntry, StatsMap, QuizQuestion } from "../types";
import type { FeedbackEntry } from "../components/Feedback";
import { allStrategies } from "../strategies";
import { loadStats, saveAnswer, resetStats } from "../stats-client";
import { parseCSV } from "../csv";

export interface QuizState {
  words: WordEntry[];
  stats: StatsMap;
  strategyIndex: number;
  question: QuizQuestion | null;
  errorLog: FeedbackEntry[];
  confirmReset: boolean;
  datasets: string[];
  dataset: string;
  loading: boolean;
  pressedKey: number | null;
}

const initialState: QuizState = {
  words: [],
  stats: {},
  strategyIndex: 0,
  question: null,
  errorLog: [],
  confirmReset: false,
  datasets: [],
  dataset: "top1000.csv",
  loading: true,
  pressedKey: null,
};

// --- Async thunks ---

export const fetchDatasets = createAsyncThunk("quiz/fetchDatasets", async () => {
  const res = await fetch("/api/datasets");
  return (await res.json()) as string[];
});

export const fetchWordsAndStats = createAsyncThunk(
  "quiz/fetchWordsAndStats",
  async (dataset: string) => {
    const [csv, stats] = await Promise.all([
      fetch(`/api/words?dataset=${encodeURIComponent(dataset)}`).then((r) => r.text()),
      loadStats(dataset),
    ]);
    return { words: parseCSV(csv), stats };
  },
);

export const submitAnswer = createAsyncThunk(
  "quiz/submitAnswer",
  async (
    { userAnswer, wasCorrect }: { userAnswer: string; wasCorrect: boolean },
    { getState },
  ) => {
    const state = (getState() as { quiz: QuizState }).quiz;
    const { question, dataset } = state;
    if (!question) throw new Error("No active question");
    const newStats = await saveAnswer(question.wordKey, wasCorrect, dataset);
    return { newStats, userAnswer, wasCorrect, prompt: question.prompt, correctAnswer: question.correctAnswer };
  },
);

export const resetQuizStats = createAsyncThunk(
  "quiz/resetStats",
  async (_, { getState }) => {
    const { dataset } = (getState() as { quiz: QuizState }).quiz;
    return await resetStats(dataset);
  },
);

// --- Helper: generate question from current state ---

function generateQuestion(state: QuizState, stats?: StatsMap): QuizQuestion | null {
  const strategy = allStrategies[state.strategyIndex];
  if (!strategy || state.words.length === 0) return null;
  return strategy.generateQuestion(state.words, stats ?? state.stats);
}

// --- Slice ---

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    setStrategyIndex(state, action: PayloadAction<number>) {
      state.strategyIndex = action.payload;
      state.question = null;
      state.errorLog = [];
    },
    setConfirmReset(state, action: PayloadAction<boolean>) {
      state.confirmReset = action.payload;
    },
    setPressedKey(state, action: PayloadAction<number | null>) {
      state.pressedKey = action.payload;
    },
    setDataset(state, action: PayloadAction<string>) {
      state.dataset = action.payload;
    },
    generateNextQuestion(state) {
      state.question = generateQuestion(state);
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchDatasets.fulfilled, (state, action) => {
        state.datasets = action.payload;
        if (action.payload.length > 0) {
          state.dataset = action.payload[0]!;
        }
      })
      .addCase(fetchWordsAndStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWordsAndStats.fulfilled, (state, action) => {
        state.words = action.payload.words;
        state.stats = action.payload.stats;
        state.question = null;
        state.errorLog = [];
        state.loading = false;
        state.question = generateQuestion(state);
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        const { newStats, userAnswer, wasCorrect, prompt, correctAnswer } = action.payload;
        state.stats = newStats;
        if (!wasCorrect) {
          state.errorLog.push({ prompt, userAnswer, correctAnswer });
        }
        state.question = generateQuestion(state, newStats);
      })
      .addCase(resetQuizStats.fulfilled, (state, action) => {
        state.stats = action.payload;
        state.errorLog = [];
        state.confirmReset = false;
        state.question = generateQuestion(state, action.payload);
      });
  },
});

export const {
  setStrategyIndex,
  setConfirmReset,
  setPressedKey,
  setDataset,
  generateNextQuestion,
} = quizSlice.actions;

export default quizSlice.reducer;
