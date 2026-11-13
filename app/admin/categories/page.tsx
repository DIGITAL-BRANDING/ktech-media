import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createCategory, toggleCategory } from "./actions";

export const dynamic = "force-dynamic";
export default async function CategoriesAdminPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", claims.claims.sub).maybeSingle();
  if (!profile || profile.role === "reporter") redirect("/admin");
  const { data: categories } = await supabase.from("categories").select("id,name,slug,description,color,sort_order,is_active").order("sort_order");
  return <section className="admin-page"><div className="admin-page-heading"><div><span className="eyebrow">TSARIN SITE</span><h1>Rukunin labarai</h1><p>Ƙirƙiri categories, tsara jerinsu, ko ɓoye category da ba a amfani da shi.</p></div></div>
    {params.error && <p className="form-error">Akwai kuskure wajen adana bayanan. Duba sunan ko launin category.</p>}{params.saved && <p className="success-message">An adana canjin category.</p>}
    <div className="admin-management-grid"><form action={createCategory} className="editor-form admin-panel"><h2>Ƙara category</h2><label>Suna<input name="name" required maxLength={80} /></label><label>Bayani<textarea name="description" rows={3} maxLength={500} /></label><div className="form-inline-fields"><label>Launi<input name="color" type="color" defaultValue="#E8001D" /></label><label>Jeri<input name="sort_order" type="number" min={0} defaultValue={10} /></label></div><button className="btn-waraka-primary" type="submit">Ƙirƙiri category</button></form>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Suna</th><th>Jeri</th><th>Matsayi</th><th /></tr></thead><tbody>{categories?.map((category) => <tr key={category.id}><td><strong><i className="category-color-dot" style={{ background: category.color }} />{category.name}</strong><small>/{category.slug}</small></td><td>{category.sort_order}</td><td>{category.is_active ? "Aiki" : "A ɓoye"}</td><td><form action={toggleCategory}><input type="hidden" name="id" value={category.id} /><input type="hidden" name="active" value={String(!category.is_active)} /><button className="table-action" type="submit">{category.is_active ? "Ɓoye" : "Kunna"}</button></form></td></tr>)}</tbody></table></div></div>
  </section>;
}
