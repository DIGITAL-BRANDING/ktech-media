import { PageIntro } from "@/components/page-intro";
import { site } from "@/lib/site";

export const metadata = { title: "Privacy policy" };
export default function PrivacyPage() {
  return <><PageIntro eyebrow={site.name} title="Privacy Policy" description="Yadda wannan website ke sarrafa bayanan amfani da bayanan shiga." /><section className="section"><article className="container legal-content"><h2>Information we collect</h2><p>Idan ka shiga newsroom, tsarin Supabase Auth yana sarrafa bayanan account da ake buƙata domin tabbatar da shiga. Kada ka tura bayanan sirri ta hanyar labarin jama’a.</p><h2>Preferences and cookies</h2><p>Website yana adana zaɓin dark ko light theme a browser ɗinka. Shigar newsroom na iya amfani da cookies masu tsaro domin kiyaye zaman shiga.</p><h2>How information is used</h2><p>Ana amfani da bayanan account domin izinin newsroom da gudanar da wallafe-wallafe. Ba a sayar da bayanan shiga.</p><h2>Contact</h2><p>Don tambaya game da sirri, yi amfani da <a href="/contact">shafin tuntuɓa</a> ko official contact da aka wallafa a can.</p><p className="legal-updated">An sabunta: Nuwamba 2026</p></article></section></>;
}
