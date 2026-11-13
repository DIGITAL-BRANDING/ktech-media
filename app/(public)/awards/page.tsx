import Link from "next/link";
import { PageIntro } from "@/components/page-intro";

export const metadata = { title: "Awards and recognition" };
export default function AwardsPage() {
  return <><PageIntro eyebrow="K-TECH MEDIA NETWORK / AWARDS" title="Awards & Recognition" description="Wannan fili ne na nuna karramawa da kyaututtukan da kafarmu ko ma’aikatanta suka samu." /><section className="section"><div className="container"><div className="page-empty-state awards-empty"><i className="bi bi-award" /><h2>Recognition from our newsroom</h2><p>Za a wallafa sahihan bayanan kyaututtuka, shekarunsu da masu bayarwa idan an tabbatar da su.</p><Link href="/about" className="section-link">About our newsroom <i className="bi bi-arrow-right" /></Link></div><div className="page-note"><i className="bi bi-shield-check" /><p>K-TECH MEDIA NETWORK tana kiyaye inganci, sahihanci da rikon amana a aikin jarida.</p></div></div></section></>;
}
