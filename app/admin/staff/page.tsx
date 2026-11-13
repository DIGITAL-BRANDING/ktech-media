import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateStaffProfile } from "./actions";

export const dynamic = "force-dynamic";
export default async function StaffAdminPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/admin/login");
  const { data: current } = await supabase.from("profiles").select("role").eq("id", claims.claims.sub).maybeSingle();
  if (current?.role !== "admin") redirect("/admin");
  const { data: staff } = await supabase.from("profiles").select("id,display_name,role,is_active,created_at").order("created_at");
  return <section className="admin-page"><div className="admin-page-heading"><div><span className="eyebrow">TSARIN SITE / IZINI</span><h1>Ma’aikata da izini</h1><p>Canza rawar newsroom ko dakatar da damar shiga ga ma’aikaci.</p></div></div>
    {params.error && <p className="form-error">Ba a iya adana canjin ba. Tabbatar kana da izinin admin.</p>}{params.saved && <p className="success-message">An sabunta izinin ma’aikaci.</p>}
    <div className="admin-staff-list">{staff?.map((person) => <form action={updateStaffProfile} className="admin-staff-card" key={person.id}><input type="hidden" name="id" value={person.id} /><label>Suna<input name="display_name" defaultValue={person.display_name} required minLength={2} maxLength={120} /></label><label>Matsayin newsroom<select name="role" defaultValue={person.role}><option value="reporter">Reporter</option><option value="editor">Editor</option><option value="admin">Admin</option></select></label><label>Matsayin account<select name="is_active" defaultValue={String(person.is_active)}><option value="true">Aiki</option><option value="false">An dakatar</option></select></label><button className="table-action" type="submit">Ajiye canji</button></form>)}</div>
    <aside className="admin-note"><i className="bi bi-info-circle" /> Sabon account ana ƙirƙirarsa daga Supabase Authentication, sannan profile ɗinsa zai bayyana a nan domin ba shi role.</aside>
  </section>;
}
