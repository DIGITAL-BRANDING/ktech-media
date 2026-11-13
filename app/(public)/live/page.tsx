import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Kalli kai tsaye", description: `Kalli tashar ${site.name} kai tsaye.` };

export default function LivePage() {
  return <section className="section live-section"><div className="container"><h1 className="section-title">Kalli kai tsaye</h1><div className="live-player-wrapper">{site.liveStreamUrl ? <iframe src={site.liveStreamUrl} title={`${site.name} kai tsaye`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <div className="stream-placeholder"><i className="bi bi-broadcast-pin" aria-hidden="true" /><h2>Ba a saita live stream ba tukuna</h2><p>Saita NEXT_PUBLIC_LIVE_STREAM_URL domin kunna live player.</p></div>}</div></div></section>;
}
