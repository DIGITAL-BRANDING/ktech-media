"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { articleDocumentText, normalizeArticleDocument } from "@/lib/article-content";

const articleSchema = z.object({
  title: z.string().trim().min(5).max(255),
  excerpt: z.string().trim().max(600).optional(),
  body: z.string().trim().min(1),
  sources: z.string().optional().default("[]"),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  intent: z.enum(["draft", "in_review"]).default("draft"),
  language: z.enum(["en", "ha"]).default("en"),
});

function toSlug(title: string) {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);
}

export async function createArticle(formData: FormData): Promise<void> {
  const parsed = articleSchema.safeParse({
    title: formData.get("title"),
    excerpt: formData.get("excerpt") || "",
    body: formData.get("body"),
    sources: formData.get("sources") || "[]",
    categoryId: formData.get("categoryId") || "",
    intent: formData.get("intent") || "draft",
    language: formData.get("language") || "en",
  });
  if (!parsed.success) redirect("/admin/articles/new?error=check-fields");
  let body;
  try { body = normalizeArticleDocument(parsed.data.body, parsed.data.sources); }
  catch { redirect("/admin/articles/new?error=check-fields"); }
  if (articleDocumentText(body).trim().length < 20) redirect("/admin/articles/new?error=check-fields");

  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (typeof userId !== "string") redirect("/admin/login");

  const slug = `${toSlug(parsed.data.title)}-${crypto.randomUUID().slice(0, 8)}`;
  const { error } = await supabase.from("articles").insert({
    author_id: userId,
    category_id: parsed.data.categoryId || null,
    title: parsed.data.title,
    slug,
    excerpt: parsed.data.excerpt || null,
    body,
    status: parsed.data.intent,
    language_code: parsed.data.language,
  });

  if (error) {
    console.error("Unable to save article draft:", error.message);
    redirect("/admin/articles/new?error=save-failed");
  }

  revalidatePath("/admin");
  redirect(`/admin?created=${parsed.data.intent}`);
}
