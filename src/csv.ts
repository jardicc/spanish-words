import type { WordEntry } from "./types";

export function parseCSV(raw: string): WordEntry[] {
  const lines = raw.trim().split("\n");
  const entries: WordEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]!.split(",");
    if (parts.length < 6) continue;
    entries.push({
      rank: parseInt(parts[0]!, 10),
      article: parts[1]!.trim(),
      word: parts[2]!.trim(),
      translation: parts[4]!.trim(),
      partOfSpeech: parts[5]!.trim(),
    });
  }

  return entries;
}
