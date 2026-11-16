import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateArticle } from "../../edit-actions";
import { ArticleRichTextEditor } from "@/components/article-rich-text-editor";

export const dynamic = "force-dynamic";
export default async function EditArticlePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/admin/login");
  const [{ data: article }, { data: categories }, { data: profile }] = await Promise.all([
    supabase.from("articles").select("id,title,excerpt,body,category_id,status,is_featured,is_breaking,slug,language_code").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id,name").eq("is_active", true).order("sort_order"),
    supabase.from("profiles").select("role").eq("id", claims.claims.sub).maybeSingle(),
  ]);
  if (!article) notFound();
  return <section className="admin-page"><div className="admin-page-heading"><div><span className="eyebrow">ABUN CIKI / GYARA</span><h1>Gyara labari</h1><p>/{article.slug}</p></div><Link href="/admin/articles" className="table-action">Komawa jerin labarai</Link></div>
    {query.error && <p className="form-error">Ba a iya adana canjin ba. Duba izinin account da bayanan da aka shigar.</p>}{query.saved && <p className="success-message">An sabunta labari.</p>}
    <form action={updateArticle} className="editor-form admin-panel admin-settings-form"><input type="hidden" name="id" value={article.id} /><label>Story language<select name="language_code" defaultValue={article.language_code}><option value="en">English</option><option value="ha">Hausa</option></select></label><label>Headline<input name="title" defaultValue={article.title} required minLength={5} maxLength={255} /></label><label>Summary<textarea name="excerpt" rows={3} defaultValue={article.excerpt ?? ""} maxLength={600} /></label><div className="rich-editor-field"><span className="rich-editor-label">Article body</span><ArticleRichTextEditor initialBody={article.body} /></div><label>Category<select name="category_id" defaultValue={article.category_id ?? ""}><option value="">No category</option>{categories?.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label>Status<select name="status" defaultValue={article.status}><option value="draft">Draft</option><option value="in_review">In review</option>{profile?.role !== "reporter" && <><option value="published">Published</option><option value="archived">Archived</option></>}</select></label>{profile?.role !== "reporter" && <div className="admin-check-row"><label><input type="checkbox" name="is_featured" value="true" defaultChecked={article.is_featured} /> Featured story</label><label><input type="checkbox" name="is_breaking" value="true" defaultChecked={article.is_breaking} /> Breaking news</label></div>}<button type="submit" className="btn-waraka-primary">Save changes</button></form>
  </section>;
}
