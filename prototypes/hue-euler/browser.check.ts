import { expect, test } from "@playwright/test";

for (const width of [320, 768, 1078]) {
  test(`step, finish, and inspect both tours without layout shifts at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("prototypes/hue-euler/");
    await expect(page.getByRole("heading", { name: "色相と、一筆書き。" })).toBeVisible();
    for (const [id, total] of [
      ["octahedron", 12],
      ["distance-12", 24],
    ] as const) {
      const card = page.locator(`[data-tour="${id}"]`);
      const graph = card.locator("[data-graph]");
      const geometry = await graph
        .locator("[data-node]")
        .evaluateAll((nodes) => nodes.map((node) => [node.getAttribute("cx"), node.getAttribute("cy"), node.getAttribute("r")]));
      const order = await graph.locator("[data-edge]").evaluateAll((edges) => edges.map((edge) => edge.getAttribute("data-edge")));
      await expect(card).toHaveAttribute("data-progress", "0");
      await card.getByRole("button", { name: "一手進む", exact: true }).click();
      await expect(card).toHaveAttribute("data-progress", "1");
      await expect(card.locator('[data-visited="true"]')).toHaveCount(1);
      await expect(card.locator('[data-hue="6"]')).toHaveAttribute("data-active", "true");
      await card.getByRole("slider").focus();
      await card.getByRole("slider").press("End");
      await expect(card).toHaveAttribute("data-progress", String(total));
      await expect(card.locator('[data-visited="true"]')).toHaveCount(total);
      await expect(card.getByRole("button", { name: "もう一度", exact: true })).toBeVisible();
      await expect(card.locator(".lab-caption")).toContainText(`${total}辺を一度ずつ通り`);
      expect(await graph.locator("[data-edge]").evaluateAll((edges) => edges.map((edge) => edge.getAttribute("data-edge")))).toEqual(order);
      expect(
        await graph
          .locator("[data-node]")
          .evaluateAll((nodes) => nodes.map((node) => [node.getAttribute("cx"), node.getAttribute("cy"), node.getAttribute("r")])),
      ).toEqual(geometry);
      await card.getByRole("button", { name: "一手戻る", exact: true }).click();
      await expect(card).toHaveAttribute("data-progress", String(total - 1));
      await card.getByRole("button", { name: "最初に戻る", exact: true }).click();
      await expect(card).toHaveAttribute("data-progress", "0");
      await card.locator(".lab-route summary").click();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`lab-${width}.png`), fullPage: true });
  });
}

test("pause and resume between vertices, keep depth layers, and play only one tour at a time", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1200, height: 920 });
  await page.clock.install();
  await page.goto("prototypes/hue-euler/");
  const octa = page.locator('[data-tour="octahedron"]');
  const full = page.locator('[data-tour="distance-12"]');
  await octa.getByRole("button", { name: "再生", exact: true }).click();
  await page.clock.runFor(550);
  const moving = Number(await octa.getAttribute("data-progress"));
  expect(moving).toBeGreaterThan(0.3);
  expect(moving).toBeLessThan(0.8);
  await expect(octa.locator('[data-edge="1-3"] [data-pen]')).toHaveCount(1);
  await octa.getByRole("button", { name: "一時停止", exact: true }).click();
  const paused = await octa.getAttribute("data-progress");
  await page.clock.runFor(1000);
  await expect(octa).toHaveAttribute("data-progress", paused!);
  await octa.getByRole("button", { name: "再開", exact: true }).click();
  await page.clock.runFor(1100);
  expect(Number(await octa.getAttribute("data-progress"))).toBeGreaterThan(moving + 0.8);
  await full.getByRole("button", { name: "再生", exact: true }).click();
  await expect(octa).toHaveAttribute("data-playing", "false");
  await expect(full).toHaveAttribute("data-playing", "true");
  const frozen = await octa.getAttribute("data-progress");
  await page.clock.runFor(5400);
  await expect(octa).toHaveAttribute("data-progress", frozen!);
  await full.getByRole("button", { name: "一時停止", exact: true }).click();
  const order = await full.locator("[data-edge]").evaluateAll((edges) => edges.map((edge) => edge.getAttribute("data-edge")));
  expect(order.indexOf("3-7")).toBeLessThan(order.indexOf("4-6"));
  await expect(full.locator('[data-edge][data-current="true"] [data-pen]')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath("lab-playing.png"), fullPage: true });
});

test("reduced motion uses complete steps and all playback controls stay available", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("prototypes/hue-euler/");
  const card = page.locator('[data-tour="octahedron"]');
  await card.getByRole("button", { name: "再生", exact: true }).click();
  await page.clock.runFor(550);
  await expect(card).toHaveAttribute("data-progress", "0");
  await expect(card.locator("[data-pen]")).toHaveCount(0);
  await page.clock.runFor(700);
  await expect(card).toHaveAttribute("data-progress", "1");
  await card.getByRole("button", { name: "一手進む", exact: true }).click();
  await expect(card).toHaveAttribute("data-progress", "2");
  await expect(card).toHaveAttribute("data-playing", "false");
  await expect(page.getByText("動きを減らす設定に合わせ、一手ごとに切り替えています。")).toBeVisible();
});
