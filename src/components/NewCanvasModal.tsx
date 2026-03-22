import React, { useState, useCallback, useEffect } from "react";
import { S_BTN, S_BTN_ACTIVE } from "../styles";
import { MAX_IMAGE_SIZE } from "../constants";
import { useTranslation } from "../i18n";

interface NewCanvasModalProps {
  open: boolean;
  onConfirm: (w: number, h: number) => void;
  onCancel: () => void;
}

export const NewCanvasModal = React.memo(function NewCanvasModal({ open, onConfirm, onCancel }: NewCanvasModalProps) {
  const { t } = useTranslation();
  const [w, setW] = useState(320);
  const [h, setH] = useState(320);

  useEffect(() => {
    if (open) { setW(320); setH(320); }
  }, [open]);

  const handleConfirm = useCallback(() => {
    const cw = Number.isFinite(w) ? Math.max(1, Math.min(MAX_IMAGE_SIZE, Math.round(w))) : 320;
    const ch = Number.isFinite(h) ? Math.max(1, Math.min(MAX_IMAGE_SIZE, Math.round(h))) : 320;
    onConfirm(cw, ch);
  }, [w, h, onConfirm]);

  if (!open) return null;

  const presets = [
    { label: "16\u00D716", w: 16, h: 16 },
    { label: "32\u00D732", w: 32, h: 32 },
    { label: "64\u00D764", w: 64, h: 64 },
    { label: "128\u00D7128", w: 128, h: 128 },
    { label: "256\u00D7256", w: 256, h: 256 },
    { label: "320\u00D7320", w: 320, h: 320 },
    { label: "512\u00D7512", w: 512, h: 512 },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onCancel}>
      <div style={{ background: "#12122a", border: "1px solid #3a3a5a", borderRadius: 8, padding: 20, minWidth: 280, textAlign: "center" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#c8c8d8", marginBottom: 12 }}>{t("new_canvas_title")}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: "#8a8aaa" }}>
            W: <input type="number" min={1} max={MAX_IMAGE_SIZE} value={w} onChange={e => setW(+e.target.value)}
              style={{ width: 60, background: "#0a0a18", border: "1px solid #2a2a40", color: "#c8c8d8", borderRadius: 4, padding: "2px 6px", fontSize: 12 }} />
          </label>
          <span style={{ color: "#5a5a7a" }}>{"\u00D7"}</span>
          <label style={{ fontSize: 11, color: "#8a8aaa" }}>
            H: <input type="number" min={1} max={MAX_IMAGE_SIZE} value={h} onChange={e => setH(+e.target.value)}
              style={{ width: 60, background: "#0a0a18", border: "1px solid #2a2a40", color: "#c8c8d8", borderRadius: 4, padding: "2px 6px", fontSize: 12 }} />
          </label>
        </div>
        <div style={{ fontSize: 9, color: "#4a4a6a", marginBottom: 8 }}>{t("new_canvas_max")} {MAX_IMAGE_SIZE}{"\u00D7"}{MAX_IMAGE_SIZE}</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", marginBottom: 12 }}>
          {presets.map(p => (
            <button key={p.label} onClick={() => { setW(p.w); setH(p.h); }}
              style={{ ...S_BTN, padding: "2px 8px", fontSize: 9, ...(w === p.w && h === p.h ? { border: "1px solid #6080ff", color: "#80a0ff" } : {}) }}>
              {p.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button onClick={handleConfirm} style={{ ...S_BTN_ACTIVE, padding: "6px 20px" }}>{t("btn_create")}</button>
          <button onClick={onCancel} style={{ ...S_BTN, padding: "6px 20px" }}>{t("btn_cancel")}</button>
        </div>
      </div>
    </div>
  );
});
