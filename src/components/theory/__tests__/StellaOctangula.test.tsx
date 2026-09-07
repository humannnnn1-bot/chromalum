// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../../../i18n";
import { K8_EXPLORER_POINTS } from "../../../data/theory-data";
import { StellaOctangula } from "../StellaOctangula";

function renderStella() {
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

function setDistances(distances: number[]) {
  for (const distance of [1, 2, 3]) {
    const button = screen.getByRole("button", { name: new RegExp(`^Distance ${distance}`) });
    if ((button.getAttribute("aria-pressed") === "true") !== distances.includes(distance)) fireEvent.click(button);
  }
}

describe("StellaOctangula", () => {
  it("combines and removes distance layers independently without moving vertices or duplicating pairs", () => {
    const { container } = renderStella();
    const diagram = container.querySelector("#theory-stella-view")!;
    const vertexPositions = () =>
      [...diagram.querySelectorAll("[data-stella-vertex] > circle:first-of-type")].map((circle) => [
        circle.getAttribute("cx"),
        circle.getAttribute("cy"),
      ]);
    const originalPositions = vertexPositions();
    expect(originalPositions).toEqual(Object.values(K8_EXPLORER_POINTS).map(({ x, y }) => [String(x), String(y)]));
    expect(screen.queryByRole("button", { name: /All.*28/ })).toBeNull();
    expect(container.querySelectorAll(".theory-k8-controls button")).toHaveLength(4);
    expect([...container.querySelectorAll(".theory-k8-color-key > span")].map((node) => node.textContent)).toEqual([
      "G",
      "R",
      "B",
      "Y",
      "C",
      "M",
      "W",
    ]);
    for (const { distances, count } of [
      { distances: [], count: 0 },
      { distances: [1], count: 12 },
      { distances: [1, 2], count: 24 },
      { distances: [2], count: 12 },
      { distances: [2, 3], count: 16 },
      { distances: [1, 2, 3], count: 28 },
      { distances: [1, 3], count: 16 },
      { distances: [3], count: 4 },
      { distances: [], count: 0 },
    ]) {
      setDistances(distances);
      expect(diagram.getAttribute("data-stella-distances")).toBe(distances.join(" ") || "none");
      expect(container.querySelector(".theory-k8-edge-count strong")?.textContent).toBe(String(count));
      expect(
        container
          .querySelector(".theory-k8-degree code")
          ?.textContent?.trim()
          .endsWith(String(count / 4)),
      ).toBe(true);
      expect(screen.getByRole("button", { name: "Nodes only" }).getAttribute("aria-pressed")).toBe(String(count === 0));
      expect(vertexPositions()).toEqual(originalPositions);
      expect(diagram.querySelectorAll("[data-stella-vertex]")).toHaveLength(8);
      expect(diagram.querySelectorAll("polygon, path")).toHaveLength(0);
      const edges = [...diagram.querySelectorAll("[data-k8-edge]")];
      expect(edges).toHaveLength(count);
      expect(new Set(edges.map((edge) => edge.getAttribute("data-k8-edge"))).size).toBe(count);
      for (const edge of edges) {
        const [a, b] = edge.getAttribute("data-k8-edge")!.split("-").map(Number);
        const distance = (a ^ b).toString(2).replace(/0/g, "").length;
        expect(distances).toContain(distance);
        expect(edge.getAttribute("data-k8-distance")).toBe(String(distance));
      }
      expect(container.querySelectorAll(".theory-k8-comparison-metrics > div")).toHaveLength(2);
    }
  });

  it.each([
    { distances: [1], candidates: [1, 2, 4] },
    { distances: [2], candidates: [3, 5, 6] },
    { distances: [3], candidates: [7] },
    { distances: [1, 2], candidates: [1, 2, 3, 4, 5, 6] },
    { distances: [1, 3], candidates: [1, 2, 4, 7] },
    { distances: [2, 3], candidates: [3, 5, 6, 7] },
    { distances: [1, 2, 3], candidates: [1, 2, 3, 4, 5, 6, 7] },
  ])("limits the second vertex to visible neighbours for distances $distances", ({ distances, candidates }) => {
    const { container, onHover } = renderStella();
    setDistances(distances);
    expect(container.querySelectorAll('[data-stella-vertex][aria-disabled="true"]')).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "K · 0 · 000" }));
    const vertices = [...container.querySelectorAll("[data-stella-vertex]")];
    const enabledTargets = vertices
      .filter((vertex) => vertex.getAttribute("aria-disabled") !== "true" && vertex.getAttribute("data-stella-vertex") !== "0")
      .map((vertex) => Number(vertex.getAttribute("data-stella-vertex")));
    expect(enabledTargets).toEqual(candidates);
    onHover.mockClear();
    for (const vertex of vertices.filter((node) => node.getAttribute("aria-disabled") === "true")) {
      expect(vertex.getAttribute("tabindex")).toBe("-1");
      expect(vertex.getAttribute("data-stella-dimmed")).toBe("true");
      fireEvent.pointerEnter(vertex);
      fireEvent.click(vertex);
      fireEvent.keyDown(vertex, { key: "Enter" });
      fireEvent.keyDown(vertex, { key: " " });
    }
    expect(onHover).not.toHaveBeenCalled();
    expect(container.querySelector('[data-stella-comparison-role="b"]')).toBeNull();
    const target = container.querySelector(`[data-stella-vertex="${candidates[0]}"]`)!;
    fireEvent.keyDown(target, { key: "Enter" });
    expect(target.getAttribute("data-stella-comparison-role")).toBe("b");
    expect(container.querySelectorAll('[data-k8-edge-active="true"]')).toHaveLength(1);
  });

  it("keeps valid pairs across toggles, drops an excluded target, and disables all selection in nodes-only view", () => {
    const { container, onHover } = renderStella();
    setDistances([1, 2]);
    fireEvent.click(screen.getByRole("button", { name: "K · 0 · 000" }));
    fireEvent.click(screen.getByRole("button", { name: "G · 4 · 100" }));
    const status = screen.getByTestId("stella-comparison-status");
    expect(status.querySelector("[data-pair-distance]")?.textContent).toBe("1");
    fireEvent.click(screen.getByRole("button", { name: /Distance 3/ }));
    fireEvent.click(screen.getByRole("button", { name: /Distance 2/ }));
    expect(container.querySelector('[data-stella-comparison-role="a"]')?.getAttribute("data-stella-vertex")).toBe("0");
    expect(container.querySelector('[data-stella-comparison-role="b"]')?.getAttribute("data-stella-vertex")).toBe("4");
    fireEvent.click(screen.getByRole("button", { name: /Distance 1/ }));
    expect(container.querySelector('[data-stella-comparison-role="b"]')).toBeNull();
    expect(container.querySelector('[data-stella-comparison-role="a"]')?.getAttribute("data-stella-vertex")).toBe("0");
    expect(status.textContent).toContain("Start: K");
    fireEvent.click(screen.getByRole("button", { name: "W · 7 · 111" }));
    expect(status.querySelector("[data-pair-distance]")?.textContent).toBe("3");
    fireEvent.click(screen.getByRole("button", { name: "Nodes only" }));
    expect(container.querySelectorAll("[data-stella-comparison-role], [data-k8-edge]")).toHaveLength(0);
    expect(status.textContent).toContain("Turn on a distance");
    expect([...status.querySelectorAll("dd strong")].map((node) => node.textContent)).toEqual(["—", "—"]);
    onHover.mockClear();
    for (const vertex of container.querySelectorAll("[data-stella-vertex]")) {
      expect(vertex.getAttribute("aria-disabled")).toBe("true");
      expect(vertex.getAttribute("tabindex")).toBe("-1");
      fireEvent.pointerEnter(vertex);
      fireEvent.click(vertex);
      fireEvent.keyDown(vertex, { key: "Enter" });
      fireEvent.keyDown(vertex, { key: " " });
    }
    expect(onHover).not.toHaveBeenCalled();
    expect(container.querySelector("[data-stella-comparison-role]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Distance 3/ }));
    expect(container.querySelectorAll('[data-stella-vertex][aria-disabled="true"]')).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "K · 0 · 000" }));
    fireEvent.click(screen.getByRole("button", { name: "W · 7 · 111" }));
    expect(status.querySelector("[data-pair-distance]")?.textContent).toBe("3");
    fireEvent.click(screen.getByRole("button", { name: /Distance 3/ }));
    expect(container.querySelectorAll("[data-stella-comparison-role]")).toHaveLength(0);
    expect(container.querySelectorAll('[data-stella-vertex][aria-disabled="true"]')).toHaveLength(8);
  });

  it("colors edges by their XOR masks and distinguishes the tetrahedra with line styles", () => {
    const { container } = renderStella();
    const diagram = container.querySelector("#theory-stella-view")!;
    const controls = screen.getByRole("group", { name: "Select visible distances (multiple allowed)" });
    expect([...controls.querySelectorAll("button")].map((button) => button.getAttribute("aria-label"))).toEqual([
      "Nodes only",
      "Distance 1 · 12 edges",
      "Distance 2 · 12 edges",
      "Distance 3 · 4 edges",
    ]);
    expect([...controls.querySelectorAll("button")].map((button) => button.getAttribute("aria-pressed"))).toEqual([
      "false",
      "true",
      "true",
      "true",
    ]);
    expect(diagram.querySelectorAll("[data-k8-edge]")).toHaveLength(28);
    for (const color of ["#ff00ff", "#00ffff", "#ffff00"])
      expect(diagram.querySelectorAll(`[data-k8-distance="2"][stroke="${color}"]`)).toHaveLength(4);
    expect(diagram.querySelectorAll('[data-k8-tetra="T0"]:not([stroke-dasharray])')).toHaveLength(6);
    expect(diagram.querySelectorAll('[data-k8-tetra="T1"][stroke-dasharray="5,3"]')).toHaveLength(6);
    expect(diagram.querySelectorAll('[data-k8-distance="3"][stroke="#ffffff"][opacity="1"]')).toHaveLength(4);
  });

  it.each([
    { a: "K · 0 · 000", b: "B · 1 · 001", edge: "0-1", maskBits: "001", distance: 1 },
    { a: "B · 1 · 001", b: "R · 2 · 010", edge: "1-2", maskBits: "011", distance: 2 },
    { a: "R · 2 · 010", b: "C · 5 · 101", edge: "2-5", maskBits: "111", distance: 3 },
  ])("compares a pair with only distance $distance enabled", ({ a, b, edge, maskBits, distance }) => {
    const { container } = renderStella();
    setDistances([distance]);
    fireEvent.click(screen.getByRole("button", { name: a }));
    fireEvent.click(screen.getByRole("button", { name: b }));
    const status = screen.getByTestId("stella-comparison-status");
    expect(status.textContent).toContain(`wt(${maskBits}) = ${distance}`);
    expect(status.querySelector("[data-pair-distance]")?.textContent).toBe(String(distance));
    expect(container.querySelector(`[data-k8-edge="${edge}"]`)?.getAttribute("data-k8-edge-active")).toBe("true");
    expect(container.querySelectorAll('[data-k8-edge-active="true"]')).toHaveLength(1);
  });

  it("keeps the anchor while replacing the target and clears the comparison on Escape", () => {
    const { container } = renderStella();
    setDistances([1, 2, 3]);
    fireEvent.click(screen.getByRole("button", { name: "R · 2 · 010" }));
    fireEvent.click(screen.getByRole("button", { name: "C · 5 · 101" }));
    fireEvent.click(screen.getByRole("button", { name: "G · 4 · 100" }));
    expect(container.querySelector('[data-stella-comparison-role="a"]')?.getAttribute("data-stella-vertex")).toBe("2");
    expect(container.querySelector('[data-stella-comparison-role="b"]')?.getAttribute("data-stella-vertex")).toBe("4");
    expect(screen.getByTestId("stella-comparison-status").querySelector("[data-pair-distance]")?.textContent).toBe("2");
    fireEvent.keyDown(container.querySelector('[data-stella-vertex="4"]')!, { key: "Escape" });
    expect(container.querySelector("[data-stella-comparison-role]")).toBeNull();
    expect(screen.getByTestId("stella-comparison-status").textContent).toContain("Choose two vertices");
  });

  it("previews candidate edges on hover and focus without changing the confirmed comparison", () => {
    const { container } = renderStella();
    setDistances([1, 2, 3]);
    const vertex = (level: number) => container.querySelector(`[data-stella-vertex="${level}"]`)!;
    const edge = (pair: string) => container.querySelector(`[data-k8-edge="${pair}"]`)!;
    const status = screen.getByTestId("stella-comparison-status");

    fireEvent.click(vertex(0));
    fireEvent.pointerEnter(vertex(2));
    expect(edge("0-2").getAttribute("data-k8-edge-preview")).toBe("true");
    expect(container.querySelectorAll('[data-k8-edge-active="true"]')).toHaveLength(1);
    expect(container.querySelector('[data-stella-comparison-role="b"]')).toBeNull();
    expect([...status.querySelectorAll("dd strong")].map((node) => node.textContent)).toEqual(["—", "—"]);

    fireEvent.click(vertex(2));
    fireEvent.pointerLeave(vertex(2));
    fireEvent.pointerEnter(vertex(4));
    expect(edge("0-4").getAttribute("data-k8-edge-preview")).toBe("true");
    expect(edge("0-2").getAttribute("data-k8-edge-active")).toBe("true");
    expect(vertex(2).getAttribute("data-stella-comparison-role")).toBe("b");
    expect(status.querySelector("[data-pair-distance]")?.textContent).toBe("1");
    expect(status.querySelector("[data-pair-gap]")?.textContent).toBe("2");

    fireEvent.pointerLeave(vertex(4));
    expect(container.querySelector('[data-k8-edge-preview="true"]')).toBeNull();
    fireEvent.focus(vertex(3));
    expect(edge("0-3").getAttribute("data-k8-edge-preview")).toBe("true");
    expect(status.querySelector("[data-pair-distance]")?.textContent).toBe("1");
    fireEvent.keyDown(vertex(3), { key: "Enter" });
    expect(vertex(3).getAttribute("data-stella-comparison-role")).toBe("b");
    expect(status.querySelector("[data-pair-distance]")?.textContent).toBe("2");
    expect(status.querySelector("[data-pair-gap]")?.textContent).toBe("3");
    expect(container.querySelector('[data-k8-edge-preview="true"]')).toBeNull();
  });

  it("keeps comparison fields, XOR and parity visible before and after selecting a pair", () => {
    const { container } = renderStella();
    expect(screen.queryByTestId("k8-distance-comparison")).toBeNull();
    expect(container.textContent).not.toContain("K↔B has 1, B↔R has 2, and M↔G has 3");
    const status = screen.getByTestId("stella-comparison-status");
    expect([...status.querySelectorAll("dd strong")].map((node) => node.textContent)).toEqual(["—", "—"]);
    const calculations = screen.getByRole("group", { name: "Calculation and parity" });
    expect(container.querySelector(".theory-k8-comparison details, .theory-k8-comparison summary")).toBeNull();
    expect([...calculations.querySelectorAll("dd code")].map((node) => node.textContent)).toEqual(["—", "—", "—"]);
    setDistances([1]);
    fireEvent.click(container.querySelector('[data-stella-vertex="0"]')!);
    fireEvent.click(container.querySelector('[data-stella-vertex="4"]')!);
    expect(status.querySelector("[data-pair-distance]")?.textContent).toBe("1");
    expect(status.querySelector("[data-pair-gap]")?.textContent).toBe("4");
    expect(status.textContent).toContain("wt(100) = 1");
    expect(status.textContent).toContain("|4 − 0| = 4");
    expect(calculations.textContent).toContain("000 ⊕ 100 = 100");
    expect(calculations.textContent).toContain("π(K)=0 · T0");
    expect(calculations.textContent).toContain("π(G)=1 · T1");
  });
});
