import { expect, test } from "@playwright/test";

test("shows face duality on load and keeps it readable and keyboard operable in both languages", async ({ page }) => {
  for (const lang of ["ja", "en"]) {
    await page.addInitScript((language) => localStorage.setItem("chromalum_lang", language), lang);
    await page.goto("theory-dev.html");
    const figure = page.getByTestId("tetra-face-duality");
    await expect(page.locator("#theory-k8 details")).toHaveCount(0);
    await expect(figure).toBeVisible();
    const select = figure.getByRole("combobox", { name: lang === "ja" ? "面を選択" : "Select a face" });
    await select.focus();
    await select.press("End");
    await expect(select).toHaveValue("7");
    await expect(figure.locator('[data-face-role="xor"]')).toHaveAttribute("data-tetra-face-vertex", "7");
    await select.press("Home");
    await expect(select).toHaveValue("0");

    for (const width of [320, 534]) {
      await page.setViewportSize({ width, height: 698 });
      for (const omitted of [0, 1, 2, 3, 4, 5, 6, 7]) {
        await select.selectOption(String(omitted));
        await expect(figure.locator('[data-face-role="xor"]')).toHaveAttribute("data-tetra-face-vertex", String(omitted));
        const layout = await figure.evaluate((element) => {
          const svg = element.querySelector("svg")!;
          const view = svg.viewBox.baseVal;
          const bounds = element.getBoundingClientRect();
          const clippedLabels = [...svg.querySelectorAll("text")].filter((label) => {
            const b = label.getBBox();
            return b.x < view.x || b.y < view.y || b.x + b.width > view.x + view.width || b.y + b.height > view.y + view.height;
          });
          const oversizedBits = [...svg.querySelectorAll("[data-tetra-face-vertex]")].filter((node) => {
            const label = node.querySelector("text")!.getBBox();
            const circle = node.querySelector<SVGCircleElement>('circle:not([fill="none"])')!;
            const cx = circle.cx.baseVal.value;
            const cy = circle.cy.baseVal.value;
            return [label.x, label.x + label.width].some((x) =>
              [label.y, label.y + label.height].some((y) => Math.hypot(x - cx, y - cy) > circle.r.baseVal.value),
            );
          });
          const overflow = [...element.querySelectorAll("table, select, figcaption")].some((node) => {
            const b = node.getBoundingClientRect();
            return b.left < bounds.left - 1 || b.right > bounds.right + 1 || node.scrollWidth > node.clientWidth + 1;
          });
          return { clippedLabels: clippedLabels.length, oversizedBits: oversizedBits.length, overflow };
        });
        expect(layout).toEqual({ clippedLabels: 0, oversizedBits: 0, overflow: false });
      }
    }
    await expect(figure.locator("path, polygon")).toHaveCount(0);
    await expect(figure).not.toContainText("theory_tetra_face_");
    await page.reload();
    await expect(figure).toBeVisible();
  }
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
  expect(metrics.zigzagBlockWidth).toBeGreaterThanOrEqual(690);
  expect(metrics.zigzagBlockWidth).toBeLessThanOrEqual(710);
  expect(metrics.zigzagSvgWidth).toBeLessThanOrEqual(710);
  expect(metrics.zigzagTableWrapWidth).toBeLessThanOrEqual(710);
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
