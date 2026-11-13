import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { formatDate } from "@/components/news-card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";

type Props = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

export default async function ArticlePreviewPage({ params }: Props) {
  if (!isSupabaseConfigured()) return <SupabaseSetupNotice title="Haɗa Supabase domin duba preview" />;
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/admin/login");
  const { data: article } = await supabase.from("articles").select("id, title, excerpt, body, featured_image_url, image_caption, status, updated_at, author:profiles!articles_author_id_fkey(display_name), category:categories(name)").eq("id", id).maybeSingle();
  if (!article) notFound();
  return <article className="article-page section"><div className="container article-container"><span className="status-badge status-draft">PREVIEW • {article.status}</span><h1>{article.title}</h1>{article.excerpt && <p className="article-standfirst">{article.excerpt}</p>}<div className="article-byline"><span>{article.author?.display_name || "Newsroom"}</span><span>{article.category?.name || "Labarai"}</span><time dateTime={article.updated_at}>An gyara {formatDate(article.updated_at)}</time></div>{article.featured_image_url && <figure className="article-hero-image"><Image src={article.featured_image_url} alt={article.image_caption || article.title} width={1280} height={720} /><figcaption>{article.image_caption}</figcaption></figure>}<div className="article-body">{toPlainText(article.body)}</div></div></article>;
}

function toPlainText(value: unknown): React.ReactNode {
  if (typeof value === "string") return <p>{value}</p>;
  if (Array.isArray(value)) return value.map((part, index) => <span key={index}>{toPlainText(part)}</span>);
  if (value && typeof value === "object") {
    const node = value as { type?: string; text?: string; content?: unknown[] };
    if (node.type === "text") return node.text;
    if (node.content) {
      const children = node.content.map((part, index) => <span key={index}>{toPlainText(part)}</span>);
      return node.type === "paragraph" || node.type === "heading" ? <p>{children}</p> : children;
    }
  }
  return null;
}
