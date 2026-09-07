import { describe, expect, it } from "vitest";
import { GRB_TONE_B, GRB_TONE_G, GRB_TONE_R } from "../../color-engine";
import {
  COMPLEMENT_EDGES,
  CUBE_EDGES,
  CUBE_FACES,
  DICE_NET_FACES,
  FANO_LINES,
  GRAY_PATH,
  GRAY_TOGGLES,
  K8_EXPLORER_POINTS,
  K8_EXPLORER_VERTICES_3D,
  OCTA_COMPLEMENT_AXES,
  OCTA_EDGES,
  OCTA_FACES,
  STELLA_EDGES,
  TETRA_T0,
  THEORY_LEVELS,
  hammingDist,
} from "../theory-data";

function edgeKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

type FaceLv = 1 | 2 | 3 | 4 | 5 | 6;
type Channel = "G" | "R" | "B";
type BitAssignment = readonly [Channel, Channel, Channel]; // [bit2, bit1, bit0]
type DiceEdge = readonly [FaceLv, FaceLv];
type Vec3 = readonly [number, number, number];
type Dir = "E" | "W" | "S" | "N";

interface OrientedFace {
  n: Vec3; // outward normal
  u: Vec3; // local +x direction in the unfolded net
  v: Vec3; // local +y direction in the unfolded net
}

interface Pt {
  x: number;
  y: number;
}

const DICE_FACES: FaceLv[] = [1, 2, 3, 4, 5, 6];

// One concrete folded cube orientation matching ColorDice's staircase:
// R(+X) -> Y(+Y) -> G(+Z) -> C(-X) -> B(-Y) -> M(-Z).
// Opposite pairs are therefore R/C, Y/B, and G/M.
const DICE_NORMALS: Record<FaceLv, Vec3> = {
  1: [0, -1, 0], // Blue
  2: [1, 0, 0], // Red
  3: [0, 0, -1], // Magenta
  4: [0, 0, 1], // Green
  5: [-1, 0, 0], // Cyan
  6: [0, 1, 0], // Yellow
};

const DICE_ROOT: FaceLv = 2;
const DICE_ROOT_ORIENTATION: OrientedFace = {
  n: DICE_NORMALS[2],
  u: DICE_NORMALS[6],
  v: DICE_NORMALS[4],
};

const GRB_TONE_WEIGHTS: Record<Channel, number> = {
  G: GRB_TONE_G,
  R: GRB_TONE_R,
  B: GRB_TONE_B,
};

const DICE_FACE_EDGES: DiceEdge[] = DICE_FACES.flatMap((a, i) =>
  DICE_FACES.slice(i + 1)
    .filter((b) => (a ^ b) !== 7)
    .map((b) => [a, b] as const),
);

function vecEq(a: Vec3, b: Vec3): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

function vecNeg(v: Vec3): Vec3 {
  return [-v[0], -v[1], -v[2]];
}

function directionToNeighbor(face: OrientedFace, neighborNormal: Vec3): Dir {
  if (vecEq(neighborNormal, face.u)) return "E";
  if (vecEq(neighborNormal, vecNeg(face.u))) return "W";
  if (vecEq(neighborNormal, face.v)) return "S";
  if (vecEq(neighborNormal, vecNeg(face.v))) return "N";
  throw new Error(`faces are not adjacent: ${face.n.join(",")} -> ${neighborNormal.join(",")}`);
}

function rotateAcross(face: OrientedFace, dir: Dir): OrientedFace {
  switch (dir) {
    case "E":
      return { n: face.u, u: vecNeg(face.n), v: face.v };
    case "W":
      return { n: vecNeg(face.u), u: face.n, v: face.v };
    case "S":
      return { n: face.v, u: face.u, v: vecNeg(face.n) };
    case "N":
      return { n: vecNeg(face.v), u: face.u, v: face.n };
  }
}

function stepFromDir({ x, y }: Pt, dir: Dir): Pt {
  if (dir === "E") return { x: x + 1, y };
  if (dir === "W") return { x: x - 1, y };
  if (dir === "S") return { x, y: y + 1 };
  return { x, y: y - 1 };
}

function combinations<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  const walk = (start: number, chosen: T[]) => {
    if (chosen.length === size) {
      out.push([...chosen]);
      return;
    }
    for (let i = start; i <= items.length - (size - chosen.length); i++) {
      chosen.push(items[i]);
      walk(i + 1, chosen);
      chosen.pop();
    }
  };
  walk(0, []);
  return out;
}

function toneWeightForAssignment([bit2, bit1, bit0]: BitAssignment, lv: number): number {
  const channelBits: Record<Channel, number> = { G: 0, R: 0, B: 0 };
  channelBits[bit2] = (lv >> 2) & 1;
  channelBits[bit1] = (lv >> 1) & 1;
  channelBits[bit0] = lv & 1;
  return channelBits.G * GRB_TONE_WEIGHTS.G + channelBits.R * GRB_TONE_WEIGHTS.R + channelBits.B * GRB_TONE_WEIGHTS.B;
}

function isStrictlyIncreasing(values: readonly number[]): boolean {
  return values.every((value, i) => i === 0 || value > values[i - 1]);
}

function isConnectedSpanningTree(edges: readonly DiceEdge[]): boolean {
  if (edges.length !== DICE_FACES.length - 1) return false;

  const adj = new Map<FaceLv, FaceLv[]>(DICE_FACES.map((f) => [f, []]));
  for (const [a, b] of edges) {
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  }

  const seen = new Set<FaceLv>([DICE_ROOT]);
  const queue: FaceLv[] = [DICE_ROOT];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const next of adj.get(cur)!) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return seen.size === DICE_FACES.length;
}

function enumerateDiceFaceSpanningTrees(): DiceEdge[][] {
  return combinations(DICE_FACE_EDGES, DICE_FACES.length - 1).filter(isConnectedSpanningTree);
}

function unfoldTree(edges: readonly DiceEdge[]): Map<FaceLv, Pt> {
  const adj = new Map<FaceLv, FaceLv[]>(DICE_FACES.map((f) => [f, []]));
  for (const [a, b] of edges) {
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  }

  const positions = new Map<FaceLv, Pt>([[DICE_ROOT, { x: 0, y: 0 }]]);
  const orientations = new Map<FaceLv, OrientedFace>([[DICE_ROOT, DICE_ROOT_ORIENTATION]]);
  const queue: FaceLv[] = [DICE_ROOT];

  while (queue.length) {
    const cur = queue.shift()!;
    const curPos = positions.get(cur)!;
    const curOrientation = orientations.get(cur)!;

    for (const next of adj.get(cur)!) {
      if (positions.has(next)) continue;

      const dir = directionToNeighbor(curOrientation, DICE_NORMALS[next]);
      const nextOrientation = rotateAcross(curOrientation, dir);
      expect(vecEq(nextOrientation.n, DICE_NORMALS[next])).toBe(true);

      positions.set(next, stepFromDir(curPos, dir));
      orientations.set(next, nextOrientation);
      queue.push(next);
    }
  }

  expect(positions.size).toBe(DICE_FACES.length);
  return positions;
}

function canonicalShape(points: readonly Pt[]): string {
  const transforms = [
    ({ x, y }: Pt) => ({ x, y }),
    ({ x, y }: Pt) => ({ x, y: -y }),
    ({ x, y }: Pt) => ({ x: -x, y }),
    ({ x, y }: Pt) => ({ x: -x, y: -y }),
    ({ x, y }: Pt) => ({ x: y, y: x }),
    ({ x, y }: Pt) => ({ x: y, y: -x }),
    ({ x, y }: Pt) => ({ x: -y, y: x }),
    ({ x, y }: Pt) => ({ x: -y, y: -x }),
  ];

  return transforms
    .map((transform) => {
      const transformed = points.map(transform);
      const minX = Math.min(...transformed.map((p) => p.x));
      const minY = Math.min(...transformed.map((p) => p.y));
      return transformed
        .map((p) => ({ x: p.x - minX, y: p.y - minY }))
        .sort((a, b) => a.x - b.x || a.y - b.y)
        .map((p) => `${p.x},${p.y}`)
        .join(";");
    })
    .sort()[0];
}

function hasNoOverlappingFaces(positions: Map<FaceLv, Pt>): boolean {
  return new Set([...positions.values()].map((p) => `${p.x},${p.y}`)).size === positions.size;
}

function containsEdges(edges: readonly DiceEdge[], required: readonly DiceEdge[]): boolean {
  const present = new Set(edges.map(([a, b]) => edgeKey(a, b)));
  return required.every(([a, b]) => present.has(edgeKey(a, b)));
}

describe("theory-data invariants", () => {
  it("treats the CMY Fano line as an even-parity tetrahedron rather than a Euclidean plane slice", () => {
    const p3 = [0, 1, 1];
    const p5 = [1, 0, 1];
    const p6 = [1, 1, 0];
    const det = p3[0] * (p5[1] * p6[2] - p5[2] * p6[1]) - p3[1] * (p5[0] * p6[2] - p5[2] * p6[0]) + p3[2] * (p5[0] * p6[1] - p5[1] * p6[0]);

    expect(det).not.toBe(0);
    expect(new Set([0, 3, 5, 6])).toEqual(new Set(TETRA_T0));
  });

  it("models the Fano plane as a Steiner triple system", () => {
    const pairCounts = new Map<string, number>();

    for (const [a, b, c] of FANO_LINES) {
      expect(a ^ b ^ c).toBe(0);
      const points = [a, b, c];
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const key = edgeKey(points[i], points[j]);
          pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
        }
      }
    }

    expect(pairCounts.size).toBe(21);
    for (const count of pairCounts.values()) expect(count).toBe(1);
  });

  it("keeps numeric level order aligned with the already selected GRB frame", () => {
    expect(GRB_TONE_WEIGHTS.G).toBeGreaterThan(GRB_TONE_WEIGHTS.R + GRB_TONE_WEIGHTS.B);
    expect(GRB_TONE_WEIGHTS.R).toBeGreaterThan(GRB_TONE_WEIGHTS.B);
    expect(THEORY_LEVELS.map(({ bits }) => 4 * bits[0] + 2 * bits[1] + bits[2])).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);

    const assignments: BitAssignment[] = [
      ["G", "R", "B"],
      ["G", "B", "R"],
      ["R", "G", "B"],
      ["R", "B", "G"],
      ["B", "G", "R"],
      ["B", "R", "G"],
    ];
    // This is a regression check after the frame choice, not a derivation of that choice.
    const monotoneAssignments = assignments.filter((assignment) =>
      isStrictlyIncreasing(Array.from({ length: 8 }, (_, lv) => toneWeightForAssignment(assignment, lv))),
    );

    expect(assignments).toHaveLength(6);
    expect(monotoneAssignments).toEqual([["G", "R", "B"]]);
    for (let lv = 0; lv < 8; lv++) {
      expect(toneWeightForAssignment(["G", "R", "B"], lv)).toBeCloseTo(lv / 7, 10);
    }
  });

  it("reverses chromatic tone ranks under complement, matching die opposite sums", () => {
    const chromaticLevels = [1, 2, 3, 4, 5, 6];
    const ranked = chromaticLevels
      .map((lv) => ({ lv, tone: toneWeightForAssignment(["G", "R", "B"], lv) }))
      .sort((a, b) => a.tone - b.tone);
    const rankByLv = new Map(ranked.map(({ lv }, i) => [lv, i + 1]));

    expect(ranked.map(({ lv }) => lv)).toEqual([1, 2, 3, 4, 5, 6]);

    for (const lv of chromaticLevels) {
      const complement = lv ^ 7;
      expect(chromaticLevels).toContain(complement);
      expect(toneWeightForAssignment(["G", "R", "B"], lv) + toneWeightForAssignment(["G", "R", "B"], complement)).toBeCloseTo(1);
      expect(rankByLv.get(lv)! + rankByLv.get(complement)!).toBe(7);
    }
  });

  it("keeps the Gray cycle on chromatic vertices with one bit flip per step", () => {
    expect(new Set(GRAY_PATH).size).toBe(6);
    expect([...GRAY_PATH].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);

    const diffToToggle: Record<number, string> = { 1: "B", 2: "R", 4: "G" };
    const signedLevelDeltas = GRAY_PATH.map((lv, i) => GRAY_PATH[(i + 1) % GRAY_PATH.length] - lv);
    expect(signedLevelDeltas).toEqual([4, -2, 1, -4, 2, -1]);
    expect(signedLevelDeltas.map(Math.sign)).toEqual([1, -1, 1, -1, 1, -1]);
    expect(signedLevelDeltas.map(Math.abs)).toEqual([4, 2, 1, 4, 2, 1]);

    GRAY_PATH.forEach((lv, i) => {
      const next = GRAY_PATH[(i + 1) % GRAY_PATH.length];
      const diff = lv ^ next;
      const delta = signedLevelDeltas[i];
      expect(hammingDist(lv, next)).toBe(1);
      expect(GRAY_TOGGLES[i]).toBe(diffToToggle[diff]);
      expect(Math.abs(delta)).toBe(diff);
      expect(delta > 0 ? (lv & next) === lv : (lv & next) === next).toBe(true);
    });
  });

  it("partitions K8 edges by Hamming distance", () => {
    const q3 = new Set(CUBE_EDGES.map(([a, b]) => edgeKey(a, b)));
    const stella = new Set(STELLA_EDGES.map(([a, b]) => edgeKey(a, b)));
    const complements = new Set(COMPLEMENT_EDGES.map(([a, b]) => edgeKey(a, b)));
    const union = new Set([...q3, ...stella, ...complements]);

    expect(q3.size).toBe(12);
    expect(stella.size).toBe(12);
    expect(complements.size).toBe(4);
    expect(union.size).toBe(28);

    for (const [a, b] of CUBE_EDGES) expect(hammingDist(a, b)).toBe(1);
    for (const [a, b] of STELLA_EDGES) expect(hammingDist(a, b)).toBe(2);
    for (const [a, b] of COMPLEMENT_EDGES) expect(hammingDist(a, b)).toBe(3);

    expect(COMPLEMENT_EDGES).toEqual([
      [0, 7],
      [1, 6],
      [2, 5],
      [3, 4],
    ]);
  });

  it("preserves a regular cube and its two regular tetrahedra in the Explorer's 3D coordinates", () => {
    for (const [edges, squaredLength] of [
      [CUBE_EDGES, 1],
      [STELLA_EDGES, 2],
      [COMPLEMENT_EDGES, 3],
    ] as const) {
      for (const [a, b] of edges) {
        const from = K8_EXPLORER_VERTICES_3D[a];
        const to = K8_EXPLORER_VERTICES_3D[b];
        const distanceSquared = from.reduce((sum, coordinate, axis) => sum + (to[axis] - coordinate) ** 2, 0);
        expect(distanceSquared).toBeCloseTo(squaredLength, 12);
      }
    }
  });

  it("projects the regular solids with a uniform scale and shared center", () => {
    const origin = K8_EXPLORER_POINTS[0];
    const origin3D = K8_EXPLORER_VERTICES_3D[0];
    const scale = (K8_EXPLORER_POINTS[1].x - origin.x) / (K8_EXPLORER_VERTICES_3D[1][0] - origin3D[0]);
    expect(scale).toBeGreaterThan(0);

    K8_EXPLORER_VERTICES_3D.forEach(([x, y], lv) => {
      const projected = K8_EXPLORER_POINTS[lv];
      expect(projected.x - origin.x).toBeCloseTo(scale * (x - origin3D[0]), 12);
      expect(projected.y - origin.y).toBeCloseTo(scale * (y - origin3D[1]), 12);
      expect((projected.x + K8_EXPLORER_POINTS[lv ^ 7].x) / 2).toBeCloseTo(90, 12);
      expect((projected.y + K8_EXPLORER_POINTS[lv ^ 7].y) / 2).toBeCloseTo(63, 12);
    });
  });

  it("recovers every missing cube-face vertex by XOR and keeps face meets and joins inside the face", () => {
    expect(CUBE_FACES).toHaveLength(6);
    for (const channel of [0, 1, 2]) {
      for (const bit of [0, 1]) {
        const face = CUBE_FACES.find((item) => item.bitIndex === channel && item.fixed === bit)!.vertices;
        expect([...face].sort((a, b) => a - b)).toEqual(
          THEORY_LEVELS.filter((level) => level.bits[channel] === bit).map((level) => level.lv),
        );
        expect(face).toHaveLength(4);
        face.forEach((level, i) => expect(hammingDist(level, face[(i + 1) % 4])).toBe(1));
        expect(face.reduce((result, level) => result ^ level, 0)).toBe(0);
        for (const missing of face) {
          expect(face.filter((level) => level !== missing).reduce((result, level) => result ^ level, 0)).toBe(missing);
        }
        for (const a of face) {
          for (const b of face) {
            expect(face).toContain(a & b);
            expect(face).toContain(a | b);
          }
        }
      }
    }
    for (const level of THEORY_LEVELS) expect(CUBE_FACES.filter((face) => face.vertices.includes(level.lv))).toHaveLength(3);
    for (const [a, b] of CUBE_EDGES)
      expect(CUBE_FACES.filter((face) => face.vertices.includes(a) && face.vertices.includes(b))).toHaveLength(2);
  });

  it("matches XOR recovery and Boolean majority to all eight tetrahedral faces and their geometric dual vertices", () => {
    const even = new Set<number>(TETRA_T0);
    const tetrahedra = [[...even], THEORY_LEVELS.filter((level) => !even.has(level.lv)).map((level) => level.lv)];
    let faceCount = 0;
    for (const tetrahedron of tetrahedra) {
      for (const [a, b, c] of combinations(tetrahedron, 3)) {
        const missing = tetrahedron.find((level) => ![a, b, c].includes(level))!;
        const majority = (a & b) | (b & c) | (c & a);
        expect(a ^ b ^ c).toBe(missing);
        expect(majority).toBe(missing ^ 7);
        expect(a | b | c).toBe(7);
        expect(a & b & c).toBe(0);
        for (const axis of [0, 1, 2]) {
          const centroid = [a, b, c].reduce((sum, level) => sum + K8_EXPLORER_VERTICES_3D[level][axis], 0) / 3;
          expect(3 * centroid).toBeCloseTo(K8_EXPLORER_VERTICES_3D[majority][axis], 12);
        }
        faceCount++;
      }
    }
    expect(faceCount).toBe(8);
  });

  it("reads every octahedral face as a mixing relation and splits its XOR into four Fano lines and their complements", () => {
    const fanoKeys = new Set(FANO_LINES.map((line) => [...line].sort().join("-")));
    let fanoFaceCount = 0;
    for (const { verts, color } of OCTA_FACES) {
      const primaryCount = verts.filter((level) => hammingDist(0, level) === 1).length;
      const mixingResult =
        primaryCount >= 2
          ? verts.reduce<number>((result, level) => result | level, 0)
          : verts.reduce<number>((result, level) => result & level, 7);
      expect(mixingResult).toBe(color);
      const xor = verts.reduce<number>((result, level) => result ^ level, 0);
      const isFano = fanoKeys.has([...verts].sort().join("-"));
      expect(xor).toBe(hammingDist(0, color) % 2 === 0 ? 0 : 7);
      expect(isFano).toBe(xor === 0);
      if (isFano) fanoFaceCount++;
      const opposite = OCTA_FACES.find((face) => face.color === (color ^ 7))!;
      expect([...opposite.verts].sort()).toEqual(verts.map((level) => level ^ 7).sort());
    }
    expect(fanoFaceCount).toBe(4);
  });

  it("identifies the fourteen zero-XOR quadruples with affine planes and the extended Hamming code", () => {
    const levels = THEORY_LEVELS.map((level) => level.lv);
    const planes = combinations(levels, 4).filter((vertices) => vertices.reduce((xor, level) => xor ^ level, 0) === 0);
    expect(planes).toHaveLength(14);
    const planeKeys = new Set(planes.map((vertices) => vertices.join("-")));
    const planesByNormalWeight = [0, 0, 0, 0];
    for (const normal of levels.slice(1)) {
      for (const parity of [0, 1]) {
        const plane = levels.filter((level) => hammingDist(0, normal & level) % 2 === parity);
        expect(planeKeys.has(plane.join("-"))).toBe(true);
        planesByNormalWeight[hammingDist(0, normal)]++;
      }
    }
    expect(planesByNormalWeight).toEqual([0, 6, 6, 2]);
    for (const triple of combinations(levels, 3)) {
      expect(planes.filter((plane) => triple.every((level) => plane.includes(level)))).toHaveLength(1);
    }
    const words = new Set([0, 255, ...planes.map((plane) => plane.reduce((word, level) => word | (1 << level), 0))]);
    expect(words.size).toBe(16);
    const distances = combinations([...words], 2).map(([a, b]) => {
      const difference = a ^ b;
      expect(words.has(difference)).toBe(true);
      return levels.reduce((weight, level) => weight + ((difference >> level) & 1), 0);
    });
    expect(Math.min(...distances)).toBe(4);
    const punctured = new Set([...words].map((word) => word >> 1));
    const hammingKernel = new Set(
      Array.from({ length: 128 }, (_, word) => word).filter(
        (word) => levels.slice(1).reduce((syndrome, level) => syndrome ^ (((word >> (level - 1)) & 1) === 1 ? level : 0), 0) === 0,
      ),
    );
    expect(punctured).toEqual(hammingKernel);
  });

  it("models the Color Diamond as the Color Cube dual with chromatic XOR edges", () => {
    const chromatic = new Set([1, 2, 3, 4, 5, 6]);
    const complementAxes = new Set(OCTA_COMPLEMENT_AXES.map(([a, b]) => edgeKey(a, b)));
    const xorCounts = new Map<number, number>();

    expect(OCTA_EDGES).toHaveLength(12);
    expect(complementAxes).toEqual(new Set(["1-6", "2-5", "3-4"]));

    for (const [a, b] of OCTA_EDGES) {
      expect(chromatic.has(a)).toBe(true);
      expect(chromatic.has(b)).toBe(true);
      expect(complementAxes.has(edgeKey(a, b))).toBe(false);

      const result = a ^ b;
      expect(chromatic.has(result)).toBe(true);
      xorCounts.set(result, (xorCounts.get(result) ?? 0) + 1);
    }

    expect(xorCounts.size).toBe(6);
    for (const lv of chromatic) expect(xorCounts.get(lv)).toBe(2);

    const faceColors = new Set(OCTA_FACES.map(({ color }) => color));
    expect(faceColors).toEqual(new Set([0, 1, 2, 3, 4, 5, 6, 7]));

    for (const face of OCTA_FACES) {
      for (const axis of OCTA_COMPLEMENT_AXES) {
        expect(axis.filter((lv) => face.verts.includes(lv)).length).toBe(1);
      }

      const expectedColor = (face.verts.includes(4) ? 4 : 0) | (face.verts.includes(2) ? 2 : 0) | (face.verts.includes(1) ? 1 : 0);
      expect(face.color).toBe(expectedColor);
    }

    const faceAdjacency = new Set<string>();
    for (let i = 0; i < OCTA_FACES.length; i++) {
      for (let j = i + 1; j < OCTA_FACES.length; j++) {
        const sharedVerts = OCTA_FACES[i].verts.filter((lv) => OCTA_FACES[j].verts.includes(lv));
        if (sharedVerts.length === 2) {
          expect(hammingDist(OCTA_FACES[i].color, OCTA_FACES[j].color)).toBe(1);
          faceAdjacency.add(edgeKey(OCTA_FACES[i].color, OCTA_FACES[j].color));
        }
      }
    }

    expect(faceAdjacency).toEqual(new Set(CUBE_EDGES.map(([a, b]) => edgeKey(a, b))));
  });

  it("keeps T0 closed under XOR", () => {
    const t0 = new Set<number>(TETRA_T0);
    for (const a of TETRA_T0) {
      for (const b of TETRA_T0) {
        expect(t0.has(a ^ b)).toBe(true);
      }
    }
  });

  it("matches the displayed subtractive CMY examples with Boolean AND", () => {
    const subtractivePairs: [number, number, number][] = [
      [3, 5, 1],
      [5, 6, 4],
      [6, 3, 2],
    ];

    for (const [a, b, expected] of subtractivePairs) {
      expect(a | b).toBe(7);
      expect(a + b - 7).toBe(expected);
      expect(a & b).toBe(expected);
      expect(a ^ b).not.toBe(expected);
    }
  });

  it("enumerates the 11 free cube nets from cube-face spanning trees", () => {
    expect(DICE_FACE_EDGES).toHaveLength(12);

    const trees = enumerateDiceFaceSpanningTrees();
    const unfolded = trees.map((edges) => unfoldTree(edges));
    const nonOverlapping = unfolded.filter(hasNoOverlappingFaces);
    const freeNets = new Set(nonOverlapping.map((positions) => canonicalShape([...positions.values()])));

    expect(trees).toHaveLength(384);
    expect(nonOverlapping).toHaveLength(384);
    expect(freeNets.size).toBe(11);
  });

  it("uniquely unfolds the hue-order die path as the 2-2-2 staircase net", () => {
    const huePathEdges = GRAY_PATH.slice(0, -1).map((lv, i) => [lv, GRAY_PATH[i + 1]] as DiceEdge);
    const displayedStaircaseShape = canonicalShape(DICE_NET_FACES.map(({ col, row }) => ({ x: col, y: row })));

    const trees = enumerateDiceFaceSpanningTrees();
    const matching = trees
      .filter((edges) => containsEdges(edges, huePathEdges))
      .map((edges) => {
        const positions = unfoldTree(edges);
        return { positions, shape: canonicalShape([...positions.values()]) };
      });

    expect(huePathEdges).toEqual([
      [2, 6],
      [6, 4],
      [4, 5],
      [5, 1],
      [1, 3],
    ]);
    expect(matching).toHaveLength(1);
    expect(hasNoOverlappingFaces(matching[0].positions)).toBe(true);
    expect(DICE_NET_FACES.map(({ lv }) => lv)).toEqual(GRAY_PATH);
    expect(matching[0].shape).toBe(displayedStaircaseShape);
  });
});
