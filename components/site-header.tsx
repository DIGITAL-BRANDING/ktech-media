import Link from "next/link";
import Image from "next/image";
import { newsCategories, site } from "@/lib/site";
import { getHomepageArticles, getPublicSiteSettings } from "@/lib/content";
import { ThemeToggle } from "@/components/theme-provider";
import { CurrentNavLink } from "@/components/current-nav-link";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Programs", href: "/programs" },
  { label: "Videos", href: "/videos" },
  { label: "Awards", href: "/awards" },
  { label: "About", href: "/about" },
  { label: "Advertise", href: "/advertise" },
  { label: "Contact", href: "/contact" },
];

export async function SiteHeader() {
  const [articles, settings] = await Promise.all([getHomepageArticles(), getPublicSiteSettings()]);
  const breaking = articles.filter((article) => article.is_breaking).slice(0, 4);
  const displayName = settings.site_name || site.name;
  return (
    <>
      <div className="top-bar">
        <div className="container-fluid px-3">
          <div className="d-flex align-items-center gap-3">
            <span className="fw-bold text-white text-nowrap breaking-label">⚡ BREAKING</span>
            <div className="ticker-wrapper flex-grow-1">
              <div className="ticker-content text-white">
                {breaking.length ? breaking.map((article) => <Link className="ticker-item" href={`/news/${article.slug}`} key={article.id}>{article.title}</Link>) : <span className="ticker-item">{settings.ticker_text || "Labarai daga Najeriya da duniya cikin Hausa."}</span>}
              </div>
            </div>
            <time className="text-white text-nowrap station-time">{new Intl.DateTimeFormat("en-NG", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" }).format(new Date())} WAT</time>
          </div>
        </div>
      </div>

      <header className="navbar-waraka" aria-label="Babban menu">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between w-100">
            <Link href="/" className="navbar-brand-custom" aria-label={`${displayName} gida`}>
              <Image src="/k-tech-media-network.png" alt="K-TECH MEDIA NETWORK logo" width={58} height={58} className="site-brand-logo" priority />
              <span className="brand-copy"><strong>{displayName}</strong><span>{site.tagline}</span></span>
            </Link>
            <nav className="site-nav d-none d-xl-flex align-items-center gap-1" aria-label="Main navigation">
              <CurrentNavLink href="/" className="nav-link-custom">Home</CurrentNavLink>
              <details className="category-menu news-dropdown">
                <summary className="nav-link-custom">News <i className="bi bi-chevron-down" aria-hidden="true" /></summary>
                <div className="dropdown-menu-dark-custom category-menu-list">
                  <Link href="/news" className="dropdown-item-custom">All news</Link>
                  {newsCategories.map((category) => <Link key={category.slug} href={`/news?category=${category.slug}`} className="dropdown-item-custom">{category.name}</Link>)}
                </div>
              </details>
              {navigation.slice(1).map((item) => <CurrentNavLink key={item.href} href={item.href} className="nav-link-custom">{item.label}</CurrentNavLink>)}
              <CurrentNavLink href="/live" className="nav-link-custom nav-live-btn"><span className="live-dot" aria-hidden="true" /> Watch Live</CurrentNavLink>
              <ThemeToggle compact />
            </nav>
            <details className="mobile-nav d-xl-none">
              <summary aria-label="Buɗe menu"><i className="bi bi-list" aria-hidden="true" /></summary>
              <nav className="mobile-nav-list" aria-label="Menu na waya">
                {navigation.slice(0, 1).map((item) => <CurrentNavLink key={item.href} href={item.href}>{item.label}</CurrentNavLink>)}
                <Link href="/news">News</Link>
                {newsCategories.map((category) => <Link key={category.slug} href={`/news?category=${category.slug}`}>{category.name}</Link>)}
                {navigation.slice(1).map((item) => <CurrentNavLink key={item.href} href={item.href}>{item.label}</CurrentNavLink>)}
                <Link href="/photos">Photos</Link><Link href="/live" className="mobile-live-link">Watch Live</Link>
                <ThemeToggle />
              </nav>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}
