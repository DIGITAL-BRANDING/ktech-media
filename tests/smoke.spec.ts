import { expect, test } from "@playwright/test";

test("public broadcast and editorial routes render", async ({ page }) => {
  for (const [path, heading] of [
    ["/", undefined],
    ["/news", /Sabbin Labarai/i],
    ["/live", /Watch live/i],
    ["/programs", /Programs & Shows/i],
    ["/videos", /Bidiyo/i],
  ] as const) {
    const response = await page.goto(path);
    expect(response?.ok(), `${path} should respond successfully`).toBeTruthy();
    if (heading) await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
    else await expect(page.getByRole("link", { name: /Watch Live/i }).first()).toBeVisible();
  }
});

test("RSS and health endpoints are available", async ({ request }) => {
  const feed = await request.get("/feed.xml");
  expect(feed.ok()).toBeTruthy();
  expect(feed.headers()["content-type"]).toContain("application/rss+xml");
  const health = await request.get("/api/health");
  expect(health.ok()).toBeTruthy();
});
