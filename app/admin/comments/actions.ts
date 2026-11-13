"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const moderationSchema = z.object({ commentId: z.string().uuid(), decision: z.enum(["approved", "rejected"]) });

export async function moderateComment(formData: FormData) {
  const parsed = moderationSchema.safeParse({ commentId: formData.get("commentId"), decision: formData.get("decision") });
  if (!parsed.success) redirect("/admin/comments?error=invalid");
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (typeof userId !== "string") redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", userId).maybeSingle();
  if (!profile?.is_active || profile.role === "reporter") redirect("/admin");
  const { data: comment, error } = await supabase.from("article_comments").update({
    status: parsed.data.decision,
    moderated_by: userId,
    approved_at: parsed.data.decision === "approved" ? new Date().toISOString() : null,
  }).eq("id", parsed.data.commentId).select("article_id").maybeSingle();
  if (error || !comment) redirect("/admin/comments?error=save");
  const { data: article } = await supabase.from("articles").select("slug").eq("id", comment.article_id).maybeSingle();
  if (article?.slug) revalidatePath(`/news/${article.slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/articles");
  revalidatePath("/admin/comments");
  redirect("/admin/comments?updated=1");
}
