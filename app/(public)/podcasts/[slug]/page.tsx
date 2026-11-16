import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AudioPlayer } from "@/components/audio-player";
import { getPodcastShow } from "@/lib/audio";
import { getLocale, t } from "@/lib/i18n";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const show = await getPodcastShow(slug, locale);
  return show ? { title: show.title, description: show.description || `Podcast from ${show.author_name}` } : { title: locale === "ha" ? "Ba a samu podkast ba" : "Podcast not found" };
}
export default async function PodcastShowPage({ params }: Props) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const show = await getPodcastShow(slug, locale);
  if (!show) notFound();
  return <section className="section"><div className="container audio-page podcast-show-page"><header className="podcast-show-hero">{show.artwork_url && <Image src={show.artwork_url} alt={`${show.title} artwork`} width={360} height={360} unoptimized />}<div><span className="eyebrow">{show.category} · {show.language_code.toUpperCase()}</span><h1>{show.title}</h1><p>{show.description}</p><span>{show.author_name}</span></div></header><h2 className="section-title">{t(locale, "latestEpisodes")}</h2>{show.episodes.length ? <div className="podcast-episode-list">{show.episodes.map((episode) => <article key={episode.id} className="podcast-episode"><div><span className="eyebrow">{episode.episode_number ? (locale === "ha" ? `KASHI NA ${episode.episode_number}` : `EPISODE ${episode.episode_number}`) : (locale === "ha" ? "KASHI" : "EPISODE")}</span><h3>{episode.title}</h3><p>{episode.summary}</p></div><AudioPlayer src={episode.audio_url} title={episode.title} /></article>)}</div> : <p>{locale === "ha" ? "Babu episode a yanzu." : "No episodes are available yet."}</p>}<a className="podcast-rss-link" href={`/podcasts/${show.slug}/feed.xml`}>{locale === "ha" ? "Bi wannan podkast ta RSS" : "Subscribe to this show’s RSS"}</a></div></section>;
}
