import { describe, it, expect } from "vitest";
import { canvasReducer, initialState } from "../canvas-reducer";
import { computeDiff } from "../undo-diff";

describe("canvasReducer", () => {
  describe("stroke_end", () => {
    it("updates data and histogram", () => {
      const state = { ...initialState };
      const finalData = new Uint8Array(state.cvs.data.length);
      finalData[0] = 3;
      const diff = computeDiff(state.cvs.data, finalData);
      const next = canvasReducer(state, { type: "stroke_end", finalData, diff });
      expect(next.cvs.data[0]).toBe(3);
      expect(next.undoStack.length).toBe(1);
      expect(next.redoStack.length).toBe(0);
      expect(next.hist[0]).toBe(state.hist[0] - 1);
      expect(next.hist[3]).toBe(1);
    });

    it("no-op for empty diff", () => {
      const state = { ...initialState };
      const finalData = new Uint8Array(state.cvs.data);
      const diff = computeDiff(state.cvs.data, finalData);
      const next = canvasReducer(state, { type: "stroke_end", finalData, diff });
      expect(next).toBe(state);
    });

    it("null diff returns same state", () => {
      const state = { ...initialState };
      const next = canvasReducer(state, { type: "stroke_end", finalData: new Uint8Array(state.cvs.data), diff: null });
      expect(next).toBe(state);
    });
  });

  describe("undo / redo", () => {
    it("undo reverses stroke", () => {
      const finalData = new Uint8Array(initialState.cvs.data.length);
      finalData[0] = 5;
      const diff = computeDiff(initialState.cvs.data, finalData);
      const afterStroke = canvasReducer(initialState, { type: "stroke_end", finalData, diff });
      expect(afterStroke.cvs.data[0]).toBe(5);

      const afterUndo = canvasReducer(afterStroke, { type: "undo" });
      expect(afterUndo.cvs.data[0]).toBe(0);
      expect(afterUndo.undoStack.length).toBe(0);
      expect(afterUndo.redoStack.length).toBe(1);
    });

    it("redo restores undone stroke", () => {
      const finalData = new Uint8Array(initialState.cvs.data.length);
      finalData[0] = 5;
      const diff = computeDiff(initialState.cvs.data, finalData);
      const s1 = canvasReducer(initialState, { type: "stroke_end", finalData, diff });
      const s2 = canvasReducer(s1, { type: "undo" });
      const s3 = canvasReducer(s2, { type: "redo" });
      expect(s3.cvs.data[0]).toBe(5);
      expect(s3.undoStack.length).toBe(1);
      expect(s3.redoStack.length).toBe(0);
    });

    it("undo on empty stack is no-op", () => {
      const next = canvasReducer(initialState, { type: "undo" });
      expect(next).toBe(initialState);
    });

    it("redo on empty stack is no-op", () => {
      const next = canvasReducer(initialState, { type: "redo" });
      expect(next).toBe(initialState);
    });
  });

  describe("clear", () => {
    it("clears canvas and pushes to undo", () => {
      const finalData = new Uint8Array(initialState.cvs.data.length);
      finalData.fill(3);
      const diff = computeDiff(initialState.cvs.data, finalData);
      const s1 = canvasReducer(initialState, { type: "stroke_end", finalData, diff });

      const s2 = canvasReducer(s1, { type: "clear" });
      expect(s2.cvs.data[0]).toBe(0);
      expect(s2.hist[0]).toBe(s2.cvs.w * s2.cvs.h);
      expect(s2.undoStack.length).toBe(2); // stroke + clear
    });

    it("clearing already blank canvas is no-op", () => {
      const next = canvasReducer(initialState, { type: "clear" });
      expect(next).toBe(initialState);
    });
  });

  describe("new_canvas", () => {
    it("creates new blank canvas with given dimensions", () => {
      const next = canvasReducer(initialState, { type: "new_canvas", w: 64, h: 48 });
      expect(next.cvs.w).toBe(64);
      expect(next.cvs.h).toBe(48);
      expect(next.cvs.data.length).toBe(64 * 48);
      expect(next.undoStack.length).toBe(0);
      expect(next.redoStack.length).toBe(0);
      expect(next.hist[0]).toBe(64 * 48);
    });
  });

  describe("load_image", () => {
    it("loads image data and resets stacks", () => {
      const data = new Uint8Array(16);
      data[0] = 2; data[1] = 5;
      const next = canvasReducer(initialState, { type: "load_image", w: 4, h: 4, data });
      expect(next.cvs.w).toBe(4);
      expect(next.cvs.h).toBe(4);
      expect(next.cvs.data[0]).toBe(2);
      expect(next.undoStack.length).toBe(0);
      expect(next.hist[2]).toBe(1);
      expect(next.hist[5]).toBe(1);
    });
  });
});
