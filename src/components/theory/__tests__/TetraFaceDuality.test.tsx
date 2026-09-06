// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "../../../i18n";
import { K8_EXPLORER_POINTS } from "../../../data/theory-data";
import { TetraFaceDuality } from "../TetraFaceDuality";

function renderFaceDuality() {
  localStorage.setItem("chromalum_lang", "en");
  return render(
    <LanguageProvider>
      <TetraFaceDuality />
    </LanguageProvider>,
  );
}

describe("TetraFaceDuality", () => {
  it("starts with the R/G/W example and separates three inputs, XOR, and majority", () => {
    const { container } = renderFaceDuality();
    expect((screen.getByRole("combobox", { name: "Select a face" }) as HTMLSelectElement).value).toBe("1");
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("face R, G, W. XOR is 001; majority is 110");
    expect(container.querySelector('[data-face-bit-row="count"]')?.textContent).toBe("Number of ones221");
    expect(container.querySelector('[data-face-bit-row="xor"]')?.textContent).toBe("XOR → B001");
    expect(container.querySelector('[data-face-bit-row="majority"]')?.textContent).toBe("Majority → Y110");
    expect(screen.getByRole("table").querySelectorAll('th[scope="col"]')).toHaveLength(4);
    expect(screen.getByRole("table").closest('[aria-live="polite"]')).not.toBeNull();
  });

  it("updates all eight faces without moving the regular geometry or adding a color node for the centroid", () => {
    const { container } = renderFaceDuality();
    const select = screen.getByRole("combobox", { name: "Select a face" });
    const cases = [
      { omitted: 0, vertices: [3, 5, 6], majority: 7 },
      { omitted: 3, vertices: [0, 5, 6], majority: 4 },
      { omitted: 5, vertices: [0, 3, 6], majority: 2 },
      { omitted: 6, vertices: [0, 3, 5], majority: 1 },
      { omitted: 1, vertices: [2, 4, 7], majority: 6 },
      { omitted: 2, vertices: [1, 4, 7], majority: 5 },
      { omitted: 4, vertices: [1, 2, 7], majority: 3 },
      { omitted: 7, vertices: [1, 2, 4], majority: 0 },
    ];
    expect(select.querySelectorAll("option")).toHaveLength(cases.length);
    for (const example of cases) {
      fireEvent.change(select, { target: { value: example.omitted } });
      const inputs = [...container.querySelectorAll('[data-face-role="input"]')].map((node) =>
        Number(node.getAttribute("data-tetra-face-vertex")),
      );
      expect(inputs).toEqual(example.vertices);
      const edges = [...container.querySelectorAll('[data-face-boundary="true"]')].map((edge) =>
        edge.getAttribute("data-tetra-face-edge")!.split("-").map(Number),
      );
      expect(edges).toHaveLength(3);
      expect(edges.every(([a, b]) => example.vertices.includes(a) && example.vertices.includes(b))).toBe(true);
      expect(container.querySelector('[data-face-role="xor"]')?.getAttribute("data-tetra-face-vertex")).toBe(String(example.omitted));
      expect(container.querySelector('[data-face-role="majority"]')?.getAttribute("data-tetra-face-vertex")).toBe(String(example.majority));
      expect([...container.querySelectorAll('[data-face-bit-row="xor"] td')].map((cell) => cell.textContent).join("")).toBe(
        example.omitted.toString(2).padStart(3, "0"),
      );
      expect([...container.querySelectorAll('[data-face-bit-row="majority"] td')].map((cell) => cell.textContent).join("")).toBe(
        example.majority.toString(2).padStart(3, "0"),
      );

      const nodes = [...container.querySelectorAll("[data-tetra-face-vertex]")];
      expect(nodes).toHaveLength(8);
      for (const node of nodes) {
        const lv = Number(node.getAttribute("data-tetra-face-vertex"));
        const circle = node.querySelector('circle:not([fill="none"])')!;
        expect(Number(circle.getAttribute("cx"))).toBe(K8_EXPLORER_POINTS[lv].x);
        expect(Number(circle.getAttribute("cy"))).toBe(K8_EXPLORER_POINTS[lv].y);
        expect(Number(circle.getAttribute("r"))).toBe(6.3);
        expect(node.querySelector("text")?.textContent).toBe(lv.toString(2).padStart(3, "0"));
      }
      const ray = container.querySelector("[data-centroid-ray]")!;
      const centroidMark = container.querySelector('[data-tetra-marker="centroid"] line:last-of-type')!;
      expect(Number(centroidMark.getAttribute("x1")) - Number(ray.getAttribute("x1"))).toBeCloseTo(
        (Number(ray.getAttribute("x2")) - Number(ray.getAttribute("x1"))) / 3,
        10,
      );
      const centroidY = (Number(centroidMark.getAttribute("y1")) + Number(centroidMark.getAttribute("y2"))) / 2;
      expect(centroidY - Number(ray.getAttribute("y1"))).toBeCloseTo(
        (Number(ray.getAttribute("y2")) - Number(ray.getAttribute("y1"))) / 3,
        10,
      );
      expect(container.querySelectorAll("[data-tetra-marker]")).toHaveLength(2);
      expect(container.querySelector("[data-tetra-marker] circle, polygon, path")).toBeNull();
    }
  });
});
