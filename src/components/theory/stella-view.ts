import {
  CUBE_EDGES,
  STELLA_EDGES,
  COMPLEMENT_EDGES,
  THEORY_LEVELS,
  K8_EXPLORER_POINTS,
  K8_EXPLORER_VERTICES_3D,
  hammingDist,
} from "../../data/theory-data";

type Point3 = readonly [number, number, number];
const point3 = (valueAt: (axis: number) => number): Point3 => [valueAt(0), valueAt(1), valueAt(2)];
const dot = (a: Point3, b: Point3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Point3, b: Point3): Point3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// Camera axes in GRB coordinates. Look along W–K, with R above C.
// x right, y down, z away: W is the nearest vertex, K the farthest.
const targetBasis: readonly Point3[] = [
  [1 / Math.SQRT2, 0, -1 / Math.SQRT2],
  [1 / Math.sqrt(6), -2 / Math.sqrt(6), 1 / Math.sqrt(6)],
  [-1 / Math.sqrt(3), -1 / Math.sqrt(3), -1 / Math.sqrt(3)],
];
const targetVertices = THEORY_LEVELS.map(({ bits }): Point3 => {
  const point: Point3 = [bits[0] - 0.5, bits[1] - 0.5, bits[2] - 0.5];
  return point3((axis) => dot(targetBasis[axis], point));
});
const sourceBasis = [0, 1, 2].map((coordinate): Point3 =>
  point3((axis) => K8_EXPLORER_VERTICES_3D[[4, 2, 1][axis]][coordinate] - K8_EXPLORER_VERTICES_3D[0][coordinate]),
);
const rotation = targetBasis.map((row) => sourceBasis.map((axis) => dot(row, axis)));
const angle = Math.acos(Math.max(-1, Math.min(1, (rotation[0][0] + rotation[1][1] + rotation[2][2] - 1) / 2)));
const axis = point3(
  (coordinate) =>
    [rotation[2][1] - rotation[1][2], rotation[0][2] - rotation[2][0], rotation[1][0] - rotation[0][1]][coordinate] / (2 * Math.sin(angle)),
);
const scale = (K8_EXPLORER_POINTS[2].x - K8_EXPLORER_POINTS[0].x) / (K8_EXPLORER_VERTICES_3D[2][0] - K8_EXPLORER_VERTICES_3D[0][0]);
const edges = [...CUBE_EDGES, ...STELLA_EDGES, ...COMPLEMENT_EDGES].map(([a, b], index) => ({ a, b, index, distance: hammingDist(a, b) }));

export function stellaView(progress: number) {
  const turn = Math.max(0, Math.min(1, progress));
  const cosine = Math.cos(angle * turn);
  const sine = Math.sin(angle * turn);
  // Rodrigues rotation preserves every 3D length throughout the animation.
  const vertices =
    turn === 0
      ? K8_EXPLORER_VERTICES_3D
      : turn === 1
        ? targetVertices
        : K8_EXPLORER_VERTICES_3D.map((point): Point3 => {
            const perpendicular = cross(axis, point);
            const parallel = dot(axis, point) * (1 - cosine);
            return point3((coordinate) => point[coordinate] * cosine + perpendicular[coordinate] * sine + axis[coordinate] * parallel);
          });
  const points =
    turn === 0
      ? K8_EXPLORER_POINTS
      : Object.fromEntries(vertices.map(([x, y], level) => [level, { x: 90 + scale * x, y: 63 + scale * y }]));
  // Along this rotation, midpoint order agrees with interpolated depth at
  // every strict crossing (checked across the entire arc). Filter only after
  // sorting, so changing distance layers or emphasis cannot promote an edge.
  const orderedEdges = edges
    .map((edge) => ({ ...edge, depth: (vertices[edge.a][2] + vertices[edge.b][2]) / 2 }))
    .sort((a, b) => (Math.abs(a.depth - b.depth) < 1e-9 ? a.index - b.index : b.depth - a.depth));
  const orderedLevels =
    turn === 0 ? THEORY_LEVELS : [...THEORY_LEVELS].sort((a, b) => vertices[b.lv][2] - vertices[a.lv][2] || a.lv - b.lv);
  return { points, vertices, orderedEdges, orderedLevels };
}
