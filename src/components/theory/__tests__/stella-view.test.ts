import { describe, expect, it } from "vitest";
import { K8_EXPLORER_POINTS, K8_EXPLORER_VERTICES_3D } from "../../../data/theory-data";
import { stellaView } from "../stella-view";

const subsets = [[], [1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]];
const phases = Array.from({ length: 201 }, (_, index) => index / 200);

describe("Stella camera rotation", () => {
  it("returns the original projection exactly and ends with W nearest, R above C, and a symmetric hexagon", () => {
    expect(stellaView(0).points).toEqual(K8_EXPLORER_POINTS);
    const { points, vertices, orderedLevels } = stellaView(1);
    expect(points[7]).toEqual({ x: 90, y: 63 });
    expect(points[0]).toEqual(points[7]);
    expect(orderedLevels[0].lv).toBe(0);
    expect(orderedLevels[orderedLevels.length - 1].lv).toBe(7);
    expect(vertices[7][2]).toBe(Math.min(...vertices.map((point) => point[2])));
    expect(points[2].x).toBe(90);
    expect(points[5].x).toBe(90);
    expect(points[2].y).toBe(Math.min(...Object.values(points).map((point) => point.y)));
    expect(points[5].y).toBe(Math.max(...Object.values(points).map((point) => point.y)));
    const radius = Math.hypot(points[2].x - 90, points[2].y - 63);
    for (const level of [1, 2, 3, 4, 5, 6]) {
      expect(Math.hypot(points[level].x - 90, points[level].y - 63)).toBeCloseTo(radius, 10);
      expect(points[level].x + points[level ^ 7].x).toBeCloseTo(180, 10);
      expect(points[level].y + points[level ^ 7].y).toBeCloseTo(126, 10);
    }
    for (const [left, right] of [
      [1, 4],
      [3, 6],
    ]) {
      expect(points[left].x + points[right].x).toBeCloseTo(180, 10);
      expect(points[left].y).toBeCloseTo(points[right].y, 10);
    }
  });

  it("rotates rigidly at a constant projection scale, with no clipping or jumps through the whole arc", () => {
    let previous = stellaView(0);
    const projectionScale =
      (K8_EXPLORER_POINTS[2].x - K8_EXPLORER_POINTS[0].x) / (K8_EXPLORER_VERTICES_3D[2][0] - K8_EXPLORER_VERTICES_3D[0][0]);
    for (const phase of phases) {
      const view = stellaView(phase);
      for (let a = 0; a < 8; a++) {
        expect(view.points[a].x).toBeCloseTo(90 + projectionScale * view.vertices[a][0], 10);
        expect(view.points[a].y).toBeCloseTo(63 + projectionScale * view.vertices[a][1], 10);
        expect(view.points[a].x - 8.7).toBeGreaterThan(12);
        expect(view.points[a].x + 8.7).toBeLessThan(168);
        expect(view.points[a].y - 8.7).toBeGreaterThan(-15);
        expect(view.points[a].y + 8.7).toBeLessThan(141);
        expect(Math.hypot(view.points[a].x - previous.points[a].x, view.points[a].y - previous.points[a].y)).toBeLessThan(1);
        for (let b = a + 1; b < 8; b++) {
          const length = Math.hypot(...view.vertices[a].map((coordinate, axis) => coordinate - view.vertices[b][axis]));
          expect(length).toBeCloseTo(Math.sqrt((a ^ b).toString(2).replace(/0/g, "").length), 10);
        }
      }
      previous = view;
    }
  });

  it("keeps interpolated crossing depth consistent through the entire rotation and every distance combination", () => {
    let strictCrossings = 0;
    for (const phase of phases) {
      const { vertices, points, orderedEdges } = stellaView(phase);
      const constraints: [number, number][] = [];
      for (let i = 0; i < orderedEdges.length; i++) {
        const first = orderedEdges[i];
        for (let j = i + 1; j < orderedEdges.length; j++) {
          const second = orderedEdges[j];
          if ([first.a, first.b].some((level) => level === second.a || level === second.b)) continue;
          const a = points[first.a],
            b = points[first.b],
            c = points[second.a],
            d = points[second.b];
          const ab = [b.x - a.x, b.y - a.y],
            cd = [d.x - c.x, d.y - c.y],
            ac = [c.x - a.x, c.y - a.y];
          const determinant = ab[0] * cd[1] - ab[1] * cd[0];
          if (Math.abs(determinant) < 1e-9) continue;
          const t = (ac[0] * cd[1] - ac[1] * cd[0]) / determinant;
          const u = (ac[0] * ab[1] - ac[1] * ab[0]) / determinant;
          if (t <= 1e-9 || t >= 1 - 1e-9 || u <= 1e-9 || u >= 1 - 1e-9) continue;
          const zFirst = vertices[first.a][2] + t * (vertices[first.b][2] - vertices[first.a][2]);
          const zSecond = vertices[second.a][2] + u * (vertices[second.b][2] - vertices[second.a][2]);
          if (Math.abs(zFirst - zSecond) < 1e-9) continue;
          expect(zFirst, `phase ${phase}, ${first.a}-${first.b} behind ${second.a}-${second.b}`).toBeGreaterThan(zSecond);
          constraints.push([first.index, second.index]);
          strictCrossings++;
        }
      }
      for (const distances of subsets) {
        const visible = orderedEdges.filter((edge) => distances.includes(edge.distance)).map((edge) => edge.index);
        expect(visible).toHaveLength(distances.reduce((count, distance) => count + (distance === 3 ? 4 : 12), 0));
        for (const [rear, front] of constraints) {
          if (visible.includes(rear) && visible.includes(front)) expect(visible.indexOf(rear)).toBeLessThan(visible.indexOf(front));
        }
      }
    }
    expect(strictCrossings).toBeGreaterThan(7000);
  });
});
