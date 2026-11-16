import Link from "next/link";
import Image from "next/image";
import { newsCategories, site } from "@/lib/site";
import { getPublicSiteSettings } from "@/lib/content";
import { categoryName, getLocale, t } from "@/lib/i18n";
import { NewsletterForm } from "@/components/newsletter-form";
import { WebPushSubscribe } from "@/components/web-push-subscribe";

const socialItems = [
  ["facebook_url", "Facebook", "bi-facebook"], ["x_url", "X", "bi-twitter-x"],
  ["youtube_url", "YouTube", "bi-youtube"], ["instagram_url", "Instagram", "bi-instagram"],
  ["whatsapp_url", "WhatsApp", "bi-whatsapp"], ["telegram_url", "Telegram", "bi-telegram"],
] as const;

export async function SiteFooter() {
  const [settings, locale] = await Promise.all([getPublicSiteSettings(), getLocale()]);
  const socials = socialItems.filter(([key]) => settings[key]);
  return <footer className="footer"><div className="container">
    <div className="row g-5 footer-main-row">
      <div className="col-lg-4"><Link href="/" className="footer-brand"><Image src="/k-tech-media-network.png" alt="K-TECH MEDIA NETWORK logo" width={58} height={58} /><span><strong>{settings.site_name || site.name}</strong><small>{site.tagline}</small></span></Link><p className="footer-desc">{locale === "ha" ? "K-TECH MEDIA NETWORK na kawo muku labarai, bincike, nishaɗi da bidiyo daga Najeriya da duniya." : "K-TECH MEDIA NETWORK brings you trusted news, analysis, entertainment and video from Nigeria and around the world."}</p>{socials.length > 0 && <div className="social-links">{socials.map(([key, label, icon]) => <a href={settings[key]} className="social-link" aria-label={label} key={key} target="_blank" rel="noreferrer"><i className={`bi ${icon}`} aria-hidden="true" /></a>)}</div>}</div>
      <div className="col-6 col-lg-2"><h2 className="footer-heading">{t(locale, "quickLinks")}</h2><ul className="footer-links"><li><Link href="/">{t(locale, "home")}</Link></li><li><Link href="/about">{t(locale, "aboutUs")}</Link></li><li><Link href="/live">{t(locale, "liveTv")}</Link></li><li><Link href="/radio">{t(locale, "radio")}</Link></li><li><Link href="/news">{t(locale, "news")}</Link></li><li><Link href="/programs">{t(locale, "programs")}</Link></li><li><Link href="/podcasts">{t(locale, "podcasts")}</Link></li><li><Link href="/videos">{t(locale, "videos")}</Link></li><li><Link href="/awards">{t(locale, "awards")}</Link></li></ul></div>
      <div className="col-6 col-lg-2"><h2 className="footer-heading">{t(locale, "newsTopics")}</h2><ul className="footer-links">{newsCategories.map((category) => <li key={category.slug}><Link href={`/news?category=${category.slug}`}>{categoryName(locale, category.slug, category.name)}</Link></li>)}</ul></div>
      <div className="col-lg-4"><h2 className="footer-heading">{t(locale, "getInTouch")}</h2><div className="footer-contact-item"><i className="bi bi-geo-alt-fill" /><span>{settings.office_address || "Nigeria"}</span></div><div className="footer-contact-item"><i className="bi bi-telephone-fill" />{settings.phone ? <a href={`tel:${settings.phone}`}>{settings.phone}</a> : <Link href="/contact">{locale === "ha" ? "Tuntuɓi newsroom" : "Contact the newsroom"}</Link>}</div><div className="footer-contact-item"><i className="bi bi-envelope-fill" />{settings.contact_email ? <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a> : <Link href="/contact">{t(locale, "newsroomEmail")}</Link>}</div><div className="footer-contact-item"><i className="bi bi-envelope-fill" />{settings.advertising_email ? <a href={`mailto:${settings.advertising_email}`}>{settings.advertising_email}</a> : <Link href="/advertise">{t(locale, "advertisingInquiries")}</Link>}</div><div className="footer-contact-item"><i className="bi bi-clock-fill" /><span>{locale === "ha" ? "Newsroom • Najeriya" : "Newsroom • Nigeria"}</span></div></div>
    </div>
    <section className="footer-audience"><div><h2>{t(locale, "subscribeNewsletter")}</h2><p>{locale === "ha" ? "Bi channel ɗinmu na WhatsApp da Telegram domin samun updates." : "Subscribe for the daily briefing and follow our WhatsApp or Telegram channels."}</p><div className="audience-optins"><NewsletterForm locale={locale} /><WebPushSubscribe locale={locale} /></div></div></section>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} {settings.site_name || site.name}. {t(locale, "allRightsReserved")}</span><div className="footer-legal-links"><Link href="/privacy">{t(locale, "privacy")}</Link><Link href="/terms">{t(locale, "terms")}</Link><Link href="/sitemap.xml">Sitemap</Link></div></div>
  </div></footer>;
}
