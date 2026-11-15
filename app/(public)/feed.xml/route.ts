import { getPublicNewsPage, getPublicVideos } from "@/lib/content";
import { site } from "@/lib/site";

export const revalidate = 300;
const escapeXml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");

export async function GET() {
  const [pages, videos] = await Promise.all([
    Promise.all([1, 2, 3, 4, 5].map((page) => getPublicNewsPage({ page }))),
    getPublicVideos(),
  ]);
  const articles = pages.flatMap((page) => page.articles);
  const items = [
    ...articles.map((article) => ({ title: article.title, url: `${site.url}/news/${article.slug}`, description: article.excerpt || "", date: article.published_at || article.created_at, category: article.category?.name || "News" })),
    ...videos.map((video) => ({ title: video.title, url: `${site.url}/videos/${video.slug}`, description: video.description || "", date: video.published_at || new Date().toISOString(), category: "Video" })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 60);
  const xmlItems = items.map((item) => `<item><title>${escapeXml(item.title)}</title><link>${escapeXml(item.url)}</link><guid isPermaLink="true">${escapeXml(item.url)}</guid><description>${escapeXml(item.description)}</description><category>${escapeXml(item.category)}</category><pubDate>${new Date(item.date).toUTCString()}</pubDate></item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(site.name)}</title><link>${escapeXml(site.url)}</link><description>${escapeXml(site.description)}</description><language>en-ng</language><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${xmlItems}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
