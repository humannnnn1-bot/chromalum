import { MAX_UNDO, LEVEL_MASK, MAX_IMAGE_SIZE } from "./constants";
import { computeDiff, applyDiff } from "./undo-diff";
import type { AppState, CanvasAction } from "./types";
import { W0, H0 } from "./constants";

function computeHist(data: Uint8Array): number[] {
  const h = new Array(8).fill(0);
  for (let i = 0; i < data.length; i++) h[data[i] & LEVEL_MASK]++;
  return h;
}

const initData = new Uint8Array(W0 * H0);
export const initialState: AppState = {
  cvs: { w: W0, h: H0, data: initData },
  undoStack: [],
  redoStack: [],
  hist: computeHist(initData),
};

export function canvasReducer(state: AppState, action: CanvasAction): AppState {
  switch (action.type) {
    case "stroke_end": {
      const { finalData, diff } = action;
      if (!diff || diff.idx.length === 0) return state;
      const newHist = [...state.hist];
      for (let i = 0; i < diff.idx.length; i++) {
        newHist[diff.ov[i] & LEVEL_MASK]--;
        newHist[diff.nv[i] & LEVEL_MASK]++;
      }
      return { ...state, cvs: { ...state.cvs, data: finalData },
        undoStack: [...state.undoStack.slice(-(MAX_UNDO - 1)), diff], redoStack: [],
        hist: newHist };
    }
    case "undo": {
      if (!state.undoStack.length) return state;
      const diff = state.undoStack[state.undoStack.length - 1];
      const newHist = [...state.hist];
      for (let i = 0; i < diff.idx.length; i++) {
        newHist[diff.nv[i] & LEVEL_MASK]--;
        newHist[diff.ov[i] & LEVEL_MASK]++;
      }
      return { ...state, cvs: { ...state.cvs, data: applyDiff(state.cvs.data, diff, true) },
        undoStack: state.undoStack.slice(0, -1), redoStack: [diff, ...state.redoStack],
        hist: newHist };
    }
    case "redo": {
      if (!state.redoStack.length) return state;
      const diff = state.redoStack[0];
      const newHist = [...state.hist];
      for (let i = 0; i < diff.idx.length; i++) {
        newHist[diff.ov[i] & LEVEL_MASK]--;
        newHist[diff.nv[i] & LEVEL_MASK]++;
      }
      return { ...state, cvs: { ...state.cvs, data: applyDiff(state.cvs.data, diff, false) },
        undoStack: [...state.undoStack, diff], redoStack: state.redoStack.slice(1),
        hist: newHist };
    }
    case "load_image": {
      const { w, h, data } = action;
      if (w <= 0 || h <= 0 || w > MAX_IMAGE_SIZE || h > MAX_IMAGE_SIZE) return state;
      if (data.length !== w * h) return state;
      return { ...state, cvs: { w, h, data }, undoStack: [], redoStack: [],
        hist: computeHist(data) };
    }
    case "clear": {
      const blank = new Uint8Array(state.cvs.w * state.cvs.h);
      const diff = computeDiff(state.cvs.data, blank);
      if (diff.idx.length === 0) return state;
      const clearHist = new Array(8).fill(0);
      clearHist[0] = state.cvs.w * state.cvs.h;
      return { ...state, cvs: { ...state.cvs, data: blank },
        undoStack: [...state.undoStack.slice(-(MAX_UNDO - 1)), diff], redoStack: [],
        hist: clearHist };
    }
    case "new_canvas": {
      const { w, h } = action;
      if (w <= 0 || h <= 0 || w > MAX_IMAGE_SIZE || h > MAX_IMAGE_SIZE) return state;
      const data = new Uint8Array(w * h);
      const hist = new Array(8).fill(0);
      hist[0] = w * h;
      return { cvs: { w, h, data }, undoStack: [], redoStack: [], hist };
    }
    default: return state;
  }
}
