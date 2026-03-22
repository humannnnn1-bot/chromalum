/* ═══════════════════════════════════════════
   PAINT FUNCTIONS
   ═══════════════════════════════════════════ */

export function paintCircle(data: Uint8Array, cx: number, cy: number, r: number, lv: number, w: number, h: number): void {
  if (r <= 0) {
    if (cx >= 0 && cx < w && cy >= 0 && cy < h) data[cy * w + cx] = lv;
    return;
  }
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx*dx + dy*dy <= r*r) {
        const px = cx + dx, py = cy + dy;
        if (px >= 0 && px < w && py >= 0 && py < h) data[py*w + px] = lv;
      }
    }
  }
}

export function paintLine(data: Uint8Array, x0: number, y0: number, x1: number, y1: number, r: number, lv: number, w: number, h: number): void {
  const ax = Math.abs(x1-x0), ay = Math.abs(y1-y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = ax - ay;
  for (;;) {
    paintCircle(data, x0, y0, r, lv, w, h);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2*e;
    if (e2 > -ay) { e -= ay; x0 += sx; }
    if (e2 < ax) { e += ax; y0 += sy; }
  }
}

/** 矩形ツール */
export function paintRect(data: Uint8Array, x0: number, y0: number, x1: number, y1: number, r: number, lv: number, w: number, h: number): void {
  const left = Math.min(x0, x1), right = Math.max(x0, x1);
  const top = Math.min(y0, y1), bottom = Math.max(y0, y1);
  paintLine(data, left, top, right, top, r, lv, w, h);
  paintLine(data, right, top, right, bottom, r, lv, w, h);
  paintLine(data, right, bottom, left, bottom, r, lv, w, h);
  paintLine(data, left, bottom, left, top, r, lv, w, h);
}

/** 楕円ツール — Midpoint Ellipse */
export function paintEllipse(data: Uint8Array, x0: number, y0: number, x1: number, y1: number, r: number, lv: number, w: number, h: number): void {
  const cx = Math.round((x0 + x1) / 2), cy = Math.round((y0 + y1) / 2);
  const rx = Math.abs(x1 - x0) >> 1, ry = Math.abs(y1 - y0) >> 1;
  if (rx === 0 && ry === 0) { paintCircle(data, cx, cy, r, lv, w, h); return; }
  if (rx === 0) { paintLine(data, cx, cy - ry, cx, cy + ry, r, lv, w, h); return; }
  if (ry === 0) { paintLine(data, cx - rx, cy, cx + rx, cy, r, lv, w, h); return; }
  let x = 0, y = ry;
  const rx2 = rx * rx, ry2 = ry * ry;
  let px = 0, py = 2 * rx2 * y;
  const plot4 = (ex: number, ey: number) => {
    paintCircle(data, cx+ex, cy+ey, r, lv, w, h);
    if (ex !== 0) paintCircle(data, cx-ex, cy+ey, r, lv, w, h);
    if (ey !== 0) {
      paintCircle(data, cx+ex, cy-ey, r, lv, w, h);
      if (ex !== 0) paintCircle(data, cx-ex, cy-ey, r, lv, w, h);
    }
  };
  let p1 = ry2 - rx2 * ry + 0.25 * rx2;
  while (px < py) {
    plot4(x, y);
    x++; px += 2 * ry2;
    if (p1 < 0) { p1 += ry2 + px; }
    else { y--; py -= 2 * rx2; p1 += ry2 + px - py; }
  }
  let p2 = ry2 * (x + 0.5) * (x + 0.5) + rx2 * (y - 1) * (y - 1) - rx2 * ry2;
  while (y >= 0) {
    plot4(x, y);
    y--; py -= 2 * rx2;
    if (p2 > 0) { p2 += rx2 - py; }
    else { x++; px += 2 * ry2; p2 += rx2 - py + px; }
  }
}
