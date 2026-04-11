// @vitest-environment happy-dom
import { GlobalWindow } from "happy-dom";
import React, { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { q } from "./render";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import quizReducer from "../src/store/quizSlice";
import App from "../src/App";

// Install happy-dom as globals so React's createRoot can use document/window.
// This is the fallback for test runners that ignore vitest.config.ts environment.
const _hw = new GlobalWindow() as any;
const _g = globalThis as any;
if (!_g.document) {
  Object.getOwnPropertyNames(_hw).forEach((key) => {
    try { if (!(key in _g)) _g[key] = _hw[key]; } catch {}
  });
}
_g.IS_REACT_ACT_ENVIRONMENT = true;

// Minimal CSV: Rank,Article,Word,Translation_EN,Czech,PoS
const SAMPLE_CSV = `Rank,Article,Word,Translation,Czech,PoS
1,el,gato,cat,kočka,noun
2,la,casa,house,dům,noun
3,,correr,to run,běžet,verb
4,el,perro,dog,pes,noun
5,la,mesa,table,stůl,noun
6,el,libro,book,kniha,noun
`;

function makeFetch(
  stats: Record<string, { correct: number; incorrect: number }> = {},
  datasets = ["top1000.csv"],
) {
  return vi.fn((url: string, init?: RequestInit) => {
    if (url.includes("/api/datasets"))
      return Promise.resolve({ ok: true, json: () => Promise.resolve(datasets) });
    if (url.includes("/api/words"))
      return Promise.resolve({ ok: true, text: () => Promise.resolve(SAMPLE_CSV) });
    if (url.includes("/api/stats") && (!init || init.method === "GET" || !init.method))
      return Promise.resolve({ ok: true, json: () => Promise.resolve(stats) });
    if (url.includes("/api/stats") && init?.method === "POST")
      return Promise.resolve({ ok: true, json: () => Promise.resolve(stats) });
    if (url.includes("/api/stats") && init?.method === "DELETE")
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    return Promise.reject(new Error(`Unexpected fetch: ${url}`));
  });
}

// Flush all pending promise chains and resulting React state updates.
async function flushAll() {
  // setTimeout(0) fires after all microtasks settle — drains the fetch().then() chains.
  await new Promise<void>((r) => setTimeout(r, 0));
}

describe("App", () => {
  let container: HTMLElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div") as unknown as HTMLElement;
    document.body.appendChild(container as unknown as Node);
  });

  afterEach(async () => {
    await act(async () => { root?.unmount(); });
    document.body.removeChild(container as unknown as Node);
    delete _g.fetch;
    vi.restoreAllMocks();
  });

  function renderApp() {
    const store = configureStore({ reducer: { quiz: quizReducer } });
    root = createRoot(container);
    root.render(<Provider store={store}><App /></Provider>);
  }

  it("shows a quiz question after loading when words are not yet mastered", async () => {
    _g.fetch = makeFetch();
    await act(async () => {
      renderApp();
    });
    await act(flushAll);
    expect(q(container, "quiz-card")).not.toBeNull();
  });

  it("shows all-done message when all words are mastered", async () => {
    const mastered = Object.fromEntries(
      ["gato", "casa", "correr", "perro", "mesa", "libro"].map(
        (k) => [`es:${k}`, { correct: 5, incorrect: 0 }]
      )
    );
    _g.fetch = makeFetch(mastered);
    await act(async () => {
      renderApp();
    });
    await act(flushAll);
    expect(q(container, "quiz-card")).toBeNull();
  });

  it("loads stats with current dataset query param", async () => {
    const fetchMock = makeFetch();
    _g.fetch = fetchMock;
    await act(async () => {
      renderApp();
    });
    await act(flushAll);
    const statsCalls = (fetchMock.mock.calls as [string][])
      .filter(([url]) => url.includes("/api/stats"));
    expect(statsCalls.length).toBeGreaterThan(0);
    expect(statsCalls[0]![0]).toContain("dataset=top1000.csv");
  });

  it("shows a quiz question after switching strategy even if previous strategy was fully mastered", async () => {
    // All words mastered for strategy 0 (keyPrefix "es")
    const mastered = Object.fromEntries(
      ["gato", "casa", "correr", "perro", "mesa", "libro"].map(
        (k) => [`es:${k}`, { correct: 5, incorrect: 0 }]
      )
    );
    _g.fetch = makeFetch(mastered);
    await act(async () => {
      renderApp();
    });
    await act(flushAll);
    // Strategy 0 should show "all done"
    expect(q(container, "quiz-card")).toBeNull();

    // Switch to strategy 1 (keyPrefix "cs") — no mastered words there
    const strategyBtns = container.querySelectorAll('[data-test="strategy-btn"]');
    await act(async () => {
      (strategyBtns[1] as HTMLButtonElement).click();
    });
    // Should now show a quiz card, not "all done"
    expect(q(container, "quiz-card")).not.toBeNull();
  });

  it("loads separate stats when switching datasets", async () => {
    const statsA = { gato: { correct: 5, incorrect: 0 } };
    const statsB = { uno: { correct: 2, incorrect: 1 } };
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes("/api/datasets"))
        return Promise.resolve({ ok: true, json: () => Promise.resolve(["top1000.csv", "cisla100.csv"]) });
      if (url.includes("/api/words"))
        return Promise.resolve({ ok: true, text: () => Promise.resolve(SAMPLE_CSV) });
      if (url.includes("/api/stats")) {
        const stats = url.includes("cisla100.csv") ? statsB : statsA;
        return Promise.resolve({ ok: true, json: () => Promise.resolve(stats) });
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });
    _g.fetch = fetchMock;
    await act(async () => {
      renderApp();
    });
    await act(flushAll);

    // Switch dataset via the select element
    const select = container.querySelector(".dataset-select") as HTMLSelectElement;
    expect(select).not.toBeNull();
    await act(async () => {
      select.value = "cisla100.csv";
      const ChangeEvent = (select.ownerDocument!.defaultView as any).Event as typeof Event;
      select.dispatchEvent(new ChangeEvent("change", { bubbles: true }));
    });
    await act(flushAll);

    const statsCalls = (fetchMock.mock.calls as [string][])
      .filter(([url]) => url.includes("/api/stats") && url.includes("cisla100.csv"));
    expect(statsCalls.length).toBeGreaterThan(0);
  });

  it("submits answer via keyboard keydown+keyup", async () => {
    const fetchMock = makeFetch();
    _g.fetch = fetchMock;
    await act(async () => { renderApp(); });
    await act(flushAll);
    expect(q(container, "quiz-card")).not.toBeNull();

    // Press key "1" to select first option
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "1" }));
    });
    // The pressed button should be visually indicated
    const btns = container.querySelectorAll('[data-test="option-btn"]');
    expect(btns[0]!.getAttribute("data-pressed")).toBe("true");

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "1" }));
    });
    await act(flushAll);
    // After keyup, a POST to /api/stats should have been made (answer submitted)
    const postCalls = (fetchMock.mock.calls as [string, RequestInit | undefined][])
      .filter(([url, init]) => url.includes("/api/stats") && init?.method === "POST");
    expect(postCalls.length).toBeGreaterThan(0);
  });

  it("ignores key presses outside range 1-6", async () => {
    const fetchMock = makeFetch();
    _g.fetch = fetchMock;
    await act(async () => { renderApp(); });
    await act(flushAll);

    const postsBefore = (fetchMock.mock.calls as [string, RequestInit | undefined][])
      .filter(([url, init]) => url.includes("/api/stats") && init?.method === "POST").length;

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "0" }));
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "0" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "9" }));
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "9" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "a" }));
    });
    await act(flushAll);

    const postsAfter = (fetchMock.mock.calls as [string, RequestInit | undefined][])
      .filter(([url, init]) => url.includes("/api/stats") && init?.method === "POST").length;
    expect(postsAfter).toBe(postsBefore);
  });

  it("still loads quiz when fetchDatasets fails", async () => {
    _g.fetch = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes("/api/datasets"))
        return Promise.reject(new Error("Network error"));
      if (url.includes("/api/words"))
        return Promise.resolve({ ok: true, text: () => Promise.resolve(SAMPLE_CSV) });
      if (url.includes("/api/stats"))
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });
    await act(async () => { renderApp(); });
    await act(flushAll);
    // App should still attempt to load words for default dataset
    expect(q(container, "quiz-card")).not.toBeNull();
  });

  it("shows loading state when fetchWordsAndStats is pending", async () => {
    // Delay word fetch so we can observe loading state
    _g.fetch = vi.fn((url: string) => {
      if (url.includes("/api/datasets"))
        return Promise.resolve({ ok: true, json: () => Promise.resolve(["top1000.csv"]) });
      if (url.includes("/api/words"))
        return new Promise(() => {}); // never resolves
      if (url.includes("/api/stats"))
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });
    await act(async () => { renderApp(); });
    await act(flushAll);
    expect(container.querySelector(".loading")).not.toBeNull();
  });
});
