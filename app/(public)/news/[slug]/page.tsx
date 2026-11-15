import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { formatDate } from "@/components/news-card";
import { getArticleBySlug } from "@/lib/content";
import { site } from "@/lib/site";
import { ArticleEngagement } from "@/components/article-engagement";
import { ArticleBody } from "@/components/article-body";

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Ba a samu labarin ba" };
  return {
    title: article.title,
    description: article.excerpt || site.description,
    alternates: { canonical: `${site.url}/news/${article.slug}` },
    openGraph: { type: "article", url: `${site.url}/news/${article.slug}`, title: article.title, description: article.excerpt || site.description, images: [article.featured_image_url || `${site.url}/logo.png`], publishedTime: article.published_at || undefined },
    twitter: { card: "summary_large_image", title: article.title, description: article.excerpt || site.description, images: [article.featured_image_url || `${site.url}/logo.png`] },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();
  const articleUrl = `${site.url}/news/${article.slug}`;
  const shareText = encodeURIComponent(article.title);
  const shareUrl = encodeURIComponent(articleUrl);
  const structuredData = { "@context": "https://schema.org", "@type": "NewsArticle", headline: article.title, description: article.excerpt || undefined, image: [article.featured_image_url || `${site.url}/logo.png`], datePublished: article.published_at || article.created_at, dateModified: article.published_at || article.created_at, author: { "@type": "Person", name: article.author?.display_name || site.name }, publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: `${site.url}/logo.png` } }, mainEntityOfPage: `${site.url}/news/${article.slug}` };
  return <article className="article-page section"><div className="container article-container"><div className="article-category">{article.category?.name || "Labarai"}</div><h1>{article.title}</h1>{article.excerpt && <p className="article-standfirst">{article.excerpt}</p>}<div className="article-byline"><span>{article.author?.display_name || "Newsroom"}</span><time dateTime={article.published_at || article.created_at}>{formatDate(article.published_at || article.created_at)}</time></div><nav className="article-share" aria-label="Share this story"><span>Share:</span><a href={`https://wa.me/?text=${shareText}%20${shareUrl}`} target="_blank" rel="noreferrer">WhatsApp</a><a href={`https://t.me/share/url?url=${shareUrl}&text=${shareText}`} target="_blank" rel="noreferrer">Telegram</a></nav>{article.featured_image_url && <figure className="article-hero-image"><Image src={article.featured_image_url} alt={article.image_caption || article.title} width={1280} height={720} priority /><figcaption>{article.image_caption}</figcaption></figure>}<div className="article-body"><ArticleBody body={article.body} /></div><ArticleEngagement articleId={article.id} /></div><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /></article>;
}
