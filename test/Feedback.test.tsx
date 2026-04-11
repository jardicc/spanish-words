import { describe, it, expect } from "vitest";
import React from "react";
import { render, q } from "./render";
import { Feedback } from "../src/components/Feedback";
import type { FeedbackEntry } from "../src/components/Feedback";

const entry: FeedbackEntry = {
  prompt: "el gato",
  userAnswer: "pes",
  correctAnswer: "kočka",
};

describe("Feedback", () => {
  it("renders prompt, wrong answer, and correct answer", () => {
    const el = render(<Feedback feedback={entry} isFirst={true} />);
    expect(q(el, "feedback-prompt")!.textContent).toBe("el gato");
    expect(q(el, "feedback-wrong")!.textContent).toBe("pes");
    expect(q(el, "feedback-correct")!.textContent).toBe("kočka");
  });

  it("contains the lightning icon", () => {
    const el = render(<Feedback feedback={entry} isFirst={true} />);
    expect(q(el, "feedback-icon")!.textContent).toBe("⚡");
  });

  it("feedback element exists", () => {
    const el = render(<Feedback feedback={entry} isFirst={true} />);
    expect(q(el, "feedback")).not.toBeNull();
  });

  it("marks data-first=true when isFirst", () => {
    const el = render(<Feedback feedback={entry} isFirst={true} />);
    expect(q(el, "feedback")!.getAttribute("data-first")).toBe("true");
  });

  it("marks data-first=false when not isFirst", () => {
    const el = render(<Feedback feedback={entry} isFirst={false} />);
    expect(q(el, "feedback")!.getAttribute("data-first")).toBe("false");
  });

  it("has no inline opacity when isFirst=true", () => {
    const el = render(<Feedback feedback={entry} isFirst={true} />);
    expect((q(el, "feedback") as HTMLElement).style.opacity).toBe("");
  });

  it("has opacity 0.35 when isFirst=false", () => {
    const el = render(<Feedback feedback={entry} isFirst={false} />);
    expect((q(el, "feedback") as HTMLElement).style.opacity).toBe("0.35");
  });
});
