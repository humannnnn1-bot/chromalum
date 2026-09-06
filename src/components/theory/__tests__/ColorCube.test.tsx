// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LanguageProvider } from "../../../i18n";
import { ColorCube } from "../ColorCube";

function renderWithLanguage(hlLevel: number | null = null) {
  localStorage.setItem("chromalum_lang", "en");
  return render(
    <LanguageProvider>
      <ColorCube hlLevel={hlLevel} onHover={vi.fn()} />
    </LanguageProvider>,
  );
}

describe("ColorCube", () => {
  it("shows the whole cube by default and toggles the three incident edges across projections", () => {
    const { container } = renderWithLanguage();
    const cube = screen.getByRole("group", { name: "Color Cube" });
    expect(container.querySelectorAll('[data-cube-active="true"]')).toHaveLength(0);
    fireEvent.keyDown(cube.querySelector('[data-level="1"]')!, { key: "Enter" });
    expect([...container.querySelectorAll('[data-cube-active="true"]')].map((edge) => edge.getAttribute("data-cube-edge")).sort()).toEqual([
      "0-1",
      "1-3",
      "1-5",
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Hasse" }));
    expect(cube.querySelector('[data-level="1"]')?.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelectorAll('[data-cube-active="true"]')).toHaveLength(3);
    fireEvent.keyDown(cube.querySelector('[data-level="1"]')!, { key: " " });
    expect(container.querySelectorAll('[data-cube-active="true"]')).toHaveLength(0);
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("button", { name: /Toggle primary/ })).toBeNull();
  });
  it("does not render RGB axis letter labels", () => {
    const { container } = renderWithLanguage();

    const svg = screen.getByRole("group", { name: "Color Cube" });
    expect([...svg.querySelectorAll("text")].some((el) => ["R", "G", "B"].includes(el.textContent ?? ""))).toBe(false);

    fireEvent.mouseEnter(svg.querySelector('[data-level="0"]')!);

    expect([...svg.querySelectorAll("text")].some((el) => ["R", "G", "B"].includes(el.textContent ?? ""))).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Hasse" }));

    expect([...container.querySelectorAll("svg text")].some((el) => ["R", "G", "B"].includes(el.textContent ?? ""))).toBe(false);
  });

  it("renders all four complement diagonals when the complement overlay is enabled", () => {
    const { container } = renderWithLanguage();

    expect(container.querySelectorAll('[data-testid^="cube-complement-"]')).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Complements" }));

    expect(container.querySelectorAll('[data-testid^="cube-complement-"]')).toHaveLength(4);
    expect(container.querySelector('[data-testid="cube-complement-0-7"]')).not.toBeNull();
  });

  it("emphasizes the three primary-colored edges at a highlighted vertex without equation chips", () => {
    const { container } = renderWithLanguage(1);

    const svg = screen.getByRole("group", { name: "Color Cube" });
    const highlightedEdges = [...svg.querySelectorAll('line[stroke-width="2"]')];
    expect(highlightedEdges).toHaveLength(3);
    expect(highlightedEdges.map((edge) => edge.getAttribute("stroke")).sort()).toEqual(["#0000ff", "#00ff00", "#ff0000"]);
    expect(container.textContent).not.toContain("⊕");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("keeps geometry overlays available while switching to the Hasse projection", async () => {
    const { container } = renderWithLanguage();
    expect(screen.queryByRole("button", { name: "Mixing" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Complements" }));
    const hasse = screen.getByRole("button", { name: "Hasse" });
    fireEvent.click(hasse);
    await waitFor(() => expect(screen.queryByText("rank")).not.toBeNull());
    expect(hasse.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Complements" }).getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelectorAll('[data-testid^="cube-complement-"]')).toHaveLength(4);
    expect(screen.getByRole("group", { name: "Color Cube" })).toBeTruthy();
    fireEvent.click(hasse);
    await waitFor(() => expect(screen.queryByText("rank")).toBeNull());
    expect(container.querySelectorAll('[data-testid^="cube-complement-"]')).toHaveLength(4);
  });
});
