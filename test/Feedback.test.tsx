import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Feedback } from "../src/components/Feedback";
import type { FeedbackEntry } from "../src/components/Feedback";

const entry: FeedbackEntry = {
  prompt: "el gato",
  userAnswer: "pes",
  correctAnswer: "kočka",
};

describe("Feedback", () => {
  it("renders prompt, wrong answer, and correct answer", () => {
    const html = renderToStaticMarkup(<Feedback feedback={entry} isFirst={true} />);
    expect(html).toContain("el gato");
    expect(html).toContain("pes");
    expect(html).toContain("kočka");
  });

  it("contains the lightning icon", () => {
    const html = renderToStaticMarkup(<Feedback feedback={entry} isFirst={true} />);
    expect(html).toContain("⚡");
  });

  it("renders wrong answer in log-wrong class", () => {
    const html = renderToStaticMarkup(<Feedback feedback={entry} isFirst={true} />);
    expect(html).toContain('class="log-wrong"');
    expect(html).toContain('class="log-correct"');
    expect(html).toContain('class="log-prompt"');
  });

  it("has feedback-incorrect class", () => {
    const html = renderToStaticMarkup(<Feedback feedback={entry} isFirst={true} />);
    expect(html).toContain("feedback-incorrect");
  });

  it("has no inline opacity when isFirst=true", () => {
    const html = renderToStaticMarkup(<Feedback feedback={entry} isFirst={true} />);
    expect(html).not.toContain("opacity");
  });

  it("has opacity 0.35 when isFirst=false", () => {
    const html = renderToStaticMarkup(<Feedback feedback={entry} isFirst={false} />);
    expect(html).toContain("opacity:0.35");
  });

  it("contains separator and arrow", () => {
    const html = renderToStaticMarkup(<Feedback feedback={entry} isFirst={true} />);
    expect(html).toContain("log-sep");
    expect(html).toContain("log-arrow");
  });
});
