import Link from "next/link";
import Image from "next/image";
import { NewsCard } from "@/components/news-card";
import { getHomepageArticles, getPublicSiteSettings, getPublicVideos } from "@/lib/content";
import { newsCategories, site } from "@/lib/site";
import { getCurrentLiveStream } from "@/lib/broadcast";
import { SponsoredPlacement } from "@/components/sponsored-placement";
import { categoryName, getLocale } from "@/lib/i18n";

export const revalidate = 60;

export default async function HomePage() {
  const locale = await getLocale();
  const [articles, videos, settings, liveStream] = await Promise.all([getHomepageArticles(locale), getPublicVideos(locale), getPublicSiteSettings(), getCurrentLiveStream()]);
  const [featured, ...sideStories] = articles;
  const mostRead = [...articles].sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0)).slice(0, 5);

  return (
    <>
      <section className="hero" aria-label={locale === "ha" ? "Babban labari" : "Top story"}>
        <div className="hero-bg" />
        <div className="hero-gradient" />
        <div className="container">
          <div className="row align-items-end">
            <div className="col-lg-8">
              <div className="hero-content">
                <span className="hero-category"><i className="bi bi-lightning-fill" aria-hidden="true" />{featured?.category?.name || (locale === "ha" ? "Babban Labari" : "Top Story")}</span>
                <h1 className="hero-title">{featured?.title || (locale === "ha" ? "Labarai masu sahihanci daga Najeriya da duniya" : "Trusted news from Nigeria and around the world")}</h1>
                <div className="hero-meta"><span><i className="bi bi-person" aria-hidden="true" />{featured?.author?.display_name || "Newsroom"}</span><span><i className="bi bi-clock" aria-hidden="true" />{featured?.published_at ? formatDate(featured.published_at, locale === "ha" ? "ha-NG" : "en-NG") : (locale === "ha" ? "Sabbin labarai" : "Latest news")}</span></div>
                <p className="hero-desc">{featured?.excerpt || site.description}</p>
                <div className="d-flex gap-3 flex-wrap"><Link href={featured ? `/news/${featured.slug}` : "/news"} className="btn-waraka-primary"><i className="bi bi-arrow-right-circle" aria-hidden="true" /> {locale === "ha" ? "Karanta cikakken labari" : "Read the full story"}</Link><Link href="/live" className="btn-waraka-outline"><i className="bi bi-broadcast" aria-hidden="true" /> {locale === "ha" ? "Kalli kai tsaye" : "Watch live"}</Link></div>
              </div>
            </div>
            <div className="col-lg-4"><div className="hero-side"><p className="text-uppercase text-muted-custom side-heading">{locale === "ha" ? "Sabbin labarai" : "Latest stories"}</p>{sideStories.slice(0, 3).map((story) => <Link href={`/news/${story.slug}`} className="hero-side-card" key={story.id}><Image src={story.featured_image_url || "/logo.png"} alt={story.image_caption || ""} width={80} height={60} /><div><div className="hero-side-card-title">{story.title}</div><div className="hero-side-card-meta">{categoryName(locale, story.category?.slug || "", story.category?.name || (locale === "ha" ? "Labarai" : "News"))}</div></div></Link>)}</div></div>
          </div>
        </div>
      </section>

      <div className="container"><SponsoredPlacement slot="homepage_top" /></div>

      <div className="container"><SponsoredPlacement slot="homepage_top" /></div>

      <section className="section">
        <div className="container">
          <SectionHeader title={locale === "ha" ? "Sabbin Labarai" : "Latest News"} href="/news" linkLabel={locale === "ha" ? "Duba duka" : "View all"} />
          <nav className="category-nav" aria-label={locale === "ha" ? "Rukunin labarai" : "News categories"}><Link href="/news" className="category-pill active">{locale === "ha" ? "Duka" : "All"}</Link>{newsCategories.map((category) => <Link href={`/news?category=${category.slug}`} className="category-pill" key={category.slug}>{categoryName(locale, category.slug, category.name)}</Link>)}</nav>
          <div className="row g-4"><div className="col-lg-8"><div className="row g-4">{articles.slice(0, 6).map((article) => <div className="col-md-6" key={article.id}><NewsCard article={article} /></div>)}</div></div><aside className="col-lg-4"><div className="most-read-panel"><div className="section-header"><h2 className="section-title">{locale === "ha" ? "Abubuwan da aka fi karantawa" : "Most read"}</h2></div>{mostRead.map((article, index) => <Link href={`/news/${article.slug}`} className="most-read-item" key={article.id}><span>{String(index + 1).padStart(2, "0")}</span><strong>{article.title}</strong></Link>)}</div></aside></div>
        </div>
      </section>

      <section className="live-section section">
        <div className="container">
          <SectionHeader title={locale === "ha" ? "Kalli kai tsaye" : "Watch live"} href="/live" linkLabel={locale === "ha" ? "Buɗe shafin live" : "Open live page"} />
          <div className="row g-4 align-items-center">
            <div className="col-lg-8"><div className="live-player-wrapper">{liveStream?.status === "live" ? <><LiveStreamEmbed embedUrl={liveStream.embed_url} hlsUrl={liveStream.hls_url} title={liveStream.title} /><span className="live-badge"><span className="live-dot" /> LIVE</span></> : <div className="stream-placeholder"><i className="bi bi-broadcast-pin" aria-hidden="true" /><h3>{liveStream?.title || "A nan za a nuna live stream"}</h3><p>{liveStream?.status === "scheduled" ? "Shiri na gaba zai fara a lokacin da aka tsara." : "Babu live broadcast a yanzu. Duba jadawalin shirin."}</p><Link href="/live" className="btn-waraka-primary">Duba shafin live</Link></div>}</div></div>
            <div className="col-lg-4"><div className="live-info"><span className="eyebrow">{settings.site_name || site.name}</span><h3>{liveStream?.status === "live" ? (locale === "ha" ? "Ana yaɗawa yanzu" : "Live now") : (locale === "ha" ? "Shiri na gaba" : "Next broadcast")}</h3><p>{liveStream?.title || (locale === "ha" ? "Rahotanni, hirarraki, da labaran kai tsaye daga newsroom ɗinmu." : "Reporting, interviews and live news from our newsroom.")}</p><Link href="/live" className="section-link">{locale === "ha" ? "Duba jadawali" : "View schedule"} <i className="bi bi-arrow-right" aria-hidden="true" /></Link></div></div>
          </div>
        </div>
      </section>

      <section className="section media-section">
        <div className="container"><SectionHeader title={locale === "ha" ? "Bidiyo" : "Videos"} href="/videos" linkLabel={locale === "ha" ? "Duba duka" : "View all"} />{videos.length ? <div className="row g-4">{videos.slice(0, 3).map((video) => <div className="col-md-6 col-lg-4" key={video.id}><Link href={`/videos/${video.slug}`} className="video-card"><div className="video-thumb">{video.thumbnail_url ? <Image src={video.thumbnail_url} alt="" fill sizes="(min-width: 992px) 33vw, 100vw" /> : <div className="video-thumb-fallback"><i className="bi bi-camera-video" /></div>}<span className="video-play-btn"><span className="video-play-icon"><i className="bi bi-play-fill" aria-hidden="true" /></span></span></div><div className="video-card-body"><h3>{video.title}</h3></div></Link></div>)}</div> : <div className="media-feature-panel"><i className="bi bi-play-circle" aria-hidden="true" /><div><h3>{locale === "ha" ? "Bidiyoyin newsroom" : "Newsroom videos"}</h3><p>{locale === "ha" ? "Rahotanni, hirarraki da shirye-shiryen kafar za su bayyana a nan bayan wallafawa." : "Reporting, interviews and programmes will appear here once published."}</p></div><Link href="/videos" className="section-link">{locale === "ha" ? "Duba bidiyo" : "Browse videos"} <i className="bi bi-arrow-right" /></Link></div>}</div>
      </section>

      <section className="section photo-callout"><div className="container"><div className="photo-callout-inner"><div><span className="eyebrow">{locale === "ha" ? "Hotunan labarai" : "Photo stories"}</span><h2>{locale === "ha" ? "Dubi labarai ta cikin hotuna" : "Stories through photography"}</h2><p>{locale === "ha" ? "Photo stories da hotunan da newsroom ta wallafa suna bayyana a shafin hotuna." : "Browse photo stories and images published by our newsroom."}</p></div><Link href="/photos" className="btn-waraka-outline">{locale === "ha" ? "Duba hotuna" : "Browse photos"} <i className="bi bi-arrow-right" aria-hidden="true" /></Link></div></div></section>
      <section className="section newsroom-cta"><div className="container"><div><span className="eyebrow">{settings.site_name || site.name}</span><h2>{locale === "ha" ? "Sahihan labarai. Cikakken bayani." : "Trusted reporting. Clear context."}</h2><p>{locale === "ha" ? "Bi sabbin labarai daga Najeriya da duniya a duk lokacin da suka faru." : "Follow the latest stories from Nigeria and around the world."}</p></div><Link href="/news" className="btn-waraka-primary">{locale === "ha" ? "Buɗe dukkan labarai" : "Browse all news"} <i className="bi bi-arrow-right" /></Link></div></section>
    </>
  );
}

function LiveStreamEmbed({ embedUrl, hlsUrl, title }: { embedUrl: string | null; hlsUrl: string | null; title: string }) {
  const url = embedUrl || hlsUrl;
  if (!url) return null;
  return embedUrl ? <iframe src={url} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen /> : <video controls playsInline preload="none" aria-label={title}><source src={url} type="application/vnd.apple.mpegurl" /></video>;
}

function SectionHeader({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return <div className="section-header"><h2 className="section-title">{title}</h2><Link href={href} className="section-link">{linkLabel} <i className="bi bi-arrow-right" aria-hidden="true" /></Link></div>;
}

function formatDate(value: string, locale = "en-NG") {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
}
