import React from "react";
import "./ConfirmDialog.css";

export function ConfirmDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="confirm-overlay" data-test="confirm-overlay">
      <div className="confirm-dialog" data-test="confirm-dialog">
        <p data-test="confirm-message">Opravdu chceš smazat všechny statistiky?</p>
        <div className="confirm-actions">
          <button className="confirm-yes" data-test="confirm-yes" onClick={onConfirm}>Ano, smazat</button>
          <button className="confirm-no" data-test="confirm-no" onClick={onCancel}>Zrušit</button>
        </div>
      </div>
    </div>
  );
}
