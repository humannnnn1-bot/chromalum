// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { K8_EXPLORER_POINTS, K8_EXPLORER_VERTICES_3D } from "../../../data/theory-data";
import { LanguageProvider } from "../../../i18n";
import { StellaOctangula } from "../StellaOctangula";

const EPSILON = 1e-9;
const distanceOf = (a: number, b: number) => (a ^ b).toString(2).replace(/0/g, "").length;
const PAIRS = Array.from({ length: 8 }, (_, a) =>
  Array.from({ length: 7 - a }, (_, offset) => ({ a, b: a + offset + 1, id: `${a}-${a + offset + 1}` })),
).flat();
const DISTANCE_SUBSETS = [[], [1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]];

// Independently inspect depth at each projected intersection. This does not
// assume that sorting whole lines by any particular representative point works.
function findCrossings() {
  const strict: { rear: string; front: string }[] = [];
  const equalDepth: { first: string; second: string }[] = [];
  for (let i = 0; i < PAIRS.length; i++) {
    const first = PAIRS[i];
    for (const second of PAIRS.slice(i + 1)) {
      if ([first.a, first.b].some((vertex) => vertex === second.a || vertex === second.b)) continue;
      const a = K8_EXPLORER_POINTS[first.a];
      const b = K8_EXPLORER_POINTS[first.b];
      const c = K8_EXPLORER_POINTS[second.a];
      const d = K8_EXPLORER_POINTS[second.b];
      const ab = { x: b.x - a.x, y: b.y - a.y };
      const cd = { x: d.x - c.x, y: d.y - c.y };
      const ac = { x: c.x - a.x, y: c.y - a.y };
      const determinant = ab.x * cd.y - ab.y * cd.x;
      if (Math.abs(determinant) < EPSILON) continue;
      const t = (ac.x * cd.y - ac.y * cd.x) / determinant;
      const u = (ac.x * ab.y - ac.y * ab.x) / determinant;
      if (t <= EPSILON || t >= 1 - EPSILON || u <= EPSILON || u >= 1 - EPSILON) continue;
      const zFirst = K8_EXPLORER_VERTICES_3D[first.a][2] + t * (K8_EXPLORER_VERTICES_3D[first.b][2] - K8_EXPLORER_VERTICES_3D[first.a][2]);
      const zSecond =
        K8_EXPLORER_VERTICES_3D[second.a][2] + u * (K8_EXPLORER_VERTICES_3D[second.b][2] - K8_EXPLORER_VERTICES_3D[second.a][2]);
      if (Math.abs(zFirst - zSecond) < EPSILON) equalDepth.push({ first: first.id, second: second.id });
      // View coordinates use z away from the viewer, so smaller z is nearer.
      else strict.push(zFirst > zSecond ? { rear: first.id, front: second.id } : { rear: second.id, front: first.id });
    }
  }
  return { strict, equalDepth };
}

const CROSSINGS = findCrossings();

function renderStella() {
  localStorage.setItem("chromalum_lang", "en");
  function ControlledStella() {
    const [hlLevel, setHlLevel] = useState<number | null>(null);
    return <StellaOctangula hlLevel={hlLevel} onHover={setHlLevel} />;
  }
  return render(
    <LanguageProvider>
      <ControlledStella />
    </LanguageProvider>,
  );
}

function setDistances(distances: number[]) {
  for (const distance of [1, 2, 3]) {
    const button = screen.getByRole("button", { name: new RegExp(`^Distance ${distance}`) });
    if ((button.getAttribute("aria-pressed") === "true") !== distances.includes(distance)) fireEvent.click(button);
  }
}

const edgeOrder = (diagram: Element) => [...diagram.querySelectorAll("[data-k8-edge]")].map((line) => line.getAttribute("data-k8-edge")!);

function expectCorrectCrossings(diagram: Element) {
  const order = edgeOrder(diagram);
  for (const { rear, front } of CROSSINGS.strict) {
    if (order.includes(rear) && order.includes(front)) {
      expect(order.indexOf(rear), `${rear} must be behind ${front} at their projected intersection`).toBeLessThan(order.indexOf(front));
    }
  }
}

describe("K8 crossing depth", () => {
  it("looks down on the G=1 face with G nearest and M farthest", () => {
    const z = K8_EXPLORER_VERTICES_3D.map((point) => point[2]);
    const faceDepth = (vertices: number[]) => vertices.reduce((sum, level) => sum + z[level], 0) / vertices.length;
    expect(faceDepth([4, 5, 6, 7])).toBeLessThan(faceDepth([0, 1, 2, 3]));
    expect(z.indexOf(Math.min(...z))).toBe(4);
    expect(z.indexOf(Math.max(...z))).toBe(3);

    const { container } = renderStella();
    const order = edgeOrder(container.querySelector("#theory-stella-view")!);
    // Rear M–W must pass behind the top face's G–Y edge, and B–M
    // behind K–G. These crossings disambiguate the above/below readings.
    expect(order.indexOf("3-7")).toBeLessThan(order.indexOf("4-6"));
    expect(order.indexOf("1-3")).toBeLessThan(order.indexOf("0-4"));
  });

  it("distinguishes projected overlaps from true intersections in the cube", () => {
    expect(PAIRS).toHaveLength(28);
    expect(CROSSINGS.strict).toHaveLength(42);
    expect(CROSSINGS.equalDepth).toHaveLength(12);
    // Six face centers and the six pairs of body diagonals have no front/back
    // distinction. Their shared locations do not introduce additional nodes.
    expect(
      CROSSINGS.equalDepth.filter(({ first, second }) =>
        [first, second].every((id) => {
          const [a, b] = id.split("-").map(Number);
          return distanceOf(a, b) === 3;
        }),
      ),
    ).toHaveLength(6);
  });

  it.each(DISTANCE_SUBSETS.map((distances) => ({ distances })))(
    "keeps physically consistent crossings and the same straight geometry for distances $distances",
    ({ distances }) => {
      const { container } = renderStella();
      const diagram = container.querySelector("#theory-stella-view")!;
      const allEdgesOrder = edgeOrder(diagram);
      setDistances(distances);
      const visiblePairs = PAIRS.filter(({ a, b }) => distances.includes(distanceOf(a, b)));
      const expectedIds = new Set(visiblePairs.map(({ id }) => id));
      const lines = [...diagram.querySelectorAll("[data-k8-edge]")];
      expect(lines).toHaveLength(visiblePairs.length);
      expect(new Set(edgeOrder(diagram))).toEqual(expectedIds);
      expect(edgeOrder(diagram)).toEqual(allEdgesOrder.filter((id) => expectedIds.has(id)));
      expect(diagram.querySelectorAll("path, polygon")).toHaveLength(0);
      for (const line of lines) {
        expect(line.tagName.toLowerCase()).toBe("line");
        const [a, b] = line.getAttribute("data-k8-edge")!.split("-").map(Number);
        expect(line.getAttribute("data-k8-distance")).toBe(String(distanceOf(a, b)));
        expect(line.getAttribute("data-k8-mask")).toBe(String(a ^ b));
        for (const [attribute, coordinate] of Object.entries({
          x1: K8_EXPLORER_POINTS[a].x,
          y1: K8_EXPLORER_POINTS[a].y,
          x2: K8_EXPLORER_POINTS[b].x,
          y2: K8_EXPLORER_POINTS[b].y,
        })) {
          expect(Number(line.getAttribute(attribute))).toBe(coordinate);
        }
      }
      const vertices = [...diagram.querySelectorAll("[data-stella-vertex]")];
      expect(vertices).toHaveLength(8);
      for (const vertex of vertices) {
        const level = Number(vertex.getAttribute("data-stella-vertex"));
        const circle = vertex.querySelector("circle")!;
        expect(Number(circle.getAttribute("cx"))).toBe(K8_EXPLORER_POINTS[level].x);
        expect(Number(circle.getAttribute("cy"))).toBe(K8_EXPLORER_POINTS[level].y);
      }
      expectCorrectCrossings(diagram);
    },
  );

  it.each(DISTANCE_SUBSETS.filter((distances) => distances.length).map((distances) => ({ distances })))(
    "preserves crossing order through selection, hover, focus, and mask emphasis for distances $distances",
    ({ distances }) => {
      const { container } = renderStella();
      const diagram = container.querySelector("#theory-stella-view")!;
      setDistances(distances);
      const order = edgeOrder(diagram);
      const expectStable = () => {
        expect(edgeOrder(diagram)).toEqual(order);
        expectCorrectCrossings(diagram);
      };
      const vertex = (level: number) => diagram.querySelector(`[data-stella-vertex="${level}"]`)!;
      const masks = Array.from({ length: 7 }, (_, index) => index + 1).filter((mask) => distances.includes(distanceOf(0, mask)));
      fireEvent.click(vertex(0));
      expectStable();
      for (const mask of masks) {
        const target = vertex(mask);
        const edge = () => diagram.querySelector(`[data-k8-edge="0-${mask}"]`)!;
        fireEvent.pointerEnter(target);
        expect(edge().getAttribute("data-k8-edge-preview")).toBe("true");
        expectStable();
        fireEvent.pointerLeave(target);
        fireEvent.focus(target);
        expect(edge().getAttribute("data-k8-edge-preview")).toBe("true");
        expectStable();
        fireEvent.blur(target);
        fireEvent.click(target);
        expect(target.getAttribute("data-stella-comparison-role")).toBe("b");
        expect(edge().getAttribute("data-k8-edge-active")).toBe("true");
        expectStable();
      }
      for (const mask of masks) {
        const control = container.querySelector(`[data-toggle-mask="${mask}"]`)!;
        fireEvent.pointerEnter(control);
        expectStable();
        fireEvent.pointerLeave(control);
        fireEvent.focus(control);
        expectStable();
        fireEvent.blur(control);
        fireEvent.click(control);
        expect(control.getAttribute("aria-pressed")).toBe("true");
        expect(diagram.querySelectorAll('[data-k8-edge-active="true"]')).toHaveLength(4);
        expectStable();
      }
    },
  );
});
