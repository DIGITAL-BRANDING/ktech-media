import { expect, test } from "@playwright/test";

test("public broadcast and editorial routes render", async ({ page }) => {
  for (const [path, heading] of [
    ["/", undefined],
    ["/news", /Latest News/i],
    ["/live", /Watch live/i],
    ["/programs", /Programs & Shows/i],
    ["/videos", /Videos/i],
    ["/radio", /K-TECH Radio, live/i],
    ["/podcasts", /Podcasts and audio stories/i],
  ] as const) {
    const response = await page.goto(path);
    expect(response?.ok(), `${path} should respond successfully`).toBeTruthy();
    if (heading) await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
    else await expect(page.getByRole("link", { name: /Watch Live/i }).first()).toBeVisible();
  }
});

test("language switcher renders Hausa without translating brand name", async ({ page }) => {
  await page.goto("/news");
  await page.getByRole("button", { name: "HA" }).first().click();
  await expect(page.getByRole("heading", { name: "Sabbin Labarai", exact: true })).toBeVisible();
  await expect(page.getByText("K-TECH MEDIA NETWORK", { exact: true }).first()).toBeVisible();
});

test("RSS and health endpoints are available", async ({ request }) => {
  const feed = await request.get("/feed.xml");
  expect(feed.ok()).toBeTruthy();
  expect(feed.headers()["content-type"]).toContain("application/rss+xml");
  const podcastFeed = await request.get("/podcasts/feed.xml");
  expect(podcastFeed.ok()).toBeTruthy();
  expect(podcastFeed.headers()["content-type"]).toContain("application/rss+xml");
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  const health = await request.get("/api/health");
  expect(health.ok()).toBeTruthy();
});
