import { getPodcastShows, getPodcastShow } from "@/lib/audio";
import { site } from "@/lib/site";

const xml = (value: string) => value.replace(/[<>&'\"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[char] || char);
export async function GET() {
  const shows = await getPodcastShows();
  const episodes = (await Promise.all(shows.map((show) => getPodcastShow(show.slug)))).flatMap((show) => show?.episodes.map((episode) => ({ ...episode, show })) || []).sort((a, b) => (b.published_at || "").localeCompare(a.published_at || "")).slice(0, 100);
  const items = episodes.map((episode) => `<item><title>${xml(episode.title)}</title><description>${xml(episode.summary || "")}</description><enclosure url="${xml(episode.audio_url)}" type="audio/mpeg"/><guid isPermaLink="false">${episode.id}</guid><pubDate>${new Date(episode.published_at || Date.now()).toUTCString()}</pubDate><link>${xml(`${site.url}/podcasts/${episode.show.slug}`)}</link></item>`).join("");
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xml(site.name)} Podcasts</title><link>${xml(`${site.url}/podcasts`)}</link><description>${xml(site.description)}</description><language>en-ng</language>${items}</channel></rss>`;
  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } });
}
