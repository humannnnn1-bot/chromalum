// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "../../../i18n";
import { OCTA_EDGES } from "../../../data/theory-data";
import { ChromaticOctahedron } from "../ChromaticOctahedron";
import { PinResetContext } from "../pin-reset";

function renderOctahedron() {
  localStorage.setItem("chromalum_lang", "en");
  return render(
    <LanguageProvider>
      <ChromaticOctahedron />
    </LanguageProvider>,
  );
}

describe("ChromaticOctahedron", () => {
  it("shows one octahedron with color names and only edge controls", () => {
    const { container } = renderOctahedron();
    expect(container.querySelectorAll("svg")).toHaveLength(1);
    expect(container.querySelectorAll("[data-octa-vertex]")).toHaveLength(6);
    expect(container.querySelectorAll("[data-octa-surface-face]")).toHaveLength(8);
    expect(container.querySelectorAll("[data-octa-edge]")).toHaveLength(12);
    const labels = [...container.querySelectorAll("[data-octa-vertex] text")].map((el) => el.textContent);
    expect(labels.sort()).toEqual(["B", "C", "G", "M", "R", "Y"]);
    expect(container.querySelector("[data-die-vertex], [data-cube-edge], [data-die-face], path")).toBeNull();
    expect(container.textContent).not.toMatch(/die vertex|die face|mixing|join|meet/i);
    expect(screen.getAllByRole("button")).toHaveLength(24);
  });

  it("completes every edge with its XOR and complement triangles", () => {
    const { container } = renderOctahedron();
    expect(screen.getByTestId("octahedron-selection").textContent).toContain("010 ⊕ 100 = 110");
    const controls = within(screen.getByRole("group", { name: "Select an octahedral edge" })).getAllByRole("button");
    expect(controls).toHaveLength(12);
    for (const [index, [a, b]] of OCTA_EDGES.entries()) {
      fireEvent.mouseEnter(controls[index]);
      expect(container.querySelectorAll("[data-octa-surface-face][data-active='true']")).toHaveLength(2);
      expect(container.querySelectorAll("[data-edge-selected='true']")).toHaveLength(1);
      for (const [role, result, parity] of [
        ["xor", a ^ b, 0],
        ["complement", a ^ b ^ 7, 7],
      ] as const) {
        const triangle = container.querySelector("[data-edge-face-role='" + role + "']")!;
        const vertices = triangle.getAttribute("data-face-verts")!.split("-").map(Number);
        expect(new Set(vertices)).toEqual(new Set([a, b, result]));
        expect(vertices.reduce((x, y) => x ^ y)).toBe(parity);
        expect(container.querySelector("[data-edge-node-role='" + role + "']")?.getAttribute("data-octa-vertex")).toBe(String(result));
        expect(container.querySelector("[data-edge-result='" + role + "']")?.textContent).toContain(result.toString(2).padStart(3, "0"));
      }
      fireEvent.mouseLeave(controls[index]);
    }
  });

  it("selects SVG edges with the keyboard and keeps the results after repeated selection", () => {
    const { container } = renderOctahedron();
    const edge = container.querySelector("[data-octa-edge-control='1-2']")!;
    fireEvent.keyDown(edge, { key: "Enter" });
    expect(edge.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("octahedron-selection").textContent).toContain("001 ⊕ 010 = 011");
    const other = container.querySelector("[data-octa-edge-control='2-4']")!;
    fireEvent.mouseEnter(other);
    expect(screen.getByTestId("octahedron-selection").textContent).toContain("010 ⊕ 100 = 110");
    fireEvent.mouseLeave(other);
    expect(edge.getAttribute("aria-pressed")).toBe("true");
    fireEvent.keyDown(edge, { key: " " });
    expect(edge.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelectorAll("[data-edge-face-role], [data-edge-result]")).toHaveLength(4);
    expect(screen.getByTestId("octahedron-selection").textContent).toContain("001 ⊕ 010 = 011");
  });

  it("keeps the SVG and native pair controls in sync when selecting the same edge", () => {
    const { container } = renderOctahedron();
    const choices = screen.getByRole("group", { name: "Select an octahedral edge" });
    const pair = within(choices).getByRole("button", { name: "Octahedral edge M 011 — C 101" });
    fireEvent.click(pair);
    const edge = container.querySelector("[data-octa-edge-control='3-5']")!;
    expect(edge.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("octahedron-selection").textContent).toContain("011 ⊕ 101 = 110");
    fireEvent.click(edge);
    expect(pair.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelectorAll("[data-edge-face-role]")).toHaveLength(2);
    expect(screen.getByTestId("octahedron-selection").textContent).toContain("011 ⊕ 101 = 110");
  });

  it("keeps the chosen edge and its results when the page reset clears a preview", () => {
    localStorage.setItem("chromalum_lang", "en");
    function Controlled({ reset }: { reset: number }) {
      return (
        <LanguageProvider>
          <PinResetContext.Provider value={reset}>
            <ChromaticOctahedron />
          </PinResetContext.Provider>
        </LanguageProvider>
      );
    }
    const { container, rerender } = render(<Controlled reset={0} />);
    fireEvent.click(container.querySelector("[data-octa-edge-control='1-2']")!);
    fireEvent.mouseEnter(container.querySelector("[data-octa-edge-control='2-4']")!);
    rerender(<Controlled reset={1} />);
    expect(container.querySelectorAll("[data-edge-face-role], [data-edge-result]")).toHaveLength(4);
    expect(screen.getByTestId("octahedron-selection").textContent).toContain("001 ⊕ 010 = 011");
  });
});
