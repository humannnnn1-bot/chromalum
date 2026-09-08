import { describe, expect, it } from "vitest";
import { CUBE_EDGES, STELLA_EDGES, OCTA_EDGES } from "../../src/data/theory-data";
import { edgeKey, frameAt, HUE, hueDirection, TOURS } from "./model";

describe("hue-constrained Euler tours", () => {
  for (const tour of TOURS) {
    it(`${tour.id}: covers the exact graph once, closes, and keeps adjacent hues across the seam`, () => {
      const expected = (tour.id === "octahedron" ? OCTA_EDGES : [...CUBE_EDGES, ...STELLA_EDGES]).map(([a, b]) => edgeKey(a, b)).sort();
      expect(tour.steps.map((step) => step.key).sort()).toEqual(expected);
      expect(new Set(tour.steps.map((step) => step.key)).size).toBe(expected.length);
      expect(tour.vertices[0]).toBe(tour.vertices[tour.vertices.length - 1]);
      for (let i = 0; i < tour.steps.length; i++) {
        const step = tour.steps[i];
        const next = tour.steps[(i + 1) % tour.steps.length];
        expect([1, -1]).toContain(hueDirection(step.mask, next.mask));
        expect(step.distance + next.distance).toBe(3);
        expect(step.mask).toBe(step.from ^ step.to);
      }
      for (const mask of HUE) expect(tour.steps.filter((step) => step.mask === mask)).toHaveLength(expected.length / 6);
    });

    it(`${tour.id}: paints crossing edges according to depth at their intersection`, () => {
      let strictCrossings = 0;
      for (let i = 0; i < tour.edges.length; i++) {
        for (let j = i + 1; j < tour.edges.length; j++) {
          const e = tour.edges[i],
            f = tour.edges[j];
          if ([e.a, e.b].some((v) => v === f.a || v === f.b)) continue;
          const a = tour.points[e.a],
            b = tour.points[e.b],
            c = tour.points[f.a],
            d = tour.points[f.b];
          const rx = b.x - a.x,
            ry = b.y - a.y,
            sx = d.x - c.x,
            sy = d.y - c.y;
          const det = rx * sy - ry * sx;
          if (Math.abs(det) < 1e-8) continue;
          const t = ((c.x - a.x) * sy - (c.y - a.y) * sx) / det;
          const u = ((c.x - a.x) * ry - (c.y - a.y) * rx) / det;
          if (t <= 1e-7 || t >= 1 - 1e-7 || u <= 1e-7 || u >= 1 - 1e-7) continue;
          const depthE = a.depth + (b.depth - a.depth) * t;
          const depthF = c.depth + (d.depth - c.depth) * u;
          if (Math.abs(depthE - depthF) < 1e-8) continue;
          strictCrossings++;
          expect(depthE, `${e.key} must be behind ${f.key}`).toBeGreaterThan(depthF);
        }
      }
      expect(strictCrossings).toBeGreaterThan(0);
    });

    it(`${tour.id}: interpolates in traversal direction, including reverse-oriented edges and completion`, () => {
      tour.steps.forEach((step, i) => {
        const frame = frameAt(tour, i + 0.25);
        const from = tour.points[step.from],
          to = tour.points[step.to];
        expect(frame.point.x).toBeCloseTo(from.x * 0.75 + to.x * 0.25);
        expect(frame.point.y).toBeCloseTo(from.y * 0.75 + to.y * 0.25);
      });
      const complete = frameAt(tour, tour.steps.length);
      expect(complete.done).toBe(true);
      expect(complete.point.x).toBeCloseTo(tour.points[tour.vertices[0]].x);
      expect(complete.point.y).toBeCloseTo(tour.points[tour.vertices[0]].y);
    });
  }

  it("the octahedron follows two forward hue laps and its second half is the complement of the first", () => {
    const tour = TOURS[0];
    expect(tour.steps.map((step) => step.mask)).toEqual([...HUE, ...HUE]);
    for (let i = 0; i <= 6; i++) expect(tour.vertices[i + 6]).toBe(tour.vertices[i] ^ 7);
    for (const point of Object.keys(tour.points).map(Number)) {
      const masks = tour.edges.filter((edge) => edge.a === point || edge.b === point).map((edge) => edge.a ^ edge.b);
      for (const incoming of masks) {
        const phase = HUE.indexOf(incoming);
        const allowed = masks.filter((outgoing) => [1, 5].includes((HUE.indexOf(outgoing) - phase + 6) % 6));
        expect(allowed).toHaveLength(1);
      }
    }
  });

  it("the 24-edge example has ten cyclic direction reversals", () => {
    const tour = TOURS[1];
    const directions = tour.steps.map((step, i) => hueDirection(step.mask, tour.steps[(i + 1) % 24].mask));
    expect(directions.filter((direction, i) => direction !== directions[(i + 1) % 24])).toHaveLength(10);
  });
});
