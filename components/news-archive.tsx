import Link from "next/link";
import { NewsCard } from "@/components/news-card";
import { getPublicNewsPage } from "@/lib/content";
import { getLocale } from "@/lib/i18n";

export async function NewsArchive({ title, categorySlug, tagSlug, page = 1, search, basePath }: { title: string; categorySlug?: string; tagSlug?: string; page?: number; search?: string; basePath: string }) {
  const locale = await getLocale();
  const result = await getPublicNewsPage({ page, search, categorySlug, tagSlug, locale });
  const pages = Math.ceil(result.total / result.pageSize);
  const query = (targetPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    params.set("page", String(targetPage));
    return `${basePath}?${params.toString()}`;
  };
  return <section className="section"><div className="container"><div className="section-header"><h1 className="section-title">{title}</h1><form action={basePath} className="news-search-form" role="search"><label htmlFor="archive-search">Search news</label><input id="archive-search" type="search" name="q" defaultValue={search} placeholder="Search stories" /><button type="submit" aria-label="Search"><i className="bi bi-search" /></button></form></div>{result.articles.length ? <><div className="row g-4">{result.articles.map((article) => <div className="col-md-6 col-lg-4" key={article.id}><NewsCard article={article} /></div>)}</div>{pages > 1 && <nav className="news-pagination" aria-label="News pages">{page > 1 && <Link href={query(page - 1)} rel="prev">← Newer</Link>}<span>Page {page} of {pages}</span>{page < pages && <Link href={query(page + 1)} rel="next">Older →</Link>}</nav>}</> : <div className="empty-state"><i className="bi bi-newspaper" aria-hidden="true" /><h2>No stories found</h2><p>{search ? "Try a different search term." : "Published stories will appear here."}</p></div>}</div></section>;
}
