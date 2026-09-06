// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "../../i18n";
import { TheoryPanel } from "../TheoryPanel";

function renderWithLanguage() {
  localStorage.setItem("chromalum_lang", "en");
  return render(
    <LanguageProvider>
      <TheoryPanel />
    </LanguageProvider>,
  );
}

describe("TheoryPanel", () => {
  it("renders one eight-chapter argument from finite algebra to derived geometry", () => {
    const { container } = renderWithLanguage();

    expect(screen.getByText("Discrete Algebraic Color Theory")).toBeTruthy();
    expect(Array.from(container.querySelectorAll(".theory-heading")).map((heading) => heading.textContent)).toEqual([
      "Three Primaries and the Eight-State Algebra",
      "Color Order Meets Binary Rank",
      "Valuation and Complement",
      "Toggle Action, Cube, and Chromatic Six-Cycle",
      "Seven Nonzero Toggles, Fano, and Hamming",
      "K₈ Partitioned by Hamming Distance",
      "Rank Geometry of the Chromatic Six-Cycle",
      "Synthesis and Exact Scope",
    ]);

    const text = container.textContent ?? "";
    expect(text).toContain("A=𝒫(E), E={G,R,B}");
    expect(text).toContain("(A,⊕)≅(𝔽₂³,+)");
    expect(text).toContain("Γ(S)=∨");
    expect(text).toContain("{1,2,4} (unnamed)");
    expect(text).toContain("s(G)>s(M)=s(R)+s(B), s(R)>s(B)");
    expect(text).toContain("L(g,r,b)=4g+2r+b");
    expect(text).toContain("L(a∨b)+L(a∧b)=L(a)+L(b)");
    expect(text).toContain("L(a⊕b)=L(a)+L(b)−2L(a∧b)");
    expect(text).toContain("L(κ(a))=7−L(a)");
    expect(text).toContain("Hxᵀ=h_i⊕h_j⊕h_k");
    expect(text).toContain("rank H=3");
    expect(text).toContain("dim ker H=7−3=4");
    expect(text).toContain("Hamming [7,4,3]");
    expect(text).toContain("8·C(3,d)/2");
    expect(text).toContain("T0=ker π={K,M,C,Y}");
    expect(text).toContain("T1=B⊕T0={B,R,G,W}");
    expect(text).toContain("T(h+1/2)=1−T(h)");
    expect(text).toContain("octahedral face-adjacency graph ≅ Q₃");
    expect(text).toContain("L(κ(c))=7−L(c)");

    for (const retained of [
      "Venn Diagram",
      "Color Cube",
      "Chromatic One-Bit Six-Cycle",
      "Fano Plane",
      "Hamming [7,4,3] Code",
      "Color Tetrahedra and Color Star",
      "Tone Zigzag and Hue-Edge Differences",
      "The 2–2–2 Hue-Order Net",
      "Color Die",
      "The Color Die and Its Dual Octahedron",
    ]) {
      expect(screen.getAllByText(retained).length).toBeGreaterThan(0);
    }
    expect(screen.getByRole("img", { name: "Binary Levels" })).toBeTruthy();

    for (const omitted of ["Polyhedra network"]) {
      expect(screen.queryByText(omitted)).toBeNull();
    }
    expect(text).toContain("Cut the closing M–R edge of the chromatic six-cycle");
    expect(text).toContain(
      "The construction therefore runs from the chromatic six-cycle to the hue-order net and then to the folded Color Die",
    );
    for (const excluded of ["pitch", "absolute frequency", "OKLab", "[8,4,4]", "1981", "11 free cube nets"]) {
      expect(text).not.toContain(excluded);
    }
  });

  it("keeps essential explanations as visible prose without introducing subsection cards", () => {
    const { container } = renderWithLanguage();
    const rankSection = container.querySelector<HTMLElement>("#theory-rank");
    const structuresSection = container.querySelector<HTMLElement>("#theory-fano-hamming");
    const geometrySection = container.querySelector<HTMLElement>("#theory-geometry");

    expect(rankSection).not.toBeNull();
    expect(structuresSection).not.toBeNull();
    expect(geometrySection).not.toBeNull();

    const binaryHeading = within(rankSection!).getByRole("heading", { level: 4, name: "Binary Levels" });
    const toggleHeading = within(structuresSection!).getByRole("heading", {
      level: 4,
      name: "Seven Nonzero Toggle Patterns",
    });
    const zigzagHeading = within(geometrySection!).getByRole("heading", {
      level: 4,
      name: "Tone Zigzag and Hue-Edge Differences",
    });
    const netHeading = within(geometrySection!).getByRole("heading", { level: 4, name: "The 2–2–2 Hue-Order Net" });
    const dieHeading = within(geometrySection!).getByRole("heading", { level: 4, name: "Color Die" });
    const octaHeading = within(geometrySection!).getByRole("heading", {
      level: 4,
      name: "The Color Die and Its Dual Octahedron",
    });
    expect(binaryHeading.parentElement).toBe(rankSection);
    expect(toggleHeading.parentElement).toBe(structuresSection);
    expect(zigzagHeading.parentElement).toBe(geometrySection);
    expect(netHeading.parentElement).toBe(geometrySection);
    expect(dieHeading.parentElement).toBe(geometrySection);
    expect(octaHeading.parentElement).toBe(geometrySection);

    const rankParagraphs = Array.from(rankSection!.children).filter((node) => node.matches("p.theory-desc"));
    const structureParagraphs = Array.from(structuresSection!.children).filter((node) => node.matches("p.theory-desc"));
    expect(rankParagraphs.some((node) => node.textContent?.includes("|S|"))).toBe(true);
    expect(rankParagraphs.some((node) => node.textContent?.includes("Hamming [7,4,3] column"))).toBe(true);
    expect(structureParagraphs.some((node) => node.textContent?.includes("ev_K(τ_m)=τ_m(K)=m"))).toBe(true);
    expect(structureParagraphs.some((node) => node.textContent?.includes("Hxᵀ=h_i⊕h_j⊕h_k"))).toBe(true);
  });

  it("shows face duality inline and keeps the complete toggle table folded", () => {
    renderWithLanguage();

    const faceHeading = screen.getByRole("heading", { name: "Face Majority and Duality", level: 4 });
    const faceSection = faceHeading.closest("section")!;
    expect(faceSection.id).toBe("theory-k8");
    expect(faceSection.querySelector("details")).toBeNull();
    expect(faceSection.textContent).toContain("maj(a,b,c)=¬d");
    expect(faceSection.textContent).toContain("g_F=(p_a+p_b+p_c)/3=p_¬d/3");
    expect(faceSection.querySelector('[data-testid="tetra-face-duality"]')).not.toBeNull();
    expect(screen.getByRole("combobox", { name: "Select a face" })).toBeTruthy();

    const summary = screen.getByText("Complete Toggle-Action Table");
    const details = summary.closest("details");
    expect(details).toBeTruthy();
    expect(details!.open).toBe(false);
    expect(details!.style.border).toBe("");
    expect(details!.style.background).toBe("");
    expect(details!.querySelector('svg[aria-label="Complete table of color states acted on by GRB toggle masks"]')).toBeTruthy();

    fireEvent.click(summary);
    expect(details!.open).toBe(true);
  });

  it("uses the horizontal space inside the binary table SVG", () => {
    renderWithLanguage();

    const binaryTable = screen.getByRole("img", { name: "Binary Levels" });
    expect(binaryTable.getAttribute("viewBox")).toBe("8 0 368 224");

    const textNodes = Array.from(binaryTable.querySelectorAll("text"));
    const channelHeaderXs = textNodes
      .filter((node) => ["G", "R", "B"].includes(node.textContent ?? "") && node.getAttribute("y") === "18")
      .map((node) => node.getAttribute("x"));
    expect(channelHeaderXs).toEqual(["170", "192", "214"]);
    expect(textNodes.find((node) => node.textContent === "Wt")?.getAttribute("x")).toBe("242");
    expect(textNodes.find((node) => node.textContent === "H(7,4)")?.getAttribute("x")).toBe("274");
    expect(textNodes.find((node) => node.textContent === "Tone")?.getAttribute("x")).toBe("332");
    expect(textNodes.filter((node) => node.getAttribute("x") === "358").map((node) => node.textContent)).toEqual([
      "0/7",
      "1/7",
      "2/7",
      "3/7",
      "4/7",
      "5/7",
      "6/7",
      "7/7",
    ]);
  });

  it("clears pinned highlights when clicking the full-width background surface", async () => {
    const { container } = renderWithLanguage();

    const venn = screen.getByRole("img", { name: "Venn Diagram" });
    await act(async () => {
      fireEvent.click(venn);
      await Promise.resolve();
    });
    await waitFor(() => expect(venn.querySelector('rect[stroke="#fff"]')).toBeTruthy());

    const resetSurface = container.querySelector(".theory-reset-surface");
    expect(resetSurface).toBeTruthy();
    await act(async () => {
      fireEvent.click(resetSurface!);
      await Promise.resolve();
    });
    await waitFor(() => expect(venn.querySelector('rect[stroke="#fff"]')).toBeFalsy());
  });

  it("keeps the K8 distance partition explorable through the retained stella", () => {
    renderWithLanguage();

    const section = screen.getByText("Color Tetrahedra and Color Star").closest("section");
    expect(section).toBeTruthy();
    const buttons = Array.from(section!.querySelectorAll("button"));
    expect(buttons.map((button) => button.textContent)).toEqual([
      "Nodes only",
      "Distance 1 · 12 edges",
      "Distance 2 · 12 edges",
      "Distance 3 · 4 edges",
      "All · 28 edges",
    ]);
    const k8Button = buttons.find((button) => button.textContent === "All · 28 edges")!;
    fireEvent.click(k8Button);
    expect(section!.textContent).toContain("Q₃(12)");
    expect(k8Button.getAttribute("aria-pressed")).toBe("true");

    const distanceTwo = buttons.find((button) => button.textContent === "Distance 2 · 12 edges")!;
    fireEvent.click(distanceTwo);
    expect(distanceTwo.getAttribute("aria-pressed")).toBe("true");
    expect(section!.querySelectorAll('[data-k8-distance="2"]')).toHaveLength(12);
    expect(section!.querySelectorAll("polygon, path")).toHaveLength(0);
  });
});
