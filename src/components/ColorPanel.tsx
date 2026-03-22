import React, { useCallback } from "react";
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP } from "../constants";
import { ColorMappingList } from "./ColorMappingList";
import type { ColorAction } from "../color-reducer";
import { useTranslation } from "../i18n";

interface ColorPanelProps {
  prvRef: React.RefObject<HTMLCanvasElement | null>;
  prvWrapRef: React.RefObject<HTMLDivElement | null>;
  displayW: number;
  displayH: number;
  canvasTransform: React.CSSProperties;
  cc: number[];
  ccDispatch: React.Dispatch<ColorAction>;
  brushLevel: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  schedCursorRef: React.MutableRefObject<(() => void) | null>;
  spaceRef: React.MutableRefObject<boolean>;
  panningRef: React.MutableRefObject<boolean>;
  startPan: (e: React.PointerEvent) => void;
  movePan: (e: React.PointerEvent) => void;
  endPan: () => void;
}

export const ColorPanel = React.memo(function ColorPanel(props: ColorPanelProps) {
  const {
    prvRef, prvWrapRef, displayW, displayH, canvasTransform,
    cc, ccDispatch, brushLevel,
    setZoom, setPan, schedCursorRef,
    spaceRef, panningRef, startPan, movePan, endPan,
  } = props;
  const { t } = useTranslation();

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "+" || e.key === "=") { e.preventDefault(); setZoom(z => Math.min(ZOOM_MAX, z * ZOOM_STEP)); schedCursorRef.current?.(); }
    else if (e.key === "-") { e.preventDefault(); setZoom(z => Math.max(ZOOM_MIN, z / ZOOM_STEP)); schedCursorRef.current?.(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setPan(p => ({ ...p, x: p.x + 10 })); schedCursorRef.current?.(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); setPan(p => ({ ...p, x: p.x - 10 })); schedCursorRef.current?.(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setPan(p => ({ ...p, y: p.y + 10 })); schedCursorRef.current?.(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setPan(p => ({ ...p, y: p.y - 10 })); schedCursorRef.current?.(); }
    else if (e.key === "0") { e.preventDefault(); setZoom(1); setPan({ x: 0, y: 0 }); schedCursorRef.current?.(); }
  }, [setZoom, setPan, schedCursorRef]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 1 || spaceRef.current) { e.preventDefault(); startPan(e); }
  }, [spaceRef, startPan]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (panningRef.current) movePan(e);
  }, [panningRef, movePan]);

  const handlePointerUp = useCallback(() => {
    if (panningRef.current) endPan();
  }, [panningRef, endPan]);

  const handlePointerLeave = useCallback(() => {
    if (panningRef.current) endPan();
  }, [panningRef, endPan]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontSize: 10, color: "#6a6a8a" }}>{t("label_colorized")}</div>
      <div ref={prvWrapRef} tabIndex={0}
        aria-label={t("aria_color_preview")}
        onKeyDown={handleKeyDown}
        style={{ border: "1px solid #2a2a40", borderRadius: 4, overflow: "hidden", position: "relative", width: displayW, height: displayH }}>
        <canvas ref={prvRef}
          role="img" aria-label={t("aria_color_preview_canvas")}
          style={{ width: displayW, height: displayH, display: "block", ...canvasTransform, cursor: "grab", touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
        />
      </div>
      <div style={{ fontSize: 10, color: "#5a5a7a" }}>{t("label_color_mapping")}</div>
      <ColorMappingList cc={cc} dispatch={ccDispatch} brushLevel={brushLevel} />
    </div>
  );
});
