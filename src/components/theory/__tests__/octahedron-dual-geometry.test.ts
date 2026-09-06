import { describe, expect, it } from "vitest";
import { TETRA_T0 } from "../../../data/theory-data";
import {
  DUAL_CUBE_VERTICES,
  DUAL_CUBE_EDGES,
  DUAL_DIE_FACES,
  DUAL_OCTA_VERTICES,
  DUAL_OCTA_EDGES,
  DUAL_OCTA_FACES,
  projectDualPoint,
} from "../octahedron-dual-geometry";

const distance = (a: readonly number[], b: readonly number[]) => Math.hypot(...a.map((x, i) => x - b[i]));

describe("regular cube and octahedron dual geometry", () => {
  it("places red above every other vertex and cyan below, on the same vertical axis", () => {
    const points = Object.fromEntries(Object.entries(DUAL_OCTA_VERTICES).map(([lv, point]) => [lv, projectDualPoint(point)]));
    expect(points[2].x).toBeCloseTo(points[5].x, 12);
    for (const lv of [1, 3, 4, 6]) {
      expect(points[2].y).toBeLessThan(points[lv].y);
      expect(points[5].y).toBeGreaterThan(points[lv].y);
    }
  });

  it("shares all six face centers with the edge midpoints of each color tetrahedron", () => {
    for (const tetra of [TETRA_T0, TETRA_T0.map((lv) => lv ^ 7)]) {
      const members = new Set<number>(tetra);
      for (const face of DUAL_DIE_FACES) {
        const ends = face.vertices.filter((lv) => members.has(lv));
        expect(ends).toHaveLength(2);
        const midpoint = DUAL_CUBE_VERTICES[ends[0]].map((coordinate, axis) => (coordinate + DUAL_CUBE_VERTICES[ends[1]][axis]) / 2);
        expect(distance(midpoint, face.center)).toBeCloseTo(0, 12);
      }
    }
  });

  it("covers every chromatic XOR edge exactly once with the four zero-XOR faces", () => {
    const zeroFaces = DUAL_OCTA_FACES.filter((face) => face.verts.reduce<number>((x, y) => x ^ y, 0) === 0);
    expect(zeroFaces).toHaveLength(4);
    for (const { a, b } of DUAL_OCTA_EDGES) {
      expect(zeroFaces.filter((face) => face.verts.includes(a) && face.verts.includes(b))).toHaveLength(1);
    }
  });

  it("uses the exact cube face centers as the vertices of a regular octahedron", () => {
    for (const { a, b } of DUAL_CUBE_EDGES) expect(distance(DUAL_CUBE_VERTICES[a], DUAL_CUBE_VERTICES[b])).toBeCloseTo(1, 12);
    for (const { a, b } of DUAL_OCTA_EDGES) expect(distance(DUAL_OCTA_VERTICES[a], DUAL_OCTA_VERTICES[b])).toBeCloseTo(Math.SQRT1_2, 12);
    for (const face of DUAL_DIE_FACES) {
      expect(face.vertices).toHaveLength(4);
      for (let axis = 0; axis < 3; axis++) {
        expect(face.center[axis]).toBeCloseTo(face.vertices.reduce((sum, lv) => sum + DUAL_CUBE_VERTICES[lv][axis], 0) / 4, 12);
        expect(DUAL_OCTA_VERTICES[face.lv ^ 7][axis]).toBeCloseTo(-face.center[axis], 12);
      }
      const projected = projectDualPoint(face.center);
      expect(projected.x).toBeCloseTo(face.vertices.reduce((sum, lv) => sum + projectDualPoint(DUAL_CUBE_VERTICES[lv]).x, 0) / 4, 12);
      expect(projected.y).toBeCloseTo(face.vertices.reduce((sum, lv) => sum + projectDualPoint(DUAL_CUBE_VERTICES[lv]).y, 0) / 4, 12);
    }
  });

  it("preserves incidence for all eight dual triangles and twelve dual edges", () => {
    for (const face of DUAL_OCTA_FACES) {
      const incident = DUAL_DIE_FACES.filter((square) => square.vertices.includes(face.color))
        .map((square) => square.lv)
        .sort();
      expect([...face.verts].sort()).toEqual(incident);
      expect(face.hidden).toBe(DUAL_CUBE_VERTICES[face.color][2] < 0);
    }
    for (const { a, b } of DUAL_OCTA_EDGES) {
      const left = DUAL_DIE_FACES.find((face) => face.lv === a)!;
      const right = DUAL_DIE_FACES.find((face) => face.lv === b)!;
      const shared = left.vertices.filter((vertex) => right.vertices.includes(vertex));
      expect(shared).toHaveLength(2);
      expect(DUAL_CUBE_EDGES.some((edge) => shared.includes(edge.a) && shared.includes(edge.b))).toBe(true);
    }
  });

  it("keeps every projected triangle open and cube vertex labels apart", () => {
    for (const face of DUAL_OCTA_FACES) {
      const [a, b, c] = face.verts.map((lv) => projectDualPoint(DUAL_OCTA_VERTICES[lv]));
      const area = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) / 2;
      expect(area).toBeGreaterThan(2000);
    }
    const points = DUAL_CUBE_VERTICES.map(projectDualPoint);
    points.forEach((point, index) => {
      for (const other of points.slice(index + 1)) {
        expect(Math.hypot(point.x - other.x, point.y - other.y)).toBeGreaterThan(44);
      }
    });
  });
});
