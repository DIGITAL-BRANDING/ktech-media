import { redirect } from "next/navigation";
import { createArticle } from "@/app/admin/articles/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";

export const metadata = { title: "Rubuta sabon labari" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewArticlePage({ searchParams }: Props) {
  if (!isSupabaseConfigured()) return <SupabaseSetupNotice title="Haɗa Supabase domin rubuta labari" />;
  const { error } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/admin/login");
  const { data: categories } = await supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order");

  return <section className="section"><div className="container admin-gate"><span className="eyebrow">NEWSROOM • DRAFT</span><h1>Rubuta sabon labari</h1><p>Ka ajiye draft ko ka tura labarin zuwa ga edita domin dubawa.</p>{error && <p className="form-error" role="alert">{error === "save-failed" ? "Ba a iya ajiye labarin ba. Duba haɗin database da izinin newsroom." : "Duba bayanan da ka shigar, sannan ka sake gwadawa."}</p>}<form action={createArticle} className="editor-form"><label>Kanun labari<input name="title" required minLength={5} maxLength={255} /></label><label>Taƙaitaccen bayani<textarea name="excerpt" rows={3} maxLength={600} /></label><label>Rukunin labari<select name="categoryId" defaultValue=""><option value="">Zaɓi rukunin labari</option>{categories?.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label>Cikakken labari<textarea name="body" rows={14} required minLength={20} /></label><div className="editor-actions"><button className="btn-waraka-outline" type="submit" name="intent" value="draft">Ajiye draft</button><button className="btn-waraka-primary" type="submit" name="intent" value="in_review">Tura wa edita</button><a href="/admin" className="btn-waraka-outline">Soke</a></div></form></div></section>;
}
