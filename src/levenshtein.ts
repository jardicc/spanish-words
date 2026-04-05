/**
 * Calculates the Levenshtein distance between two strings, which is the minimum number of single-character edits (insertions, deletions, or substitutions) required to change one string into the other.
 * @param a The first string.
 * @param b The second string.
 * @returns The Levenshtein distance between the two strings.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[]);

  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost
      );
    }
  }

  return dp[m]![n]!;
}

/**
 * Finds the most similar words to the target from the candidates list, based on Levenshtein distance.
 * The target word itself is excluded from the results.
 * @param target The word to compare against.
 * @param candidates The list of candidate words to search through.
 * @param count The maximum number of similar words to return.
 * @returns An array of the most similar words, sorted by similarity (closest first).
 */
export function findSimilarWords(target: string, candidates: string[], count: number): string[] {
  const results: { word: string; distance: number }[] = [];
  const targetLower = target.toLowerCase();

  for (const c of candidates) {
    if (c === target) {continue;} // Skip the target word itself
    const distance = levenshtein(targetLower, c.toLowerCase());
    let i = results.length;
    while (i > 0 && results[i - 1]!.distance > distance) {
      i--
    };
    if (i < count) {
      results.splice(i, 0, { word: c, distance });
      if (results.length > count) {
        results.pop()
      };
    }
  }

  return results.map((s) => s.word);
}
