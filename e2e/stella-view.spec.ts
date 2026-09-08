import { expect, test, type Locator } from "@playwright/test";

for (const input of ["mouse", "touch"] as const) {
  test(`requires a quick pair of ${input} presses and keeps slower presses as normal selections`, async ({ browser }) => {
    const context = await browser.newContext({ hasTouch: true, reducedMotion: "reduce", viewport: { width: 1075, height: 698 } });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:4173/chromalum/theory-dev.html");
    const graph = page.locator("#theory-stella-view");
    const vertex = graph.locator('[data-stella-vertex="5"]');
    await vertex.scrollIntoViewIfNeeded();
    const box = (await vertex.boundingBox())!;
    const x = box.x + box.width / 2,
      y = box.y + box.height / 2;
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    const press = async (clickCount: number) => {
      if (input === "touch") await page.touchscreen.tap(x, y);
      else {
        await page.mouse.move(x, y);
        await page.mouse.down({ clickCount });
        await page.mouse.up({ clickCount });
      }
    };
    await press(1);
    await expect(vertex).toHaveAttribute("data-stella-comparison-role", "a");
    await page.clock.runFor(280);
    // Still a native dblclick on many systems, but too slow for this shortcut.
    await press(2);
    await expect(graph).toHaveAttribute("data-stella-view", "default");
    await expect(graph.locator("[data-stella-comparison-role]")).toHaveCount(0);
    await page.clock.runFor(600);
    await press(1);
    await page.clock.runFor(120);
    await press(2);
    await expect(graph).toHaveAttribute("data-stella-view", "symmetric");
    await expect(graph.locator("[data-stella-comparison-role]")).toHaveCount(0);
    await context.close();
  });
}

async function geometry(graph: Locator) {
  return graph.locator("[data-stella-vertex]").evaluateAll((nodes) =>
    Object.fromEntries(
      nodes.map((node) => {
        const circle = node.querySelector("circle")!;
        return [node.getAttribute("data-stella-vertex")!, { x: Number(circle.getAttribute("cx")), y: Number(circle.getAttribute("cy")) }];
      }),
    ),
  );
}

test("double-click rotates continuously, keeps selection and layout, and reverses without a jump", async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem("chromalum_lang", "en"));
  await page.setViewportSize({ width: 1075, height: 698 });
  await page.goto("theory-dev.html");
  const graph = page.locator("#theory-stella-view");
  await graph.scrollIntoViewIfNeeded();
  const initial = await geometry(graph);
  const box = await graph.boundingBox();
  const summary = await page.locator(".theory-k8-summary").textContent();
  const controls = page.locator(".theory-k8-display-modes button");
  await expect(controls).toHaveCount(4);
  // An ordinary click still selects immediately. A double-click restores the
  // comparison that existed before its first click, even on a vertex.
  await graph.locator('[data-stella-vertex="2"]').click();
  await expect(graph.locator('[data-stella-vertex="2"]')).toHaveAttribute("data-stella-comparison-role", "a");
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await graph.locator('[data-stella-vertex="5"]').dblclick();
  await expect(graph).toHaveAttribute("data-stella-view", "symmetric");
  await expect(graph.locator('[data-stella-vertex="2"]')).toHaveAttribute("data-stella-comparison-role", "a");
  await expect(graph.locator('[data-stella-comparison-role="b"]')).toHaveCount(0);
  await page.mouse.move(0, 0);
  await page.clock.runFor(300);
  const middle = await geometry(graph);
  expect(middle).not.toEqual(initial);
  expect(Number(await graph.getAttribute("data-stella-turn"))).toBeGreaterThan(0);
  expect(Number(await graph.getAttribute("data-stella-turn"))).toBeLessThan(1);
  expect(await graph.boundingBox()).toEqual(box);
  await graph.screenshot({ path: testInfo.outputPath("during-rotation.png") });
  // Reverse while still moving: the starting position must be unchanged.
  await graph.dblclick({ position: { x: 10, y: 10 }, force: true });
  expect(await geometry(graph)).toEqual(middle);
  await page.clock.runFor(700);
  expect(await geometry(graph)).toEqual(initial);
  await graph.dblclick({ position: { x: 10, y: 10 }, force: true });
  await page.clock.runFor(700);
  await expect(graph).toHaveAttribute("data-stella-turn", "1");
  const end = await geometry(graph);
  expect(end[7]).toEqual(end[0]);
  expect(end[2].x).toBe(end[5].x);
  expect(end[2].y).toBeLessThan(end[5].y);
  await expect(graph.locator("[data-stella-vertex]").last()).toHaveAttribute("data-stella-vertex", "7");
  expect(await graph.boundingBox()).toEqual(box);
  expect(await page.locator(".theory-k8-summary").textContent()).toBe(summary);
  await graph.locator('[data-stella-vertex="2"]').focus();
  await page.keyboard.press("Escape");
  await expect(graph.locator("[data-stella-comparison-role]")).toHaveCount(0);
  await graph.locator('[data-stella-vertex="2"]').evaluate((node) => (node as SVGElement).blur());
  await page.locator(".theory-k8-overview").screenshot({ path: testInfo.outputPath("symmetric-view.png") });
  for (const distances of [[1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3], []]) {
    for (const distance of [1, 2, 3]) {
      const button = controls.nth(distance);
      if (((await button.getAttribute("aria-pressed")) === "true") !== distances.includes(distance)) await button.click();
    }
    await expect(graph.locator("[data-k8-edge]")).toHaveCount(distances.reduce((count, distance) => count + (distance === 3 ? 4 : 12), 0));
    expect(await geometry(graph)).toEqual(end);
  }
});

test("double-tap works on touch without zoom, duplicate toggles, or treating a drag as a tap", async ({ browser }, testInfo) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/chromalum/theory-dev.html");
  const graph = page.locator("#theory-stella-view");
  await graph.scrollIntoViewIfNeeded();
  const box = (await graph.boundingBox())!;
  const initial = await geometry(graph);
  const x = box.x + 10,
    y = box.y + 10;
  await page.touchscreen.tap(x, y);
  await page.touchscreen.tap(x, y);
  await expect(graph).toHaveAttribute("data-stella-turn", "1");
  // A synthesized mouse dblclick must not toggle a second time.
  await graph.dispatchEvent("dblclick", { detail: 2 });
  await expect(graph).toHaveAttribute("data-stella-view", "symmetric");
  expect(await page.evaluate(() => window.visualViewport!.scale)).toBe(1);
  await graph.screenshot({ path: testInfo.outputPath("symmetric-touch.png") });
  const symmetric = await geometry(graph);
  await graph.dispatchEvent("pointerdown", { pointerType: "touch", isPrimary: true, clientX: x, clientY: y });
  await graph.dispatchEvent("pointermove", { pointerType: "touch", isPrimary: true, clientX: x, clientY: y + 40 });
  await graph.dispatchEvent("pointerup", { pointerType: "touch", isPrimary: true, clientX: x, clientY: y + 40 });
  await page.touchscreen.tap(x, y);
  expect(await geometry(graph)).toEqual(symmetric);
  await page.touchscreen.tap(x, y);
  await expect(graph).toHaveAttribute("data-stella-turn", "0");
  expect(await geometry(graph)).toEqual(initial);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});
