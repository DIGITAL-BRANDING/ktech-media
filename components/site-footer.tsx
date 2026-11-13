import Link from "next/link";
import Image from "next/image";
import { newsCategories, site } from "@/lib/site";
import { getPublicSiteSettings } from "@/lib/content";

const socialItems = [
  ["facebook_url", "Facebook", "bi-facebook"], ["x_url", "X", "bi-twitter-x"],
  ["youtube_url", "YouTube", "bi-youtube"], ["instagram_url", "Instagram", "bi-instagram"],
  ["whatsapp_url", "WhatsApp", "bi-whatsapp"], ["telegram_url", "Telegram", "bi-telegram"],
] as const;

export async function SiteFooter() {
  const settings = await getPublicSiteSettings();
  const socials = socialItems.filter(([key]) => settings[key]);
  return <footer className="footer"><div className="container">
    <div className="row g-5 footer-main-row">
      <div className="col-lg-4"><Link href="/" className="footer-brand"><Image src="/k-tech-media-network.png" alt="K-TECH MEDIA NETWORK logo" width={58} height={58} /><span><strong>{settings.site_name || site.name}</strong><small>{site.tagline}</small></span></Link><p className="footer-desc">K-TECH MEDIA NETWORK na kawo muku labarai, bincike, nishaɗi da bidiyo daga Najeriya da duniya.</p>{socials.length > 0 && <div className="social-links">{socials.map(([key, label, icon]) => <a href={settings[key]} className="social-link" aria-label={label} key={key} target="_blank" rel="noreferrer"><i className={`bi ${icon}`} aria-hidden="true" /></a>)}</div>}</div>
      <div className="col-6 col-lg-2"><h2 className="footer-heading">QUICK LINKS</h2><ul className="footer-links"><li><Link href="/">Home</Link></li><li><Link href="/about">About Us</Link></li><li><Link href="/live">Live TV</Link></li><li><Link href="/news">News</Link></li><li><Link href="/programs">Programs</Link></li><li><Link href="/videos">Videos</Link></li><li><Link href="/awards">Awards</Link></li></ul></div>
      <div className="col-6 col-lg-2"><h2 className="footer-heading">NEWS TOPICS</h2><ul className="footer-links">{newsCategories.map((category) => <li key={category.slug}><Link href={`/news?category=${category.slug}`}>{category.name}</Link></li>)}</ul></div>
      <div className="col-lg-4"><h2 className="footer-heading">GET IN TOUCH</h2><div className="footer-contact-item"><i className="bi bi-geo-alt-fill" /><span>{settings.office_address || "Nigeria"}</span></div><div className="footer-contact-item"><i className="bi bi-telephone-fill" />{settings.phone ? <a href={`tel:${settings.phone}`}>{settings.phone}</a> : <Link href="/contact">Contact the newsroom</Link>}</div><div className="footer-contact-item"><i className="bi bi-envelope-fill" />{settings.contact_email ? <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a> : <Link href="/contact">Newsroom email</Link>}</div><div className="footer-contact-item"><i className="bi bi-envelope-fill" />{settings.advertising_email ? <a href={`mailto:${settings.advertising_email}`}>{settings.advertising_email}</a> : <Link href="/advertise">Advertising inquiries</Link>}</div><div className="footer-contact-item"><i className="bi bi-clock-fill" /><span>Newsroom • Nigeria</span></div></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} {settings.site_name || site.name}. All Rights Reserved.</span><div className="footer-legal-links"><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Use</Link><Link href="/sitemap.xml">Sitemap</Link></div></div>
  </div></footer>;
}
