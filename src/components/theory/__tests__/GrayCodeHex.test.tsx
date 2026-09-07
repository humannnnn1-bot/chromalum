// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LanguageProvider } from "../../../i18n";
import { HueTraversal } from "../HueTraversal";

function renderTraversal() {
  localStorage.setItem("chromalum_lang", "en");
  return render(
    <LanguageProvider>
      <HueTraversal hlLevel={null} onHover={vi.fn()} />
    </LanguageProvider>,
  );
}

function selectedEdges(container: HTMLElement) {
  return ["data-cycle-edge", "data-hue-edge", "data-edge-row"].map((attribute) =>
    [...container.querySelectorAll("[" + attribute + '][data-hue-selected="true"]')].map((element) => element.getAttribute(attribute)),
  );
}

describe("Shared hue traversal", () => {
  it("selects the same edge in the six-cycle, zigzag, and table, with signed direction", () => {
    const { container } = renderTraversal();
    expect(selectedEdges(container)).toEqual([["0"], ["0"], ["0"]]);
    expect(screen.getByRole("status").textContent).toContain("R 010 → Y 110 · toggle G · ΔL=+4");
    const row = container.querySelector('[data-edge-row="3"]')!;
    fireEvent.click(within(row as HTMLElement).getByRole("button"));
    expect(selectedEdges(container)).toEqual([["3"], ["3"], ["3"]]);
    expect(screen.getByRole("status").textContent).toContain("C 101 → B 001 · toggle G · ΔL=−4");
    fireEvent.click(screen.getByRole("button", { name: "Counter-clockwise" }));
    expect(selectedEdges(container)).toEqual([["3"], ["3"], ["3"]]);
    expect(screen.getByRole("status").textContent).toContain("B 001 → C 101 · toggle G · ΔL=+4");
    expect(row.textContent).toContain("B₁→C₅");
    expect(row.textContent).toContain("B₁⊂C₅");
    expect(container.querySelector('[data-hue-edge="3"]')?.textContent).toContain("+4");
  });

  it("selects a cycle edge by keyboard without conflating tone selection with an edge", () => {
    const { container } = renderTraversal();
    const cycle = screen.getByRole("group", { name: "Chromatic One-Bit Six-Cycle" });
    const edge = within(cycle).getByRole("button", { name: "Select edge B–M" });
    fireEvent.keyDown(edge, { key: "Enter" });
    expect(selectedEdges(container)).toEqual([["4"], ["4"], ["4"]]);
    fireEvent.click(container.querySelector('[data-tone-level-control="2"]')!);
    expect(selectedEdges(container)).toEqual([["4"], ["4"], ["4"]]);
    expect(container.querySelector('[data-active-fiber="2"]')).not.toBeNull();
  });

  it("advances one edge per press and wraps a complete cycle in either direction", () => {
    const { container } = renderTraversal();
    const clockwise = screen.getByRole("button", { name: "Clockwise" });
    const counterclockwise = screen.getByRole("button", { name: "Counter-clockwise" });
    expect(container.querySelectorAll(".theory-hue-controls button")).toHaveLength(2);

    for (const [edge, transition] of [
      [1, "6-4"],
      [2, "4-5"],
      [3, "5-1"],
      [4, "1-3"],
      [5, "3-2"],
      [0, "2-6"],
    ] as const) {
      fireEvent.click(clockwise);
      expect(selectedEdges(container)).toEqual([[`${edge}`], [`${edge}`], [`${edge}`]]);
      expect(screen.getByRole("status").getAttribute("data-hue-transition")).toBe(transition);
    }
    for (const [edge, transition] of [
      [0, "6-2"],
      [5, "2-3"],
      [4, "3-1"],
      [3, "1-5"],
      [2, "5-4"],
      [1, "4-6"],
    ] as const) {
      fireEvent.click(counterclockwise);
      expect(selectedEdges(container)).toEqual([[`${edge}`], [`${edge}`], [`${edge}`]]);
      expect(screen.getByRole("status").getAttribute("data-hue-transition")).toBe(transition);
    }
    fireEvent.click(clockwise);
    expect(screen.getByRole("status").getAttribute("data-hue-transition")).toBe("6-4");
  });
});
