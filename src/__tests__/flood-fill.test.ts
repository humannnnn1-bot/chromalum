import { describe, it, expect } from "vitest";
import { floodFill } from "../flood-fill";

function mkBuf(w: number, h: number, fill = 0): Uint8Array {
  const buf = new Uint8Array(w * h);
  if (fill) buf.fill(fill);
  return buf;
}

describe("floodFill", () => {
  it("returns null for out-of-bounds seed", () => {
    const buf = mkBuf(10, 10);
    expect(floodFill(buf, -1, 0, 1, 10, 10)).toBeNull();
    expect(floodFill(buf, 0, -1, 1, 10, 10)).toBeNull();
    expect(floodFill(buf, 10, 0, 1, 10, 10)).toBeNull();
    expect(floodFill(buf, 0, 10, 1, 10, 10)).toBeNull();
  });

  it("returns null when seed matches target", () => {
    const buf = mkBuf(10, 10, 3);
    expect(floodFill(buf, 5, 5, 3, 10, 10)).toBeNull();
  });

  it("fills entire uniform canvas", () => {
    const buf = mkBuf(5, 5, 0);
    const changed = floodFill(buf, 0, 0, 1, 5, 5);
    expect(changed).not.toBeNull();
    expect(changed!.length).toBe(25);
    for (let i = 0; i < 25; i++) expect(buf[i]).toBe(1);
  });

  it("fills only connected region", () => {
    const buf = mkBuf(5, 5, 0);
    // Create a wall at column 2
    for (let y = 0; y < 5; y++) buf[y * 5 + 2] = 2;
    floodFill(buf, 0, 0, 1, 5, 5);
    // Left side should be filled
    expect(buf[0 * 5 + 0]).toBe(1);
    expect(buf[0 * 5 + 1]).toBe(1);
    // Wall should remain
    expect(buf[0 * 5 + 2]).toBe(2);
    // Right side should NOT be filled
    expect(buf[0 * 5 + 3]).toBe(0);
    expect(buf[0 * 5 + 4]).toBe(0);
  });

  it("returns correct changed indices", () => {
    const buf = mkBuf(3, 3, 0);
    buf[1 * 3 + 1] = 5; // center is different
    const changed = floodFill(buf, 0, 0, 7, 3, 3);
    expect(changed).not.toBeNull();
    // 8 cells should be changed (all except center)
    expect(changed!.length).toBe(8);
    expect(buf[1 * 3 + 1]).toBe(5); // center unchanged
  });
});
