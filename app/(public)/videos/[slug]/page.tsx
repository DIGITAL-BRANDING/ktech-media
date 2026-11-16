import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicVideoBySlug, getPublicVideos } from "@/lib/content";
import { site } from "@/lib/site";
import { getLocale } from "@/lib/i18n";

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 60;

function makeEmbedUrl(provider: string, raw: string | null) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (["youtube.com", "m.youtube.com", "youtu.be", "youtube-nocookie.com"].includes(host)) {
      const id = host === "youtu.be" ? url.pathname.split("/").filter(Boolean)[0] : url.searchParams.get("v") || url.pathname.split("/").filter(Boolean).at(-1);
      return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (provider === "vimeo" && (host === "vimeo.com" || host.endsWith(".vimeo.com"))) {
      const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (provider === "facebook" && (host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.watch")) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url.toString())}&show_text=false`;
    }
    return null;
  } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const video = await getPublicVideoBySlug(slug, await getLocale());
  if (!video) return { title: "Video not found" };
  const canonical = `${site.url}/videos/${video.slug}`;
  return { title: video.title, description: video.description || `Watch ${video.title} on ${site.name}.`, alternates: { canonical }, openGraph: { type: "video.other", url: canonical, title: video.title, description: video.description || undefined, images: video.thumbnail_url ? [video.thumbnail_url] : undefined } };
}

export default async function VideoDetailPage({ params }: Props) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const [video, allVideos] = await Promise.all([getPublicVideoBySlug(slug, locale), getPublicVideos(locale)]);
  if (!video) notFound();
  const ha = locale === "ha";
  const embedUrl = makeEmbedUrl(video.provider, video.source_url);
  const related = allVideos.filter((item) => item.id !== video.id).slice(0, 3);
  const canonical = `${site.url}/videos/${video.slug}`;
  const schema = { "@context": "https://schema.org", "@type": "VideoObject", name: video.title, description: video.description || "", thumbnailUrl: video.thumbnail_url ? [video.thumbnail_url] : undefined, uploadDate: video.published_at || undefined, embedUrl: embedUrl || undefined, url: canonical, publisher: { "@type": "Organization", name: site.name } };
  return <article className="section video-detail-page"><div className="container video-detail-container"><span className="eyebrow">{video.category?.name || (ha ? "BIDIYO" : "VIDEO")}</span><h1>{video.title}</h1>{video.description && <p className="video-detail-description">{video.description}</p>}<div className="video-detail-player">{embedUrl ? <iframe src={embedUrl} title={video.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : video.thumbnail_url ? <Image src={video.thumbnail_url} alt={`${video.title} thumbnail`} fill priority sizes="100vw" /> : <div className="video-thumb-fallback"><i className="bi bi-camera-video" aria-hidden="true" /></div>}</div><div className="video-detail-actions"><span>{video.published_at ? new Intl.DateTimeFormat(ha ? "ha-NG" : "en-NG", { dateStyle: "long" }).format(new Date(video.published_at)) : "K-TECH MEDIA NETWORK"}</span><a href={`https://wa.me/?text=${encodeURIComponent(`${video.title} ${canonical}`)}`} target="_blank" rel="noopener noreferrer"><i className="bi bi-whatsapp" /> {ha ? "Raba a WhatsApp" : "Share on WhatsApp"}</a><a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonical)}`} target="_blank" rel="noopener noreferrer"><i className="bi bi-facebook" /> {ha ? "Raba" : "Share"}</a></div>
    {related.length > 0 && <section className="video-related"><div className="section-header"><h2 className="section-title">{ha ? "Bidiyoyi makamanta" : "Related videos"}</h2><Link href="/videos" className="section-link">{ha ? "Dukkan bidiyo" : "All videos"} <i className="bi bi-arrow-right" /></Link></div><div className="row g-4">{related.map((item) => <div className="col-md-4" key={item.id}><Link className="video-card" href={`/videos/${item.slug}`}><div className="video-thumb">{item.thumbnail_url ? <Image src={item.thumbnail_url} alt={`${item.title} thumbnail`} fill sizes="33vw" /> : <div className="video-thumb-fallback"><i className="bi bi-camera-video" /></div>}</div><div className="video-card-body"><h3>{item.title}</h3></div></Link></div>)}</div></section>}
  </div><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /></article>;
}
