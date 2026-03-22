import { LEVEL_INFO } from "./color-engine";
import { LEVEL_MASK } from "./constants";
import type { DirtyRect, ImgCache } from "./types";

/* ═══════════════════════════════════════════
   renderBuf — モジュールレベル関数
   canvas要素とImageDataキャッシュを引数で受け取る
   dirty rect対応 + GRAY_VALUESテーブル
   ═══════════════════════════════════════════ */

export const GRAY_VALUES = new Uint8Array(8);
for (let i = 0; i < 8; i++) GRAY_VALUES[i] = LEVEL_INFO[i].gray;

export function renderBuf(
  data: Uint8Array, w: number, h: number,
  lut: [number, number, number][],
  srcCanvas: HTMLCanvasElement | null,
  prvCanvas: HTMLCanvasElement | null,
  imgCache: ImgCache,
  dirty?: DirtyRect | null
): void {
  if (!srcCanvas && !prvCanvas) return;
  const sc = srcCanvas?.getContext("2d") ?? null;
  const pc = prvCanvas?.getContext("2d") ?? null;
  if (!sc && !pc) return;
  if (!imgCache.src || imgCache.src.width !== w || imgCache.src.height !== h) {
    imgCache.src = (sc ?? pc)!.createImageData(w, h);
    imgCache.prv = (pc ?? sc)!.createImageData(w, h);
  }
  const si = imgCache.src!, pi = imgCache.prv!;
  const s32 = new Uint32Array(si.data.buffer);
  const p32 = new Uint32Array(pi.data.buffer);
  if (dirty) {
    const x0 = Math.max(0, dirty.x), y0 = Math.max(0, dirty.y);
    const x1 = Math.min(w, dirty.x + dirty.w), y1 = Math.min(h, dirty.y + dirty.h);
    if (x0 >= x1 || y0 >= y1) return;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = y * w + x;
        const lv = data[i] & LEVEL_MASK;
        const g = GRAY_VALUES[lv];
        s32[i] = 0xFF000000 | (g << 16) | (g << 8) | g;
        const rgb = lut[lv];
        p32[i] = 0xFF000000 | (rgb[2] << 16) | (rgb[1] << 8) | rgb[0];
      }
    }
    const dw = x1 - x0, dh = y1 - y0;
    if (dw > 0 && dh > 0) {
      if (sc) sc.putImageData(si, 0, 0, x0, y0, dw, dh);
      if (pc) pc.putImageData(pi, 0, 0, x0, y0, dw, dh);
    }
  } else {
    const n = Math.min(w * h, data.length);
    for (let i = 0; i < n; i++) {
      const lv = data[i] & LEVEL_MASK;
      const g = GRAY_VALUES[lv];
      s32[i] = 0xFF000000 | (g << 16) | (g << 8) | g;
      const rgb = lut[lv];
      p32[i] = 0xFF000000 | (rgb[2] << 16) | (rgb[1] << 8) | rgb[0];
    }
    if (sc) sc.putImageData(si, 0, 0);
    if (pc) pc.putImageData(pi, 0, 0);
  }
}
