const siteName = process.env.NEXT_PUBLIC_SITE_NAME?.trim();
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const site = {
  name: siteName || "K-TECH MEDIA NETWORK",
  tagline: "Connecting People Through Information.",
  description:
    "K-TECH MEDIA NETWORK — Connecting People Through Information. Labarai, hotuna da bidiyo daga Najeriya da duniya.",
  url: siteUrl || "http://localhost:3000",
  liveStreamUrl: process.env.NEXT_PUBLIC_LIVE_STREAM_URL?.trim() || "",
};

export const newsCategories = [
  { name: "Siyasa", slug: "politics" },
  { name: "Kasuwanci", slug: "business" },
  { name: "Wasanni", slug: "sports" },
  { name: "Nishaɗi", slug: "entertainment" },
  { name: "Ilimi", slug: "education" },
  { name: "Kiwon Lafiya", slug: "health" },
  { name: "Fasaha", slug: "technology" },
  { name: "Duniya", slug: "international" },
];
