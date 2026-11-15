"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const videoSchema = z.object({
  title: z.string().trim().min(5).max(255),
  description: z.string().trim().max(1200).optional(),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  sourceUrl: z.string().trim().url(),
  thumbnailUrl: z.string().trim().optional().default(""),
});

function getApprovedVideoSource(rawUrl: string): { provider: "youtube" | "facebook" | "vimeo"; thumbnail: string | null } | null {
  const url = new URL(rawUrl);
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (["youtube.com", "m.youtube.com", "youtu.be", "youtube-nocookie.com"].includes(host)) {
    const id = host === "youtu.be" ? url.pathname.split("/").filter(Boolean)[0] : url.searchParams.get("v") || url.pathname.split("/").filter(Boolean).at(-1);
    return id && /^[a-zA-Z0-9_-]{6,20}$/.test(id) ? { provider: "youtube", thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` } : null;
  }
  if (["facebook.com", "fb.watch"].includes(host) || host.endsWith(".facebook.com")) return { provider: "facebook", thumbnail: null };
  if (host === "vimeo.com" || host.endsWith(".vimeo.com")) return { provider: "vimeo", thumbnail: null };
  return null;
}

function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 180);
}

export async function createVideo(formData: FormData) {
  const parsed = videoSchema.safeParse({ title: formData.get("title"), description: formData.get("description") || "", categoryId: formData.get("categoryId") || "", sourceUrl: formData.get("sourceUrl"), thumbnailUrl: formData.get("thumbnailUrl") || "" });
  if (!parsed.success) redirect("/admin/videos/new?error=check-fields");
  const source = getApprovedVideoSource(parsed.data.sourceUrl);
  if (!source) redirect("/admin/videos/new?error=provider");
  let manualThumbnail: string | null = null;
  if (parsed.data.thumbnailUrl) {
    try { const thumbnail = new URL(parsed.data.thumbnailUrl); if (thumbnail.protocol !== "https:") throw new Error("HTTPS required"); manualThumbnail = thumbnail.toString(); }
    catch { redirect("/admin/videos/new?error=thumbnail"); }
  }

  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (typeof claims?.claims?.sub !== "string") redirect("/admin/login");
  const slug = `${slugify(parsed.data.title) || "video"}-${crypto.randomUUID().slice(0, 8)}`;
  const { error } = await supabase.from("videos").insert({
    author_id: claims.claims.sub,
    category_id: parsed.data.categoryId || null,
    title: parsed.data.title,
    slug,
    description: parsed.data.description || null,
    provider: source.provider,
    source_url: parsed.data.sourceUrl,
    thumbnail_url: manualThumbnail || source.thumbnail,
    status: "in_review",
  });
  if (error) {
    console.error("Unable to submit video:", error.message);
    redirect("/admin/videos/new?error=save-failed");
  }
  revalidatePath("/admin/review");
  redirect("/admin/review?submitted=video");
}
