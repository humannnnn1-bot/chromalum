// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { LanguageProvider } from "../../../i18n";
import { ColorDice, HueOrderNet } from "../ColorDice";

function renderWithLanguage() {
  localStorage.setItem("chromalum_lang", "en");
  return render(
    <LanguageProvider>
      <ColorDice />
    </LanguageProvider>,
  );
}

function renderNetWithLanguage() {
  localStorage.setItem("chromalum_lang", "en");
  const onHover = vi.fn();
  const rendered = render(
    <LanguageProvider>
      <HueOrderNet hlLevel={null} onHover={onHover} />
    </LanguageProvider>,
  );
  return { ...rendered, onHover };
}

describe("ColorDice", () => {
  it("shows complementary face ranks without the removed mixing views", () => {
    const { container } = renderWithLanguage();
    const structure = screen.getByTestId("color-die-rank-structure");
    const structureText = structure.textContent ?? "";

    expect(structureText).toContain("L(c) = 1…6");
    expect(structureText).toContain("⚀⚁⚂⚃⚄⚅");
    expect(structureText).toContain("B₁↔Y₆");
    expect(structureText).toContain("R₂↔C₅");
    expect(structureText).toContain("G₄↔M₃");
    expect(structureText).toContain("L(c̄) = 7 − L(c)");
    expect(structureText).toContain("L(c) + L(c̄) = 7");

    expect(screen.queryByTestId("color-die-view-grid")).toBeNull();
    expect(container.textContent).not.toContain("XNOR");
  });

  it("preserves pointer pinning and makes every visible face keyboard operable", async () => {
    const { container, onHover } = renderNetWithLanguage();
    const view = container.querySelector<HTMLElement>('[data-testid="hue-order-net"]');
    expect(view).not.toBeNull();
    const redFace = within(view!).getByRole("button", { name: "R · 2 · 010" });

    fireEvent.mouseEnter(redFace);
    expect(onHover).toHaveBeenLastCalledWith(2);
    fireEvent.mouseLeave(redFace);
    expect(onHover).toHaveBeenLastCalledWith(null);

    fireEvent.click(redFace);
    await waitFor(() => expect(onHover).toHaveBeenLastCalledWith(2));
    expect(redFace.getAttribute("aria-pressed")).toBe("true");

    fireEvent.keyDown(redFace, { key: " " });
    await waitFor(() => expect(onHover).toHaveBeenLastCalledWith(null));
    expect(redFace.getAttribute("aria-pressed")).toBe("false");

    fireEvent.focus(redFace);
    expect(onHover).toHaveBeenLastCalledWith(2);
    fireEvent.blur(redFace);
    expect(onHover).toHaveBeenLastCalledWith(null);
  });

  it("shows a connected hue-order net without arrows, delta badges, or a folding banner", () => {
    const { container } = renderNetWithLanguage();
    const net = screen.getByRole("group", { name: "A 2–2–2 net of the Color Die preserving the five hue-order connections" });
    const faces = [...net.querySelectorAll<SVGGElement>("[data-hue-net-face]")];

    expect(faces.map((face) => Number(face.getAttribute("data-hue-net-face")))).toEqual([2, 6, 4, 5, 1, 3]);
    expect(faces.map((face) => Number(face.getAttribute("data-hue-order")))).toEqual([1, 2, 3, 4, 5, 6]);
    expect(faces.map((face) => face.querySelector("text:last-of-type")?.textContent)).toEqual(["010", "110", "100", "101", "001", "011"]);
    const corners = faces.map((face) =>
      face
        .querySelector("polygon")!
        .getAttribute("points")!
        .split(" ")
        .map((point) => point.split(",").map(Number)),
    );
    for (let i = 0; i < corners.length - 1; i++) {
      const shared = corners[i].filter(([x, y]) =>
        corners[i + 1].some(([nextX, nextY]) => Math.abs(x - nextX) < 1e-8 && Math.abs(y - nextY) < 1e-8),
      );
      expect(shared).toHaveLength(2);
    }
    const cut = container.querySelector('[data-hue-net-cut="3-2"]');
    expect(cut?.textContent).toContain("Cut M₃–R₂; fold to join");
    expect(net.querySelector("path, marker")).toBeNull();
    expect(container.textContent).not.toContain("ΔL");
    expect(screen.queryByTestId("hue-net-fold")).toBeNull();
    expect(container.querySelector("details")).toBeNull();
  });
});
