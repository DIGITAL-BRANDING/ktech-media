import { getPublicNewsPage } from "@/lib/content";
import { site } from "@/lib/site";

export const revalidate = 300;
const escapeXml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");

export async function GET() {
  const pages = await Promise.all(Array.from({ length: 20 }, (_, index) => getPublicNewsPage({ page: index + 1 })));
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const articles = pages.flatMap((page) => page.articles).filter((article) => article.published_at && new Date(article.published_at).getTime() >= cutoff);
  const urls = articles.map((article) => `<url><loc>${escapeXml(`${site.url}/news/${article.slug}`)}</loc><news:news><news:publication><news:name>${escapeXml(site.name)}</news:name><news:language>${article.language_code === "en" ? "en" : "ha"}</news:language></news:publication><news:publication_date>${new Date(article.published_at!).toISOString()}</news:publication_date><news:title>${escapeXml(article.title)}</news:title></news:news></url>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
