import { expect, test } from "@playwright/test";

for (const width of [320, 1078]) {
  test(`keeps K8 crossings consistent through every distance combination and emphasis at ${width}px`, async ({ page }, testInfo) => {
    await page.addInitScript(() => localStorage.setItem("chromalum_lang", "en"));
    await page.setViewportSize({ width, height: 698 });
    await page.goto("theory-dev.html");
    const graph = page.locator("#theory-stella-view");
    const controls = page.locator(".theory-k8-display-modes");
    const edgeOrder = () =>
      graph.locator("line[data-k8-edge]").evaluateAll((edges) => edges.map((edge) => edge.getAttribute("data-k8-edge")!));
    const allEdges = await edgeOrder();
    expect(allEdges).toHaveLength(28);
    // Strict crossings calculated independently from interpolated 3D depth:
    // From above, 4–6 is in front of 3–7; 0–7 is in front of 1–3.
    expect(allEdges.indexOf("3-7")).toBeLessThan(allEdges.indexOf("4-6"));
    expect(allEdges.indexOf("1-3")).toBeLessThan(allEdges.indexOf("0-7"));

    const nodeGeometry = () =>
      graph
        .locator("[data-stella-vertex] > circle:first-of-type")
        .evaluateAll((nodes) => nodes.map((node) => [node.getAttribute("cx"), node.getAttribute("cy"), node.getAttribute("r")]));
    const initialGeometry = await nodeGeometry();

    // Include additions and removals in different orders, not just resets.
    for (const distances of [[1], [1, 2], [2], [2, 3], [3], [1, 3], [1, 2, 3], []]) {
      for (const distance of [1, 2, 3]) {
        const button = controls.getByRole("button", { name: `Distance ${distance} · ${distance === 3 ? 4 : 12} edges`, exact: true });
        if (((await button.getAttribute("aria-pressed")) === "true") !== distances.includes(distance)) await button.click();
      }
      await expect(graph).toHaveAttribute("data-stella-distances", distances.join(" ") || "none");
      const visibleEdges = allEdges.filter((pair) => {
        const [a, b] = pair.split("-").map(Number);
        return distances.includes((a ^ b).toString(2).replaceAll("0", "").length);
      });
      expect(await edgeOrder()).toEqual(visibleEdges);
      expect(await nodeGeometry()).toEqual(initialGeometry);
      await expect(graph.locator("[data-stella-vertex]")).toHaveCount(8);
      await expect(graph.locator("path, polygon, mask")).toHaveCount(0);
      if (distances.length > 0) {
        await graph.screenshot({ path: testInfo.outputPath(`distance-${distances.join("-")}.png`) });
      }
    }

    for (const distance of [1, 2, 3]) {
      await controls.getByRole("button", { name: `Distance ${distance} · ${distance === 3 ? 4 : 12} edges`, exact: true }).click();
    }
    const origin = graph.locator('[data-stella-vertex="0"]');
    const target = graph.locator('[data-stella-vertex="7"]');
    await origin.click();
    await target.hover();
    await expect(graph.locator('[data-k8-edge="0-7"]')).toHaveAttribute("data-k8-edge-preview", "true");
    expect(await edgeOrder()).toEqual(allEdges);
    await target.click();
    await expect(graph.locator('[data-k8-edge="0-7"]')).toHaveAttribute("stroke-width", "2.4");
    expect(await edgeOrder()).toEqual(allEdges);
    const candidate = graph.locator('[data-stella-vertex="4"]');
    await candidate.focus();
    await expect(graph.locator('[data-k8-edge="0-4"]')).toHaveAttribute("data-k8-edge-preview", "true");
    expect(await edgeOrder()).toEqual(allEdges);
    await candidate.press("Escape");
    await expect(graph.locator("[data-stella-comparison-role]")).toHaveCount(0);
    expect(await edgeOrder()).toEqual(allEdges);
  });
}
