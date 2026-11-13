import { PageIntro } from "@/components/page-intro";
import { site } from "@/lib/site";

export const metadata = { title: "Terms of use" };
export default function TermsPage() {
  return <><PageIntro eyebrow={site.name} title="Terms of Use" description="Sharuɗɗan amfani da website da kayan aikin newsroom." /><section className="section"><article className="container legal-content"><h2>Using this website</h2><p>Za ka iya karanta da raba links na labarai domin amfani na mutum. Kada ka yi amfani da website wajen karya doka, cutar da wani ko lalata tsarin aiki.</p><h2>Editorial material</h2><p>Labarai, hotuna, bidiyo da sauran kayan aikin da aka wallafa na K-TECH MEDIA NETWORK ne ko masu lasisi. Ka nemi izini kafin sake wallafa abu gaba ɗaya.</p><h2>Newsroom accounts</h2><p>Ma’aikata su kiyaye bayanan shiga, su wallafa bayanan da suka tantance, kuma su bi matsayin izinin account ɗinsu.</p><h2>Corrections and updates</h2><p>Muna iya sabunta labarai domin ƙara bayani ko gyara kuskure. Ka tuntuɓe mu ta <a href="/contact">shafin contact</a> idan ka lura da matsala.</p><p className="legal-updated">An sabunta: Nuwamba 2026</p></article></section></>;
}
