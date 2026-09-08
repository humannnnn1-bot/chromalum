import {
  CUBE_EDGES,
  STELLA_EDGES,
  OCTA_EDGES,
  THEORY_LEVELS,
  K8_EXPLORER_POINTS,
  K8_EXPLORER_VERTICES_3D,
  GRAY_PATH,
  hammingDist,
} from "../../src/data/theory-data";
import { DUAL_OCTA_VERTICES, projectDualPoint } from "../../src/components/theory/octahedron-dual-geometry";

export const HUE = GRAY_PATH;
export const LEVELS = THEORY_LEVELS;
export type TourId = "octahedron" | "distance-12";
type Point = { x: number; y: number; depth: number };
type TourStep = {
  from: number;
  to: number;
  mask: number;
  distance: number;
  key: string;
};
export type Tour = {
  id: TourId;
  title: string;
  subtitle: string;
  rule: string;
  vertices: readonly number[];
  steps: readonly TourStep[];
  points: Readonly<Record<number, Point>>;
  edges: readonly { a: number; b: number; key: string; depth: number; step: number }[];
};

export const edgeKey = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;
export const bits = (level: number) => LEVELS[level].bits.join("");

function fitPoints(raw: Readonly<Record<number, Point>>): Readonly<Record<number, Point>> {
  const values = Object.values(raw);
  const xs = values.map((p) => p.x);
  const ys = values.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scale = Math.min(280 / (maxX - minX), 242 / (maxY - minY));
  return Object.fromEntries(
    Object.entries(raw).map(([level, point]) => [
      level,
      { x: 200 + (point.x - (minX + maxX) / 2) * scale, y: 154 + (point.y - (minY + maxY) / 2) * scale, depth: point.depth },
    ]),
  );
}

const octaPoints = fitPoints(
  Object.fromEntries(
    Object.entries(DUAL_OCTA_VERTICES).map(([level, point]) => [
      level,
      // The dual view uses z toward the viewer; normalize both views to z away.
      { ...projectDualPoint(point), depth: -point[2] },
    ]),
  ),
);
const distancePoints = fitPoints(
  Object.fromEntries(
    Object.entries(K8_EXPLORER_POINTS).map(([level, point]) => [level, { ...point, depth: K8_EXPLORER_VERTICES_3D[Number(level)][2] }]),
  ),
);

function makeTour(
  details: Pick<Tour, "id" | "title" | "subtitle" | "rule">,
  vertices: readonly number[],
  graphEdges: readonly (readonly [number, number])[],
  points: Readonly<Record<number, Point>>,
): Tour {
  const steps = vertices.slice(1).map((to, i) => {
    const from = vertices[i];
    return { from, to, mask: from ^ to, distance: hammingDist(from, to), key: edgeKey(from, to) };
  });
  const edges = graphEdges
    .map(([a, b]) => ({
      a,
      b,
      key: edgeKey(a, b),
      depth: (points[a].depth + points[b].depth) / 2,
      step: steps.findIndex((s) => s.key === edgeKey(a, b)),
    }))
    .sort((a, b) => (Math.abs(a.depth - b.depth) < 1e-9 ? a.key.localeCompare(b.key) : b.depth - a.depth));
  return { ...details, vertices, steps, points, edges };
}

export const TOURS: readonly Tour[] = [
  makeTour(
    { id: "octahedron", title: "八面体", subtitle: "色相順で一筆書き", rule: "同じ向きに、2周" },
    [1, 3, 5, 1, 4, 5, 6, 4, 2, 6, 3, 2, 1],
    OCTA_EDGES,
    octaPoints,
  ),
  makeTour(
    { id: "distance-12", title: "距離1 ＋ 距離2", subtitle: "色相隣接で一筆書き", rule: "隣り合う色へ、折り返しながら" },
    [0, 2, 4, 0, 5, 4, 1, 0, 3, 1, 2, 3, 6, 7, 4, 6, 5, 7, 1, 5, 3, 7, 2, 6, 0],
    [...CUBE_EDGES, ...STELLA_EDGES],
    distancePoints,
  ),
];

export function hueDirection(a: number, b: number): 1 | -1 {
  const delta = (HUE.indexOf(b) - HUE.indexOf(a) + HUE.length) % HUE.length;
  if (delta !== 1 && delta !== HUE.length - 1) throw new Error(`Non-adjacent hue transition: ${a} → ${b}`);
  return delta === 1 ? 1 : -1;
}

export function frameAt(tour: Tour, progress: number) {
  const total = tour.steps.length;
  const position = Math.max(0, Math.min(total, progress));
  const completed = Math.floor(position);
  const done = completed === total;
  const index = Math.min(completed, total - 1);
  const fraction = done ? 1 : position - completed;
  const step = tour.steps[index];
  const next = tour.steps[(index + 1) % total];
  const previous = tour.steps[(index + total - 1) % total];
  const direction = hueDirection(step.mask, next.mask);
  const turning = !done && index > 0 && hueDirection(previous.mask, step.mask) !== direction;
  const from = tour.points[step.from];
  const to = tour.points[step.to];
  return {
    completed,
    done,
    index,
    fraction,
    step,
    direction,
    turning,
    point: { x: from.x + (to.x - from.x) * fraction, y: from.y + (to.y - from.y) * fraction },
  };
}
