import Link from "next/link";
import Image from "next/image";
import type { NewsArticle } from "@/lib/content";

export function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <article className="news-card">
      <Link href={`/news/${article.slug}`} className="news-card-img">
        <Image src={article.featured_image_url || "/logo.png"} alt={article.image_caption || article.title} fill sizes="(min-width: 992px) 33vw, (min-width: 768px) 50vw, 100vw" />
        {article.category && <span className="news-card-badge">{article.category.name}</span>}
      </Link>
      <div className="news-card-body">
        <h3><Link href={`/news/${article.slug}`} className="news-card-title">{article.title}</Link></h3>
        {article.excerpt && <p className="news-card-excerpt">{article.excerpt}</p>}
        <div className="news-card-meta"><span>{article.author?.display_name || "Newsroom"}</span><time dateTime={article.published_at || article.created_at}>{formatDate(article.published_at || article.created_at)}</time></div>
      </div>
    </article>
  );
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ha-NG", { dateStyle: "medium" }).format(new Date(value));
}
