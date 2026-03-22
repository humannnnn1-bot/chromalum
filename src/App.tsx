import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useReducer, useMemo } from "react";

import { buildColorLUT, DEFAULT_CC } from "./color-engine";
import { DISPLAY_MAX, MOBILE_BREAKPOINT, TOAST_DURATION, LEVEL_MASK, isShapeTool } from "./constants";
import { timestamp } from "./utils";
import type { ToolId } from "./constants";
import { renderBuf } from "./render-buf";
import { canvasReducer, initialState } from "./canvas-reducer";
import { colorReducer } from "./color-reducer";
import { saveState, loadState } from "./utils/idb-persistence";
import { useSyncRef } from "./hooks/useSyncRef";
import { usePanZoom } from "./hooks/usePanZoom";
import { useCanvasDrawing } from "./hooks/useCanvasDrawing";
import { useFileDrop } from "./hooks/useFileDrop";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { S_TAB_ACTIVE, S_TAB_INACTIVE } from "./styles";
import { Toast } from "./components/Toast";
import { HexDiag } from "./components/HexDiag";
import { SourcePanel } from "./components/SourcePanel";
import { ColorPanel } from "./components/ColorPanel";
import { HelpModal } from "./components/HelpModal";
import { NewCanvasModal } from "./components/NewCanvasModal";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { useTranslation } from "./i18n";

export default function App() {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(canvasReducer, initialState);
  const { cvs } = state;
  const [cc, ccDispatch] = useReducer(colorReducer, [...DEFAULT_CC]);

  const [brushLevel, setBrushLevel] = useState(7);
  const [brushSize, setBrushSize] = useState(12);
  const [tool, setTool] = useState<ToolId>("brush");
  const [saveScale, setSaveScale] = useState(1);
  const [mobileTab, setMobileTab] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);
  const [showNewCanvas, setShowNewCanvas] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((message: string, type: "error" | "success" | "info" = "info") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => { setToast(null); toastTimerRef.current = null; }, TOAST_DURATION);
  }, []);

  const prvRef = useRef<HTMLCanvasElement | null>(null);
  const hexPrvRef = useRef<HTMLCanvasElement | null>(null);
  const srcWrapRef = useRef<HTMLDivElement | null>(null);
  const prvWrapRef = useRef<HTMLDivElement | null>(null);
  const ariaLiveRef = useRef<HTMLDivElement | null>(null);
  const helpRef = useRef<HTMLDivElement | null>(null);

  const announce = useCallback((msg: string) => {
    if (ariaLiveRef.current) ariaLiveRef.current.textContent = msg;
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${MOBILE_BREAKPOINT}px)`);
    const h = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    h(mq); mq.addEventListener("change", h as (e: MediaQueryListEvent) => void);
    return () => mq.removeEventListener("change", h as (e: MediaQueryListEvent) => void);
  }, []);

  // Restore state from IndexedDB on mount (showToast is stable via useCallback([]))
  const loadedOnceRef = useRef(false);
  useEffect(() => {
    if (loadedOnceRef.current) return;
    loadedOnceRef.current = true;
    loadState().then(saved => {
      if (saved) {
        dispatch({ type: "load_image", w: saved.w, h: saved.h, data: saved.data });
        for (let lv = 0; lv < 8; lv++) ccDispatch({ type: "set_color", lv, idx: saved.cc[lv] });
      }
    }).catch(() => showToast(t("toast_restore_failed"), "error")).finally(() => setLoaded(true));
  }, [showToast, t]);

  // Auto-save to IndexedDB on changes (debounced)
  useEffect(() => {
    if (!loaded) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveState({ w: cvs.w, h: cvs.h, data: cvs.data, cc: [...cc], version: 1 }).catch(() => showToast(t("toast_autosave_failed"), "error"));
    }, 1000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [cvs, cc, loaded, showToast, t]);

  const hist = state.hist;
  const colorLUT = useMemo(() => buildColorLUT(cc), [cc]);

  const { displayW, displayH } = useMemo(() => {
    const safeW = Math.max(1, cvs.w), safeH = Math.max(1, cvs.h);
    const asp = safeW / safeH, mx = DISPLAY_MAX;
    return {
      displayW: asp >= 1 ? mx : Math.round(mx * asp),
      displayH: asp >= 1 ? Math.round(mx / asp) : mx,
    };
  }, [cvs.w, cvs.h]);

  const sharedSchedCursorRef = useRef<(() => void) | null>(null);

  const panZoom = usePanZoom(cvs, displayW, sharedSchedCursorRef);

  const drawing = useCanvasDrawing(
    cvs, displayW, displayH, dispatch, colorLUT, cc,
    brushLevel, brushSize, tool,
    panZoom.zoom, panZoom.pan,
    panZoom.panningRef, panZoom.spaceRef,
    panZoom.zoomRef, panZoom.panRef,
    panZoom.startPan, panZoom.movePan, panZoom.endPan,
    prvRef,
  );

  // Bridge schedCursorRef from drawing hook to shared ref used by panZoom
  // Intentionally runs every render (no deps) to keep ref in sync
  useLayoutEffect(() => {
    sharedSchedCursorRef.current = drawing.schedCursorRef.current;
  });

  // Cleanup on unmount
  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (drawing.cursorRafRef.current) cancelAnimationFrame(drawing.cursorRafRef.current);
  }, []);

  const brushSizeRef = useSyncRef(brushSize);

  const fileDrop = useFileDrop(
    dispatch, panZoom.setZoom, panZoom.setPan, showToast, announce, t,
  );

  useKeyboardShortcuts(
    setTool, setBrushLevel, setBrushSize,
    dispatch, announce, panZoom.endPan, setShowHelp,
    panZoom.setCursorMode, panZoom.spaceRef, panZoom.panningRef,
    brushSizeRef, setShowNewCanvas, t,
  );

  // Wheel listener (non-passive)
  useEffect(() => {
    const s = srcWrapRef.current, p = prvWrapRef.current;
    const opts: AddEventListenerOptions = { passive: false };
    if (s) s.addEventListener('wheel', panZoom.onWheel, opts);
    if (p) p.addEventListener('wheel', panZoom.onWheel, opts);
    return () => {
      if (s) s.removeEventListener('wheel', panZoom.onWheel, opts);
      if (p) p.removeEventListener('wheel', panZoom.onWheel, opts);
    };
  }, [panZoom.onWheel, isMobile, mobileTab]);

  // Render buffer on state change
  useLayoutEffect(() => {
    if (drawing.drawingRef.current) return;
    const s = drawing.srcRef.current, p = prvRef.current, hp = hexPrvRef.current;
    if (!s && !p && !hp) return;
    let needReset = false;
    if (s && (s.width !== cvs.w || s.height !== cvs.h)) { s.width = cvs.w; s.height = cvs.h; needReset = true; }
    if (p && (p.width !== cvs.w || p.height !== cvs.h)) { p.width = cvs.w; p.height = cvs.h; needReset = true; }
    if (needReset) drawing.imgCacheRef.current = { src: null, prv: null };
    renderBuf(cvs.data, cvs.w, cvs.h, colorLUT, s, p || hp, drawing.imgCacheRef.current);
    if (hp) {
      if (hp.width !== cvs.w || hp.height !== cvs.h) { hp.width = cvs.w; hp.height = cvs.h; }
      const hctx = hp.getContext("2d");
      if (hctx && drawing.imgCacheRef.current.prv) {
        hctx.putImageData(drawing.imgCacheRef.current.prv, 0, 0);
      }
    }
  }, [cvs, colorLUT, mobileTab]);

  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  const saveColor = useCallback((ref: React.RefObject<HTMLCanvasElement | null>, name: string) => {
    const c = ref.current; if (!c) return;
    if (saveScale === 1) {
      const u = c.toDataURL("image/png");
      if (!u || u === "data:,") { showToast(t("toast_image_gen_failed"), "error"); return; }
      const a = document.createElement("a"); a.href = u; a.download = name; a.click();
      return;
    }
    const outW = cvs.w * saveScale, outH = cvs.h * saveScale;
    if (outW * outH > 16_000_000) {
      showToast(t("toast_memory_warning", outW, outH), "info");
    }
    const sc = document.createElement("canvas"); sc.width = outW; sc.height = outH;
    const ctx = sc.getContext("2d"); if (!ctx) return;
    ctx.imageSmoothingEnabled = false; ctx.drawImage(c, 0, 0, sc.width, sc.height);
    sc.toBlob(blob => {
      if (!blob) { showToast(t("toast_image_gen_failed"), "error"); return; }
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = u; a.download = name; a.click();
      URL.revokeObjectURL(u);
    }, "image/png");
  }, [saveScale, cvs.w, cvs.h, showToast, t]);

  const copyToClipboard = useCallback(() => {
    const c = prvRef.current; if (!c) return;
    c.toBlob(blob => {
      if (!blob) return;
      if (typeof ClipboardItem === "undefined") { showToast(t("toast_clipboard_unsupported"), "error"); return; }
      navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
        .then(() => showToast(t("toast_copied"), "success"))
        .catch(() => showToast(t("toast_copy_failed"), "error"));
    }, "image/png");
  }, [showToast, t]);

  const saveSVG = useCallback(() => {
    const totalPx = cvs.w * cvs.h;
    if (totalPx > 500_000) {
      showToast(t("toast_svg_size_warning", cvs.w, cvs.h), "info");
    }
    const rects: { x: number; y: number; w: number; h: number; fill: string }[] = [];
    for (let y = 0; y < cvs.h; y++) {
      let x = 0;
      while (x < cvs.w) {
        const lv = cvs.data[y * cvs.w + x] & LEVEL_MASK; const rgb = colorLUT[lv];
        let runLen = 1;
        while (x + runLen < cvs.w) {
          const nlv = cvs.data[y * cvs.w + x + runLen] & LEVEL_MASK; const nrgb = colorLUT[nlv];
          if (nrgb[0] === rgb[0] && nrgb[1] === rgb[1] && nrgb[2] === rgb[2]) runLen++; else break;
        }
        rects.push({ x, y, w: runLen, h: 1, fill: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})` });
        x += runLen;
      }
    }
    rects.sort((a, b) => a.x - b.x || (a.fill < b.fill ? -1 : a.fill > b.fill ? 1 : 0) || a.y - b.y);
    const merged: typeof rects = [];
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (merged.length > 0) {
        const prev = merged[merged.length - 1];
        if (prev.x === r.x && prev.w === r.w && prev.fill === r.fill && r.y === prev.y + prev.h) {
          prev.h += r.h;
          continue;
        }
      }
      merged.push({ ...r });
    }
    const BATCH = 1000;
    const chunks: string[] = [];
    chunks.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${cvs.w}" height="${cvs.h}" shape-rendering="crispEdges">`);
    for (let i = 0; i < merged.length; i += BATCH) {
      let batch = "";
      const end = Math.min(i + BATCH, merged.length);
      for (let j = i; j < end; j++) {
        const r = merged[j];
        batch += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.fill}"/>`;
      }
      chunks.push(batch);
    }
    chunks.push("</svg>");
    try {
      const svgStr = chunks.join("");
      const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chromalum_${timestamp()}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast(t("toast_svg_gen_failed"), "error");
    }
  }, [cvs, colorLUT, showToast, t]);

  const exportPalette = useCallback(() => {
    const json = JSON.stringify({ cc: [...cc], version: 1 });
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chromalum_palette_${timestamp()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t("toast_palette_saved"), "success");
  }, [cc, showToast, t]);

  const importPalette = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result as string);
        // cc values are indices into LEVEL_CANDIDATES; buildColorLUT uses % alts.length so any non-negative integer is safe
        if (!obj || obj.version !== 1 || !Array.isArray(obj.cc) || obj.cc.length !== 8
          || !obj.cc.every((v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 0)) {
          showToast(t("toast_palette_format_invalid"), "error");
          return;
        }
        for (let lv = 0; lv < 8; lv++) {
          ccDispatch({ type: "set_color", lv, idx: obj.cc[lv] });
        }
        showToast(t("toast_palette_loaded"), "success");
      } catch {
        showToast(t("toast_palette_load_failed"), "error");
      }
    };
    reader.onerror = () => showToast(t("toast_palette_load_failed"), "error");
    reader.readAsText(file);
  }, [showToast, t, ccDispatch]);

  const handleClear = useCallback(() => {
    if (hist[0] !== cvs.w * cvs.h) {
      dispatch({ type: "clear" });
      showToast(t("toast_cleared"), "info");
    }
  }, [hist, cvs.w, cvs.h, showToast, t]);

  const canvasTransform = useMemo(() => ({
    imageRendering: "pixelated" as const,
    transform: `scale(${panZoom.zoom}) translate(${panZoom.pan.x * displayW / cvs.w}px,${panZoom.pan.y * displayH / cvs.h}px)`,
    transformOrigin: "center center",
  }), [panZoom.zoom, panZoom.pan.x, panZoom.pan.y, displayW, displayH, cvs.w, cvs.h]);

  const canvasCursor = panZoom.cursorMode === "grabbing" ? "grabbing" : panZoom.cursorMode === "grab" ? "grab" : tool === "fill" ? "crosshair" : isShapeTool(tool) ? "crosshair" : "none";

  const onPointerLeave = useCallback((e: React.PointerEvent) => {
    const el = drawing.srcRef.current;
    if (el && drawing.drawingRef.current) {
      try {
        if (typeof el.hasPointerCapture === 'function' && el.hasPointerCapture(e.pointerId)) {
          drawing.clearCursor(); return;
        }
      } catch {}
    }
    drawing.onUp(); drawing.clearCursor();
  }, [drawing]);

  const schedCursorFn = useCallback(() => {
    drawing.schedCursorRef.current?.();
  }, [drawing.schedCursorRef]);

  const toolState = useMemo(() => ({
    tool, setTool, brushLevel, setBrushLevel, brushSize, setBrushSize,
  }), [tool, brushLevel, brushSize]);

  const viewState = useMemo(() => ({
    zoom: panZoom.zoom, setZoom: panZoom.setZoom, setPan: panZoom.setPan,
    displayW, displayH, canvasTransform, canvasCursor,
  }), [panZoom.zoom, panZoom.setZoom, panZoom.setPan, displayW, displayH, canvasTransform, canvasCursor]);

  const saveActionsObj = useMemo(() => ({
    saveColor, saveSVG, copyToClipboard, exportPalette, importPalette, saveScale, setSaveScale,
  }), [saveColor, saveSVG, copyToClipboard, exportPalette, importPalette, saveScale]);

  const handleNewCanvas = useCallback(() => setShowNewCanvas(true), []);
  const handleNewCanvasConfirm = useCallback((w: number, h: number) => {
    dispatch({ type: "new_canvas", w, h });
    panZoom.setZoom(1);
    panZoom.setPan({ x: 0, y: 0 });
    setShowNewCanvas(false);
    showToast(t("toast_new_canvas_created", w, h), "success");
  }, [panZoom.setZoom, panZoom.setPan, showToast, t]);
  const handleNewCanvasCancel = useCallback(() => setShowNewCanvas(false), []);


  const hexPanel = (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 10, color: "#6a6a8a" }}>{t("label_colorized")}</div>
      <div style={{ border: "1px solid #2a2a40", borderRadius: 4, overflow: "hidden", display: "inline-block", width: displayW, height: displayH }}>
        <canvas ref={hexPrvRef}
          style={{ width: displayW, height: displayH, display: "block", imageRendering: "pixelated" }} />
      </div>
      <div style={{ fontSize: 10, color: "#4a4a6a", marginTop: 8 }}>{t("hex_title")}</div>
      <HexDiag cc={cc} dispatch={ccDispatch} hist={hist} total={cvs.w * cvs.h} />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a12", color: "#c8c8d8", fontFamily: "monospace", padding: 16 }}
      onDragEnter={fileDrop.onDragEnter} onDragOver={fileDrop.onDragOver} onDragLeave={fileDrop.onDragLeave} onDrop={fileDrop.onDrop}>
      <style>{`
        button:focus-visible{outline:2px solid #6080ff;outline-offset:2px;}
        @keyframes toast-in{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
      `}</style>

      <div ref={ariaLiveRef} aria-live="polite" aria-atomic="true"
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }} />

      {toast && <Toast message={toast.message} type={toast.type} />}

      <NewCanvasModal open={showNewCanvas} onConfirm={handleNewCanvasConfirm} onCancel={handleNewCanvasCancel} />

      {fileDrop.dragging && <div style={{ position: "fixed", inset: 0, background: "rgba(64,128,255,.15)", border: "3px dashed #6080ff", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <div style={{ fontSize: 20, color: "#80a0ff", fontWeight: 700 }}>{t("drop_image")}</div>
      </div>}

      <HelpModal showHelp={showHelp} setShowHelp={setShowHelp} helpRef={helpRef} />

      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, background: "linear-gradient(90deg,#ff4060,#ff8040,#ffe040,#40ff60,#40e0ff,#8040ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2 }}>CHROMALUM</h1>
        <div style={{ fontSize: 9, color: "#3a3a5a", marginTop: 2 }}>
          {cvs.w}&times;{cvs.h} | {Math.round(panZoom.zoom * 100)}% |{" "}
          <span style={{ cursor: "pointer", color: "#5a5a8a", textDecoration: "underline" }} onClick={() => setShowHelp(true)}>?{t("help_link")}</span>
          {" | "}<LanguageSwitcher />
        </div>
      </div>

      {isMobile && <div style={{ display: "flex", justifyContent: "center", gap: 2, marginBottom: 8 }}>
        {["Source", "Color", "Hex"].map((tab, i) =>
          <button key={tab} onClick={() => setMobileTab(i)} style={mobileTab === i ? S_TAB_ACTIVE : S_TAB_INACTIVE}>{tab}</button>)}
      </div>}

      {isMobile ? (
        <div style={{ display: "flex", justifyContent: "center" }}>
          {mobileTab === 0 && <SourcePanel
            srcRef={drawing.srcRef} curRef={drawing.curRef} srcWrapRef={srcWrapRef} statusRef={drawing.statusRef}
            toolState={toolState} viewState={viewState} saveActions={saveActionsObj}
            colorLUT={colorLUT} state={state}
            onDown={drawing.onDown} onMove={drawing.onMove} onUp={drawing.onUp} onPointerLeave={onPointerLeave}
            undo={undo} redo={redo} handleClear={handleClear} loadImg={fileDrop.loadImg}
            announce={announce} schedCursor={schedCursorFn} prvRef={prvRef}
            onNewCanvas={() => setShowNewCanvas(true)}
          />}
          {mobileTab === 1 && <ColorPanel
            prvRef={prvRef} prvWrapRef={prvWrapRef} displayW={displayW} displayH={displayH}
            canvasTransform={canvasTransform} cc={cc} ccDispatch={ccDispatch} brushLevel={brushLevel}
            setZoom={panZoom.setZoom} setPan={panZoom.setPan} schedCursorRef={sharedSchedCursorRef}
            spaceRef={panZoom.spaceRef} panningRef={panZoom.panningRef}
            startPan={panZoom.startPan} movePan={panZoom.movePan} endPan={panZoom.endPan}
          />}
          {mobileTab === 2 && hexPanel}
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <SourcePanel
              srcRef={drawing.srcRef} curRef={drawing.curRef} srcWrapRef={srcWrapRef} statusRef={drawing.statusRef}
              toolState={toolState} viewState={viewState} saveActions={saveActionsObj}
              colorLUT={colorLUT} state={state}
              onDown={drawing.onDown} onMove={drawing.onMove} onUp={drawing.onUp} onPointerLeave={onPointerLeave}
              undo={undo} redo={redo} handleClear={handleClear} loadImg={fileDrop.loadImg}
              announce={announce} schedCursor={schedCursorFn} prvRef={prvRef}
              onNewCanvas={() => setShowNewCanvas(true)}
            />
            <ColorPanel
              prvRef={prvRef} prvWrapRef={prvWrapRef} displayW={displayW} displayH={displayH}
              canvasTransform={canvasTransform} cc={cc} ccDispatch={ccDispatch} brushLevel={brushLevel}
              setZoom={panZoom.setZoom} setPan={panZoom.setPan} schedCursorRef={sharedSchedCursorRef}
              spaceRef={panZoom.spaceRef} panningRef={panZoom.panningRef}
              startPan={panZoom.startPan} movePan={panZoom.movePan} endPan={panZoom.endPan}
            />
          </div>
          <div style={{ marginTop: 16 }}>{hexPanel}</div>
        </>
      )}
    </div>
  );
}
