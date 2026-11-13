"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const reviewInput = z.object({ articleId: z.string().uuid(), action: z.enum(["publish", "return"]) });

export async function reviewArticle(formData: FormData) {
  const input = reviewInput.safeParse({ articleId: formData.get("articleId"), action: formData.get("action") });
  if (!input.success) redirect("/admin/review?error=invalid");

  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  const editorId = claims?.claims?.sub;
  if (typeof editorId !== "string") redirect("/admin/login");

  const now = new Date().toISOString();
  const update = input.data.action === "publish"
    ? { status: "published" as const, published_at: now, editor_id: editorId }
    : { status: "draft" as const, published_at: null, editor_id: editorId };
  const { data, error } = await supabase
    .from("articles")
    .update(update)
    .eq("id", input.data.articleId)
    .eq("status", "in_review")
    .select("id")
    .maybeSingle();

  if (error || !data) redirect("/admin/review?error=not-authorized");
  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath("/sitemap.xml");
  redirect("/admin/review?updated=1");
}
