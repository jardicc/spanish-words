import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GlobalWindow } from "happy-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import quizReducer, { type QuizState } from "../src/store/quizSlice";

const win = new GlobalWindow();

export function render(element: React.ReactElement): HTMLElement {
  const html = renderToStaticMarkup(element);
  const container = win.document.createElement("div");
  container.innerHTML = html;
  return container as unknown as HTMLElement;
}

export function renderWithStore(
  element: React.ReactElement,
  preloadedQuizState?: Partial<QuizState>,
): HTMLElement {
  const store = configureStore({
    reducer: { quiz: quizReducer },
    preloadedState: preloadedQuizState
      ? { quiz: { ...quizReducer(undefined, { type: "@@INIT" }), ...preloadedQuizState } }
      : undefined,
  });
  return render(<Provider store={store}>{element}</Provider>);
}

export function q(container: HTMLElement, testId: string): HTMLElement | null {
  return container.querySelector(`[data-test="${testId}"]`);
}

export function qAll(container: HTMLElement, testId: string): HTMLElement[] {
  return Array.from(container.querySelectorAll(`[data-test="${testId}"]`));
}
