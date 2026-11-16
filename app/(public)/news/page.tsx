import type { Metadata } from "next";
import { NewsCard } from "@/components/news-card";
import { getPublicNewsPage } from "@/lib/content";
import { site } from "@/lib/site";
import { newsCategories } from "@/lib/site";
import Link from "next/link";
import { categoryName, getLocale, t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Labarai", description: `Sabbin labarai daga ${site.name}.`, alternates: { types: { "application/rss+xml": `${site.url}/feed.xml` } } };
export const revalidate = 60;

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; category?: string }> }) {
  const params = await searchParams;
  const locale = await getLocale();
  const page = Math.max(1, Number(params.page) || 1);
  const { articles, total, pageSize } = await getPublicNewsPage({ page, search: params.q, categorySlug: params.category, locale });
  const pages = Math.ceil(total / pageSize);
  const linkFor = (nextPage: number) => { const query = new URLSearchParams(); if (params.q) query.set("q", params.q); if (params.category) query.set("category", params.category); query.set("page", String(nextPage)); return `/news?${query.toString()}`; };
  return <section className="section"><div className="container"><div className="section-header"><h1 className="section-title">{locale === "ha" ? "Sabbin Labarai" : "Latest News"}</h1><form action="/news" className="news-search-form" role="search"><label htmlFor="news-search">{locale === "ha" ? "Bincika labarai" : "Search news"}</label><input id="news-search" name="q" type="search" defaultValue={params.q} placeholder={locale === "ha" ? "Bincika labarai" : "Search stories"} /><button type="submit" aria-label={t(locale, "search")}><i className="bi bi-search" /></button></form></div><nav className="category-nav" aria-label={locale === "ha" ? "Tace labarai bisa rukuni" : "Filter by news category"}><Link href="/news" className={!params.category ? "category-pill active" : "category-pill"}>{locale === "ha" ? "Duka" : "All"}</Link>{newsCategories.map((category) => <Link key={category.slug} href={`/news/category/${category.slug}`} className={params.category === category.slug ? "category-pill active" : "category-pill"}>{categoryName(locale, category.slug, category.name)}</Link>)}</nav>{articles.length ? <><div className="row g-4">{articles.map((article) => <div className="col-md-6 col-lg-4" key={article.id}><NewsCard article={article} /></div>)}</div>{pages > 1 && <nav className="news-pagination" aria-label={locale === "ha" ? "Shafukan labarai" : "News pages"}>{page > 1 && <Link href={linkFor(page - 1)} rel="prev">← {locale === "ha" ? "Sabbi" : "Newer"}</Link>}<span>{locale === "ha" ? `Shafi ${page} na ${pages}` : `Page ${page} of ${pages}`}</span>{page < pages && <Link href={linkFor(page + 1)} rel="next">{locale === "ha" ? "Tsofaffi" : "Older"} →</Link>}</nav>}</> : <div className="empty-state"><i className="bi bi-newspaper" aria-hidden="true" /><h2>{locale === "ha" ? "Ba a samu labarai ba" : "No stories found"}</h2><p>{params.q ? (locale === "ha" ? "Gwada wasu kalmomin bincike." : "Try a different search term.") : (locale === "ha" ? "Labarai za su bayyana nan idan an wallafa su." : "Published stories will appear here.")}</p></div>}</div></section>;
}
