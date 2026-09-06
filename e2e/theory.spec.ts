import { expect, test } from "@playwright/test";

test("links cube selection and hue-edge views while keeping the consolidated panels responsive", async ({ page }) => {
  for (const language of ["ja", "en"]) {
    await page.addInitScript((lang) => localStorage.setItem("chromalum_lang", lang), language);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1039, height: 900 });
    await page.goto("theory-dev.html");
    const cube = page.locator(".theory-cube");
    await expect(cube.locator('[data-cube-active="true"]')).toHaveCount(0);
    await expect(cube.getByRole("status")).toHaveCount(0);
    await expect(cube.locator("div button")).toHaveCount(3);
    const state = cube.locator('[data-level="1"]');
    await state.focus();
    await state.press("Enter");
    await expect(cube).toHaveAttribute("data-selected-level", "1");
    await expect(cube.locator('[data-cube-active="true"]')).toHaveCount(3);
    await cube.getByRole("button", { name: language === "ja" ? "ハッセ図" : "Hasse", exact: true }).click();
    await expect(cube).toHaveAttribute("data-selected-level", "1");
    await state.focus();
    await state.press("Space");
    await expect(cube.locator('[data-cube-active="true"]')).toHaveCount(0);

    const hue = page.locator(".theory-hue");
    await hue.locator('[data-edge-row="3"] button').click();
    for (const attribute of ["data-cycle-edge", "data-hue-edge", "data-edge-row"]) {
      await expect(hue.locator(`[${attribute}="3"]`)).toHaveAttribute("data-hue-selected", "true");
    }
    await hue.getByRole("button", { name: language === "ja" ? "向きを反転" : "Reverse direction" }).click();
    await expect(hue.getByRole("status")).toContainText("ΔL=+4");
    await expect(hue.locator('[data-edge-row="3"]')).toContainText("B₁ → C₅");
    await hue.locator('[data-cycle-edge="5"]').focus();
    await hue.locator('[data-cycle-edge="5"]').press("Space");
    await expect(hue.locator('[data-hue-edge="5"]')).toHaveAttribute("data-hue-selected", "true");
    const plot = hue.locator(".theory-zigzag-svg");
    await plot.scrollIntoViewIfNeeded();
    const point = await plot
      .locator('[data-hue-edge="2"] line')
      .last()
      .evaluate((line) => {
        const box = line.getBoundingClientRect();
        return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      });
    await page.mouse.click(point.x, point.y);
    await expect(hue.locator('[data-cycle-edge="2"]')).toHaveAttribute("data-hue-selected", "true");

    const checks = page.getByTestId("hamming-parity-sets");
    await expect(page.getByTestId("hamming-flow-operation-check").getByTestId("hamming-parity-sets")).toHaveCount(1);
    await checks.getByTestId("hamming-venn-check-4").click();
    await expect(page.getByTestId("hamming-stage-received").locator('[data-parity-member="true"]')).toHaveCount(4);
    for (const width of [320, 534, 1039]) {
      await page.setViewportSize({ width, height: 900 });
      const layout = await page.evaluate(() => {
        const selectors =
          ".theory-derivation, .theory-derivation-order, .theory-derivation-conclusion, .theory-cube, .theory-hue, .theory-hue-plots, .theory-hue table, .theory-hamming-flow, .theory-hamming-generation, .theory-hamming-stage, .theory-hamming-sets";
        const overflow = [...document.querySelectorAll(selectors)]
          .filter((element) => {
            const box = element.getBoundingClientRect();
            return box.left < 0 || box.right > innerWidth + 1 || element.scrollWidth > element.clientWidth + 1;
          })
          .map((element) => element.className);
        const paths = [...document.querySelectorAll(".theory-derivation-paths > figure")].map((element) => element.getBoundingClientRect());
        return { overflow, sideBySide: Math.abs(paths[0].top - paths[1].top) < 1 };
      });
      expect(layout.overflow).toEqual([]);
      expect(layout.sideBySide).toBe(width > 760);
    }
  }
});

test("shows gapless sums and keeps K8 mask filters compact with a static rank-gap comparison", async ({ page }) => {
  for (const language of ["ja", "en"]) {
    await page.addInitScript((lang) => localStorage.setItem("chromalum_lang", lang), language);
    await page.goto("theory-dev.html");
    const subset = page.getByTestId("subset-sum-derivation");
    await expect(subset.locator('[data-subset-weight="4"] [data-subset-value]')).toHaveText(["0", "1", "2", "3", "4", "5", "6", "7"]);
    await expect(subset.locator('[data-subset-weight="4"] [data-subset-translated="true"]')).toHaveText(["4", "5", "6", "7"]);
    const graph = page.locator("#theory-stella-view");
    const positions = () =>
      graph
        .locator("[data-stella-vertex] > circle:first-of-type")
        .evaluateAll((nodes) => nodes.map((node) => [node.getAttribute("cx"), node.getAttribute("cy")]));
    const before = await positions();
    const modes = page.locator(".theory-k8-controls").getByRole("group").first();
    const distance1 = modes.getByRole("button", { name: language === "ja" ? "距離1 12本" : "Distance 1 · 12 edges", exact: true });
    const distance2 = modes.getByRole("button", { name: language === "ja" ? "距離2 12本" : "Distance 2 · 12 edges", exact: true });
    await expect(page.locator("[data-k8-mask-control]")).toHaveCount(3);
    await distance1.click();
    const mask = page.locator('[data-k8-mask-control="1"]');
    await mask.focus();
    await mask.press("Enter");
    await expect(mask).toHaveAttribute("aria-pressed", "true");
    await expect(mask).toBeFocused();
    await expect(distance1).toHaveAttribute("aria-pressed", "true");
    await expect(graph).toHaveAttribute("data-stella-distance", "1");
    await expect(graph.locator("[data-k8-edge]")).toHaveCount(12);
    await expect(graph.locator('[data-k8-edge-active="true"][data-k8-mask="1"]')).toHaveCount(4);
    await expect(graph.locator('[data-stella-dimmed="true"]')).toHaveCount(0);
    await expect(page.locator("[data-k8-mask-pair]")).toHaveCount(0);
    expect(await positions()).toEqual(before);
    await mask.press("Space");
    await expect(mask).toHaveAttribute("aria-pressed", "false");
    await expect(graph.locator('[data-k8-edge-active="true"]')).toHaveCount(0);

    const comparison = page.getByTestId("k8-distance-comparison");
    await expect(comparison.getByRole("button")).toHaveCount(0);
    await expect(comparison.locator("tbody tr")).toHaveCount(3);
    await expect(comparison.locator("[data-pair-distance]")).toHaveText(["1", "2", "3"]);
    await expect(comparison.locator("[data-pair-gap]")).toHaveText(["1", "1", "1"]);
    await modes.getByRole("button", { name: language === "ja" ? "すべて 28本" : "All · 28 edges", exact: true }).click();
    await expect(page.locator("[data-k8-mask-control]")).toHaveCount(0);
    for (const level of [3, 4]) {
      const vertex = graph.locator(`[data-stella-vertex="${level}"]`);
      await vertex.focus();
      await vertex.press("Enter");
    }
    await expect(graph.locator('[data-k8-edge-active="true"]')).toHaveCount(1);
    await expect(graph.locator('[data-k8-edge="3-4"]')).toHaveAttribute("data-k8-edge-active", "true");
    await expect(page.getByTestId("stella-comparison-status")).toContainText("|ΔL| = |4 − 3| = 1");
    expect(await positions()).toEqual(before);
    await expect(page.getByTestId("tetra-face-duality")).toHaveCount(0);
    await expect(page.locator("#theory-k8").getByRole("combobox")).toHaveCount(0);
    await expect(page.locator("#theory-k8")).toContainText("d=a⊕b⊕c");

    await distance2.click();
    for (const width of [320, 534, 1039]) {
      await page.setViewportSize({ width, height: 900 });
      const layout = await page.evaluate(() => {
        const graphic = document.querySelector("#theory-stella-view")!.getBoundingClientRect();
        const masks = document.querySelector(".theory-k8-mask-buttons")!.getBoundingClientRect();
        const controls = document.querySelectorAll(".theory-k8-masks button");
        return {
          controlsBelow: masks.top >= graphic.bottom,
          touchTargets: [...controls].every((node) => {
            const box = node.getBoundingClientRect();
            return box.width >= 44 && box.height >= 44;
          }),
          fits: [
            ...document.querySelectorAll(
              ".theory-subset, .theory-subset-values, .theory-subset p, .theory-k8-controls, .theory-k8-masks, .theory-k8-comparison, .theory-k8-comparison table, .theory-k8-comparison p, .theory-k8-comparison-status",
            ),
          ].every((node) => {
            const box = node.getBoundingClientRect();
            return box.left >= 0 && box.right <= innerWidth && node.scrollWidth <= node.clientWidth + 1;
          }),
        };
      });
      expect(layout).toEqual({ controlsBelow: true, touchTargets: true, fits: true });
    }
  }
});

test("reveals Hamming results in sequence and discards calculations from superseded inputs", async ({ page }) => {
  await page.setViewportSize({ width: 534, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("chromalum_lang", "en"));
  await page.clock.install({ time: new Date("2026-09-06T00:00:00Z") });
  await page.goto("theory-dev.html");
  await expect(page.getByTestId("hamming-stage-output").locator("[data-bit-string]")).toHaveAttribute("data-bit-string", "1011");
  await page.clock.pauseAt(new Date("2026-09-06T01:00:00Z"));
  const encoded = page.getByTestId("hamming-stage-encoded");
  const received = page.getByTestId("hamming-stage-received");
  const syndrome = page.getByTestId("hamming-stage-syndrome");
  const corrected = page.getByTestId("hamming-stage-corrected");
  const output = page.getByTestId("hamming-stage-output");
  const checks = page.getByTestId("hamming-parity-check-card");

  await page.getByTestId("hamming-data-2").click();
  await expect(encoded).toHaveAttribute("aria-busy", "true");
  await expect(encoded.locator("[data-bit-string]")).toHaveCount(0);
  await expect(output.locator("[data-bit-string]")).toHaveCount(0);
  await expect(page.getByTestId("hamming-status")).toContainText("Calculating");
  await page.clock.runFor(360);
  await expect(encoded.locator("[data-bit-string]")).toHaveAttribute("data-bit-string", "1111111");
  await expect(received.locator("[data-bit-string]")).toHaveCount(0);
  await page.clock.runFor(360);
  await expect(received.locator("[data-bit-string]")).toHaveAttribute("data-bit-string", "1111111");
  await expect(checks.locator("[data-parity-check-result]")).toHaveCount(0);
  await page.clock.runFor(180);
  await expect(checks.locator("[data-parity-check-result]")).toHaveCount(1);
  await expect(checks.locator('[data-parity-check-channel="sG"]')).toHaveAttribute("data-parity-check-result", "0");
  await expect(syndrome.locator("[data-syndrome-bits]")).toHaveCount(0);
  await page.clock.runFor(360);
  await expect(syndrome.locator("[data-syndrome-bits]")).toHaveAttribute("data-syndrome-bits", "000");
  await expect(corrected.locator("[data-bit-string]")).toHaveCount(0);
  await page.clock.runFor(540);
  await expect(output.locator("[data-bit-string]")).toHaveAttribute("data-bit-string", "1111");

  await page.getByTestId("hamming-error-5").click();
  await expect(encoded.locator("[data-bit-string]")).toHaveAttribute("data-bit-string", "1111111");
  await expect(received.locator("[data-bit-string]")).toHaveCount(0);
  await page.clock.runFor(180);
  await expect(received.locator("[data-bit-string]")).toHaveAttribute("data-bit-string", "1111011");
  await page.clock.runFor(540);
  await expect(syndrome.locator("[data-syndrome-bits]")).toHaveAttribute("data-syndrome-bits", "101");
  await page.getByTestId("hamming-data-2").click();
  await expect(syndrome.locator("[data-syndrome-bits]")).toHaveCount(0);
  await page.clock.runFor(540);
  await expect(output.locator("[data-bit-string]")).toHaveCount(0);
  await page.clock.runFor(1260);
  await expect(output.locator("[data-bit-string]")).toHaveAttribute("data-bit-string", "1011");
  await expect(page.getByTestId("hamming-status")).toContainText("position 5");
});

test("connects accessible parity-set controls to four positions, live equations, and delayed error toggles", async ({ page }) => {
  for (const language of ["ja", "en"]) {
    await page.addInitScript((lang) => localStorage.setItem("chromalum_lang", lang), language);
    await page.goto("theory-dev.html");
    const sets = page.getByTestId("hamming-parity-sets");
    const blueCheck = page.getByTestId("hamming-venn-check-1");
    const node = page.getByTestId("hamming-venn-position-5");
    const detail = page.getByTestId("hamming-venn-detail");
    await expect(sets.locator('svg [role="button"]')).toHaveCount(7);
    await blueCheck.click();
    await expect(sets.locator('[data-check-member="true"]')).toHaveCount(4);
    await expect(detail).toContainText("r₁ ⊕ r₃ ⊕ r₅ ⊕ r₇");
    await node.focus();
    await node.press("Enter");
    await expect(node).toHaveAttribute("aria-pressed", "true");
    await expect(node).toBeFocused();
    await expect(page.getByTestId("hamming-error-5")).toHaveAttribute("aria-pressed", "true");
    await expect(detail.locator("[data-check-value]")).toHaveAttribute("data-check-value", "1");
    await expect(detail).toContainText("0 ⊕ 1 ⊕ 1 ⊕ 1 = 1");
    await node.press("Space");
    await expect(node).toHaveAttribute("aria-pressed", "false");
    await expect(detail.locator("[data-check-value]")).toHaveAttribute("data-check-value", "0");
    await expect(node).toBeFocused();
    await blueCheck.click();
    await expect(sets.locator('[data-check-member="true"]')).toHaveCount(7);
    for (const width of [320, 534, 1039]) {
      await page.setViewportSize({ width, height: 900 });
      const layout = await sets.evaluate((root) => {
        const figure = root.querySelector("figure")!.getBoundingClientRect();
        const inspector = root.querySelector(".theory-hamming-sets-inspector")!.getBoundingClientRect();
        return {
          touchTargets: [...root.querySelectorAll(".theory-hamming-node-target, button")].every((element) => {
            const box = element.getBoundingClientRect();
            return box.width >= 44 && box.height >= 44;
          }),
          fits: [...root.querySelectorAll("svg, button, p")].every((element) => {
            const box = element.getBoundingClientRect();
            return box.left >= 0 && box.right <= window.innerWidth && element.scrollWidth <= element.clientWidth + 1;
          }),
          stacked: inspector.top >= figure.bottom,
        };
      });
      expect(layout).toEqual({ touchTargets: true, fits: true, stacked: width < 640 });
    }
  }
});

test("shows one regular chromatic octahedron with red above cyan and accessible edge selection", async ({ page }) => {
  for (const language of ["ja", "en"]) {
    await page.addInitScript((lang) => localStorage.setItem("chromalum_lang", lang), language);
    await page.goto("theory-dev.html");
    const section = page.locator("#theory-octahedron");
    await expect(
      section.getByRole("heading", { name: language === "ja" ? "有彩六色の八面体" : "Octahedron of Six Chromatic Colors" }),
    ).toBeVisible();
    const octahedron = section.getByTestId("chromatic-octahedron");
    await expect(octahedron.locator("svg")).toHaveCount(1);
    await expect(octahedron.locator("[data-cube-edge], [data-die-vertex]")).toHaveCount(0);
    await expect(octahedron.locator("[data-octa-vertex]")).toHaveCount(6);
    await expect(octahedron.locator("[data-octa-edge-control][role='button']")).toHaveCount(12);
    await expect(octahedron.locator(".theory-octahedron-choices button")).toHaveCount(12);
    await expect(octahedron.locator('[data-edge-result="xor"]')).toContainText("010 ⊕ 100 = 110");
    await expect(octahedron.locator('[data-edge-result="complement"]')).toContainText("¬(010 ⊕ 100) = 001");
    const edge = octahedron.locator('[data-octa-edge-control="1-2"]');
    await edge.focus();
    await edge.press("Enter");
    await expect(edge).toHaveAttribute("aria-pressed", "true");
    await expect(octahedron.locator('[data-edge-result="xor"]')).toContainText("001 ⊕ 010 = 011");
    await expect(octahedron.locator('[data-octa-surface-face][data-active="true"]')).toHaveCount(2);
    await edge.press("Space");
    await expect(edge).toHaveAttribute("aria-pressed", "true");
    await expect(octahedron.locator("[data-edge-result]")).toHaveCount(2);
    await octahedron.locator('[data-octa-edge-control="2-4"]').click();
    await expect(octahedron.locator('[data-edge-result="complement"]')).toContainText("¬(010 ⊕ 100) = 001");
    const fanoNote = section.locator("p#theory-octa-face-algebra");
    await expect(fanoNote).toContainText("Fano");
    await fanoNote.click();
    await expect(octahedron.locator('[data-edge-result="xor"]')).toContainText("010 ⊕ 100 = 110");
    await expect(fanoNote).toContainText("000");
    await expect(fanoNote).toContainText("111");
    for (const width of [320, 534, 1039]) {
      await page.setViewportSize({ width, height: 900 });
      const layout = await octahedron.evaluate((el) => {
        const points = [...el.querySelectorAll("[data-octa-vertex] text")].map((node) => ({
          label: node.textContent,
          box: node.getBoundingClientRect(),
        }));
        const red = points.find(({ label }) => label === "R")!.box;
        const cyan = points.find(({ label }) => label === "C")!.box;
        return {
          oriented: points.every(({ box }) => box.top >= red.top && box.top <= cyan.top),
          fits: [...el.querySelectorAll("svg, button, p, figcaption")].every((node) => {
            const box = node.getBoundingClientRect();
            return box.left >= 0 && box.right <= window.innerWidth && node.scrollWidth <= node.clientWidth + 1;
          }),
          targets: [...el.querySelectorAll("button")].every((node) => node.getBoundingClientRect().height >= 44),
        };
      });
      expect(layout).toEqual({ oriented: true, fits: true, targets: true });
    }
  }
});

test("connects primary selection and the eight-state list with readable responsive controls", async ({ page }) => {
  for (const language of ["ja", "en"]) {
    await page.addInitScript((lang) => localStorage.setItem("chromalum_lang", lang), language);
    await page.goto("theory-dev.html");
    const generation = page.getByTestId("primary-generation");
    const layers = generation.getByTestId("generation-layers");
    const inputs = generation.locator(".theory-generation-inputs button");
    await expect(layers.getByRole("button")).toHaveCount(8);
    const black = layers.locator('[data-level="0"]');
    await black.focus();
    await black.press("Enter");
    await expect(black).toBeFocused();
    await expect(generation.locator("[data-generation-result]")).toHaveAttribute("data-generation-result", "0");
    await expect(generation.getByRole("status")).toContainText("∅ → K");
    await expect(generation.locator('.theory-generation-inputs button[aria-pressed="true"]')).toHaveCount(0);
    const cyan = layers.locator('[data-level="5"]');
    await cyan.focus();
    await cyan.press("Space");
    await expect(generation.locator("[data-generation-result]")).toHaveAttribute("data-generation-result", "5");
    await expect(inputs.nth(0)).toHaveAttribute("aria-pressed", "true");
    await expect(inputs.nth(1)).toHaveAttribute("aria-pressed", "false");
    await expect(inputs.nth(2)).toHaveAttribute("aria-pressed", "true");
    await inputs.nth(1).click();
    await expect(layers.locator('[data-level="7"]')).toHaveAttribute("aria-pressed", "true");
    await expect(generation.getByRole("status")).toContainText("4+2+1=7");
    for (const width of [320, 534, 1158]) {
      await page.setViewportSize({ width, height: 698 });
      const layout = await generation.evaluate((root) => {
        const builder = root.querySelector(".theory-generation-builder")!.getBoundingClientRect();
        const states = root.querySelector(".theory-generation-states")!.getBoundingClientRect();
        const buttons = [...root.querySelectorAll("button")];
        return {
          sameRow: Math.abs(builder.top - states.top) < 1,
          fits: [...root.querySelectorAll("button, h4, h5, p, [role='status']")].every((el) => {
            const box = el.getBoundingClientRect();
            return box.left >= 0 && box.right <= window.innerWidth && el.scrollWidth <= el.clientWidth + 1;
          }),
          touchTargets: buttons.every((el) => {
            const box = el.getBoundingClientRect();
            return box.width >= 44 && box.height >= 44;
          }),
          readable: buttons.every((el) => Number.parseFloat(getComputedStyle(el).fontSize) >= 12),
        };
      });
      expect(layout).toEqual({ sameRow: width === 1158, fits: true, touchTargets: true, readable: true });
    }
  }
});

test("keeps mixing in its dedicated diagrams and groups the hue net with complementary die ranks", async ({ page }) => {
  for (const language of ["ja", "en"]) {
    await page.addInitScript((lang) => localStorage.setItem("chromalum_lang", lang), language);
    await page.goto("theory-dev.html");
    const die = page.getByRole("region", {
      name: language === "ja" ? "色相順の展開図とカラーダイス" : "Hue-Order Net and Color Die",
      exact: true,
    });
    const net = die.getByTestId("hue-order-net");
    const ranks = die.getByTestId("color-die-rank-structure");
    await expect(net.getByRole("button")).toHaveCount(6);
    await expect(net.locator("svg path, svg marker")).toHaveCount(0);
    await expect(die).not.toContainText("ΔL");
    await expect(die.getByTestId("hue-net-fold")).toHaveCount(0);
    await expect(ranks).toContainText("L(c) + L(c̄) = 7");
    await expect(die).not.toContainText(/mixing|混色|XNOR/i);
    await expect(page.getByTestId("color-die-view-grid")).toHaveCount(0);
    const cube = page.locator("#theory-cube-cycle");
    await expect(cube.getByRole("button", { name: language === "ja" ? "混色" : "Mixing", exact: true })).toHaveCount(0);
    await expect(cube).not.toContainText(language === "ja" ? "「混色」モード" : "Mixing mode");
    await expect(page.locator("#theory-algebra")).toContainText("XNOR(a,b)=¬(a⊕b)");
    const hasse = cube.getByRole("button", { name: language === "ja" ? "ハッセ図" : "Hasse", exact: true });
    await hasse.click();
    await expect(hasse).toHaveAttribute("aria-pressed", "true");
    await expect(cube.getByRole("group", { name: language === "ja" ? "カラーキューブ" : "Color Cube", exact: true })).toContainText(
      "Pascal",
    );
    for (const width of [320, 534, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await ranks.scrollIntoViewIfNeeded();
      const layout = await die.evaluate((section) => {
        const netBox = section.querySelector('[data-testid="hue-order-net"]')!.getBoundingClientRect();
        const ranksBox = section.querySelector('[data-testid="color-die-rank-structure"]')!.getBoundingClientRect();
        return {
          ordered: netBox.bottom <= ranksBox.top || netBox.right <= ranksBox.left,
          fits: [...section.querySelectorAll("svg, p, h4, [data-testid='color-die-rank-structure']")].every((el) => {
            const box = el.getBoundingClientRect();
            return box.left >= 0 && box.right <= window.innerWidth && el.scrollWidth <= el.clientWidth + 1;
          }),
        };
      });
      expect(layout).toEqual({ ordered: true, fits: true });
    }
  }
});

test("compares fixed GRB join and YCM meet with compact nodes and responsive independent controls", async ({ page }) => {
  for (const language of ["ja", "en"]) {
    await page.addInitScript((lang) => localStorage.setItem("chromalum_lang", lang), language);
    await page.goto("theory-dev.html");
    const diagrams = page.locator("#theory-mixing");
    const grb = diagrams.getByRole("figure", { name: "GRB · join ∨" });
    const ycm = diagrams.getByRole("figure", { name: "YCM · meet ∧" });
    await expect(grb.locator("svg").getByRole("button")).toHaveCount(3);
    await expect(ycm.locator("svg").getByRole("button")).toHaveCount(3);
    await expect(diagrams.locator("button")).toHaveCount(0);
    await expect(grb.locator("[data-mixing-result]")).toHaveAttribute("data-mixing-result", "7");
    await expect(ycm.locator("[data-mixing-result]")).toHaveAttribute("data-mixing-result", "0");
    const blue = grb.getByRole("button", { name: language === "ja" ? "入力B、ビット001" : "Input B, bits 001", exact: true });
    const yellow = ycm.getByRole("button", { name: language === "ja" ? "入力Y、ビット110" : "Input Y, bits 110", exact: true });
    await blue.focus();
    await blue.press("Space");
    await expect(blue).toBeFocused();
    await expect(blue).toHaveAttribute("aria-pressed", "false");
    await expect(blue.locator(".theory-mixing-focus-ring")).toHaveCSS("opacity", "1");
    await expect(grb.locator("[data-mixing-result]")).toHaveAttribute("data-mixing-result", "6");
    await blue.press("Enter");
    await expect(grb.locator("[data-mixing-result]")).toHaveAttribute("data-mixing-result", "7");
    await blue.press("Space");
    await expect(ycm.locator("[data-mixing-result]")).toHaveAttribute("data-mixing-result", "0");
    await yellow.click();
    await expect(ycm.locator("[data-mixing-result]")).toHaveAttribute("data-mixing-result", "1");

    for (const width of [320, 534, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const layout = await diagrams.evaluate((root) => {
        const figures = [...root.querySelectorAll("figure")];
        const bounds = figures.map((figure) => figure.getBoundingClientRect());
        const overflow = figures.some((figure) => {
          const area = figure.getBoundingClientRect();
          return [...figure.querySelectorAll("svg, table, button, p, figcaption")].some((node) => {
            const box = node.getBoundingClientRect();
            return box.left < area.left - 1 || box.right > area.right + 1 || node.scrollWidth > node.clientWidth + 1;
          });
        });
        const invalidNodes = [...root.querySelectorAll("[data-mixing-color]")].filter((node) => {
          const circle = node.querySelector("circle")!;
          const label = node.querySelector("text")!.getBBox();
          return [label.x, label.x + label.width].some((x) =>
            [label.y, label.y + label.height].some(
              (y) => Math.hypot(x - circle.cx.baseVal.value, y - circle.cy.baseVal.value) > circle.r.baseVal.value,
            ),
          );
        });
        const clippedLabels = [...root.querySelectorAll("svg text")].filter((node) => {
          const label = node as SVGTextElement;
          const box = label.getBBox();
          const view = label.ownerSVGElement!.viewBox.baseVal;
          return box.x < 0 || box.y < 0 || box.x + box.width > view.width || box.y + box.height > view.height;
        });
        const invalidGates = figures.filter((figure) => {
          const gate = figure.querySelector<SVGPathElement>("[data-mixing-gate]")!;
          const label = figure.querySelector<SVGTextElement>("[data-mixing-operator]")!;
          const box = label.getBBox();
          const toGate = gate.getCTM()!.inverse().multiply(label.getCTM()!);
          return [box.x, box.x + box.width].some((x) =>
            [box.y, box.y + box.height].some((y) => !gate.isPointInFill(new DOMPoint(x, y).matrixTransform(toGate))),
          );
        });
        const diagonalWires = [...root.querySelectorAll<SVGPolylineElement>("[data-mixing-wire]")].filter((wire) =>
          [...wire.points].slice(1).some((point, index) => {
            const previous = wire.points.getItem(index);
            return point.x !== previous.x && point.y !== previous.y;
          }),
        );
        return {
          overflow,
          invalidNodes: invalidNodes.length,
          clippedLabels: clippedLabels.length,
          invalidGates: invalidGates.length,
          diagonalWires: diagonalWires.length,
          sameRow: Math.abs(bounds[0].top - bounds[1].top) < 1,
        };
      });
      expect(layout).toEqual({
        overflow: false,
        invalidNodes: 0,
        clippedLabels: 0,
        invalidGates: 0,
        diagonalWires: 0,
        sameRow: width === 1280,
      });
    }
    await expect(grb.locator('path[data-mixing-gate="or"]')).toHaveCount(1);
    await expect(ycm.locator('path[data-mixing-gate="and"]')).toHaveCount(1);
    await expect(diagrams.locator("path:not([data-mixing-gate])")).toHaveCount(0);
    await expect(diagrams).not.toContainText("theory_mixing_");
  }
});

test.describe("mixing nodes on touch screens", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 320, height: 698 } });

  test("toggles both graphs by tapping the input nodes with generous hit areas", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("chromalum_lang", "en"));
    await page.goto("theory-dev.html");
    const diagrams = page.locator("#theory-mixing");
    for (const [family, label, result] of [
      ["rgb", "Input B, bits 001", "6"],
      ["cmy", "Input Y, bits 110", "1"],
    ]) {
      const figure = diagrams.locator(`[data-mixing-family="${family}"]`);
      const node = figure.getByRole("button", { name: label, exact: true });
      await node.tap();
      await expect(node).toHaveAttribute("aria-pressed", "false");
      await expect(figure.locator("[data-mixing-result]")).toHaveAttribute("data-mixing-result", result);
      const hit = await node.locator("[data-mixing-hit]").boundingBox();
      expect(hit!.width).toBeGreaterThanOrEqual(44);
      expect(hit!.height).toBeGreaterThanOrEqual(44);
    }
  });
});

test("keeps the three-bit labels inside compact nodes in every Stella mode", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("chromalum_lang", "en"));
  await page.goto("theory-dev.html");
  const diagram = page.locator("#theory-stella-view");

  for (const width of [534, 320]) {
    await page.setViewportSize({ width, height: 698 });
    for (const mode of ["Nodes only", "Distance 1 · 12 edges", "Distance 2 · 12 edges", "Distance 3 · 4 edges", "All · 28 edges"]) {
      await page.getByRole("button", { name: mode, exact: true }).click();
      const nodes = await diagram.locator("[data-stella-vertex]").evaluateAll((vertices) =>
        vertices.map((vertex) => {
          const circle = vertex.querySelector<SVGCircleElement>('circle[fill]:not([fill="transparent"]):not([fill="none"])')!;
          const label = vertex.querySelector<SVGTextElement>("text")!;
          const { x, y, width, height } = label.getBBox();
          const cx = circle.cx.baseVal.value;
          const cy = circle.cy.baseVal.value;
          return {
            level: Number(vertex.getAttribute("data-stella-vertex")),
            text: label.textContent,
            radius: circle.r.baseVal.value,
            cornerDistances: [
              Math.hypot(x - cx, y - cy),
              Math.hypot(x + width - cx, y - cy),
              Math.hypot(x - cx, y + height - cy),
              Math.hypot(x + width - cx, y + height - cy),
            ],
          };
        }),
      );
      expect(nodes).toHaveLength(8);
      await expect(diagram.locator("polygon, path")).toHaveCount(0);
      for (const node of nodes) {
        expect(node.text).toBe(node.level.toString(2).padStart(3, "0"));
        expect(Math.max(...node.cornerDistances)).toBeLessThanOrEqual(node.radius);
      }
    }
  }
});

test("uses straight K8 edges clear of unrelated nodes and separates the 100–011 complement pair", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("chromalum_lang", "en"));
  await page.goto("theory-dev.html");
  const diagram = page.locator("#theory-stella-view");
  await expect(diagram.locator('[data-k8-edge="3-4"]')).toHaveCount(0);

  await page.getByRole("button", { name: "All · 28 edges", exact: true }).click();
  await expect(diagram.locator("path")).toHaveCount(0);
  const routes = await diagram.evaluate((svg) => {
    const nodes = [...svg.querySelectorAll<SVGGElement>("[data-stella-vertex]")].map((node) => {
      const circle = node.querySelector<SVGCircleElement>("circle")!;
      return { level: Number(node.dataset.stellaVertex), x: circle.cx.baseVal.value, y: circle.cy.baseVal.value };
    });
    return [...svg.querySelectorAll<SVGLineElement>("line[data-k8-edge]")].map((edge) => {
      const pair = edge.dataset.k8Edge!;
      const [a, b] = pair.split("-").map(Number);
      const length = edge.getTotalLength();
      const start = edge.getPointAtLength(0);
      const end = edge.getPointAtLength(length);
      const from = nodes.find((node) => node.level === a)!;
      const to = nodes.find((node) => node.level === b)!;
      let clearance = Infinity;
      for (let i = 0; i <= 100; i++) {
        const point = edge.getPointAtLength((i / 100) * length);
        for (const node of nodes) {
          if (node.level !== a && node.level !== b) clearance = Math.min(clearance, Math.hypot(point.x - node.x, point.y - node.y));
        }
      }
      return {
        pair,
        coordinates: ["x1", "y1", "x2", "y2"].map((attribute) => edge.getAttribute(attribute)!),
        startError: Math.hypot(start.x - from.x, start.y - from.y),
        endError: Math.hypot(end.x - to.x, end.y - to.y),
        clearance,
      };
    });
  });
  expect(routes).toHaveLength(28);
  for (const route of routes) {
    expect(route.startError, route.pair).toBeLessThan(0.01);
    expect(route.endError, route.pair).toBeLessThan(0.01);
    // Leave a gap around visible nodes instead of appearing connected.
    expect(route.clearance, route.pair).toBeGreaterThan(9);
  }

  await page.getByRole("button", { name: "Distance 3 · 4 edges", exact: true }).click();
  await expect(diagram.locator("[data-k8-edge]")).toHaveCount(4);
  await expect(diagram.locator('[data-k8-edge="3-4"]')).toHaveAttribute("stroke", "#ff6080");
  for (const pair of ["3-4", "2-5"]) {
    const coordinates = routes.find((route) => route.pair === pair)!.coordinates;
    for (const [index, attribute] of ["x1", "y1", "x2", "y2"].entries()) {
      await expect(diagram.locator(`[data-k8-edge="${pair}"]`)).toHaveAttribute(attribute, String(coordinates[index]));
    }
  }
});

test("restores the Theory development page position after reloading", async ({ page }) => {
  await page.setViewportSize({ width: 534, height: 698 });
  await page.goto("theory-dev.html");
  await page.locator("#theory-stella-view").scrollIntoViewIfNeeded();

  const savedY = await page.evaluate(() => window.scrollY);
  expect(savedY).toBeGreaterThan(1000);
  await page.reload();
  await expect(page.locator("#theory-stella-view")).toBeVisible();
  await expect.poll(() => page.evaluate((y) => Math.abs(window.scrollY - y), savedY)).toBeLessThanOrEqual(1);

  // The next reload must use the new position, including an explicit return to the top.
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem(`chromalum_theory_dev_scroll:${location.pathname}${location.hash}`)))
    .toBe("0");
  await page.reload();
  await expect(page.getByText("THEORY DEVELOPMENT", { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("opens the Theory tab and renders the main sections", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "Theory" }).click();

  await expect(page.getByRole("heading", { name: /Discrete Algebraic Color Theory|離散代数的色彩理論/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Binary Levels|バイナリレベル/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Color Cube|カラーキューブ/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Hamming \[7,4,3\] (?:Code|符号)/ })).toBeVisible();
});

test("opens the Theory tab directly from the URL hash", async ({ page }) => {
  await page.goto("/#theory");

  await expect(page.getByRole("tab", { name: /Theory/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: /Discrete Algebraic Color Theory|離散代数的色彩理論/ })).toBeVisible();
});

test("uses a wider reading measure on desktop without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/#theory");

  const metrics = await page.locator(".theory-container").evaluate((container) => {
    const paragraph = container.querySelector<HTMLElement>(".theory-desc");
    const zigzagBlock = container.querySelector<HTMLElement>(".theory-zigzag-block");
    const zigzagSvg = zigzagBlock?.querySelector<SVGElement>(".theory-zigzag-svg");
    const zigzagTableWrap = zigzagBlock?.querySelector<HTMLElement>(".theory-zigzag-table-wrap");
    if (!paragraph) throw new Error("Theory paragraph not found");
    if (!zigzagBlock || !zigzagSvg || !zigzagTableWrap) throw new Error("Tone zigzag figure not found");

    return {
      containerWidth: container.getBoundingClientRect().width,
      paragraphWidth: paragraph.getBoundingClientRect().width,
      zigzagBlockWidth: zigzagBlock.getBoundingClientRect().width,
      zigzagSvgWidth: zigzagSvg.getBoundingClientRect().width,
      zigzagTableWrapWidth: zigzagTableWrap.getBoundingClientRect().width,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });

  expect(metrics.containerWidth).toBeGreaterThanOrEqual(890);
  expect(metrics.paragraphWidth).toBeGreaterThanOrEqual(750);
  expect(metrics.paragraphWidth).toBeLessThanOrEqual(770);
  expect(metrics.zigzagBlockWidth).toBeGreaterThanOrEqual(870);
  expect(metrics.zigzagBlockWidth).toBeLessThanOrEqual(940);
  expect(metrics.zigzagSvgWidth).toBeLessThanOrEqual(710);
  expect(metrics.zigzagTableWrapWidth).toBeLessThanOrEqual(metrics.zigzagBlockWidth);
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth);
});

test("links direct graph hover to the tone level while keeping all eight buttons", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/#theory");

  const graphLevelFour = page.locator("[data-tone-level-hover='4']");
  const plottedLevelFour = page.locator("[data-tone-level='4'] line");

  await expect(page.locator("[data-tone-level-control]")).toHaveCount(8);
  await graphLevelFour.hover();
  await expect(page.locator("[data-active-fiber='4']")).toBeVisible();
  await expect(plottedLevelFour).toHaveAttribute("stroke-width", "1.8");

  await page.getByRole("heading", { name: /Discrete Algebraic Color Theory|離散代数的色彩理論/ }).hover();
  await expect(page.locator("[data-active-fiber]")).toHaveCount(0);
  await expect(plottedLevelFour).toHaveAttribute("stroke-width", "0.6");
});

test("keeps the English Theory title on one line on narrow mobile viewports", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("chromalum_lang", "en");
  });
  await page.goto("/#theory");

  const title = page.getByRole("heading", { name: "Discrete Algebraic Color Theory" });
  await expect(title).toBeVisible();

  const metrics = await title.evaluate((node) => {
    const el = node as HTMLElement;
    const style = window.getComputedStyle(el);
    return {
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
      whiteSpace: style.whiteSpace,
    };
  });

  expect(metrics.whiteSpace).toBe("nowrap");
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
});
