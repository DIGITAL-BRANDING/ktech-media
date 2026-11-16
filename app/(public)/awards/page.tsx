import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "Awards and recognition" };
export default async function AwardsPage() {
  const ha = (await getLocale()) === "ha";
  return <><PageIntro eyebrow="K-TECH MEDIA NETWORK / AWARDS" title={ha ? "Kyaututtuka da karramawa" : "Awards & Recognition"} description={ha ? "Wannan fili ne na nuna karramawa da kyaututtukan da kafarmu ko ma’aikatanta suka samu." : "Recognition and awards earned by our newsroom and its journalists."} /><section className="section"><div className="container"><div className="page-empty-state awards-empty"><i className="bi bi-award" /><h2>{ha ? "Karramawa daga newsroom ɗinmu" : "Recognition from our newsroom"}</h2><p>{ha ? "Za a wallafa sahihan bayanan kyaututtuka, shekarunsu da masu bayarwa idan an tabbatar da su." : "Verified awards, years and awarding organisations will be listed here."}</p><Link href="/about" className="section-link">{ha ? "Game da newsroom ɗinmu" : "About our newsroom"} <i className="bi bi-arrow-right" /></Link></div><div className="page-note"><i className="bi bi-shield-check" /><p>{ha ? "K-TECH MEDIA NETWORK tana kiyaye inganci, sahihanci da rikon amana a aikin jarida." : "K-TECH MEDIA NETWORK is committed to accuracy, credibility and responsible journalism."}</p></div></div></section></>;
}
