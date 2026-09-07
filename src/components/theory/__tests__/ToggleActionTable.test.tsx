// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../../../i18n";
import { StellaOctangula } from "../StellaOctangula";

function renderTable() {
  localStorage.setItem("chromalum_lang", "en");
  const rendered = render(
    <LanguageProvider>
      <StellaOctangula hlLevel={null} onHover={vi.fn()} />
    </LanguageProvider>,
  );
  return rendered;
}

describe("ToggleActionTable", () => {
  it("starts with the complete table and no predetermined state or transition", () => {
    const { container } = renderTable();
    const readout = screen.getByTestId("toggle-action-readout");
    expect(readout.getAttribute("data-state")).toBe("");
    expect(readout.getAttribute("data-mask")).toBe("");
    expect(readout.getAttribute("data-result")).toBe("");
    expect(container.querySelectorAll('.theory-toggle-explorer [aria-pressed="true"]')).toHaveLength(0);
    expect(container.querySelectorAll("[data-k8-edge]")).toHaveLength(28);
    expect(container.querySelectorAll('.theory-cayley-table button[aria-disabled="true"]')).toHaveLength(0);
  });

  it("renders all 64 transitions with exact bit labels and distinct state and mask headers", () => {
    const { container } = renderTable();
    const cells = Array.from(container.querySelectorAll("button[data-row][data-mask][data-result]"));
    expect(cells).toHaveLength(64);
    for (const cell of cells) {
      const row = Number(cell.getAttribute("data-row"));
      const mask = Number(cell.getAttribute("data-mask"));
      expect(Number(cell.getAttribute("data-result"))).toBe(row ^ mask);
      expect(cell.textContent).toBe((row ^ mask).toString(2).padStart(3, "0"));
    }
    expect(container.querySelector('[data-column-mask="3"]')?.getAttribute("aria-label")).toContain("011 (τRτB)");
    expect(container.querySelector('[data-toggle-state="3"]')?.getAttribute("aria-label")).toContain("state M (011), rank 3");
  });

  it("selects each entire state row and restores it after a transient cell preview", () => {
    const { container } = renderTable();
    const readout = screen.getByTestId("toggle-action-readout");
    for (let row = 0; row < 8; row++) {
      fireEvent.click(container.querySelector(`[data-toggle-state="${row}"]`)!);
      expect(readout.getAttribute("data-state")).toBe(String(row));
      expect(readout.getAttribute("data-mask")).toBe("");
      expect(container.querySelectorAll('td button[data-axis="true"]')).toHaveLength(8);
      const preview = container.querySelector(`[data-row="${(row + 1) % 8}"][data-mask="3"]`)!;
      fireEvent.pointerEnter(preview);
      expect(readout.getAttribute("data-result")).toBe(String(((row + 1) % 8) ^ 3));
      fireEvent.pointerLeave(preview);
      expect(readout.getAttribute("data-state")).toBe(String(row));
      expect(readout.getAttribute("data-result")).toBe("");
    }
  });

  it("pins a transition through unrelated hovers and clears it by repeat click, background, or Escape", () => {
    const { container } = renderTable();
    const readout = screen.getByTestId("toggle-action-readout");
    const cell = container.querySelector('[data-row="6"][data-mask="2"]')!;
    const other = container.querySelector('[data-row="1"][data-mask="7"]')!;
    fireEvent.click(cell);
    expect(readout.getAttribute("data-result")).toBe("4");
    expect(readout.textContent).toContain("τR");
    expect(readout.textContent).toContain("1-bit toggle");
    fireEvent.pointerEnter(other);
    expect(readout.getAttribute("data-state")).toBe("6");
    expect(readout.getAttribute("data-mask")).toBe("2");
    fireEvent.pointerLeave(other);
    expect(readout.getAttribute("data-result")).toBe("4");
    fireEvent.click(cell);
    expect(readout.getAttribute("data-result")).toBe("");
    fireEvent.click(cell);
    fireEvent.click(screen.getByTestId("toggle-action-explorer"));
    expect(readout.getAttribute("data-result")).toBe("");
    fireEvent.click(cell);
    fireEvent.keyDown(cell, { key: "Escape" });
    expect(readout.getAttribute("data-result")).toBe("");
  });

  it("navigates cells with arrow keys and exposes only one cell in the tab order", () => {
    const { container } = renderTable();
    const first = container.querySelector('[data-row="0"][data-mask="0"]')!;
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(document.activeElement).toBe(container.querySelector('[data-row="0"][data-mask="1"]'));
    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
    expect(document.activeElement).toBe(container.querySelector('[data-row="1"][data-mask="1"]'));
    fireEvent.keyDown(document.activeElement!, { key: "End", ctrlKey: true });
    expect(document.activeElement).toBe(container.querySelector('[data-row="7"][data-mask="7"]'));
    expect(screen.getByTestId("toggle-action-readout").getAttribute("data-result")).toBe("0");
    expect(container.querySelectorAll('td button[tabindex="0"]')).toHaveLength(1);
  });

  it("links every graph edge to the two reciprocal cells in its mask column", () => {
    const { container } = renderTable();
    const graph = container.querySelector("#theory-stella-view")!;
    const vertex = (level: number) => graph.querySelector(`[data-stella-vertex="${level}"]`)!;
    const readout = screen.getByTestId("toggle-action-readout");
    for (let a = 0; a < 8; a++) {
      for (let b = a + 1; b < 8; b++) {
        fireEvent.click(graph);
        fireEvent.click(vertex(a));
        fireEvent.click(vertex(b));
        const cells = [...container.querySelectorAll('td button[data-active="true"]')];
        expect(cells).toHaveLength(2);
        expect(cells.map((cell) => Number(cell.getAttribute("data-row"))).sort((x, y) => x - y)).toEqual([a, b]);
        expect(cells.every((cell) => Number(cell.getAttribute("data-mask")) === (a ^ b))).toBe(true);
        expect(readout.getAttribute("data-state")).toBe(String(a));
        expect(readout.getAttribute("data-result")).toBe(String(b));
        expect(graph.querySelectorAll('[data-k8-edge-active="true"]')).toHaveLength(1);
      }
    }
  });

  it("links all 64 table cells to their graph endpoints, with no self-edges for identity", () => {
    const { container } = renderTable();
    const graph = container.querySelector("#theory-stella-view")!;
    for (let row = 0; row < 8; row++) {
      for (let mask = 0; mask < 8; mask++) {
        fireEvent.click(container.querySelector(`[data-row="${row}"][data-mask="${mask}"]`)!);
        const edges = [...graph.querySelectorAll('[data-k8-edge-active="true"]')];
        expect(edges).toHaveLength(mask === 0 ? 0 : 1);
        if (mask !== 0) {
          expect(edges[0].getAttribute("data-k8-mask")).toBe(String(mask));
          expect(
            edges[0]
              .getAttribute("data-k8-edge")!
              .split("-")
              .map(Number)
              .sort((a, b) => a - b),
          ).toEqual([row, row ^ mask].sort((a, b) => a - b));
        }
        expect(graph.querySelector('[data-stella-comparison-role="a"]')?.getAttribute("data-stella-vertex")).toBe(String(row));
        expect(screen.getByTestId("toggle-action-readout").getAttribute("data-result")).toBe(String(row ^ mask));
        expect(container.querySelectorAll('td button[data-active="true"]')).toHaveLength(mask === 0 ? 1 : 2);
      }
    }
  });

  it("selects the four-edge matching of each nonzero column, and the identity column without edges", () => {
    const { container } = renderTable();
    const readout = screen.getByTestId("toggle-action-readout");
    for (let mask = 0; mask < 8; mask++) {
      const column = container.querySelector(`[data-toggle-mask="${mask}"]`)!;
      fireEvent.click(column);
      const edges = [...container.querySelectorAll('[data-k8-edge-active="true"]')];
      expect(edges).toHaveLength(mask === 0 ? 0 : 4);
      expect(edges.every((edge) => edge.getAttribute("data-k8-mask") === String(mask))).toBe(true);
      expect(container.querySelectorAll('td button[data-active="true"]')).toHaveLength(8);
      expect(readout.getAttribute("data-state")).toBe("");
      expect(readout.getAttribute("data-mask")).toBe(String(mask));
      expect(readout.getAttribute("data-result")).toBe("");
      expect(readout.textContent).toContain(mask === 0 ? "no graph edges" : "4 edges");
      fireEvent.click(column);
      expect(readout.getAttribute("data-mask")).toBe("");
    }
  });

  it("applies distance filters to columns, preserves the fixed table, and skips disabled columns on the keyboard", () => {
    const { container } = renderTable();
    const cell = (row: number, mask: number) => container.querySelector(`[data-row="${row}"][data-mask="${mask}"]`)!;
    fireEvent.click(screen.getByRole("button", { name: "Distance 1 · 12 edges" }));
    fireEvent.click(screen.getByRole("button", { name: "Distance 3 · 4 edges" }));
    expect(container.querySelectorAll("td button")).toHaveLength(64);
    expect(container.querySelectorAll('td button[aria-disabled="true"]')).toHaveLength(32);
    fireEvent.keyDown(cell(0, 0), { key: "ArrowRight" });
    expect(document.activeElement).toBe(cell(0, 3));
    fireEvent.click(cell(2, 7));
    fireEvent.click(container.querySelector('[data-toggle-mask="7"]')!);
    expect(container.querySelector('[data-k8-distance="3"]')).toBeNull();
    expect(screen.getByTestId("toggle-action-readout").getAttribute("data-pinned")).toBe("false");

    fireEvent.click(cell(2, 5));
    fireEvent.click(screen.getByRole("button", { name: "Distance 1 · 12 edges" }));
    expect(screen.getByTestId("toggle-action-readout").getAttribute("data-mask")).toBe("5");
    fireEvent.click(screen.getByRole("button", { name: "Distance 2 · 12 edges" }));
    expect(screen.getByTestId("toggle-action-readout").getAttribute("data-state")).toBe("2");
    expect(screen.getByTestId("toggle-action-readout").getAttribute("data-mask")).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "Nodes only" }));
    expect(container.querySelectorAll('.theory-cayley-table button:not([aria-disabled="true"])')).toHaveLength(0);
    fireEvent.click(cell(1, 0));
    fireEvent.click(container.querySelector('[data-toggle-state="1"]')!);
    expect(screen.getByTestId("toggle-action-readout").getAttribute("data-state")).toBe("");
    expect(container.querySelector("[data-stella-comparison-role]")).toBeNull();
  });

  it("previews across both views while retaining the confirmed pair, then clears both on graph background", () => {
    const { container } = renderTable();
    const cell = (row: number, mask: number) => container.querySelector(`[data-row="${row}"][data-mask="${mask}"]`)!;
    const vertex = (level: number) => container.querySelector(`[data-stella-vertex="${level}"]`)!;
    const readout = screen.getByTestId("toggle-action-readout");
    fireEvent.click(vertex(0));
    fireEvent.click(vertex(3));
    const confirmed = readout.textContent;
    fireEvent.pointerEnter(cell(4, 2));
    expect(container.querySelector('[data-k8-edge="4-6"]')?.getAttribute("data-k8-edge-preview")).toBe("true");
    expect(cell(4, 2).getAttribute("data-preview")).toBe("true");
    expect(cell(6, 2).getAttribute("data-preview")).toBe("true");
    expect(vertex(4).getAttribute("data-stella-preview")).toBe("true");
    expect(vertex(6).getAttribute("data-stella-preview")).toBe("true");
    expect(readout.textContent).toBe(confirmed);
    fireEvent.pointerLeave(cell(4, 2));
    fireEvent.focus(vertex(7));
    expect(cell(0, 7).getAttribute("data-preview")).toBe("true");
    expect(cell(7, 7).getAttribute("data-preview")).toBe("true");
    expect(readout.textContent).toBe(confirmed);
    fireEvent.click(container.querySelector("#theory-stella-view")!);
    expect(readout.getAttribute("data-result")).toBe("");
    expect(container.querySelector("[data-stella-comparison-role]")).toBeNull();
    expect(container.querySelector('td [data-preview="true"]')).toBeNull();
  });
});
