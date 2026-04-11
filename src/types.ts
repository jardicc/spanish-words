export interface WordEntry {
  rank: number;
  article: string;
  word: string;
  translation: string;
  partOfSpeech: string;
}

export interface WordStats {
  correct: number;
  incorrect: number;
}

export type StatsMap = Record<string, WordStats>;

export interface QuizOption {
  label: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  prompt: string;
  correctAnswer: string;
  options: QuizOption[];
  wordKey: string;
}

export interface Strategy {
  name: string;
  description: string;
  keyPrefix: string;
  wordsFilter?: (words: WordEntry[]) => WordEntry[];
  generateQuestion(words: WordEntry[], stats: StatsMap): QuizQuestion | null;
}

export interface FeedbackState {
  correctAnswer: string;
  userAnswer: string;
  wasCorrect: boolean;
}
