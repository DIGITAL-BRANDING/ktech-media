import type { MetadataRoute } from "next";
import { getPublicArticleSlugs, getPublicVideos } from "@/lib/content";
import { site } from "@/lib/site";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, videos] = await Promise.all([getPublicArticleSlugs(), getPublicVideos()]);
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: site.url, changeFrequency: "hourly", priority: 1 },
    { url: `${site.url}/news`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${site.url}/programs`, changeFrequency: "daily", priority: 0.7 },
    { url: `${site.url}/videos`, changeFrequency: "daily", priority: 0.7 },
    { url: `${site.url}/photos`, changeFrequency: "daily", priority: 0.7 },
    { url: `${site.url}/awards`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site.url}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site.url}/advertise`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${site.url}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site.url}/live`, changeFrequency: "daily", priority: 0.6 },
    { url: `${site.url}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site.url}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
  return [
    ...staticRoutes,
    ...articles.map((article) => ({
      url: `${site.url}/news/${article.slug}`,
      lastModified: article.published_at ? new Date(article.published_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...videos.map((video) => ({ url: `${site.url}/videos/${video.slug}`, lastModified: video.published_at ? new Date(video.published_at) : undefined, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
