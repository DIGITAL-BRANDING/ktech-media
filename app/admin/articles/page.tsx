import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const labels: Record<string, string> = { draft: "Draft", in_review: "A tantance", published: "An wallafa", archived: "An ajiye" };

export default async function ArticlesAdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/admin/login");
  let query = supabase.from("articles").select("id,title,slug,status,created_at,published_at,category:categories(name),author:profiles!articles_author_id_fkey(display_name)").order("updated_at", { ascending: false }).limit(100);
  if (status && Object.hasOwn(labels, status)) query = query.eq("status", status as "draft");
  const { data } = await query;
  const { data: engagementRows } = await supabase.rpc("admin_article_engagement");
  const metrics = new Map((engagementRows || []).map((row) => [row.article_id, row]));
  return <section className="admin-page"><div className="admin-page-heading"><div><span className="eyebrow">NEWSROOM / ABUN CIKI</span><h1>Gudanar da labarai</h1><p>Duba matsayin labarai, bude preview ko ƙirƙiri sabon labari.</p></div><Link href="/admin/articles/new" className="btn-waraka-primary"><i className="bi bi-plus-lg" /> Sabon labari</Link></div>
    <nav className="admin-filter-row"><Link href="/admin/articles">Duka</Link>{Object.entries(labels).map(([key, label]) => <Link className={status === key ? "active" : ""} href={`/admin/articles?status=${key}`} key={key}>{label}</Link>)}</nav>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Labari</th><th>Category</th><th>Marubuci</th><th>Matsayi</th><th>Views</th><th>Likes</th><th>Comments</th><th>Kwanan wata</th><th /></tr></thead><tbody>{data?.map((article) => { const stats = metrics.get(article.id); return <tr key={article.id}><td><strong>{article.title}</strong><small>/{article.slug}</small></td><td>{(article.category as { name?: string } | null)?.name ?? "—"}</td><td>{(article.author as { display_name?: string } | null)?.display_name ?? "—"}</td><td><span className={`status-pill status-${article.status}`}>{labels[article.status] ?? article.status}</span></td><td>{Number(stats?.views || 0).toLocaleString()}</td><td>{Number(stats?.likes || 0).toLocaleString()}</td><td>{(Number(stats?.pending_comments || 0) + Number(stats?.approved_comments || 0)).toLocaleString()}{Number(stats?.pending_comments || 0) > 0 && <small>{stats?.pending_comments} pending</small>}</td><td>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(article.created_at))}</td><td><Link href={`/admin/articles/${article.id}/edit`} className="table-action">Edit</Link> <Link href={`/admin/articles/${article.id}/preview`} className="table-action">Preview <i className="bi bi-arrow-up-right" /></Link></td></tr>; })}</tbody></table>{!data?.length && <p className="empty-state">Babu labarai a wannan tacewar.</p>}</div>
  </section>;
}
