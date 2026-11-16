import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";
import { changeAdStatus, createAdCampaign, createNewsletterCampaign, sendNewsletterCampaign, sendPushBroadcast } from "@/app/admin/marketing/actions";

export const metadata = { title: "Audience & Advertising" };
export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ error?: string; saved?: string; sent?: string; pushSent?: string }> };

export default async function MarketingAdminPage({ searchParams }: Props) {
  if (!isSupabaseConfigured()) return <SupabaseSetupNotice title="Connect Supabase to manage audience and ads" />;
  const query = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role,is_active").eq("id", userId).maybeSingle();
  if (!profile?.is_active || profile.role === "reporter") redirect("/admin");
  const [{ data: campaigns }, { data: ads }, { count: activeSubscribers }, { count: pushCount }, { data: articles }] = await Promise.all([
    supabase.from("newsletter_campaigns").select("id,subject,language_code,status,recipient_count,sent_at,created_at").order("created_at", { ascending: false }).limit(30),
    supabase.from("ad_campaigns").select("id,advertiser,title,slot,status,starts_at,ends_at").order("created_at", { ascending: false }).limit(30),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("web_push_subscriptions").select("id", { count: "exact", head: true }),
    supabase.from("articles").select("id,title").eq("status", "published").order("published_at", { ascending: false }).limit(100),
  ]);
  const errorMessages: Record<string, string> = {
    campaign: "Check the subject, language and message content.", recipients: "Could not load confirmed newsletter subscribers.",
    "email-config": "Set RESEND_API_KEY, NEWSLETTER_FROM_EMAIL and NEWSLETTER_TOKEN_SECRET in Railway.",
    delivery: "Email delivery failed. Check Resend configuration and delivery logs before retrying.",
    ad: "Check the HTTPS image and destination URLs, date range and required fields.", sponsor: "The ad was saved, but the sponsored article label could not be updated.",
    push: "Push notification sending failed.", "push-config": "Set the VAPID public key, private key and subject in Railway.",
  };
  return <section className="admin-page">
    <div className="admin-page-heading"><div><span className="eyebrow">AUDIENCE / REVENUE</span><h1>Audience & Advertising</h1><p>Manage newsletter campaigns, web push and sponsored placements.</p></div></div>
    {query.saved && <p role="status" className="success-message">Saved successfully.</p>}{query.sent && <p role="status" className="success-message">Newsletter sent to {query.sent} subscribers.</p>}{query.pushSent && <p role="status" className="success-message">Push notification delivered to {query.pushSent} devices.</p>}{query.error && <p role="alert" className="form-error">{errorMessages[query.error] || "The request could not be completed."}</p>}
    <div className="marketing-metrics"><div><span>Confirmed newsletter readers</span><strong>{activeSubscribers || 0}</strong></div><div><span>Push-enabled devices</span><strong>{pushCount || 0}</strong></div><div><span>Ad campaigns</span><strong>{ads?.length || 0}</strong></div></div>

    <div className="marketing-admin-grid">
      <form action={createNewsletterCampaign} className="editor-form admin-panel admin-settings-form"><span className="eyebrow">NEWSLETTER</span><h2 className="section-title">Write a campaign</h2><label>Subject<input name="subject" required minLength={3} maxLength={180} /></label><label>Preheader<input name="preheader" maxLength={200} /></label><label>Message<textarea name="body" required minLength={20} maxLength={12000} rows={8} placeholder="One paragraph per line" /></label><label>Audience language<select name="language" defaultValue="en"><option value="en">English subscribers</option><option value="ha">Hausa subscribers</option></select></label><button className="btn-waraka-primary">Save newsletter draft</button></form>
      <form action={sendPushBroadcast} className="editor-form admin-panel admin-settings-form"><span className="eyebrow">WEB PUSH</span><h2 className="section-title">Send breaking news alert</h2><label>Notification title<input name="title" required maxLength={90} /></label><label>Message<input name="body" required maxLength={240} /></label><label>Internal destination path<input name="url" required defaultValue="/news" placeholder="/news/story-slug" /></label><p className="form-hint">A valid VAPID setup is required. Expired browser subscriptions are removed automatically.</p><button className="btn-waraka-primary">Send push notification</button></form>
    </div>

      <section className="admin-panel mt-4"><h2 className="section-title">Newsletter drafts and history</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Subject</th><th>Language</th><th>Status</th><th>Audience</th><th>Action</th></tr></thead><tbody>{campaigns?.map((campaign) => <tr key={campaign.id}><td>{campaign.subject}</td><td>{campaign.language_code.toUpperCase()}</td><td>{campaign.status}</td><td>{campaign.recipient_count}</td><td>{campaign.status === "draft" ? <form action={sendNewsletterCampaign}><input type="hidden" name="campaignId" value={campaign.id} /><button className="table-action">Send now</button></form> : campaign.sent_at ? new Date(campaign.sent_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos" }) : "—"}</td></tr>)}</tbody></table></div></section>

    <form action={createAdCampaign} className="editor-form admin-panel admin-settings-form mt-4"><span className="eyebrow">AD INVENTORY</span><h2 className="section-title">Book a sponsored placement</h2><div className="ad-form-grid"><label>Advertiser<input name="advertiser" required maxLength={160} /></label><label>Campaign title<input name="title" required maxLength={180} /></label><label>Image / banner URL<input type="url" name="imageUrl" required placeholder="https://…" /></label><label>Destination URL<input type="url" name="destinationUrl" required placeholder="https://advertiser.example" /></label><label>Placement<select name="slot"><option value="homepage_top">Homepage banner</option><option value="homepage_sidebar">Homepage sidebar</option><option value="article_inline">Article inline</option><option value="podcast_sidebar">Podcast area</option></select></label><label>Attach sponsored article (optional)<select name="sponsoredArticleId" defaultValue=""><option value="">No article</option>{articles?.map((article) => <option key={article.id} value={article.id}>{article.title}</option>)}</select></label><label>Start date/time (local WAT)<input type="datetime-local" name="startsAt" /></label><label>End date/time (local WAT)<input type="datetime-local" name="endsAt" /></label></div><label>Campaign description<textarea name="description" maxLength={400} rows={2} /></label><button className="btn-waraka-primary">Create ad campaign</button></form>

    <section className="admin-panel mt-4"><h2 className="section-title">Ad campaigns</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Advertiser</th><th>Placement</th><th>Campaign</th><th>Status</th><th>Manage</th></tr></thead><tbody>{ads?.map((ad) => <tr key={ad.id}><td>{ad.advertiser}</td><td>{ad.slot.replaceAll("_", " ")}</td><td>{ad.title}</td><td>{ad.status}</td><td><form action={changeAdStatus} className="ad-status-form"><input type="hidden" name="id" value={ad.id} /><select name="status" defaultValue={ad.status === "ended" ? "ended" : ad.status === "paused" ? "paused" : "active"}><option value="active">Active</option><option value="paused">Paused</option><option value="ended">Ended</option></select><button className="table-action">Update</button></form></td></tr>)}</tbody></table></div></section>
  </section>;
}
