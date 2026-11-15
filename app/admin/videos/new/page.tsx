import Link from "next/link";
import { redirect } from "next/navigation";
import { createVideo } from "@/app/admin/videos/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";

export const metadata = { title: "Sabon bidiyo" };
export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewVideoPage({ searchParams }: Props) {
  if (!isSupabaseConfigured()) return <SupabaseSetupNotice title="Haɗa Supabase domin ƙara bidiyo" />;
  const { error } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/admin/login");
  const { data: categories } = await supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order");
  const errorText = error === "provider" ? "Yi amfani da hanyar YouTube, Facebook ko Vimeo." : error === "thumbnail" ? "Thumbnail URL must use HTTPS." : error === "save-failed" ? "Ba a iya ajiye bidiyon ba. Duba izinin newsroom." : error ? "Duba bayanan da ka shigar." : "";
  return <section className="section"><div className="container admin-gate"><span className="eyebrow">NEWSROOM • VIDEO</span><h1>Ƙara sabon bidiyo</h1><p>Saka hanyar bidiyo daga YouTube, Facebook ko Vimeo. Za a tura shi zuwa ga edita domin dubawa.</p>{errorText && <p className="form-error" role="alert">{errorText}</p>}<form action={createVideo} className="editor-form"><label>Kanun bidiyo<input name="title" required minLength={5} maxLength={255} /></label><label>Bayani<textarea name="description" rows={4} maxLength={1200} /></label><label>Rukunin labari<select name="categoryId" defaultValue=""><option value="">Zaɓi rukunin labari</option>{categories?.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label>Hanyar bidiyo<input name="sourceUrl" type="url" placeholder="https://youtu.be/..." required /></label><label>Thumbnail image URL (optional)<input name="thumbnailUrl" type="url" placeholder="https://…" /></label><p className="form-hint">Don isar da bidiyo cikin sauri, za mu yi amfani da streaming provider. Ba a aika babban fayil ɗin bidiyo kai tsaye zuwa database ba. Samar da thumbnail link don Facebook/Vimeo.</p><div className="editor-actions"><button className="btn-waraka-primary" type="submit">Aika wa edita</button><Link href="/admin" className="btn-waraka-outline">Soke</Link></div></form></div></section>;
}
