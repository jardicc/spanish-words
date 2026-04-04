import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
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
    const html = renderToStaticMarkup(
      <QuizCard question={question} onAnswer={() => {}} pressedKey={null} />
    );
    expect(html).toContain("la casa");
    expect(html).toContain("quiz-prompt");
  });

  it("renders all options with labels", () => {
    const html = renderToStaticMarkup(
      <QuizCard question={question} onAnswer={() => {}} pressedKey={null} />
    );
    expect(html).toContain("dům");
    expect(html).toContain("pes");
    expect(html).toContain("kočka");
    expect(html).toContain("stůl");
    expect(html).toContain("auto");
    expect(html).toContain("kniha");
  });

  it("renders key numbers 1-6", () => {
    const html = renderToStaticMarkup(
      <QuizCard question={question} onAnswer={() => {}} pressedKey={null} />
    );
    for (let i = 1; i <= 6; i++) {
      expect(html).toContain(`<span class="option-key">${i}</span>`);
    }
  });

  it("adds pressed class for the pressed key", () => {
    const html = renderToStaticMarkup(
      <QuizCard question={question} onAnswer={() => {}} pressedKey={3} />
    );
    expect(html).toContain("option-btn-pressed");
    // Only one button should have pressed class
    const pressedCount = (html.match(/option-btn-pressed/g) || []).length;
    expect(pressedCount).toBe(1);
  });

  it("has no pressed class when pressedKey is null", () => {
    const html = renderToStaticMarkup(
      <QuizCard question={question} onAnswer={() => {}} pressedKey={null} />
    );
    expect(html).not.toContain("option-btn-pressed");
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
    const html = renderToStaticMarkup(
      <QuizCard question={articleQ} onAnswer={() => {}} pressedKey={null} />
    );
    expect(html).toContain("___ casa (dům)");
    expect(html).toContain("el");
    expect(html).toContain("la");
    const btnCount = (html.match(/option-btn"/g) || []).length;
    expect(btnCount).toBe(2);
  });
});
