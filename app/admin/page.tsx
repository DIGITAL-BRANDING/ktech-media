import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { signOutNewsroom } from "@/app/admin/actions";
import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";

export const metadata = { title: "Newsroom" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseSetupNotice title="Haɗa Supabase domin kunna admin panel" />;
  }

  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/admin/login");
  const [{ data: profile }, { count: articleCount }, { count: draftCount }, { count: reviewCount }, { count: publishedCount }, { count: videoCount }, { count: photoCount }, { count: staffCount }] = await Promise.all([
    supabase.from("profiles").select("display_name, role, is_active").eq("id", claims.claims.sub).maybeSingle(),
    supabase.from("articles").select("id", { count: "exact", head: true }),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "in_review"),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("videos").select("id", { count: "exact", head: true }),
    supabase.from("photo_stories").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  if (!profile?.is_active) redirect("/admin/login");

  return <section className="section"><div className="admin-gate">
    <div className="admin-page-heading"><div><span className="eyebrow">NEWSROOM • {profile.role}</span><h1>Sannu, {profile.display_name}</h1><p>Ga taƙaitaccen halin wallafe-wallafenka da wuraren sarrafa kafar.</p></div><div className="admin-quick-actions"><Link href="/admin/articles/new" className="btn-waraka-primary"><i className="bi bi-plus-lg" aria-hidden="true" /> Rubuta labari</Link><form action={signOutNewsroom}><button className="btn-sm-admin" type="submit">Fita</button></form></div></div>
    <div className="admin-cards admin-stat-grid">
      <Link href="/admin/articles"><strong>{articleCount ?? 0}</strong><span>Dukkan labarai</span><i className="bi bi-newspaper" /></Link>
      <Link href="/admin/articles?status=draft"><strong>{draftCount ?? 0}</strong><span>Drafts</span><i className="bi bi-file-earmark-text" /></Link>
      <Link href="/admin/review"><strong>{reviewCount ?? 0}</strong><span>A tantance</span><i className="bi bi-hourglass-split" /></Link>
      <Link href="/admin/articles?status=published"><strong>{publishedCount ?? 0}</strong><span>Wallafe-wallafe</span><i className="bi bi-globe2" /></Link>
      <Link href="/admin/videos"><strong>{videoCount ?? 0}</strong><span>Bidiyo</span><i className="bi bi-camera-video" /></Link>
      <Link href="/admin/photos"><strong>{photoCount ?? 0}</strong><span>Photo stories</span><i className="bi bi-images" /></Link>
      {profile.role === "admin" && <Link href="/admin/staff"><strong>{staffCount ?? 0}</strong><span>Ma’aikata</span><i className="bi bi-people" /></Link>}
    </div>
    <div className="admin-dashboard-grid">
      <section className="admin-panel"><div className="admin-panel-header"><h2>Ayyukan newsroom</h2><Link href="/admin/settings" className="section-link">Saituna <i className="bi bi-arrow-right" /></Link></div><div className="admin-action-grid">
        <Link href="/admin/articles" className="admin-action-card"><i className="bi bi-newspaper" /><span><strong>Gudanar da labarai</strong><small>Duba, tace, gyara ko ajiye labarai</small></span><i className="bi bi-arrow-up-right" /></Link>
        <Link href="/admin/videos" className="admin-action-card"><i className="bi bi-camera-video" /><span><strong>Gudanar da bidiyo</strong><small>Ƙara ko duba bidiyon newsroom</small></span><i className="bi bi-arrow-up-right" /></Link>
        <Link href="/admin/photos" className="admin-action-card"><i className="bi bi-images" /><span><strong>Gudanar da hotuna</strong><small>Ƙirƙiri galleries da photo stories</small></span><i className="bi bi-arrow-up-right" /></Link>
        {profile.role !== "reporter" && <Link href="/admin/categories" className="admin-action-card"><i className="bi bi-tags" /><span><strong>Rukunin labarai</strong><small>Tsara sassa da launukan category</small></span><i className="bi bi-arrow-up-right" /></Link>}
      </div></section>
      <aside className="admin-panel admin-dashboard-aside"><div className="admin-panel-header"><h2>Saurin ƙirƙira</h2></div><div className="admin-shortcuts"><Link href="/admin/articles/new"><i className="bi bi-plus-circle" /> Sabon labari</Link><Link href="/admin/videos/new"><i className="bi bi-play-btn" /> Ƙara bidiyo</Link><Link href="/admin/photos/new"><i className="bi bi-images" /> Ƙirƙiri photo story</Link><Link href="/admin/review"><i className="bi bi-check2-square" /> Bude jerin tantancewa</Link></div></aside>
    </div>
  </div></section>;
}
