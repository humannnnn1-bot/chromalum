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
  it("groups the two derivations, toggle cube, hue traversal, and Hamming checks without repeated panels", () => {
    const { container } = renderWithLanguage();
    const derivation = container.querySelector(".theory-derivation")!;
    expect(derivation.querySelectorAll("figure")).toHaveLength(2);
    expect(container.querySelectorAll('[data-testid="subset-sum-derivation"]')).toHaveLength(1);
    expect(derivation.textContent).toContain("rank_s(c)=#{x∈A | s(x)<s(c)}");
    expect(derivation.querySelector(".theory-derivation-conclusion")?.textContent).toContain("L(g,r,b)=4g+2r+b");
    const cube = screen.getByRole("group", { name: "Color Cube" });
    expect(cube.closest("section")?.id).toBe("theory-cube-cycle");
    expect(screen.queryByRole("group", { name: "Primary bit to toggle" })).toBeNull();
    const cycle = screen.getByRole("group", { name: "Chromatic One-Bit Six-Cycle" });
    expect(cycle.closest("section")?.id).toBe("theory-geometry");
    expect(cycle.closest(".theory-hue")?.querySelector(".theory-zigzag-svg")).not.toBeNull();
    expect(screen.getAllByTestId("hamming-parity-check-card")).toHaveLength(1);
    expect(screen.getByTestId("hamming-parity-sets").closest('[data-testid="hamming-flow-operation-check"]')).not.toBeNull();
  });
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
    expect(text).toContain("A=𝒫(E)");
    expect(text).toContain("(A,⊕)≅(𝔽₂³,+)");
    expect(text).toContain("Γ(S)=∨");
    expect(text).toContain("unnamed weights {1,2,4}");
    expect(text).toContain("w_G>w_R+w_B · w_R>w_B>0");
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
    expect(text).toContain("L(κ(c))=7−L(c)");

    for (const retained of [
      "Venn Diagram",
      "GRB and YCM Mixing",
      "Color Cube",
      "Chromatic One-Bit Six-Cycle",
      "Fano Plane",
      "Hamming [7,4,3] Code",
      "Distance 2 and the Two Color Tetrahedra",
      "Tone Zigzag and Hue-Edge Differences",
      "Hue-Order Net and Color Die",
      "Octahedron of Six Chromatic Colors",
    ]) {
      expect(screen.getAllByText(retained).length).toBeGreaterThan(0);
    }
    expect(screen.getByRole("img", { name: "Binary Levels" })).toBeTruthy();
    expect(screen.getByRole("figure", { name: "GRB · join ∨" }).closest("section")?.id).toBe("theory-algebra");
    expect(screen.getByRole("figure", { name: "YCM · meet ∧" }).closest("details")).toBeNull();

    for (const omitted of ["Polyhedra network", "Octahedral Faces and Operations"]) {
      expect(screen.queryByText(omitted)).toBeNull();
    }
    expect(text).toContain("cube is a chosen model");
    expect(text).toContain("preserving the five connections in hue order R→Y→G→C→B→M");
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
    const dieSection = within(geometrySection!).getByRole("region", { name: "Hue-Order Net and Color Die" });
    const dieHeading = within(dieSection).getByRole("heading", { level: 4, name: "Hue-Order Net and Color Die" });
    const octaSection = within(geometrySection!).getByRole("region", { name: "Octahedron of Six Chromatic Colors" });
    const octaHeading = within(octaSection).getByRole("heading", {
      level: 4,
      name: "Octahedron of Six Chromatic Colors",
    });
    expect(binaryHeading.parentElement).toBe(rankSection);
    expect(toggleHeading.parentElement).toBe(structuresSection);
    expect(zigzagHeading.parentElement).toBe(geometrySection);
    expect(dieSection.parentElement).toBe(geometrySection);
    expect(dieHeading.parentElement).toBe(dieSection);
    const net = within(dieSection).getByTestId("hue-order-net");
    const ranks = within(dieSection).getByTestId("color-die-rank-structure");
    expect(net.compareDocumentPosition(ranks) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(dieSection.querySelector("details")).toBeNull();
    expect(dieSection.textContent).not.toMatch(/mixing|XNOR|\bjoin\b|\bmeet\b/i);
    expect(screen.queryByTestId("color-die-view-grid")).toBeNull();
    expect(octaSection.parentElement).toBe(geometrySection);
    expect(octaHeading.parentElement).toBe(octaSection);
    expect(octaSection.querySelectorAll("svg")).toHaveLength(1);
    expect(octaSection.querySelector("[data-die-vertex], [data-die-face]")).toBeNull();

    const rankParagraphs = Array.from(rankSection!.children).filter((node) => node.matches("p.theory-desc"));
    const structureParagraphs = Array.from(structuresSection!.children).filter((node) => node.matches("p.theory-desc"));
    expect(rankParagraphs.some((node) => node.textContent?.includes("|S|"))).toBe(true);
    expect(rankParagraphs.some((node) => node.textContent?.includes("Hamming [7,4,3] column"))).toBe(true);
    expect(structureParagraphs.some((node) => node.textContent?.includes("ev_K(τ_m)=τ_m(K)=m"))).toBe(true);
    expect(structureParagraphs.some((node) => node.textContent?.includes("Hxᵀ=h_i⊕h_j⊕h_k"))).toBe(true);
  });

  it("keeps a short tetrahedral XOR note and the complete toggle table folded", () => {
    renderWithLanguage();

    const faceSection = screen.getByRole("heading", { name: "K₈ Partitioned by Hamming Distance" }).closest("section")!;
    const faceNote = screen.getByText(/The three vertices a,b,c of a face therefore recover/);
    const distanceDiagram = faceSection.querySelector("#theory-stella-view")!;
    expect(distanceDiagram.compareDocumentPosition(faceNote) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(faceSection.textContent).toContain("¬T0=T1");
    expect(faceSection.textContent).toContain("¬T1=T0");
    expect(faceSection.querySelector("details")).toBeNull();
    expect(faceNote.textContent).toContain("d=a⊕b⊕c");
    expect(faceNote.textContent).toContain("010⊕100⊕111=001=B");
    expect(faceSection.querySelectorAll("svg")).toHaveLength(1);
    expect(faceSection.querySelector('[data-testid="tetra-face-duality"]')).toBeNull();
    expect(screen.queryByRole("combobox", { name: "Select a face" })).toBeNull();
    expect(faceSection.textContent).not.toMatch(/majority|centroid/i);

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

    const section = screen.getByText("Distance 2 and the Two Color Tetrahedra").closest("section");
    expect(section).toBeTruthy();
    const buttons = Array.from(screen.getByRole("group", { name: "Select the graph display" }).querySelectorAll("button"));
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
    expect(section!.textContent).toContain("2K₄(12)");
    expect(k8Button.getAttribute("aria-pressed")).toBe("true");

    const distanceTwo = buttons.find((button) => button.textContent === "Distance 2 · 12 edges")!;
    fireEvent.click(distanceTwo);
    expect(distanceTwo.getAttribute("aria-pressed")).toBe("true");
    expect(section!.querySelectorAll('[data-k8-distance="2"]')).toHaveLength(12);
    expect(section!.querySelectorAll("polygon, path")).toHaveLength(0);
  });
});
