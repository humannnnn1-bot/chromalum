import { useRef, useLayoutEffect, useCallback } from "react";
import { LEVEL_MASK, GRID_ZOOM_THRESHOLD, isShapeTool } from "../constants";
import type { ToolId } from "../constants";
import { LEVEL_INFO, LEVEL_CANDIDATES } from "../color-engine";
import { paintCircle, paintLine, paintRect, paintEllipse } from "../paint";
import { shapeBBox, unionBBox, brushBBox, restoreRect } from "../dirty-rect";
import { floodFill } from "../flood-fill";
import { computeDiff } from "../undo-diff";
import { renderBuf } from "../render-buf";
import { hexStr } from "../utils";
import { useSyncRef } from "./useSyncRef";
import type { CanvasData, StrokeState, ImgCache, CanvasAction } from "../types";

export interface CanvasDrawingResult {
  srcRef: React.MutableRefObject<HTMLCanvasElement | null>;
  curRef: React.MutableRefObject<HTMLCanvasElement | null>;
  statusRef: React.MutableRefObject<HTMLDivElement | null>;
  imgCacheRef: React.MutableRefObject<ImgCache>;
  strokeRef: React.MutableRefObject<StrokeState | null>;
  drawingRef: React.MutableRefObject<boolean>;
  lastRef: React.MutableRefObject<{ x: number; y: number } | null>;
  cursorRafRef: React.MutableRefObject<number | null>;
  schedCursorRef: React.MutableRefObject<(() => void) | null>;
  cursorPosRef: React.MutableRefObject<{ dx: number; dy: number } | null>;
  onDown: (e: React.PointerEvent) => void;
  onMove: (e: React.PointerEvent) => void;
  onUp: () => void;
  trackCursor: (e: React.PointerEvent) => void;
  clearCursor: () => void;
}

export function useCanvasDrawing(
  cvs: CanvasData,
  displayW: number,
  displayH: number,
  dispatch: React.Dispatch<CanvasAction>,
  colorLUT: [number, number, number][],
  cc: number[],
  brushLevel: number,
  brushSize: number,
  tool: ToolId,
  zoom: number,
  pan: { x: number; y: number },
  panningRef: React.MutableRefObject<boolean>,
  spaceRef: React.MutableRefObject<boolean>,
  zoomRef: React.MutableRefObject<number>,
  panRef: React.MutableRefObject<{ x: number; y: number }>,
  startPan: (e: React.PointerEvent) => void,
  movePan: (e: React.PointerEvent) => void,
  endPan: () => void,
  prvRef: React.MutableRefObject<HTMLCanvasElement | null>,
): CanvasDrawingResult {
  const srcRef = useRef<HTMLCanvasElement | null>(null);
  const curRef = useRef<HTMLCanvasElement | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const imgCacheRef = useRef<ImgCache>({ src: null, prv: null });
  const strokeRef = useRef<StrokeState | null>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const cursorRafRef = useRef<number | null>(null);
  const schedCursorRef = useRef<(() => void) | null>(null);
  const cursorPosRef = useRef<{ dx: number; dy: number } | null>(null);

  const ccRef = useSyncRef(cc);
  const brushLevelRef = useSyncRef(brushLevel);
  const brushSizeRef = useSyncRef(brushSize);
  const toolRef = useSyncRef(tool);
  const cvsRef = useSyncRef(cvs);
  const colorLUTRef = useSyncRef(colorLUT);
  const displayWRef = useSyncRef(displayW);
  const displayHRef = useSyncRef(displayH);
  const startPanRef = useSyncRef(startPan);
  const movePanRef = useSyncRef(movePan);
  const endPanRef = useSyncRef(endPan);

  function cPos(e: React.PointerEvent) {
    const c = curRef.current; if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return { x: -1, y: -1 };
    const z = zoomRef.current, p = panRef.current, cv = cvsRef.current;
    const rx = (e.clientX - r.left) / r.width, ry = (e.clientY - r.top) / r.height;
    const vx = (rx - 0.5) / z + 0.5 - p.x / cv.w, vy = (ry - 0.5) / z + 0.5 - p.y / cv.h;
    return { x: Math.max(0, Math.min(cv.w - 1, Math.floor(vx * cv.w))), y: Math.max(0, Math.min(cv.h - 1, Math.floor(vy * cv.h))) };
  }

  function updateStatus(e: React.PointerEvent) {
    const el = statusRef.current; if (!el) return;
    const cv = cvsRef.current, pos = cPos(e);
    if (pos.x < 0 || pos.x >= cv.w || pos.y < 0 || pos.y >= cv.h) { el.textContent = "\u2014"; return; }
    const d = drawingRef.current && strokeRef.current?.buf ? strokeRef.current.buf : cv.data;
    const lv = d[pos.y * cv.w + pos.x] & LEVEL_MASK;
    const info = LEVEL_INFO[lv];
    const a = LEVEL_CANDIDATES[lv], ci = ccRef.current[lv] % a.length, cur = a[ci];
    el.textContent = `(${pos.x}, ${pos.y})  L${lv} ${info.name}  ${hexStr(cur.rgb)}`;
  }

  function drawCursorAndGrid() {
    const c = curRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    const z = zoomRef.current, cv = cvsRef.current, p = panRef.current;
    const dW = displayWRef.current, dH = displayHRef.current;
    const pxPerCell = (dW / cv.w) * z;

    if (z >= GRID_ZOOM_THRESHOLD && pxPerCell >= 4) {
      const offsetX = dW * (0.5 - z / 2 + z * p.x / cv.w);
      const offsetY = dH * (0.5 - z / 2 + z * p.y / cv.h);
      const endY = Math.min(dH, offsetY + cv.h * pxPerCell);
      const endX = Math.min(dW, offsetX + cv.w * pxPerCell);
      const xStart = Math.max(0, Math.ceil(-offsetX / pxPerCell));
      const xEnd   = Math.min(cv.w, Math.floor((dW - offsetX) / pxPerCell));
      const yStart = Math.max(0, Math.ceil(-offsetY / pxPerCell));
      const yEnd   = Math.min(cv.h, Math.floor((dH - offsetY) / pxPerCell));
      ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let x = xStart; x <= xEnd; x++) {
        const px = offsetX + x * pxPerCell;
        ctx.moveTo(px, Math.max(0, offsetY)); ctx.lineTo(px, endY);
      }
      for (let y = yStart; y <= yEnd; y++) {
        const py = offsetY + y * pxPerCell;
        ctx.moveTo(Math.max(0, offsetX), py); ctx.lineTo(endX, py);
      }
      ctx.stroke();
    }
    const pos = cursorPosRef.current;
    if (!pos || panningRef.current) return;
    const curBS = brushSizeRef.current;
    const rPx = Math.floor(curBS / 2);
    const r = Math.max(0.5, rPx) * (dW / cv.w) * z;
    const curTool = toolRef.current;
    // snap cursor to canvas pixel center
    const rx = pos.dx / dW, ry = pos.dy / dH;
    const vx = (rx - 0.5) / z + 0.5 - p.x / cv.w;
    const vy = (ry - 0.5) / z + 0.5 - p.y / cv.h;
    const cx = Math.floor(vx * cv.w), cy = Math.floor(vy * cv.h);
    const sdx = dW * (((cx + 0.5) / cv.w - 0.5 + p.x / cv.w) * z + 0.5);
    const sdy = dH * (((cy + 0.5) / cv.h - 0.5 + p.y / cv.h) * z + 0.5);
    const brushColor = curTool === "eraser" ? "rgba(255,100,100,.8)" : "rgba(255,255,255,.8)";
    const brushR = rPx;
    if (curTool !== "fill") {
      ctx.beginPath();
      if (brushR <= 0) {
        ctx.rect(sdx - pxPerCell / 2, sdy - pxPerCell / 2, pxPerCell, pxPerCell);
      } else {
        for (let dy = -brushR; dy <= brushR; dy++) {
          for (let dx = -brushR; dx <= brushR; dx++) {
            if (dx * dx + dy * dy > brushR * brushR) continue;
            const px = sdx + (dx - 0.5) * pxPerCell;
            const py = sdy + (dy - 0.5) * pxPerCell;
            if (dy === -brushR || dx * dx + (dy - 1) * (dy - 1) > brushR * brushR)
              { ctx.moveTo(px, py); ctx.lineTo(px + pxPerCell, py); }
            if (dy === brushR || dx * dx + (dy + 1) * (dy + 1) > brushR * brushR)
              { ctx.moveTo(px, py + pxPerCell); ctx.lineTo(px + pxPerCell, py + pxPerCell); }
            if (dx === -brushR || (dx - 1) * (dx - 1) + dy * dy > brushR * brushR)
              { ctx.moveTo(px, py); ctx.lineTo(px, py + pxPerCell); }
            if (dx === brushR || (dx + 1) * (dx + 1) + dy * dy > brushR * brushR)
              { ctx.moveTo(px + pxPerCell, py); ctx.lineTo(px + pxPerCell, py + pxPerCell); }
          }
        }
      }
      ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.strokeStyle = brushColor; ctx.lineWidth = 1; ctx.stroke();
    }
    if (curTool === "fill" || isShapeTool(curTool)) {
      const cs = 8;
      ctx.beginPath();
      ctx.moveTo(sdx - cs, sdy); ctx.lineTo(sdx + cs, sdy);
      ctx.moveTo(sdx, sdy - cs); ctx.lineTo(sdx, sdy + cs);
      ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.strokeStyle = "rgba(200,220,255,.7)"; ctx.lineWidth = 1; ctx.stroke();
    }
  }

  function schedCursor() {
    if (cursorRafRef.current) return;
    cursorRafRef.current = requestAnimationFrame(() => { cursorRafRef.current = null; drawCursorAndGrid(); });
  }

  // Intentionally runs every render (no deps) to keep ref in sync with latest closure
  useLayoutEffect(() => { schedCursorRef.current = schedCursor; });

  function drawShapeAt(buf: Uint8Array, toolId: string, x0: number, y0: number, x1: number, y1: number, r: number, lv: number, w: number, h: number) {
    if (toolId === "line") paintLine(buf, x0, y0, x1, y1, r, lv, w, h);
    else if (toolId === "rect") paintRect(buf, x0, y0, x1, y1, r, lv, w, h);
    else if (toolId === "ellipse") paintEllipse(buf, x0, y0, x1, y1, r, lv, w, h);
  }

  const trackCursor = useCallback((e: React.PointerEvent) => {
    const c = curRef.current; if (!c) return;
    const r = c.getBoundingClientRect();
    cursorPosRef.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    schedCursor();
  }, []);

  const clearCursor = useCallback(() => {
    cursorPosRef.current = null; schedCursor();
    const el = statusRef.current; if (el) el.textContent = "\u2014";
  }, []);

  const onDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    e.preventDefault();
    if (drawingRef.current) return;
    if (e.button === 1) { startPanRef.current(e); return; }
    if (spaceRef.current) { startPanRef.current(e); return; }
    if ((e.target as HTMLElement).setPointerCapture) try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch {}
    drawingRef.current = true;
    const curTool = toolRef.current, curBL = brushLevelRef.current, curBS = brushSizeRef.current;
    const pos = cPos(e);
    lastRef.current = pos;
    const cv = cvsRef.current;
    const pre = new Uint8Array(cv.data);
    const buf = new Uint8Array(pre);
    strokeRef.current = {
      buf, pre,
      params: { tool: curTool, brushLevel: curBL, brushSize: curBS },
      shapeStart: pos,
      prevShapeBBox: null,
    };
    const lv = curTool === "eraser" ? 0 : curBL;
    const r = Math.floor(curBS / 2);
    const W = cv.w, H = cv.h;

    if (curTool === "fill") {
      floodFill(buf, pos.x, pos.y, lv, W, H);
    } else if (isShapeTool(curTool)) {
      drawShapeAt(buf, curTool, pos.x, pos.y, pos.x, pos.y, r, lv, W, H);
      strokeRef.current.prevShapeBBox = shapeBBox(pos.x, pos.y, pos.x, pos.y, r, W, H);
    } else {
      paintCircle(buf, pos.x, pos.y, r, lv, W, H);
      const dirtyBB = brushBBox([[pos.x, pos.y]], r, W, H);
      renderBuf(buf, W, H, colorLUTRef.current, srcRef.current, prvRef.current, imgCacheRef.current, dirtyBB);
      return;
    }
    renderBuf(buf, W, H, colorLUTRef.current, srcRef.current, prvRef.current, imgCacheRef.current);
  }, []);

  const onMove = useCallback((e: React.PointerEvent) => {
    trackCursor(e); updateStatus(e);
    if (panningRef.current) { movePanRef.current(e); return; }
    if (!drawingRef.current) return;
    const st = strokeRef.current;
    if (!st || st.params.tool === "fill") return;
    e.preventDefault();
    const sp = st.params;
    const pos = cPos(e), last = lastRef.current || pos;
    const buf = st.buf;
    const lv = sp.tool === "eraser" ? 0 : sp.brushLevel;
    const r = Math.floor(sp.brushSize / 2);
    const cv = cvsRef.current;
    const W = cv.w, H = cv.h;

    if (isShapeTool(sp.tool)) {
      const s = st.shapeStart || pos;
      const newBB = shapeBBox(s.x, s.y, pos.x, pos.y, r, W, H);
      const prevBB = st.prevShapeBBox;
      const dirtyBB = unionBBox(prevBB, newBB);
      if (st.pre && dirtyBB) restoreRect(buf, st.pre, W, dirtyBB);
      drawShapeAt(buf, sp.tool, s.x, s.y, pos.x, pos.y, r, lv, W, H);
      st.prevShapeBBox = newBB;
      lastRef.current = pos;
      renderBuf(buf, W, H, colorLUTRef.current, srcRef.current, prvRef.current, imgCacheRef.current, dirtyBB);
      return;
    } else {
      paintLine(buf, last.x, last.y, pos.x, pos.y, r, lv, W, H);
      const allPts: [number, number][] = [[last.x, last.y], [pos.x, pos.y]];
      const dirtyBB = brushBBox(allPts, r, W, H);
      lastRef.current = pos;
      renderBuf(buf, W, H, colorLUTRef.current, srcRef.current, prvRef.current, imgCacheRef.current, dirtyBB);
      return;
    }
  }, [trackCursor]);

  const onUp = useCallback(() => {
    if (panningRef.current) { endPanRef.current(); return; }
    const st = strokeRef.current;
    if (drawingRef.current && st) {
      const finalData = new Uint8Array(st.buf);
      const diff = st.pre ? computeDiff(st.pre, finalData) : null;
      dispatch({ type: "stroke_end", finalData, diff });
    }
    drawingRef.current = false; lastRef.current = null;
    strokeRef.current = null;
  }, [dispatch]);

  return {
    srcRef, curRef, statusRef, imgCacheRef,
    strokeRef, drawingRef, lastRef,
    cursorRafRef, schedCursorRef, cursorPosRef,
    onDown, onMove, onUp,
    trackCursor, clearCursor,
  };
}
