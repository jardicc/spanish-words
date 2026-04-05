import { describe, it, expect } from "vitest";
import { levenshtein, findSimilarWords } from "../src/levenshtein";

describe("levenshtein", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("casa", "casa")).toBe(0);
  });

  it("returns string length when other is empty", () => {
    expect(levenshtein("abc", "")).toBe(3);
    expect(levenshtein("", "abc")).toBe(3);
  });

  it("returns 0 for two empty strings", () => {
    expect(levenshtein("", "")).toBe(0);
  });

  it("counts single substitution", () => {
    expect(levenshtein("cat", "bat")).toBe(1);
  });

  it("counts single insertion", () => {
    expect(levenshtein("abc", "abcd")).toBe(1);
  });

  it("counts single deletion", () => {
    expect(levenshtein("abcd", "abc")).toBe(1);
  });

  it("handles multi-operation distance", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
  });

  it("is not symmetric (same result both directions)", () => {
    expect(levenshtein("abc", "xyz")).toBe(levenshtein("xyz", "abc"));
  });
});

describe("findSimilarWords", () => {
  // Distances from "gato": pato=1, cano=2, casa=3, gato=0(self), mesa=4, libro=5, perro=4
  const candidates = ["gato", "casa", "perro", "libro", "mesa", "pato", "cano"];

  it("returns the requested count of words", () => {
    // top 3: pato(1), cano(2), casa(3)
    expect(findSimilarWords("gato", candidates, 3)).toHaveLength(3);
  });

  it("excludes the target word itself", () => {
    // "gato" is in candidates but must not appear in results
    const result = findSimilarWords("gato", candidates, 3);
    expect(result).not.toContain("gato");
  });

  it("returns closest words first", () => {
    // top 2: pato(distance 1), cano(distance 2) — perro(distance 4) is too far
    const result = findSimilarWords("gato", candidates, 2);
	expect(result[0]).toBe("pato");
	expect(result[1]).toBe("cano");
    expect(result).not.toContain("perro");
  });

  it("returns all candidates if count exceeds available", () => {
    // 7 candidates minus "gato" itself = 6 results
    const result = findSimilarWords("gato", candidates, 100);
    expect(result).toHaveLength(candidates.length - 1);
  });

  it("returns empty array for empty candidates", () => {
    // nothing to pick from
    expect(findSimilarWords("gato", [], 3)).toEqual([]);
  });

  it("is case-insensitive", () => {
    // "PATO" vs "gato": distance 1 (only 'g'↔'P' differs ignoring case)
    // "PERRO" vs "gato": distance 4 — so PATO wins
    const lower = findSimilarWords("gato", ["PATO", "PERRO"], 1);
    const upper = findSimilarWords("GATO", ["pato", "perro"], 1);
    expect(lower[0]!.toLowerCase()).toBe("pato");
    expect(upper[0]!.toLowerCase()).toBe("pato");
  });
});
