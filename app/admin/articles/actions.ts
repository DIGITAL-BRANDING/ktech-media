"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const articleSchema = z.object({
  title: z.string().trim().min(5).max(255),
  excerpt: z.string().trim().max(600).optional(),
  body: z.string().trim().min(20),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  intent: z.enum(["draft", "in_review"]).default("draft"),
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
    categoryId: formData.get("categoryId") || "",
    intent: formData.get("intent") || "draft",
  });
  if (!parsed.success) redirect("/admin/articles/new?error=check-fields");

  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (typeof userId !== "string") redirect("/admin/login");

  const slug = `${toSlug(parsed.data.title)}-${crypto.randomUUID().slice(0, 8)}`;
  const paragraphs = parsed.data.body.split(/\n\s*\n/).map((text) => ({
    type: "paragraph",
    content: [{ type: "text", text }],
  }));
  const { error } = await supabase.from("articles").insert({
    author_id: userId,
    category_id: parsed.data.categoryId || null,
    title: parsed.data.title,
    slug,
    excerpt: parsed.data.excerpt || null,
    body: { type: "doc", content: paragraphs },
    status: parsed.data.intent,
    language_code: "ha",
  });

  if (error) {
    console.error("Unable to save article draft:", error.message);
    redirect("/admin/articles/new?error=save-failed");
  }

  revalidatePath("/admin");
  redirect(`/admin?created=${parsed.data.intent}`);
}
