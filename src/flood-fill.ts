/* ═══════════════════════════════════════════
   FLOOD FILL
   Scanline FloodFill — flat Int32Array stack (GC圧削減)
   変更インデックスを返却
   ═══════════════════════════════════════════ */

export function floodFill(data: Uint8Array, sx: number, sy: number, newVal: number, w: number, h: number): Uint32Array | null {
  if (sx < 0 || sx >= w || sy < 0 || sy >= h) return null;
  const oldVal = data[sy * w + sx];
  if (oldVal === newVal) return null;
  const maxPixels = w * h;
  let stack = new Int32Array(Math.min(1024, maxPixels * 4));
  let sp = 0;
  let changed = new Uint32Array(Math.min(256, maxPixels));
  let ci = 0;
  const pushChanged = (idx: number) => {
    if (ci >= changed.length) { const nc = new Uint32Array(Math.min(changed.length * 2, maxPixels)); nc.set(changed); changed = nc; }
    changed[ci++] = idx;
  };
  const push = (y: number, xl: number, xr: number, dy: number) => {
    if (sp + 4 > stack.length) {
      const ns = new Int32Array(Math.min(stack.length * 2, maxPixels * 4));
      ns.set(stack); stack = ns;
    }
    stack[sp++] = y; stack[sp++] = xl; stack[sp++] = xr; stack[sp++] = dy;
  };
  push(sy, sx, sx, 1);
  push(sy - 1, sx, sx, -1);
  while (sp > 0) {
    const dy = stack[--sp], xr = stack[--sp], xl = stack[--sp], y = stack[--sp];
    if (y < 0 || y >= h) continue;
    let x = xl;
    while (x >= 0 && data[y*w + x] === oldVal) { const idx = y*w + x; data[idx] = newVal; pushChanged(idx); x--; }
    const lx = x + 1;
    x = xl + 1;
    while (x < w && data[y*w + x] === oldVal) { const idx = y*w + x; data[idx] = newVal; pushChanged(idx); x++; }
    const rx = x - 1;
    const ny = y + dy;
    if (ny >= 0 && ny < h) {
      let a = false;
      for (let i = lx; i <= rx; i++) {
        if (data[ny*w + i] === oldVal) { if (!a) { push(ny, i, i, dy); a = true; } } else a = false;
      }
    }
    const oy = y - dy;
    if (oy >= 0 && oy < h) {
      let a = false;
      for (let i = lx; i < xl; i++) {
        if (data[oy*w + i] === oldVal) { if (!a) { push(oy, i, i, -dy); a = true; } } else a = false;
      }
      a = false;
      for (let i = xr + 1; i <= rx; i++) {
        if (data[oy*w + i] === oldVal) { if (!a) { push(oy, i, i, -dy); a = true; } } else a = false;
      }
    }
  }
  return changed.subarray(0, ci);
}
