import { describe, it, expect } from "vitest";
import { parseCSV } from "../src/csv";
import { allStrategies } from "../src/strategies";

const sampleCSV = `Rank,Article,Word,Translation(EN),Czech,Part of Speech
1,,de,of,z,preposition
2,el,gato,cat,kočka,noun
3,la,casa,house,dům,noun
4,,hablar,to speak,mluvit,verb
5,el,perro,dog,pes,noun
6,la,mesa,table,stůl,noun`;

describe("parseCSV", () => {
  it("parses all rows (skips header)", () => {
    const words = parseCSV(sampleCSV);
    expect(words.length).toBe(6);
  });

  it("parses word fields correctly", () => {
    const words = parseCSV(sampleCSV);
    const casa = words.find((w) => w.word === "casa");
    expect(casa).toBeDefined();
    expect(casa!.article).toBe("la");
    expect(casa!.translation).toBe("dům");
    expect(casa!.partOfSpeech).toBe("noun");
    expect(casa!.rank).toBe(3);
  });

  it("handles words without articles", () => {
    const words = parseCSV(sampleCSV);
    const hablar = words.find((w) => w.word === "hablar");
    expect(hablar).toBeDefined();
    expect(hablar!.article).toBe("");
  });

  it("skips malformed lines", () => {
    const bad = sampleCSV + "\nbadline";
    const words = parseCSV(bad);
    expect(words.length).toBe(6);
  });

  it("returns empty array for empty input", () => {
    expect(parseCSV("")).toEqual([]);
  });

  it("returns empty array for header-only CSV", () => {
    expect(parseCSV("Rank,Article,Word,Translation(EN),Czech,Part of Speech")).toEqual([]);
  });

  it("handles whitespace in fields", () => {
    const csv = `Rank,Article,Word,Trans,Czech,PoS
1, el , gato , cat , kočka , noun `;
    const words = parseCSV(csv);
    expect(words[0]!.article).toBe("el");
    expect(words[0]!.word).toBe("gato");
    expect(words[0]!.translation).toBe("kočka");
    expect(words[0]!.partOfSpeech).toBe("noun");
  });

  it("parses rank as number even when invalid", () => {
    const csv = `Rank,Article,Word,Trans,Czech,PoS
abc,el,gato,cat,kočka,noun`;
    const words = parseCSV(csv);
    expect(words.length).toBe(1);
    expect(Number.isNaN(words[0]!.rank)).toBe(true);
  });
});

describe("allStrategies", () => {
  const words = parseCSV(sampleCSV);

  it("has 3 strategies", () => {
    expect(allStrategies.length).toBe(3);
  });

  it("strategies have names and descriptions", () => {
    for (const s of allStrategies) {
      expect(s.name.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(0);
    }
  });

  it("Španělsky → Česky generates a question with correct structure", () => {
    const q = allStrategies[0]!.generateQuestion(words, {});
    expect(q).not.toBeNull();
    expect(q!.prompt.length).toBeGreaterThan(0);
    expect(q!.correctAnswer.length).toBeGreaterThan(0);
    expect(q!.options.length).toBeGreaterThanOrEqual(2);
    expect(q!.options.some((o) => o.isCorrect)).toBe(true);
  });

  it("Česky → Španělsky generates a question with Czech prompt", () => {
    const q = allStrategies[1]!.generateQuestion(words, {});
    expect(q).not.toBeNull();
    // prompt should be a Czech translation
    const translations = words.map((w) => w.translation);
    expect(translations).toContain(q!.prompt);
  });

  it("Členy strategy only uses nouns with articles", () => {
    const q = allStrategies[2]!.generateQuestion(words, {});
    expect(q).not.toBeNull();
    expect(q!.options.length).toBe(2);
    const labels = q!.options.map((o) => o.label).sort();
    expect(labels).toEqual(["el", "la"]);
  });

  it("excludes words with ≥80% success rate and ≥3 attempts", () => {
    // 4 correct / 5 total = 80% → should be excluded
    const stats80: Record<string, { correct: number; incorrect: number }> = {};
    for (const w of words) {
      stats80[`es:${w.word}`] = { correct: 4, incorrect: 1 };
      stats80[`cs:${w.word}`] = { correct: 4, incorrect: 1 };
      stats80[`article:${w.word}`] = { correct: 4, incorrect: 1 };
    }
    for (const s of allStrategies) {
      expect(s.generateQuestion(words, stats80)).toBeNull();
    }
  });

  it("includes words with <80% success rate", () => {
    // 3 correct / 5 total = 60% → should still be included
    const stats60: Record<string, { correct: number; incorrect: number }> = {};
    for (const w of words) {
      stats60[`es:${w.word}`] = { correct: 3, incorrect: 2 };
      stats60[`cs:${w.word}`] = { correct: 3, incorrect: 2 };
      stats60[`article:${w.word}`] = { correct: 3, incorrect: 2 };
    }
    for (const s of allStrategies) {
      expect(s.generateQuestion(words, stats60)).not.toBeNull();
    }
  });

  it("returns null when all words mastered", () => {
    const fullStats: Record<string, { correct: number; incorrect: number }> = {};
    for (const w of words) {
      fullStats[`es:${w.word}`] = { correct: 10, incorrect: 0 };
      fullStats[`cs:${w.word}`] = { correct: 10, incorrect: 0 };
      fullStats[`article:${w.word}`] = { correct: 10, incorrect: 0 };
    }
    for (const s of allStrategies) {
      expect(s.generateQuestion(words, fullStats)).toBeNull();
    }
  });
});

describe("pickWord – weighted selection", () => {
  const words = parseCSV(sampleCSV);

  it("gives new (unseen) words higher chance than partially-seen words", () => {
    // Only "gato" has stats → the rest are unseen (weight 5 each)
    const stats = { "es:gato": { correct: 2, incorrect: 1 } }; // rate=0.67 → weight=max(1,10*0.33)=3.3
    const counts: Record<string, number> = {};
    for (let i = 0; i < 200; i++) {
      const q = allStrategies[0]!.generateQuestion(words, stats);
      const key = q!.wordKey;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    // Unseen words collectively should appear much more than gato
    const gatoCount = counts["es:gato"] ?? 0;
    const otherCount = Object.entries(counts)
      .filter(([k]) => k !== "es:gato")
      .reduce((s, [, v]) => s + v, 0);
    expect(otherCount).toBeGreaterThan(gatoCount);
  });

  it("gives failed words higher weight than successful words", () => {
    // Two words: one with high success, one with low success
    const stats = {
      "es:gato": { correct: 1, incorrect: 4 },   // rate=0.2 → weight=8
      "es:casa": { correct: 4, incorrect: 1 },    // rate=0.8 → mastered, excluded
      "es:correr": { correct: 1, incorrect: 4 },  // rate=0.2 → weight=8
      "es:perro": { correct: 2, incorrect: 1 },   // rate=0.67 → weight=3.3
      "es:mesa": { correct: 2, incorrect: 1 },    // rate=0.67 → weight=3.3
      "es:libro": { correct: 2, incorrect: 1 },   // rate=0.67 → weight=3.3
    };
    const counts: Record<string, number> = {};
    for (let i = 0; i < 300; i++) {
      const q = allStrategies[0]!.generateQuestion(words, stats);
      const key = q!.wordKey;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    // gato and correr (low success) should appear more than perro (higher success)
    expect((counts["es:gato"] ?? 0) + (counts["es:correr"] ?? 0)).toBeGreaterThan(
      (counts["es:perro"] ?? 0)
    );
  });

  it("returns null when no words are provided", () => {
    const q = allStrategies[0]!.generateQuestion([], {});
    expect(q).toBeNull();
  });
});

describe("generateOptions – distractor selection", () => {
  const words = parseCSV(sampleCSV);

  it("always includes the correct answer in options", () => {
    for (let i = 0; i < 50; i++) {
      const q = allStrategies[0]!.generateQuestion(words, {});
      expect(q).not.toBeNull();
      expect(q!.options.some((o) => o.isCorrect)).toBe(true);
      expect(q!.options.find((o) => o.isCorrect)!.label).toBe(q!.correctAnswer);
    }
  });

  it("generates at most 6 options", () => {
    for (let i = 0; i < 20; i++) {
      const q = allStrategies[0]!.generateQuestion(words, {});
      expect(q!.options.length).toBeLessThanOrEqual(6);
    }
  });

  it("has exactly one correct option", () => {
    for (let i = 0; i < 20; i++) {
      const q = allStrategies[0]!.generateQuestion(words, {});
      const correctCount = q!.options.filter((o) => o.isCorrect).length;
      expect(correctCount).toBe(1);
    }
  });

  it("does not include duplicate labels", () => {
    for (let i = 0; i < 20; i++) {
      const q = allStrategies[0]!.generateQuestion(words, {});
      const labels = q!.options.map((o) => o.label);
      expect(new Set(labels).size).toBe(labels.length);
    }
  });

  it("shuffles option order (not always the same)", () => {
    const firstPositions = new Set<number>();
    for (let i = 0; i < 30; i++) {
      const q = allStrategies[0]!.generateQuestion(words, {});
      const correctIdx = q!.options.findIndex((o) => o.isCorrect);
      firstPositions.add(correctIdx);
    }
    // Correct answer should appear in multiple positions due to shuffle
    expect(firstPositions.size).toBeGreaterThan(1);
  });
});

describe("articleStrategy – mastery keys", () => {
  const words = parseCSV(sampleCSV);
  const articleStrategy = allStrategies[2]!;

  it("does not return words mastered under the article:word key", () => {
    // All nouns mastered under the correct article:word key
    const stats: Record<string, { correct: number; incorrect: number }> = {};
    for (const w of words.filter((w) => w.article !== "")) {
      stats[`article:${w.word}`] = { correct: 4, incorrect: 1 }; // 80%
    }
    expect(articleStrategy.generateQuestion(words, stats)).toBeNull();
  });

  it("still returns words mastered only under the bare word key (no article: prefix)", () => {
    // Stats only under bare key – articleStrategy must not treat them as mastered
    const stats: Record<string, { correct: number; incorrect: number }> = {};
    for (const w of words.filter((w) => w.article !== "")) {
      stats[w.word] = { correct: 10, incorrect: 0 };
    }
    expect(articleStrategy.generateQuestion(words, stats)).not.toBeNull();
  });

  it("question wordKey has the article: prefix", () => {
    const q = articleStrategy.generateQuestion(words, {});
    expect(q).not.toBeNull();
    expect(q!.wordKey).toMatch(/^article:/);
  });
});
