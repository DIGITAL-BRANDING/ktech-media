import { safeArticleUrl } from "@/lib/article-content";

export function LiveStreamPlayer({ title, embedUrl, hlsUrl }: { title: string; embedUrl: string | null; hlsUrl: string | null }) {
  const embed = safeArticleUrl(embedUrl);
  const hls = safeArticleUrl(hlsUrl);
  if (embed) return <iframe src={embed} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />;
  if (hls) return <video controls playsInline preload="none" aria-label={title}><source src={hls} type="application/vnd.apple.mpegurl" />Your browser does not support this HLS player. Open the stream on a browser with native HLS support.</video>;
  return <div className="stream-placeholder"><i className="bi bi-broadcast-pin" aria-hidden="true" /><h2>Live stream is currently offline</h2><p>Check the programme guide below for the next broadcast.</p></div>;
}
