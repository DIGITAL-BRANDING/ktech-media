import type { Metadata } from "next";
import { NewsCard } from "@/components/news-card";
import { getHomepageArticles } from "@/lib/content";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Labarai", description: `Sabbin labarai daga ${site.name}.` };
export const revalidate = 60;

export default async function NewsPage() {
  const articles = await getHomepageArticles();
  return <section className="section"><div className="container"><div className="section-header"><h1 className="section-title">Sabbin Labarai</h1></div>{articles.length ? <div className="row g-4">{articles.map((article) => <div className="col-md-6 col-lg-4" key={article.id}><NewsCard article={article} /></div>)}</div> : <div className="empty-state"><i className="bi bi-newspaper" aria-hidden="true" /><h2>Ana shirya shafin labarai</h2><p>Za a nuna labaran da editoci suka wallafa nan idan an haɗa Supabase.</p></div>}</div></section>;
}
