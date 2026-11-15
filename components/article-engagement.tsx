"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Counts = { views: number; likes: number; comments: number };
type PublicComment = { id: string; commenter_name: string; body: string; created_at: string };

function getViewerKey() {
  const key = "k-tech-newsroom-viewer";
  let value = window.localStorage.getItem(key);
  if (!value) {
    value = window.crypto.randomUUID();
    window.localStorage.setItem(key, value);
  }
  return value;
}

export function ArticleEngagement({ articleId }: { articleId: string }) {
  const [counts, setCounts] = useState<Counts>({ views: 0, likes: 0, comments: 0 });
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const refreshEngagement = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    const [{ data: totals }, { data: publicComments }] = await Promise.all([
      supabase.rpc("get_public_article_engagement", { p_article_id: articleId, p_viewer_key: getViewerKey() }),
      supabase.from("article_comments").select("id, commenter_name, body, created_at")
        .eq("article_id", articleId).eq("status", "approved").order("approved_at", { ascending: false }).limit(20),
    ]);
    if (totals?.[0]) {
      setCounts(totals[0]);
      setLiked(totals[0].liked);
    }
    setComments((publicComments || []) as PublicComment[]);
  }, [articleId]);

  useEffect(() => {
    let active = true;
    const supabase = createBrowserSupabaseClient();
    try {
      const viewerKey = getViewerKey();
      void supabase.rpc("record_article_view", { p_article_id: articleId, p_viewer_key: viewerKey })
        .then(() => { if (active) void refreshEngagement(); });
    } catch {
      // Storage can be unavailable in private browsing; public reading still works.
    }
    return () => { active = false; };
  }, [articleId, refreshEngagement]);

  async function toggleLike() {
    setBusy(true);
    setNotice("");
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase.rpc("toggle_article_like", { p_article_id: articleId, p_viewer_key: getViewerKey() });
      if (error) throw error;
      if (data?.[0]) {
        setLiked(data[0].liked);
        setCounts((current) => ({ ...current, likes: Number(data[0].like_count) }));
      }
    } catch {
      setNotice("Likes could not be updated right now. Please try again.");
    } finally { setBusy(false); }
  }

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.rpc("submit_article_comment", {
        p_article_id: articleId,
        p_viewer_key: getViewerKey(),
        p_commenter_name: name,
        p_comment_body: body,
      });
      if (error) throw error;
      setName("");
      setBody("");
      setNotice("Thanks. Your comment has been sent for review.");
    } catch {
      setNotice("Your comment could not be sent. Please check the form and try again.");
    } finally { setBusy(false); }
  }

  return <section className="article-engagement" aria-label="Article engagement">
    <div className="engagement-summary">
      <span><i className="bi bi-eye" aria-hidden="true" /> {counts.views.toLocaleString()} views</span>
      <button type="button" className={liked ? "engagement-like is-liked" : "engagement-like"} onClick={toggleLike} disabled={busy} aria-pressed={liked}>
        <i className="bi bi-heart-fill" aria-hidden="true" /> {counts.likes.toLocaleString()} {counts.likes === 1 ? "like" : "likes"}
      </button>
      <span><i className="bi bi-chat-dots" aria-hidden="true" /> {counts.comments.toLocaleString()} comments</span>
    </div>
    <div className="engagement-columns">
      <div><h2>Comments</h2>
        {comments.length ? <ul className="public-comment-list">{comments.map((comment) => <li key={comment.id}><strong>{comment.commenter_name}</strong><p>{comment.body}</p><time dateTime={comment.created_at}>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(comment.created_at))}</time></li>)}</ul> : <p className="engagement-muted">Be the first to comment.</p>}
      </div>
      <form className="comment-form" onSubmit={submitComment}><h2>Join the conversation</h2>
        <label>Your name<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required /></label>
        <label>Comment<textarea value={body} onChange={(event) => setBody(event.target.value)} minLength={5} maxLength={2000} rows={4} required /></label>
        <button className="btn-waraka-primary" type="submit" disabled={busy}>{busy ? "Sending…" : "Submit comment"}</button>
        <p className="engagement-muted">Comments appear after editorial review.</p>
        {notice && <p className="engagement-notice" role="status">{notice}</p>}
      </form>
    </div>
  </section>;
}
