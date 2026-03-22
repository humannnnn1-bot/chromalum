import type { DirtyRect } from "./types";

/* ═══════════════════════════════════════════
   DIRTY RECT HELPERS
   ═══════════════════════════════════════════ */

/** シェイプの外接矩形を計算 */
export function shapeBBox(x0: number, y0: number, x1: number, y1: number, r: number, w: number, h: number): DirtyRect | null {
  let minX = Math.min(x0, x1) - r;
  let maxX = Math.max(x0, x1) + r;
  let minY = Math.min(y0, y1) - r;
  let maxY = Math.max(y0, y1) + r;
  minX = Math.max(0, minX); minY = Math.max(0, minY);
  maxX = Math.min(w - 1, maxX); maxY = Math.min(h - 1, maxY);
  if (maxX < minX || maxY < minY) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/** 2つの dirty rect の合併 (union) */
export function unionBBox(a: DirtyRect | null, b: DirtyRect | null): DirtyRect | null {
  if (!a) return b; if (!b) return a;
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  return { x, y,
    w: Math.max(a.x + a.w, b.x + b.w) - x,
    h: Math.max(a.y + a.h, b.y + b.h) - y };
}

/** ブラシ/消しゴムストロークの dirty rect */
export function brushBBox(pts: [number, number][], r: number, w: number, h: number): DirtyRect | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [px, py] of pts) {
    minX = Math.min(minX, px - r); maxX = Math.max(maxX, px + r);
    minY = Math.min(minY, py - r); maxY = Math.max(maxY, py + r);
  }
  minX = Math.max(0, minX); minY = Math.max(0, minY);
  maxX = Math.min(w - 1, maxX); maxY = Math.min(h - 1, maxY);
  if (maxX < minX || maxY < minY) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/** buf の bbox 領域のみ pre から復元（row-by-row subarray set） */
export function restoreRect(buf: Uint8Array, pre: Uint8Array, stride: number, bb: DirtyRect): void {
  const x0 = bb.x, x1 = bb.x + bb.w, y1 = bb.y + bb.h;
  for (let y = bb.y; y < y1; y++) {
    const start = y * stride + x0;
    buf.set(pre.subarray(start, y * stride + x1), start);
  }
}
