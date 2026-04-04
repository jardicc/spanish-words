import type { StatsMap } from "./types";

const API_BASE = "";

export async function loadStats(dataset: string): Promise<StatsMap> {
  const res = await fetch(`${API_BASE}/api/stats?dataset=${encodeURIComponent(dataset)}`);
  if (!res.ok) return {};
  return res.json();
}

export async function saveAnswer(wordKey: string, correct: boolean, dataset: string): Promise<StatsMap> {
  const res = await fetch(`${API_BASE}/api/stats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wordKey, correct, dataset }),
  });
  return res.json();
}

export async function resetStats(dataset: string): Promise<StatsMap> {
  const res = await fetch(`${API_BASE}/api/stats?dataset=${encodeURIComponent(dataset)}`, { method: "DELETE" });
  return res.json();
}
