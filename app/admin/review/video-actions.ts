"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const inputSchema = z.object({ videoId: z.string().uuid(), action: z.enum(["publish", "return"]) });

export async function reviewVideo(formData: FormData) {
  const parsed = inputSchema.safeParse({ videoId: formData.get("videoId"), action: formData.get("action") });
  if (!parsed.success) redirect("/admin/review?error=invalid");
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (typeof claims?.claims?.sub !== "string") redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", claims.claims.sub).maybeSingle();
  if (!profile || !["editor", "admin"].includes(profile.role)) redirect("/admin/review?error=not-authorized");

  const update = parsed.data.action === "publish"
    ? { status: "published" as const, published_at: new Date().toISOString() }
    : { status: "draft" as const, published_at: null };
  const { data, error } = await supabase.from("videos").update(update).eq("id", parsed.data.videoId).eq("status", "in_review").select("id").maybeSingle();
  if (error || !data) redirect("/admin/review?error=not-authorized");
  revalidatePath("/");
  revalidatePath("/videos");
  redirect("/admin/review?updated=1");
}
