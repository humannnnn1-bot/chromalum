import React, { useEffect, useCallback } from "react";
import { S_BTN } from "../styles";
import { useTranslation } from "../i18n";

interface HelpModalProps {
  showHelp: boolean;
  setShowHelp: React.Dispatch<React.SetStateAction<boolean>>;
  helpRef: React.RefObject<HTMLDivElement | null>;
}

export const HelpModal = React.memo(function HelpModal({ showHelp, setShowHelp, helpRef }: HelpModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!showHelp) return;
    const el = helpRef.current; if (!el) return;
    const focusable = el.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
    if (focusable.length) (focusable[0] as HTMLElement).focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const first = focusable[0] as HTMLElement, last = focusable[focusable.length - 1] as HTMLElement;
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
    };
    el.addEventListener('keydown', trap);
    return () => el.removeEventListener('keydown', trap);
  }, [showHelp, helpRef]);

  const handleClose = useCallback(() => setShowHelp(false), [setShowHelp]);
  const stopPropagation = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

  if (!showHelp) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={handleClose}>
      <div ref={helpRef} role="dialog" aria-modal="true" aria-label={t("help_title")}
        style={{ background: "#1a1a2a", border: "1px solid #3a3a5a", borderRadius: 8, padding: 20, maxWidth: 360, fontFamily: "monospace", fontSize: 11, color: "#c8c8d8" }}
        onClick={stopPropagation}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#80a0ff" }}>{t("help_title")}</div>
        {[
          ["B", t("help_brush")], ["E", t("help_eraser")], ["F", t("help_fill")],
          ["L", t("help_line")], ["R", t("help_rect")], ["O", t("help_ellipse")],
          ["0-7", t("help_level")], ["[ / ]", t("help_brush_size")],
          [t("help_pan_key"), t("help_pan")], [t("help_zoom_key"), t("help_zoom")],
          ["Ctrl+N", t("help_new_canvas")],
          ["Ctrl+Z", t("help_undo")], ["Ctrl+Y / \u2318\u21E7Z", t("help_redo")],
          ["Ctrl+V", t("help_paste")], ["?", t("help_this_help")], ["Esc", t("help_close")],
        ].map(([k, v]) =>
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #2a2a3a" }}>
            <span style={{ color: "#80a0ff", fontWeight: 700, minWidth: 120 }}>{k}</span>
            <span style={{ color: "#8a8aaa" }}>{v}</span>
          </div>)}
        <button onClick={handleClose} tabIndex={0}
          style={{ ...S_BTN, marginTop: 12, width: "100%", textAlign: "center" }}>{t("help_close")}</button>
      </div>
    </div>
  );
});
