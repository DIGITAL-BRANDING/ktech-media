import { getPodcastShow } from "@/lib/audio";
import { site } from "@/lib/site";

const xml = (value: string) => value.replace(/[<>&'\"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[char] || char);
type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { slug } = await params;
  const show = await getPodcastShow(slug);
  if (!show) return new Response("Podcast not found", { status: 404 });
  const items = show.episodes.map((episode) => `<item><title>${xml(episode.title)}</title><description>${xml(episode.summary || "")}</description><enclosure url="${xml(episode.audio_url)}" type="audio/mpeg"/><guid isPermaLink="false">${episode.id}</guid><pubDate>${new Date(episode.published_at || Date.now()).toUTCString()}</pubDate><link>${xml(`${site.url}/podcasts/${show.slug}`)}</link></item>`).join("");
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xml(show.title)}</title><link>${xml(`${site.url}/podcasts/${show.slug}`)}</link><description>${xml(show.description || "")}</description><language>${show.language_code === "ha" ? "ha-ng" : "en-ng"}</language><itunes:author xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">${xml(show.author_name)}</itunes:author>${items}</channel></rss>`;
  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } });
}
