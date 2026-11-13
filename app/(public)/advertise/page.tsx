import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { getPublicSiteSettings } from "@/lib/content";

export const metadata = { title: "Advertise" };
export default async function AdvertisePage() {
  const settings = await getPublicSiteSettings();
  const email = settings.advertising_email || settings.contact_email;
  return <><PageIntro eyebrow="PARTNER WITH US" title="Advertise with K-TECH MEDIA NETWORK" description="Tuntuɓi ƙungiyarmu domin tattauna hanyoyin isar da saƙon tallace-tallace ga masu sauraronmu." action={email ? { href: `mailto:${email}`, label: "Email our advertising team" } : { href: "/contact", label: "Contact our team" }} /><section className="section"><div className="container"><div className="page-feature-grid"><article className="page-feature-card"><i className="bi bi-display" /><h2>Digital placements</h2><p>Tattauna banner da sauran wuraren tallace-tallace a shafukan yanar gizonmu.</p></article><article className="page-feature-card"><i className="bi bi-camera-video" /><h2>Video sponsorship</h2><p>Haɗin gwiwa kan bidiyo da shirye-shirye bisa yarjejeniya bayyananniya.</p></article><article className="page-feature-card"><i className="bi bi-megaphone" /><h2>Campaigns</h2><p>Tsara kamfen bisa manufa, lokaci da bayanan da ɓangarorin suka amince da su.</p></article></div><div className="page-note"><i className="bi bi-info-circle" /><p>Ba a haɗa tallace-tallace da shawarar editoci kan labarai ba. Dole ne duk sponsored content ya bayyana a sarari.</p></div>{email && <p className="contact-detail"><i className="bi bi-envelope" /> <a href={`mailto:${email}`}>{email}</a></p>}<p className="advertise-cta">Kana da tambaya? <Link href="/contact">Tuntuɓi K-TECH MEDIA NETWORK</Link>.</p></div></section></>;
}
