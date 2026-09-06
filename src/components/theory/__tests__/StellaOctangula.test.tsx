// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../../../i18n";
import { K8_EXPLORER_POINTS } from "../../../data/theory-data";
import { StellaOctangula } from "../StellaOctangula";

function renderStella() {
  localStorage.setItem("chromalum_lang", "en");
  const onHover = vi.fn();
  const rendered = render(
    <LanguageProvider>
      <StellaOctangula hlLevel={null} onHover={onHover} />
    </LanguageProvider>,
  );
  return { ...rendered, onHover };
}

function renderControlledStella() {
  localStorage.setItem("chromalum_lang", "en");
  const onHover = vi.fn();

  function ControlledStella() {
    const [hlLevel, setHlLevel] = useState<number | null>(null);
    return (
      <StellaOctangula
        hlLevel={hlLevel}
        onHover={(level) => {
          onHover(level);
          setHlLevel(level);
        }}
      />
    );
  }

  const rendered = render(
    <LanguageProvider>
      <ControlledStella />
    </LanguageProvider>,
  );
  return { ...rendered, onHover };
}

function visibleLevels(container: HTMLElement): number[] {
  return [...container.querySelectorAll<SVGGElement>("[data-stella-vertex]")].map((vertex) =>
    Number(vertex.getAttribute("data-stella-vertex")),
  );
}

describe("StellaOctangula", () => {
  it("switches between the three disjoint distance layers and all 28 pairs", () => {
    const { container } = renderStella();
    const diagram = screen.getByRole("group", { name: "Distance 2 and the Two Color Tetrahedra" });
    const partition = new Set<string>();
    const vertexPositions = () =>
      [...diagram.querySelectorAll("[data-stella-vertex] > circle:first-of-type")].map((circle) => [
        circle.getAttribute("cx"),
        circle.getAttribute("cy"),
      ]);
    const originalPositions = vertexPositions();
    expect(originalPositions).toEqual(Object.values(K8_EXPLORER_POINTS).map(({ x, y }) => [String(x), String(y)]));
    fireEvent.click(screen.getByRole("button", { name: "Nodes only" }));
    expect(diagram.getAttribute("data-stella-mode")).toBe("nodes");
    expect(visibleLevels(container)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(vertexPositions()).toEqual(originalPositions);
    expect(diagram.querySelectorAll("line, polygon, path")).toHaveLength(0);

    for (const [distance, count] of [
      [1, 12],
      [2, 12],
      [3, 4],
    ]) {
      const button = screen.getByRole("button", { name: new RegExp(`Distance ${distance}`) });
      fireEvent.click(button);
      expect(button.getAttribute("aria-pressed")).toBe("true");
      expect(diagram.getAttribute("data-stella-distance")).toBe(String(distance));
      expect(visibleLevels(container)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      expect(vertexPositions()).toEqual(originalPositions);

      const edges = [...container.querySelectorAll("[data-k8-edge], [data-stella-edge]")];
      expect(edges).toHaveLength(count);
      for (const edge of edges) {
        const pair = edge.getAttribute("data-k8-edge") ?? edge.getAttribute("data-stella-edge")!;
        const [a, b] = pair.split("-").map(Number);
        expect((a ^ b).toString(2).replace(/0/g, "")).toHaveLength(distance);
        expect(partition.has(pair)).toBe(false);
        partition.add(pair);
      }
      expect(container.querySelectorAll("[data-stella-face], polygon")).toHaveLength(0);
    }

    fireEvent.click(screen.getByRole("button", { name: /All.*28 edges/ }));
    expect(diagram.getAttribute("data-stella-distance")).toBe("all");
    expect(vertexPositions()).toEqual(originalPositions);
    const allPairs = [...container.querySelectorAll("[data-k8-edge]")].map((edge) => edge.getAttribute("data-k8-edge"));
    expect(allPairs).toHaveLength(28);
    expect(new Set(allPairs)).toEqual(partition);
    fireEvent.click(screen.getByRole("button", { name: "Nodes only" }));
    expect(diagram.querySelectorAll("line, polygon, path")).toHaveLength(0);
    expect(vertexPositions()).toEqual(originalPositions);
  });

  it("clears comparisons and pinned highlights when the distance mode changes", async () => {
    const { container, onHover } = renderControlledStella();
    fireEvent.click(screen.getByRole("button", { name: /All.*28 edges/ }));
    fireEvent.click(screen.getByRole("button", { name: "K · 0 · 000" }));
    fireEvent.click(screen.getByRole("button", { name: "W · 7 · 111" }));
    expect(container.querySelectorAll("[data-stella-comparison-role]")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: /Distance 1/ }));
    expect(container.querySelector("[data-stella-comparison-role]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "K · 0 · 000" }));
    await waitFor(() => expect(onHover).toHaveBeenLastCalledWith(0));
    expect(container.querySelectorAll('[data-k8-edge-active="true"]')).toHaveLength(3);
    expect(container.querySelector('[data-stella-vertex="7"]')?.getAttribute("data-stella-dimmed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: /Distance 2/ }));
    fireEvent.click(screen.getByRole("button", { name: "K · 0 · 000" }));
    await waitFor(() => expect(onHover).toHaveBeenLastCalledWith(0));
    expect(container.querySelectorAll('[data-k8-edge-active="true"]')).toHaveLength(3);
    expect(container.querySelector('[data-stella-vertex="7"]')?.getAttribute("data-stella-dimmed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: /Distance 3/ }));
    await waitFor(() => expect(onHover).toHaveBeenLastCalledWith(null));
    expect(container.querySelectorAll('[data-k8-edge-active="true"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-stella-dimmed="true"]')).toHaveLength(0);
    fireEvent.keyDown(screen.getByRole("button", { name: "K · 0 · 000" }), { key: "Enter" });
    await waitFor(() => expect(onHover).toHaveBeenLastCalledWith(0));
    expect(container.querySelectorAll('[data-k8-edge-active="true"]')).toHaveLength(1);
    expect(container.querySelector('[data-stella-vertex="7"]')?.getAttribute("data-stella-dimmed")).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: "Nodes only" }));
    expect(container.querySelectorAll('[data-stella-dimmed="true"]')).toHaveLength(0);
    fireEvent.keyDown(screen.getByRole("button", { name: "K · 0 · 000" }), { key: "Enter" });
    await waitFor(() => expect(onHover).toHaveBeenLastCalledWith(0));
    expect(container.querySelectorAll('[data-stella-dimmed="false"]')).toHaveLength(1);
    expect(container.querySelectorAll("line, polygon, path")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: /All.*28 edges/ }));
    expect(screen.getByTestId("stella-comparison-status").textContent).toBe("Select an anchor vertex in K₈");
  });

  it("combines the two tetrahedra as colored edges in the default distance-2 mode", () => {
    const { container } = renderStella();
    const diagram = screen.getByRole("group", { name: "Distance 2 and the Two Color Tetrahedra" });
    const controls = screen.getByRole("group", { name: "Select the graph display" });
    expect([...controls.querySelectorAll("button")].map((button) => button.textContent)).toEqual([
      "Nodes only",
      "Distance 1 · 12 edges",
      "Distance 2 · 12 edges",
      "Distance 3 · 4 edges",
      "All · 28 edges",
    ]);
    expect(diagram.getAttribute("data-stella-mode")).toBe("stella");
    expect(screen.getByRole("button", { name: "Distance 2 · 12 edges" }).getAttribute("aria-pressed")).toBe("true");
    expect(visibleLevels(container)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(diagram.querySelectorAll("polygon, path")).toHaveLength(0);
    expect(diagram.querySelectorAll('[data-k8-distance="2"][stroke="#ffd36e"]')).toHaveLength(6);
    expect(diagram.querySelectorAll('[data-k8-distance="2"][stroke="#90c8ff"]')).toHaveLength(6);
  });

  it.each([
    { a: "K · 0 · 000", b: "B · 1 · 001", edge: "0-1", maskBits: "001", distance: "1", label: "distance 1" },
    { a: "B · 1 · 001", b: "R · 2 · 010", edge: "1-2", maskBits: "011", distance: "2", label: "distance 2" },
    { a: "R · 2 · 010", b: "C · 5 · 101", edge: "2-5", maskBits: "111", distance: "3", label: "distance 3" },
  ])("compares a directly selected K8 pair at $label", ({ a, b, edge, maskBits, distance, label }) => {
    const { container } = renderStella();
    fireEvent.click(screen.getByRole("button", { name: /All.*28 edges/ }));

    fireEvent.click(screen.getByRole("button", { name: a }));
    fireEvent.click(screen.getByRole("button", { name: b }));

    const status = screen.getByTestId("stella-comparison-status");
    expect(status.textContent).toContain(`wt(${maskBits})`);
    expect(status.textContent).toContain(`= ${distance}`);
    expect(status.textContent).toContain(label);
    expect(container.querySelector(`[data-k8-edge="${edge}"]`)?.getAttribute("data-k8-edge-active")).toBe("true");
    expect(container.querySelectorAll('[data-k8-edge-active="true"]')).toHaveLength(1);
  });

  it("keeps the K8 anchor while replacing the target and clears the comparison on Escape", () => {
    const { container } = renderStella();
    fireEvent.click(screen.getByRole("button", { name: /All.*28 edges/ }));
    fireEvent.click(screen.getByRole("button", { name: "R · 2 · 010" }));
    fireEvent.click(screen.getByRole("button", { name: "C · 5 · 101" }));

    fireEvent.click(screen.getByRole("button", { name: "G · 4 · 100" }));
    expect(container.querySelector('[data-stella-comparison-role="a"]')?.getAttribute("data-stella-vertex")).toBe("2");
    expect(container.querySelector('[data-stella-comparison-role="b"]')?.getAttribute("data-stella-vertex")).toBe("4");
    expect(screen.getByTestId("stella-comparison-status").textContent).toContain("distance 2");

    fireEvent.keyDown(container.querySelector('[data-stella-vertex="4"]')!, { key: "Escape" });
    expect(container.querySelector("[data-stella-comparison-role]")).toBeNull();
    expect(screen.getByTestId("stella-comparison-status").textContent).toBe("Select an anchor vertex in K₈");
  });

  it("filters each distance layer by its three masks without changing the geometry", async () => {
    const { container, onHover } = renderControlledStella();
    const svg = container.querySelector("svg")!;
    const positions = () =>
      [...svg.querySelectorAll("[data-stella-vertex] > circle:first-of-type")].map((node) => [
        node.getAttribute("cx"),
        node.getAttribute("cy"),
      ]);
    const originalPositions = positions();
    const allPairs = new Set<string>();
    const distanceTotals = [0, 0, 0, 0];

    for (const [distance, masks] of [
      [1, [4, 2, 1]],
      [2, [3, 5, 6]],
    ] as const) {
      const mode = screen.getByRole("button", { name: new RegExp("Distance " + distance) });
      fireEvent.click(mode);
      expect(
        [...container.querySelectorAll("[data-k8-mask-control]")].map((node) => Number(node.getAttribute("data-k8-mask-control"))),
      ).toEqual(masks);
      for (const mask of masks) {
        const control = container.querySelector('[data-k8-mask-control="' + mask + '"]')!;
        fireEvent.click(control);
        expect(control.getAttribute("aria-pressed")).toBe("true");
        expect(mode.getAttribute("aria-pressed")).toBe("true");
        expect(svg.getAttribute("data-stella-distance")).toBe(String(distance));
        expect(svg.getAttribute("data-stella-mask")).toBe(String(mask));
        expect(svg.querySelectorAll("[data-k8-edge]")).toHaveLength(12);
        const selected = [...svg.querySelectorAll('[data-k8-edge-active="true"]')];
        expect(selected).toHaveLength(4);
        const vertices = new Set<number>();
        for (const edge of selected) {
          const pair = edge.getAttribute("data-k8-edge")!;
          const [a, b] = pair.split("-").map(Number);
          expect(a ^ b).toBe(mask);
          expect(edge.tagName).toBe("line");
          expect(edge.hasAttribute("stroke-dasharray")).toBe(false);
          expect(allPairs.has(pair)).toBe(false);
          allPairs.add(pair);
          vertices.add(a);
          vertices.add(b);
          distanceTotals[distance]++;
        }
        expect(vertices.size).toBe(8);
        expect(container.querySelectorAll("[data-k8-mask-pair]")).toHaveLength(0);
        expect(positions()).toEqual(originalPositions);
        fireEvent.mouseEnter(svg.querySelector('[data-stella-vertex="2"]')!);
        expect(svg.querySelectorAll('[data-k8-edge-active="true"]')).toHaveLength(4);
        expect(svg.querySelectorAll('[data-stella-dimmed="true"]')).toHaveLength(0);
        fireEvent.mouseLeave(svg.querySelector('[data-stella-vertex="2"]')!);
        fireEvent.click(control);
        expect(control.getAttribute("aria-pressed")).toBe("false");
        expect(svg.hasAttribute("data-stella-mask")).toBe(false);
        expect(svg.querySelectorAll('[data-k8-edge-active="true"]')).toHaveLength(0);
      }
    }
    fireEvent.click(container.querySelector('[data-k8-mask-control="5"]')!);
    fireEvent.click(screen.getByRole("button", { name: /Distance 3/ }));
    expect(svg.hasAttribute("data-stella-mask")).toBe(false);
    for (const edge of svg.querySelectorAll("[data-k8-edge]")) {
      expect(edge.getAttribute("data-k8-mask")).toBe("7");
      allPairs.add(edge.getAttribute("data-k8-edge")!);
      distanceTotals[3]++;
    }
    expect(allPairs.size).toBe(28);
    expect(distanceTotals).toEqual([0, 12, 12, 4]);
    for (const label of [/Distance 3/, /Nodes only/, /All · 28/]) {
      fireEvent.click(screen.getByRole("button", { name: label }));
      expect(container.querySelectorAll("[data-k8-mask-control]")).toHaveLength(0);
    }
    fireEvent.click(screen.getByRole("button", { name: /Distance 2/ }));
    fireEvent.click(container.querySelector('[data-k8-mask-control="5"]')!);
    fireEvent.keyDown(svg, { key: "Escape" });
    await waitFor(() => expect(onHover).toHaveBeenLastCalledWith(null));
    expect(svg.hasAttribute("data-stella-mask")).toBe(false);
    expect(svg.querySelectorAll("[data-k8-edge]")).toHaveLength(12);
  });

  it("keeps the rank-gap examples static while allowing arbitrary pairs in the graph", () => {
    const { container } = renderStella();
    const comparison = screen.getByTestId("k8-distance-comparison");
    expect(comparison.querySelector("button, [tabindex]")).toBeNull();
    for (const [pair, distance] of [
      ["0-1", 1],
      ["1-2", 2],
      ["3-4", 3],
    ] as const) {
      const row = comparison.querySelector('[data-k8-comparison-pair="' + pair + '"]')!;
      expect(row.querySelector("[data-pair-distance]")?.textContent).toBe(String(distance));
      expect(row.querySelector("[data-pair-gap]")?.textContent).toBe("1");
      fireEvent.click(row);
      expect(container.querySelector("svg")?.getAttribute("data-stella-distance")).toBe("2");
    }
    fireEvent.click(screen.getByRole("button", { name: /All · 28/ }));
    fireEvent.click(container.querySelector('[data-stella-vertex="0"]')!);
    fireEvent.click(container.querySelector('[data-stella-vertex="4"]')!);
    expect(screen.getByTestId("stella-comparison-status").textContent).toContain("dH = wt(100) = 1");
    expect(screen.getByTestId("stella-comparison-status").textContent).toContain("|ΔL| = |4 − 0| = 4");
  });
});
