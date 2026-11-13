import { redirect } from "next/navigation";
import { createArticle } from "@/app/admin/articles/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";
import { ArticleRichTextEditor } from "@/components/article-rich-text-editor";

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

  return <section className="section"><div className="container admin-gate"><span className="eyebrow">NEWSROOM • DRAFT</span><h1>Write a story</h1><p>Format the article, add inline links, and attach source references before saving or sending it for review.</p>{error && <p className="form-error" role="alert">{error === "save-failed" ? "The article could not be saved. Check the newsroom database permissions." : "Check the fields and make sure the article body has at least 20 characters."}</p>}<form action={createArticle} className="editor-form"><label>Headline<input name="title" required minLength={5} maxLength={255} /></label><label>Summary<textarea name="excerpt" rows={3} maxLength={600} /></label><label>Category<select name="categoryId" defaultValue=""><option value="">Select a category</option>{categories?.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><div className="rich-editor-field"><span className="rich-editor-label">Article body</span><ArticleRichTextEditor /></div><div className="editor-actions"><button className="btn-waraka-outline" type="submit" name="intent" value="draft">Save draft</button><button className="btn-waraka-primary" type="submit" name="intent" value="in_review">Send to editor</button><a href="/admin" className="btn-waraka-outline">Cancel</a></div></form></div></section>;
}
