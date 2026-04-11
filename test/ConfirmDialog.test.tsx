// @vitest-environment happy-dom
import { GlobalWindow } from "happy-dom";
import { describe, it, expect, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { render, q } from "./render";
import { ConfirmDialog } from "../src/components/ConfirmDialog";

const _hw = new GlobalWindow() as any;
const _g = globalThis as any;
if (!_g.document) {
  Object.getOwnPropertyNames(_hw).forEach((key) => {
    try { if (!(key in _g)) _g[key] = _hw[key]; } catch {}
  });
}
_g.IS_REACT_ACT_ENVIRONMENT = true;

describe("ConfirmDialog", () => {
  it("renders the confirmation message", () => {
    const el = render(<ConfirmDialog onConfirm={() => {}} onCancel={() => {}} />);
    expect(q(el, "confirm-message")!.textContent).toBe(
      "Opravdu chceš smazat všechny statistiky?"
    );
  });

  it("has confirm and cancel buttons", () => {
    const el = render(<ConfirmDialog onConfirm={() => {}} onCancel={() => {}} />);
    expect(q(el, "confirm-yes")).not.toBeNull();
    expect(q(el, "confirm-no")).not.toBeNull();
    expect(q(el, "confirm-yes")!.textContent).toBe("Ano, smazat");
    expect(q(el, "confirm-no")!.textContent).toBe("Zrušit");
  });

  it("has overlay and dialog structure", () => {
    const el = render(<ConfirmDialog onConfirm={() => {}} onCancel={() => {}} />);
    expect(q(el, "confirm-overlay")).not.toBeNull();
    expect(q(el, "confirm-dialog")).not.toBeNull();
  });

  it("confirm-dialog is nested inside overlay", () => {
    const el = render(<ConfirmDialog onConfirm={() => {}} onCancel={() => {}} />);
    const overlay = q(el, "confirm-overlay")!;
    expect(overlay.querySelector('[data-test="confirm-dialog"]')).not.toBeNull();
  });

  it("calls onConfirm when confirm button is clicked", () => {
    const onConfirm = vi.fn();
    const container = document.createElement("div");
    act(() => { createRoot(container).render(<ConfirmDialog onConfirm={onConfirm} onCancel={() => {}} />); });
    container.querySelector<HTMLButtonElement>('[data-test="confirm-yes"]')!.click();
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when cancel button is clicked", () => {
    const onCancel = vi.fn();
    const container = document.createElement("div");
    act(() => { createRoot(container).render(<ConfirmDialog onConfirm={() => {}} onCancel={onCancel} />); });
    container.querySelector<HTMLButtonElement>('[data-test="confirm-no"]')!.click();
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
