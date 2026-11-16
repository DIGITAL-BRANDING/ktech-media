import type { Metadata } from "next";
import Link from "next/link";
import { AudioPlayer } from "@/components/audio-player";
import { getLiveRadio } from "@/lib/audio";
import { getLocale, t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Radio", description: "Listen to K-TECH MEDIA NETWORK radio live." };

export default async function RadioPage() {
  const [radio, locale] = await Promise.all([getLiveRadio(), getLocale()]);
  return <section className="section"><div className="container audio-page"><span className="eyebrow">K-TECH MEDIA NETWORK · {t(locale, "radio")}</span><h1>{locale === "ha" ? "Rediyon K-TECH kai tsaye" : "K-TECH Radio, live"}</h1><p>{radio?.description || (locale === "ha" ? "Saurari labarai, tattaunawa da shirye-shiryenmu kai tsaye." : "Listen to news, interviews and original programmes from our newsroom.")}</p>{radio?.status === "live" ? <div className="radio-on-air"><span className="live-badge"><span className="live-dot" /> LIVE</span><h2>{radio.title}</h2><AudioPlayer src={radio.stream_url} title={radio.title} /></div> : <div className="media-feature-panel"><i className="bi bi-broadcast" aria-hidden="true"/><div><h2>{locale === "ha" ? "Rediyo tana hutu a yanzu" : "Radio is currently off air"}</h2><p>{locale === "ha" ? "Ka dawo daga baya ko ka saurari podkast ɗinmu." : "Come back later or catch up with our podcasts."}</p></div><Link href="/podcasts" className="section-link">{t(locale, "podcasts")}</Link></div>}</div></section>;
}
