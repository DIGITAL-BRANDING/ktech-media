import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function VideosAdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/admin/login");
  const { data } = await supabase.from("videos").select("id,title,slug,status,provider,created_at,category:categories(name)").order("updated_at", { ascending: false }).limit(100);
  return <section className="admin-page"><div className="admin-page-heading"><div><span className="eyebrow">MEDIA / BIDIYO</span><h1>Gudanar da bidiyo</h1><p>Gudanar da bidiyoyin da aka tura da waɗanda suke jiran tantancewa.</p></div><Link href="/admin/videos/new" className="btn-waraka-primary"><i className="bi bi-plus-lg" /> Ƙara bidiyo</Link></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Suna</th><th>Category</th><th>Tushe</th><th>Matsayi</th><th>Kwanan wata</th></tr></thead><tbody>{data?.map((video) => <tr key={video.id}><td><strong>{video.title}</strong><small>/{video.slug}</small></td><td>{(video.category as { name?: string } | null)?.name ?? "—"}</td><td>{video.provider}</td><td><span className={`status-pill status-${video.status}`}>{video.status}</span></td><td>{new Intl.DateTimeFormat("ha-NG", { dateStyle: "medium" }).format(new Date(video.created_at))}</td></tr>)}</tbody></table>{!data?.length && <p className="empty-state">Babu bidiyo tukuna. Ka ƙara bidiyo domin fara newsroom library.</p>}</div></section>;
}
