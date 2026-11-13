import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDate } from "@/components/news-card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { reviewArticle } from "@/app/admin/review/actions";
import { reviewPhotoStory } from "@/app/admin/review/photo-actions";
import { reviewVideo } from "@/app/admin/review/video-actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";

export const metadata = { title: "Duba labarai" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string; updated?: string }> };

export default async function ReviewQueuePage({ searchParams }: Props) {
  if (!isSupabaseConfigured()) return <SupabaseSetupNotice title="Haɗa Supabase domin duba wallafe-wallafe" />;
  const { error, updated } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/admin/login");

  const [{ data: profile }, { data: articles }, { data: photoStories }, { data: videos }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", claims.claims.sub).maybeSingle(),
    supabase.from("articles").select("id, title, slug, excerpt, status, updated_at, author:profiles!articles_author_id_fkey(display_name)").eq("status", "in_review").order("updated_at", { ascending: true }),
    supabase.from("photo_stories").select("id, title, slug, description, status, updated_at, author:profiles!photo_stories_author_id_fkey(display_name)").eq("status", "in_review").order("updated_at", { ascending: true }),
    supabase.from("videos").select("id, title, slug, description, source_url, status, updated_at, author:profiles!videos_author_id_fkey(display_name)").eq("status", "in_review").order("updated_at", { ascending: true }),
  ]);
  const canPublish = profile?.role === "editor" || profile?.role === "admin";

  return <section className="section"><div className="container admin-gate"><span className="eyebrow">NEWSROOM • REVIEW QUEUE</span><h1>Jerin tantancewa</h1><p>Ka duba rubutu, sahihancin bayani, category da media kafin wallafawa.</p>{updated && <p className="success-message" role="status">An sabunta matsayin labarin.</p>}{error && <p className="form-error" role="alert">Ba a iya sabunta wannan labari ba. Mai amfani yana bukatar izinin edita/admin.</p>}<h2 className="review-section-title">Labarai</h2><div className="review-list">{articles?.length ? articles.map((article) => <article className="review-item" key={article.id}><div className="review-item-main"><span className="status-badge status-pending">{article.status}</span><h3>{article.title}</h3><p>{article.excerpt || "Babu taƙaitaccen bayani."}</p><small>{relationName(article.author) || "Newsroom"} • An gyara {formatDate(article.updated_at)}</small></div><div className="review-actions"><Link className="btn-sm-admin" href={`/admin/articles/${article.id}/preview`} target="_blank">Duba preview</Link>{canPublish && <><form action={reviewArticle}><input type="hidden" name="articleId" value={article.id} /><button className="btn-sm-admin" name="action" value="return">Mayar wa marubuci</button></form><form action={reviewArticle}><input type="hidden" name="articleId" value={article.id} /><button className="btn-red" name="action" value="publish">Wallafa</button></form></>}</div></article>) : <p className="review-empty">Babu labarin da ake tantancewa.</p>}</div><h2 className="review-section-title">Photo stories</h2><div className="review-list">{photoStories?.length ? photoStories.map((story) => <article className="review-item" key={story.id}><div className="review-item-main"><span className="status-badge status-pending">{story.status}</span><h3>{story.title}</h3><p>{story.description || "Babu taƙaitaccen bayani."}</p><small>{relationName(story.author) || "Newsroom"} • An gyara {formatDate(story.updated_at)}</small></div><div className="review-actions"><Link className="btn-sm-admin" href={`/admin/photos/${story.id}/preview`} target="_blank">Duba preview</Link>{canPublish && <><form action={reviewPhotoStory}><input type="hidden" name="storyId" value={story.id} /><button className="btn-sm-admin" name="action" value="return">Mayar wa marubuci</button></form><form action={reviewPhotoStory}><input type="hidden" name="storyId" value={story.id} /><button className="btn-red" name="action" value="publish">Wallafa</button></form></>}</div></article>) : <p className="review-empty">Babu photo story da ake tantancewa.</p>}</div><h2 className="review-section-title">Bidiyo</h2><div className="review-list">{videos?.length ? videos.map((video) => <article className="review-item" key={video.id}><div className="review-item-main"><span className="status-badge status-pending">{video.status}</span><h3>{video.title}</h3><p>{video.description || "Babu taƙaitaccen bayani."}</p><small>{relationName(video.author) || "Newsroom"} • An gyara {formatDate(video.updated_at)}</small></div><div className="review-actions"><a className="btn-sm-admin" href={video.source_url || "#"} target="_blank" rel="noopener noreferrer">Duba bidiyo</a>{canPublish && <><form action={reviewVideo}><input type="hidden" name="videoId" value={video.id} /><button className="btn-sm-admin" name="action" value="return">Mayar wa marubuci</button></form><form action={reviewVideo}><input type="hidden" name="videoId" value={video.id} /><button className="btn-red" name="action" value="publish">Wallafa</button></form></>}</div></article>) : <p className="review-empty">Babu bidiyon da ake tantancewa.</p>}</div></div></section>;
}

function relationName(value: { display_name: string } | { display_name: string }[] | null) {
  return Array.isArray(value) ? value[0]?.display_name : value?.display_name;
}
