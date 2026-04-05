import { describe, it, expect, vi, afterEach } from "vitest";
import { loadStats, saveAnswer, resetStats } from "../src/stats-client";

const _g = globalThis as any;

function mockFetch(body: unknown) {
  return vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(body), text: () => Promise.resolve(String(body)) })
  );
}

afterEach(() => {
  delete _g.fetch;
  vi.restoreAllMocks();
});

describe("loadStats", () => {
  it("sends GET request with dataset query param", async () => {
    const stats = { casa: { correct: 3, incorrect: 1 } };
    _g.fetch = mockFetch(stats);
    const result = await loadStats("cisla100.csv");
    expect(_g.fetch).toHaveBeenCalledWith("/api/stats?dataset=cisla100.csv");
    expect(result).toEqual(stats);
  });

  it("encodes special characters in dataset name", async () => {
    _g.fetch = mockFetch({});
    await loadStats("my file.csv");
    expect(_g.fetch).toHaveBeenCalledWith("/api/stats?dataset=my%20file.csv");
  });
});

describe("saveAnswer", () => {
  it("sends POST with wordKey, correct and dataset in body", async () => {
    _g.fetch = mockFetch({});
    await saveAnswer("casa", true, "top1000.csv");
    expect(_g.fetch).toHaveBeenCalledWith(
      "/api/stats",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ wordKey: "casa", correct: true, dataset: "top1000.csv" }),
      })
    );
  });

  it("uses the provided dataset, not a hardcoded one", async () => {
    _g.fetch = mockFetch({});
    await saveAnswer("uno", false, "cisla100.csv");
    const body = JSON.parse((_g.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1].body);
    expect(body.dataset).toBe("cisla100.csv");
  });
});

describe("resetStats", () => {
  it("sends DELETE request with dataset query param", async () => {
    _g.fetch = mockFetch({});
    await resetStats("cisla100.csv");
    expect(_g.fetch).toHaveBeenCalledWith(
      "/api/stats?dataset=cisla100.csv",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("returns the response JSON", async () => {
    const empty = {};
    _g.fetch = mockFetch(empty);
    const result = await resetStats("top1000.csv");
    expect(result).toEqual(empty);
  });
});
