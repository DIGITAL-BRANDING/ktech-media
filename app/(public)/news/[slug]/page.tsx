import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { formatDate } from "@/components/news-card";
import { getArticleBySlug } from "@/lib/content";
import { site } from "@/lib/site";
import { ArticleEngagement } from "@/components/article-engagement";

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Ba a samu labarin ba" };
  return {
    title: article.title,
    description: article.excerpt || site.description,
    openGraph: { type: "article", title: article.title, description: article.excerpt || site.description, images: article.featured_image_url ? [article.featured_image_url] : undefined, publishedTime: article.published_at || undefined },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();
  return <article className="article-page section"><div className="container article-container"><div className="article-category">{article.category?.name || "Labarai"}</div><h1>{article.title}</h1>{article.excerpt && <p className="article-standfirst">{article.excerpt}</p>}<div className="article-byline"><span>{article.author?.display_name || "Newsroom"}</span><time dateTime={article.published_at || article.created_at}>{formatDate(article.published_at || article.created_at)}</time></div>{article.featured_image_url && <figure className="article-hero-image"><Image src={article.featured_image_url} alt={article.image_caption || article.title} width={1280} height={720} priority /><figcaption>{article.image_caption}</figcaption></figure>}<div className="article-body">{toPlainText(article.body) || <p>Abubuwan cikakken labari za su bayyana nan.</p>}</div><ArticleEngagement articleId={article.id} /></div></article>;
}

function toPlainText(value: unknown): React.ReactNode {
  if (typeof value === "string") return <p key={value}>{value}</p>;
  if (Array.isArray(value)) return value.flatMap((part, index) => <span key={index}>{toPlainText(part)}</span>);
  if (value && typeof value === "object") {
    const node = value as { type?: string; text?: string; content?: unknown[] };
    if (node.type === "text" && node.text) return node.text;
    if (node.content) {
      const content = node.content.map((part, index) => <span key={index}>{toPlainText(part)}</span>);
      return node.type === "paragraph" || node.type === "heading" ? <p>{content}</p> : content;
    }
  }
  return null;
}
