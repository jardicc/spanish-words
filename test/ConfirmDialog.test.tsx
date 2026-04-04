// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import React from "react";
import { render, q } from "./render";
import { ConfirmDialog } from "../src/components/ConfirmDialog";

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
});
