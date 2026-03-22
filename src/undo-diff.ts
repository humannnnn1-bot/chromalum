import type { Diff } from "./types";

/* ═══════════════════════════════════════════
   UNDO DIFF
   ═══════════════════════════════════════════ */

export function computeDiff(oldD: Uint8Array, newD: Uint8Array): Diff {
  const len = Math.min(oldD.length, newD.length);
  let count = 0;
  for (let i = 0; i < len; i++) if (oldD[i] !== newD[i]) count++;
  const idx = new Uint32Array(count), ov = new Uint8Array(count), nv = new Uint8Array(count);
  let j = 0;
  for (let i = 0; i < len; i++) {
    if (oldD[i] !== newD[i]) { idx[j] = i; ov[j] = oldD[i]; nv[j] = newD[i]; j++; }
  }
  return { idx, ov, nv };
}

export function applyDiff(data: Uint8Array, diff: Diff, reverse: boolean): Uint8Array {
  const r = new Uint8Array(data), v = reverse ? diff.ov : diff.nv;
  for (let i = 0; i < diff.idx.length; i++) r[diff.idx[i]] = v[i];
  return r;
}
