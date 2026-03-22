import type React from "react";
import { MIN_TAP_SIZE } from "./constants";

/* ═══════════════════════════════════════════
   SHARED STYLES
   ═══════════════════════════════════════════ */
export const S_BTN: React.CSSProperties = { padding: "4px 10px", fontSize: 11, border: "1px solid #2a2a40", background: "#0f0f1a", color: "#7a7aaa", borderRadius: 4, cursor: "pointer" };
export const S_BTN_ACTIVE: React.CSSProperties = { ...S_BTN, border: "1px solid #6080ff", background: "#1a1a3a", color: "#80a0ff", fontWeight: 700 };
export const S_BTN_SM: React.CSSProperties = { ...S_BTN, padding: "2px 8px", fontSize: 10 };
export const S_BTN_SM_ACTIVE: React.CSSProperties = { ...S_BTN_ACTIVE, padding: "2px 8px", fontSize: 10 };
export const S_NAV_ARROW: React.CSSProperties = { background: "none", border: "none", color: "#5a5a9a", cursor: "pointer", fontSize: 16, minWidth: MIN_TAP_SIZE, minHeight: MIN_TAP_SIZE, display: "flex", alignItems: "center", justifyContent: "center" };
export const S_TAB_ACTIVE: React.CSSProperties = {
  padding: "5px 14px", fontSize: 11, fontWeight: 700,
  border: "1px solid #6080ff", background: "#1a1a3a", color: "#80a0ff",
  borderRadius: "4px 4px 0 0", cursor: "pointer", borderBottom: "1px solid #1a1a3a",
};
export const S_TAB_INACTIVE: React.CSSProperties = {
  padding: "5px 14px", fontSize: 11, fontWeight: 400,
  border: "1px solid #2a2a40", background: "#0f0f1a", color: "#5a5a7a",
  borderRadius: "4px 4px 0 0", cursor: "pointer", borderBottom: "1px solid #2a2a40",
};
export const S_SWATCH: React.CSSProperties = { borderRadius: 3, cursor: "pointer", padding: 0, background: "none" };
