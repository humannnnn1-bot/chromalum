/* ═══════════════════════════════════════════
   SHARED TYPES
   ═══════════════════════════════════════════ */

import type React from "react";

export interface Diff {
  idx: Uint32Array;
  ov: Uint8Array;
  nv: Uint8Array;
}

export interface CanvasData {
  w: number;
  h: number;
  data: Uint8Array;
}

export interface AppState {
  cvs: CanvasData;
  undoStack: Diff[];
  redoStack: Diff[];
  hist: number[];
}

export type CanvasAction =
  | { type: "stroke_end"; finalData: Uint8Array; diff: Diff | null }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "load_image"; w: number; h: number; data: Uint8Array }
  | { type: "clear" }
  | { type: "new_canvas"; w: number; h: number };

export interface DirtyRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface StrokeParams {
  tool: import("./constants").ToolId;
  brushLevel: number;
  brushSize: number;
}

export interface StrokeState {
  buf: Uint8Array;
  pre: Uint8Array;
  params: StrokeParams;
  shapeStart: Point;
  prevShapeBBox: DirtyRect | null;
}

export interface ImgCache {
  src: ImageData | null;
  prv: ImageData | null;
}

export interface ToolState {
  tool: import("./constants").ToolId;
  setTool: React.Dispatch<React.SetStateAction<import("./constants").ToolId>>;
  brushLevel: number;
  setBrushLevel: React.Dispatch<React.SetStateAction<number>>;
  brushSize: number;
  setBrushSize: React.Dispatch<React.SetStateAction<number>>;
}

export interface ViewState {
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  displayW: number;
  displayH: number;
  canvasTransform: React.CSSProperties;
  canvasCursor: string;
}

export interface SaveActions {
  saveColor: (ref: React.RefObject<HTMLCanvasElement | null>, name: string) => void;
  saveSVG: () => void;
  copyToClipboard: () => void;
  exportPalette: () => void;
  importPalette: (file: File) => void;
  saveScale: number;
  setSaveScale: React.Dispatch<React.SetStateAction<number>>;
}
