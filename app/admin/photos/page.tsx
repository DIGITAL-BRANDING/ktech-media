import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function PhotosAdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/admin/login");
  const { data } = await supabase.from("photo_stories").select("id,title,slug,status,created_at,category:categories(name)").order("updated_at", { ascending: false }).limit(100);
  return <section className="admin-page"><div className="admin-page-heading"><div><span className="eyebrow">MEDIA / HOTO</span><h1>Photo stories</h1><p>Jerin galleries da labaran hoto na newsroom.</p></div><Link href="/admin/photos/new" className="btn-waraka-primary"><i className="bi bi-plus-lg" /> Sabon photo story</Link></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Suna</th><th>Category</th><th>Matsayi</th><th>Kwanan wata</th><th /></tr></thead><tbody>{data?.map((story) => <tr key={story.id}><td><strong>{story.title}</strong><small>/{story.slug}</small></td><td>{(story.category as { name?: string } | null)?.name ?? "—"}</td><td><span className={`status-pill status-${story.status}`}>{story.status}</span></td><td>{new Intl.DateTimeFormat("ha-NG", { dateStyle: "medium" }).format(new Date(story.created_at))}</td><td><Link href={`/admin/photos/${story.id}/preview`} className="table-action">Duba <i className="bi bi-arrow-up-right" /></Link></td></tr>)}</tbody></table>{!data?.length && <p className="empty-state">Babu photo story tukuna.</p>}</div></section>;
}
