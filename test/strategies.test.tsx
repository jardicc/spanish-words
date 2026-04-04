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

  it("returns null when all words mastered", () => {
    const fullStats: Record<string, { correct: number; incorrect: number }> = {};
    for (const w of words) {
      fullStats[w.word] = { correct: 10, incorrect: 0 };
      fullStats[`article:${w.word}`] = { correct: 10, incorrect: 0 };
    }
    for (const s of allStrategies) {
      expect(s.generateQuestion(words, fullStats)).toBeNull();
    }
  });
});
