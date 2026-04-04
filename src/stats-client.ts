import type { StatsMap, WordStats } from "./types";

const API_BASE = "";

export async function loadStats(): Promise<StatsMap> {
  const res = await fetch(`${API_BASE}/api/stats`);
  if (!res.ok) return {};
  return res.json();
}

export async function saveAnswer(wordKey: string, correct: boolean): Promise<StatsMap> {
  const res = await fetch(`${API_BASE}/api/stats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wordKey, correct }),
  });
  return res.json();
}

export async function resetStats(): Promise<StatsMap> {
  const res = await fetch(`${API_BASE}/api/stats`, { method: "DELETE" });
  return res.json();
}
