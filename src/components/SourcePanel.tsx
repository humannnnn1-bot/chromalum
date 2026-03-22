import React, { useCallback } from "react";
import { TOOLS, BRUSH_MIN, BRUSH_MAX, BRUSH_STEP } from "../constants";
import { LEVEL_INFO } from "../color-engine";
import { S_BTN, S_BTN_ACTIVE } from "../styles";
import { rgbStr, timestamp } from "../utils";
import type { AppState, ToolState, ViewState, SaveActions } from "../types";
import { useTranslation } from "../i18n";

interface SourcePanelProps {
  srcRef: React.RefObject<HTMLCanvasElement | null>;
  curRef: React.RefObject<HTMLCanvasElement | null>;
  srcWrapRef: React.RefObject<HTMLDivElement | null>;
  statusRef: React.RefObject<HTMLDivElement | null>;
  toolState: ToolState;
  viewState: ViewState;
  saveActions: SaveActions;
  colorLUT: [number, number, number][];
  state: AppState;
  onDown: (e: React.PointerEvent) => void;
  onMove: (e: React.PointerEvent) => void;
  onUp: () => void;
  onPointerLeave: (e: React.PointerEvent) => void;
  undo: () => void;
  redo: () => void;
  handleClear: () => void;
  loadImg: (file: File) => void;
  announce: (msg: string) => void;
  schedCursor: () => void;
  prvRef: React.RefObject<HTMLCanvasElement | null>;
  onNewCanvas: () => void;
}

export const SourcePanel = React.memo(function SourcePanel(props: SourcePanelProps) {
  const {
    srcRef, curRef, srcWrapRef, statusRef,
    colorLUT, state,
    onDown, onMove, onUp, onPointerLeave,
    undo, redo, handleClear, loadImg,
    announce, schedCursor, prvRef, onNewCanvas,
  } = props;
  const { tool, setTool, brushLevel, setBrushLevel, brushSize, setBrushSize } = props.toolState;
  const { zoom, setZoom, setPan, displayW, displayH, canvasTransform, canvasCursor } = props.viewState;
  const { saveColor, saveSVG, copyToClipboard, exportPalette, importPalette, saveScale, setSaveScale } = props.saveActions;
  const { t } = useTranslation();

  const handleContextMenu = useCallback((e: React.MouseEvent) => e.preventDefault(), []);
  const handleZoomReset = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); schedCursor(); }, [setZoom, setPan, schedCursor]);
  const handleSizeDown = useCallback(() => setBrushSize(v => Math.max(BRUSH_MIN, v - BRUSH_STEP)), [setBrushSize]);
  const handleSizeUp = useCallback(() => setBrushSize(v => Math.min(BRUSH_MAX, v + BRUSH_STEP)), [setBrushSize]);
  const handleSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setBrushSize(+e.target.value), [setBrushSize]);
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) loadImg(e.target.files[0]); e.target.value = ""; }, [loadImg]);
  const handleSaveColor = useCallback(() => saveColor(prvRef, `chromalum_color_${timestamp()}.png`), [saveColor, prvRef]);
  const handleSaveGray = useCallback(() => saveColor(srcRef, `chromalum_gray_${timestamp()}.png`), [saveColor, srcRef]);
  const handlePaletteImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) importPalette(e.target.files[0]); e.target.value = ""; }, [importPalette]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontSize: 10, color: "#6a6a8a" }}>{t("label_source")}</div>
      <div ref={srcWrapRef} style={{ border: "1px solid #2a2a40", borderRadius: 4, overflow: "hidden", position: "relative", width: displayW, height: displayH }}>
        <canvas ref={srcRef}
          role="application" aria-label={t("aria_drawing_canvas")}
          style={{ width: displayW, height: displayH, display: "block", ...canvasTransform, cursor: canvasCursor, touchAction: "none" }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
          onPointerLeave={onPointerLeave}
          onContextMenu={handleContextMenu} />
        <canvas ref={curRef} width={displayW} height={displayH}
          style={{ position: "absolute", top: 0, left: 0, width: displayW, height: displayH, pointerEvents: "none" }} />
      </div>
      <div ref={statusRef} style={{ fontSize: 9, color: "#5a5a8a", fontFamily: "monospace", minHeight: 14, textAlign: "center" }}>{"\u2014"}</div>

      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center" }} role="radiogroup" aria-label={t("aria_drawing_tools")}>
        {TOOLS.map(tl =>
          <button key={tl.id} onClick={() => { setTool(tl.id); announce(t("announce_" + tl.id)); }} role="radio" aria-checked={tool === tl.id}
            style={tool === tl.id ? S_BTN_ACTIVE : S_BTN}>
            {t("tool_" + tl.id)}({tl.key})</button>)}
      </div>

      <div style={{ display: "flex", gap: 4 }}>
        <button onClick={undo} disabled={!state.undoStack.length} aria-disabled={!state.undoStack.length}
          style={{ ...S_BTN, opacity: state.undoStack.length ? 1 : .3 }} title={t("title_undo")}>{t("btn_undo")}</button>
        <button onClick={redo} disabled={!state.redoStack.length} aria-disabled={!state.redoStack.length}
          style={{ ...S_BTN, opacity: state.redoStack.length ? 1 : .3 }} title={t("title_redo")}>{t("btn_redo")}</button>
        <button onClick={handleZoomReset} style={S_BTN}
          title={t("title_zoom_reset")} aria-label={t("aria_zoom_reset", Math.round(zoom * 100))}>{"\u229B"}{Math.round(zoom * 100)}%</button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
        <span style={{ color: "#5a5a7a" }}>{t("label_size")}</span>
        <button onClick={handleSizeDown}
          aria-label={t("aria_brush_size_decrease")}
          style={{ ...S_BTN, padding: "2px 8px", fontSize: 13, fontWeight: 700 }}>{"\u2212"}</button>
        <input type="range" min={BRUSH_MIN} max={BRUSH_MAX} step={1} value={brushSize}
          aria-label={t("aria_brush_size")}
          onChange={handleSizeChange} style={{ width: 80 }} />
        <button onClick={handleSizeUp}
          aria-label={t("aria_brush_size_increase")}
          style={{ ...S_BTN, padding: "2px 8px", fontSize: 13, fontWeight: 700 }}>+</button>
        <span style={{ color: "#8a8aaa", minWidth: 20 }}>{brushSize}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
        <div style={{ width: 24, height: 24, borderRadius: 4, border: "2px solid #6080ff",
          background: `rgb(${LEVEL_INFO[brushLevel].gray},${LEVEL_INFO[brushLevel].gray},${LEVEL_INFO[brushLevel].gray})` }} />
        <div style={{ fontSize: 10, color: "#8a8aaa" }}>{"\u2192"}</div>
        <div style={{ width: 24, height: 24, borderRadius: 4, border: "2px solid #6080ff",
          background: rgbStr(colorLUT[brushLevel]) }} />
        <span style={{ fontSize: 9, color: "#6a6a8a" }}>L{brushLevel} {LEVEL_INFO[brushLevel].name}</span>
      </div>

      <div style={{ display: "flex", gap: 3 }}>
        {LEVEL_INFO.map((info, i) =>
          <button key={i} onClick={() => { setBrushLevel(i); announce(t("announce_level", i, info.name)); }}
            aria-label={t("announce_level", i, info.name)}
            style={{ width: 30, height: 30, border: `2px solid ${brushLevel === i ? "#6080ff" : "#2a2a40"}`, borderRadius: 4, cursor: "pointer",
              background: `rgb(${info.gray},${info.gray},${info.gray})`, position: "relative" }}>
            <span style={{ position: "absolute", bottom: 1, right: 2, fontSize: 8, color: info.gray > 128 ? "#000" : "#fff", fontWeight: 700 }}>{i}</span>
          </button>)}
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={onNewCanvas} style={S_BTN} title={t("title_new_canvas")}>{t("btn_new")}</button>
        <label style={{ ...S_BTN, border: "1px solid #3040aa", color: "#8090dd" }}>{t("btn_load")}<input type="file" accept="image/*" aria-label={t("aria_open_image")} onChange={handleFileChange} style={{ display: "none" }} /></label>
        <button onClick={handleClear} style={S_BTN} title={t("title_clear")}>{t("btn_clear")}</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
          <button onClick={handleSaveColor} style={{ ...S_BTN, color: "#70aa80" }}>{t("btn_save_color")}</button>
          <button onClick={handleSaveGray} style={S_BTN}>{t("btn_save_gray")}</button>
          <button onClick={saveSVG} style={{ ...S_BTN, color: "#aa80dd" }}>{t("btn_save_svg")}</button>
          <button onClick={copyToClipboard} style={{ ...S_BTN, color: "#80aacc" }} title={t("title_copy")}>{t("btn_copy")}</button>
        </div>
        <div style={{ display: "flex", gap: 3, alignItems: "center", justifyContent: "center" }} role="radiogroup" aria-label={t("label_png_scale")}>
          <span style={{ fontSize: 9, color: "#4a4a6a" }}>{t("label_png_scale")}</span>
          {[1, 2, 4, 8].map(s =>
            <button key={s} onClick={() => setSaveScale(s)}
              role="radio" aria-checked={saveScale === s}
              aria-label={t("aria_png_scale", s)}
              style={{ ...S_BTN, padding: "2px 6px", fontSize: 9, ...(saveScale === s ? { border: "1px solid #6080ff", color: "#80a0ff" } : {}) }}>{s}x</button>)}
        </div>
        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
          <button onClick={exportPalette} style={{ ...S_BTN, color: "#aa9060" }} title={t("title_palette_export")}>{t("btn_palette_export")}</button>
          <label style={{ ...S_BTN, color: "#60aa90", cursor: "pointer" }} title={t("title_palette_import")}>{t("btn_palette_import")}<input type="file" accept=".json" aria-label={t("aria_palette_file")} onChange={handlePaletteImport} style={{ display: "none" }} /></label>
        </div>
      </div>
    </div>
  );
});
