"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { articleDocumentText, normalizeArticleDocument } from "@/lib/article-content";

const schema = z.object({ id: z.string().uuid(), title: z.string().trim().min(5).max(255), excerpt: z.string().trim().max(600), body: z.string().trim().min(1), sources: z.string().optional().default("[]"), category_id: z.union([z.literal(""), z.string().uuid()]), status: z.enum(["draft", "in_review", "published", "archived"]), is_featured: z.enum(["true", "false"]).optional(), is_breaking: z.enum(["true", "false"]).optional() });
export async function updateArticle(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/articles?error=invalid");
  let body;
  try { body = normalizeArticleDocument(parsed.data.body, parsed.data.sources); }
  catch { redirect(`/admin/articles/${parsed.data.id}/edit?error=invalid`); }
  if (articleDocumentText(body).trim().length < 20) redirect(`/admin/articles/${parsed.data.id}/edit?error=invalid`);
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (typeof userId !== "string") redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  const { id, ...values } = parsed.data;
  const payload = {
    title: values.title,
    excerpt: values.excerpt || null,
    body,
    category_id: values.category_id || null,
    status: values.status,
    published_at: values.status === "published" ? new Date().toISOString() : null,
    ...(profile?.role !== "reporter" ? { editor_id: userId, is_featured: values.is_featured === "true", is_breaking: values.is_breaking === "true" } : {}),
  };
  const { data, error } = await supabase.from("articles").update(payload).eq("id", id).select("slug").maybeSingle();
  if (error || !data) redirect(`/admin/articles/${id}/edit?error=not-authorized`);
  revalidatePath("/"); revalidatePath("/news"); revalidatePath(`/news/${data.slug}`); revalidatePath("/admin/articles");
  redirect(`/admin/articles/${id}/edit?saved=1`);
}
