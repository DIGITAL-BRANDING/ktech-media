import { redirect } from "next/navigation";
import { moderateComment } from "@/app/admin/comments/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage({ searchParams }: { searchParams: Promise<{ updated?: string; error?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (typeof userId !== "string") redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", userId).maybeSingle();
  if (!profile?.is_active || profile.role === "reporter") redirect("/admin");
  const { data: comments } = await supabase.from("article_comments")
    .select("id, article_id, commenter_name, body, status, created_at, article:articles(title, slug)")
    .order("created_at", { ascending: false }).limit(200);
  return <section className="admin-page">
    <div className="admin-page-heading"><div><span className="eyebrow">NEWSROOM / MODERATION</span><h1>Reader comments</h1><p>Review reader comments before they appear publicly.</p></div></div>
    {params.updated && <p className="success-message" role="status">Comment moderation has been saved.</p>}
    {params.error && <p className="form-error" role="alert">Comment could not be updated. Refresh and try again.</p>}
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Comment</th><th>Article</th><th>Status</th><th>Submitted</th><th>Action</th></tr></thead><tbody>
      {comments?.map((comment) => {
        const article = comment.article as { title?: string; slug?: string } | null;
        return <tr key={comment.id}><td><strong>{comment.commenter_name}</strong><small>{comment.body}</small></td><td>{article?.title || "Deleted article"}</td><td><span className={`status-pill status-${comment.status}`}>{comment.status}</span></td><td>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(comment.created_at))}</td><td>{comment.status === "pending" ? <div className="comment-moderation-actions"><form action={moderateComment}><input type="hidden" name="commentId" value={comment.id} /><button className="table-action" name="decision" value="approved">Approve</button></form><form action={moderateComment}><input type="hidden" name="commentId" value={comment.id} /><button className="table-action" name="decision" value="rejected">Reject</button></form></div> : "—"}</td></tr>;
      })}
    </tbody></table>{!comments?.length && <p className="empty-state">No comments submitted yet.</p>}</div>
  </section>;
}
