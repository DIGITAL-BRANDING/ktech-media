import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getLocale, t } from "@/lib/i18n";
import { getPodcastShows } from "@/lib/audio";
import { SponsoredPlacement } from "@/components/sponsored-placement";

export const metadata: Metadata = { title: "Podcasts", description: "Podcasts from K-TECH MEDIA NETWORK." };
export default async function PodcastsPage() {
  const locale = await getLocale();
  const shows = await getPodcastShows(locale);
  return <section className="section"><div className="container audio-page"><span className="eyebrow">K-TECH MEDIA NETWORK · {t(locale, "podcasts")}</span><h1>{locale === "ha" ? "Podkast da shirye-shiryen sauti" : "Podcasts and audio stories"}</h1><p>{locale === "ha" ? "Saurari rahotanni, tattaunawa da cikakken bayani a duk lokacin da kake so." : "Listen to reporting, interviews and in-depth conversations whenever you want."}</p>{shows.length ? <div className="row g-4 mt-3">{shows.map((show) => <article key={show.id} className="col-md-6 col-lg-4"><Link href={`/podcasts/${show.slug}`} className="podcast-show-card">{show.artwork_url ? <Image src={show.artwork_url} alt={`${show.title} artwork`} width={640} height={640} unoptimized /> : <span className="podcast-artwork-placeholder"><i className="bi bi-soundwave" /></span>}<div><span className="eyebrow">{show.category} · {show.language_code.toUpperCase()}</span><h2>{show.title}</h2><p>{show.description}</p><span className="section-link">{t(locale, "latestEpisodes")} <i className="bi bi-arrow-right" /></span></div></Link></article>)}</div> : <div className="media-feature-panel"><i className="bi bi-mic"/><div><h2>{locale === "ha" ? "Ba a wallafa podkast ba tukuna" : "No podcasts published yet"}</h2><p>{locale === "ha" ? "Sabbin shirye-shiryen sauti za su bayyana a nan." : "New audio programmes will appear here when the newsroom publishes them."}</p></div></div>}<SponsoredPlacement slot="podcast_sidebar" /><p className="podcast-rss-link"><a href="/podcasts/feed.xml">RSS feed</a></p></div></section>;
}
