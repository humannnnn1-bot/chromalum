// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../../../i18n";
import { FANO_LINES, FANO_LINE_CATEGORIES } from "../../../data/theory-data";
import { FanoPlane } from "../FanoPlane";

function renderCorrespondence() {
  localStorage.setItem("chromalum_lang", "en");
  return render(
    <LanguageProvider>
      <FanoPlane hlLevel={null} onHover={vi.fn()} />
    </LanguageProvider>,
  );
}

function activeColumns(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[data-h-column][data-active="true"]')).map((column) =>
    Number(column.getAttribute("data-h-column")),
  );
}

describe("Fano-Hamming correspondence", () => {
  it("starts with all seven points and lines, a complete matrix, and no chosen example", () => {
    const { container } = renderCorrespondence();
    expect(container.querySelectorAll("[data-fano-point]")).toHaveLength(7);
    expect(container.querySelectorAll("[data-fano-line]")).toHaveLength(7);
    expect(container.querySelectorAll("[data-fano-line-choice]")).toHaveLength(7);
    expect(Array.from(container.querySelectorAll("[data-h-column]")).map((column) => column.getAttribute("data-h-column-bits"))).toEqual([
      "001",
      "010",
      "011",
      "100",
      "101",
      "110",
      "111",
    ]);
    expect(activeColumns(container)).toEqual([]);
    expect(screen.getByTestId("fano-hamming-checks").getAttribute("data-word")).toBe("");
    expect(screen.getByTestId("fano-hamming-matrix").textContent).toContain("ker H = Hamming [7,4,3]");
  });

  it("links each point to one matrix column and the corresponding single-error syndrome", () => {
    const { container } = renderCorrespondence();
    const checks = screen.getByTestId("fano-hamming-checks");
    for (let point = 1; point <= 7; point++) {
      fireEvent.click(container.querySelector(`[data-fano-point="${point}"]`)!);
      expect(activeColumns(container)).toEqual([point]);
      expect(checks.getAttribute("data-syndrome")).toBe(point.toString(2).padStart(3, "0"));
      expect(checks.getAttribute("data-word")).toBe("0".repeat(point - 1) + "1" + "0".repeat(7 - point));
      expect(checks.getAttribute("data-weight")).toBe("1");
      fireEvent.click(container.querySelector(`[data-fano-point="${point}"]`)!);
      expect(activeColumns(container)).toEqual([]);
    }
  });

  it("completes every pair directly while marking only the two inputs as selected", () => {
    const { container } = renderCorrespondence();
    const checks = screen.getByTestId("fano-hamming-checks");
    const diagram = container.querySelector(".theory-fano-plot")!;
    for (let a = 1; a < 7; a++) {
      for (let b = a + 1; b <= 7; b++) {
        fireEvent.click(diagram);
        fireEvent.click(container.querySelector(`[data-fano-point="${a}"]`)!);
        fireEvent.click(container.querySelector(`[data-h-column="${b}"]`)!);
        expect(activeColumns(container)).toEqual([a, b, a ^ b].sort((x, y) => x - y));
        expect(checks.getAttribute("data-syndrome")).toBe("000");
        expect(checks.getAttribute("data-weight")).toBe("3");
        expect(container.querySelector(`[data-fano-point="${a ^ b}"]`)?.getAttribute("data-fano-selection-role")).toBe("c");
        expect(
          [...container.querySelectorAll('[data-h-column][aria-pressed="true"]')].map((column) =>
            Number(column.getAttribute("data-h-column")),
          ),
        ).toEqual([a, b]);
      }
    }
  });

  it("maps all seven lines, including the circle, to distinct weight-three codewords", () => {
    const { container } = renderCorrespondence();
    const checks = screen.getByTestId("fano-hamming-checks");
    const words = new Set<string>();
    for (const line of FANO_LINES) {
      fireEvent.click(container.querySelector(`[data-fano-line-choice="${line.join("-")}"]`)!);
      expect(activeColumns(container)).toEqual([...line]);
      expect(container.querySelectorAll('[data-fano-line-active="true"]')).toHaveLength(1);
      expect(checks.getAttribute("data-syndrome")).toBe("000");
      expect(checks.getAttribute("data-weight")).toBe("3");
      const word = checks.getAttribute("data-word")!;
      expect(word.replace(/0/g, "")).toHaveLength(3);
      words.add(word);
    }
    expect(words.size).toBe(7);
    fireEvent.click(container.querySelector(".theory-fano-plot")!);
    expect(activeColumns(container)).toEqual([]);
    expect(checks.getAttribute("data-word")).toBe("");
  });

  it("previews a different line and returns to the pinned result when the pointer leaves", () => {
    const { container } = renderCorrespondence();
    const first = container.querySelector('[data-fano-line-choice="1-2-3"]')!;
    const second = container.querySelector('[data-fano-line-hit="3-5-6"]')!;
    fireEvent.click(first);
    fireEvent.pointerEnter(second);
    expect(activeColumns(container)).toEqual([3, 5, 6]);
    fireEvent.pointerLeave(second);
    expect(activeColumns(container)).toEqual([1, 2, 3]);
    fireEvent.keyDown(first, { key: "Escape" });
    expect(activeColumns(container)).toEqual([]);
  });

  it("accepts matrix columns as the inputs to the existing two-point construction", () => {
    const { container } = renderCorrespondence();
    fireEvent.click(container.querySelector('[data-h-column="3"]')!);
    fireEvent.click(container.querySelector('[data-h-column="5"]')!);
    expect(activeColumns(container)).toEqual([3, 5, 6]);
    expect(screen.getByTestId("fano-hamming-checks").getAttribute("data-syndrome")).toBe("000");
    expect(container.querySelector('[data-fano-point="6"]')?.getAttribute("data-fano-selection-role")).toBe("c");
    expect(container.querySelector('[data-h-column="6"]')?.getAttribute("aria-pressed")).toBe("false");

    fireEvent.pointerEnter(container.querySelector('[data-fano-line-hit="1-2-3"]')!);
    expect(activeColumns(container)).toEqual([3, 5, 6]);
    fireEvent.pointerEnter(container.querySelector('[data-h-column="4"]')!);
    expect(activeColumns(container)).toEqual([3, 5, 6]);
    expect(screen.getByTestId("fano-completion-status").textContent).toContain("M3 ⊕ C5 = Y6");

    fireEvent.click(container.querySelector('[data-fano-line-choice="1-2-3"]')!);
    expect(activeColumns(container)).toEqual([1, 2, 3]);
    expect(container.querySelectorAll("[data-fano-selection-role]")).toHaveLength(0);
  });

  it("keeps keyboard focus ahead of incidental pointer entry until the pointer moves", () => {
    const { container } = renderCorrespondence();
    const green = container.querySelector('[data-h-column="4"]')!;
    const white = container.querySelector('[data-h-column="7"]')!;
    fireEvent.focus(green);
    fireEvent.pointerEnter(white);
    expect(activeColumns(container)).toEqual([4]);
    fireEvent.pointerMove(white, { clientX: 30, clientY: 50 });
    expect(activeColumns(container)).toEqual([7]);
  });

  it("combines the three line types independently in all eight visibility states", () => {
    const { container } = renderCorrespondence();
    const categories = ["primary", "complement", "secondary"] as const;
    expect(container.querySelectorAll('[data-fano-filter][aria-pressed="true"]')).toHaveLength(3);
    fireEvent.click(container.querySelector('[data-fano-line-choice="1-6-7"]')!);
    for (let mask = 0; mask < 8; mask++) {
      const enabled = categories.filter((_, index) => mask & (1 << index));
      for (const category of categories) {
        const button = container.querySelector(`[data-fano-filter="${category}"]`)!;
        if ((button.getAttribute("aria-pressed") === "true") !== enabled.includes(category)) fireEvent.click(button);
        expect(button.getAttribute("aria-pressed")).toBe(String(enabled.includes(category)));
      }
      const expectedLines = FANO_LINES.filter((_, index) => enabled.includes(FANO_LINE_CATEGORIES[index])).map((line) => line.join("-"));
      expect([...container.querySelectorAll("[data-fano-line]")].map((line) => line.getAttribute("data-fano-line"))).toEqual(expectedLines);
      expect([...container.querySelectorAll("[data-fano-line-hit]")].map((line) => line.getAttribute("data-fano-line-hit"))).toEqual(
        expectedLines,
      );
      expect(activeColumns(container)).toEqual([]);
      expect(container.querySelectorAll("[data-fano-point]")).toHaveLength(7);
      expect(container.querySelectorAll("[data-fano-line-choice]")).toHaveLength(7);
    }
  });

  it("keeps hidden lines hidden when points and line buttons are previewed or selected", () => {
    const { container } = renderCorrespondence();
    for (const button of container.querySelectorAll("[data-fano-filter]")) fireEvent.click(button);
    const line = container.querySelector('[data-fano-line-choice="3-5-6"]')!;
    fireEvent.pointerEnter(line);
    expect(activeColumns(container)).toEqual([3, 5, 6]);
    expect(container.querySelectorAll("[data-fano-line]")).toHaveLength(0);
    fireEvent.click(line);
    fireEvent.pointerLeave(line);
    expect(container.querySelectorAll("[data-fano-line]")).toHaveLength(0);

    fireEvent.click(container.querySelector('[data-fano-point="1"]')!);
    fireEvent.click(container.querySelector('[data-fano-point="2"]')!);
    expect(activeColumns(container)).toEqual([1, 2, 3]);
    expect(container.querySelectorAll('[data-fano-filter][aria-pressed="true"]')).toHaveLength(0);
    expect(container.querySelectorAll("[data-fano-line]")).toHaveLength(0);
    expect(container.querySelectorAll("[data-fano-line-hit]")).toHaveLength(0);
  });
});
