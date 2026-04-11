// @vitest-environment happy-dom
import { GlobalWindow } from "happy-dom";
import { describe, it, expect, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { render, q, qAll } from "./render";
import { QuizCard } from "../src/components/QuizCard";
import type { QuizQuestion } from "../src/types";

const _hw = new GlobalWindow() as any;
const _g = globalThis as any;
if (!_g.document) {
  Object.getOwnPropertyNames(_hw).forEach((key) => {
    try { if (!(key in _g)) _g[key] = _hw[key]; } catch {}
  });
}
_g.IS_REACT_ACT_ENVIRONMENT = true;

const question: QuizQuestion = {
  prompt: "la casa",
  correctAnswer: "dům",
  wordKey: "casa",
  options: [
    { label: "dům", isCorrect: true },
    { label: "pes", isCorrect: false },
    { label: "kočka", isCorrect: false },
    { label: "stůl", isCorrect: false },
    { label: "auto", isCorrect: false },
    { label: "kniha", isCorrect: false },
  ],
};

describe("QuizCard", () => {
  it("renders the prompt", () => {
    const el = render(
      <QuizCard question={question} onAnswer={() => {}} pressedKey={null} />
    );
    expect(q(el, "quiz-prompt")!.textContent).toBe("la casa");
  });

  it("renders all options with labels", () => {
    const el = render(
      <QuizCard question={question} onAnswer={() => {}} pressedKey={null} />
    );
    const labels = qAll(el, "option-label").map((e) => e.textContent);
    expect(labels).toEqual(["dům", "pes", "kočka", "stůl", "auto", "kniha"]);
  });

  it("renders key numbers 1-6", () => {
    const el = render(
      <QuizCard question={question} onAnswer={() => {}} pressedKey={null} />
    );
    const keys = qAll(el, "option-key").map((e) => e.textContent);
    expect(keys).toEqual(["1", "2", "3", "4", "5", "6"]);
  });

  it("marks one button as pressed", () => {
    const el = render(
      <QuizCard question={question} onAnswer={() => {}} pressedKey={3} />
    );
    const btns = qAll(el, "option-btn");
    const pressed = btns.filter((b) => b.getAttribute("data-pressed") === "true");
    expect(pressed.length).toBe(1);
    expect(btns.indexOf(pressed[0]!)).toBe(2); // 3rd button (index 2)
  });

  it("has no pressed button when pressedKey is null", () => {
    const el = render(
      <QuizCard question={question} onAnswer={() => {}} pressedKey={null} />
    );
    const btns = qAll(el, "option-btn");
    const pressed = btns.filter((b) => b.getAttribute("data-pressed") === "true");
    expect(pressed.length).toBe(0);
  });

  it("works with fewer options (article strategy)", () => {
    const articleQ: QuizQuestion = {
      prompt: "___ casa (dům)",
      correctAnswer: "la",
      wordKey: "article:casa",
      options: [
        { label: "el", isCorrect: false },
        { label: "la", isCorrect: true },
      ],
    };
    const el = render(
      <QuizCard question={articleQ} onAnswer={() => {}} pressedKey={null} />
    );
    expect(q(el, "quiz-prompt")!.textContent).toBe("___ casa (dům)");
    const labels = qAll(el, "option-label").map((e) => e.textContent);
    expect(labels).toEqual(["el", "la"]);
    expect(qAll(el, "option-btn").length).toBe(2);
  });

  it("calls onAnswer with label and isCorrect when option is clicked", () => {
    const onAnswer = vi.fn();
    const container = document.createElement("div");
    act(() => {
      createRoot(container).render(
        <QuizCard question={question} onAnswer={onAnswer} pressedKey={null} />
      );
    });
    // Click the first option ("dům", correct)
    const btns = container.querySelectorAll<HTMLButtonElement>('[data-test="option-btn"]');
    btns[0]!.click();
    expect(onAnswer).toHaveBeenCalledWith("dům", true);
    // Click the second option ("pes", incorrect)
    btns[1]!.click();
    expect(onAnswer).toHaveBeenCalledWith("pes", false);
  });

  it("highlights correct answer when wrong key is pressed (pressedIsWrong)", () => {
    // pressedKey=2 → "pes" (incorrect). Should highlight pressed as wrong AND show correct.
    const el = render(
      <QuizCard question={question} onAnswer={() => {}} pressedKey={2} />
    );
    const btns = qAll(el, "option-btn");
    // Button index 1 (key 2) = "pes" → pressed + wrong
    expect(btns[1]!.className).toContain("option-btn-wrong");
    // Button index 0 = "dům" (correct) → should also be highlighted as correct
    expect(btns[0]!.className).toContain("option-btn-correct");
  });

  it("does not highlight correct answer when correct key is pressed", () => {
    // pressedKey=1 → "dům" (correct). Only the pressed button should be highlighted.
    const el = render(
      <QuizCard question={question} onAnswer={() => {}} pressedKey={1} />
    );
    const btns = qAll(el, "option-btn");
    expect(btns[0]!.className).toContain("option-btn-correct");
    // Other buttons should NOT have any extra styling
    for (let i = 1; i < btns.length; i++) {
      expect(btns[i]!.className).not.toContain("option-btn-correct");
      expect(btns[i]!.className).not.toContain("option-btn-wrong");
    }
  });
});
