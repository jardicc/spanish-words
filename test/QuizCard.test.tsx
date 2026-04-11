import { describe, it, expect, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { render, q, qAll } from "./render";
import { QuizCard } from "../src/components/QuizCard";
import type { QuizQuestion } from "../src/types";

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
    let root!: Root;
    act(() => {
      root = createRoot(container);
      root.render(<QuizCard question={question} onAnswer={onAnswer} pressedKey={null} />);
    });
    // Click the first option ("dům", correct)
    const btns = container.querySelectorAll<HTMLButtonElement>('[data-test="option-btn"]');
    btns[0]!.click();
    expect(onAnswer).toHaveBeenCalledWith("dům", true);
    // Click the second option ("pes", incorrect)
    btns[1]!.click();
    expect(onAnswer).toHaveBeenCalledWith("pes", false);
    act(() => { root.unmount(); });
  });

  it("highlights wrong pressed button and hints correct answer", () => {
    // pressedKey=2 → "pes" (incorrect). Should mark pressed as wrong AND hint the correct one.
    const el = render(
      <QuizCard question={question} onAnswer={() => {}} pressedKey={2} />
    );
    const btns = qAll(el, "option-btn");
    expect(btns[1]!.getAttribute("data-state")).toBe("wrong");
    expect(btns[0]!.getAttribute("data-state")).toBe("correct-hint");
  });

  it("only marks the pressed correct button, others have no state", () => {
    // pressedKey=1 → "dům" (correct). Only that button should have a state.
    const el = render(
      <QuizCard question={question} onAnswer={() => {}} pressedKey={1} />
    );
    const btns = qAll(el, "option-btn");
    expect(btns[0]!.getAttribute("data-state")).toBe("correct");
    for (let i = 1; i < btns.length; i++) {
      expect(btns[i]!.getAttribute("data-state")).toBeNull();
    }
  });
});
