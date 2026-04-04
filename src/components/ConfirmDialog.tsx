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
    <div className="confirm-overlay">
      <div className="confirm-dialog">
        <p>Opravdu chceš smazat všechny statistiky?</p>
        <div className="confirm-actions">
          <button className="confirm-yes" onClick={onConfirm}>Ano, smazat</button>
          <button className="confirm-no" onClick={onCancel}>Zrušit</button>
        </div>
      </div>
    </div>
  );
}
