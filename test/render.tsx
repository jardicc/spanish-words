import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GlobalWindow } from "happy-dom";

const win = new GlobalWindow();

export function render(element: React.ReactElement): HTMLElement {
  const html = renderToStaticMarkup(element);
  const container = win.document.createElement("div");
  container.innerHTML = html;
  return container as unknown as HTMLElement;
}

export function q(container: HTMLElement, testId: string): HTMLElement | null {
  return container.querySelector(`[data-test="${testId}"]`);
}

export function qAll(container: HTMLElement, testId: string): HTMLElement[] {
  return Array.from(container.querySelectorAll(`[data-test="${testId}"]`));
}
