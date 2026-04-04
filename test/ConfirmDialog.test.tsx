import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ConfirmDialog } from "../src/components/ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renders the confirmation question", () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog onConfirm={() => {}} onCancel={() => {}} />
    );
    expect(html).toContain("Opravdu chceš smazat všechny statistiky?");
  });

  it("has confirm and cancel buttons", () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog onConfirm={() => {}} onCancel={() => {}} />
    );
    expect(html).toContain("Ano, smazat");
    expect(html).toContain("Zrušit");
  });

  it("has overlay and dialog structure", () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog onConfirm={() => {}} onCancel={() => {}} />
    );
    expect(html).toContain("confirm-overlay");
    expect(html).toContain("confirm-dialog");
    expect(html).toContain("confirm-actions");
  });

  it("has correct button classes", () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog onConfirm={() => {}} onCancel={() => {}} />
    );
    expect(html).toContain("confirm-yes");
    expect(html).toContain("confirm-no");
  });
});
