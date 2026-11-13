"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const inputSchema = z.object({ storyId: z.string().uuid(), action: z.enum(["publish", "return"]) });
type PublishedCopy = { id: string; oldPath: string; newPath: string; mimeType: string };

export async function reviewPhotoStory(formData: FormData) {
  const parsed = inputSchema.safeParse({ storyId: formData.get("storyId"), action: formData.get("action") });
  if (!parsed.success) redirect("/admin/review?error=invalid");
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (typeof claims?.claims?.sub !== "string") redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", claims.claims.sub).maybeSingle();
  if (!profile || !["editor", "admin"].includes(profile.role)) redirect("/admin/review?error=not-authorized");

  const { data: story } = await supabase.from("photo_stories").select("id, slug").eq("id", parsed.data.storyId).eq("status", "in_review").maybeSingle();
  if (!story) redirect("/admin/review?error=not-found");
  if (parsed.data.action === "return") {
    const { error } = await supabase.from("photo_stories").update({ status: "draft" }).eq("id", story.id);
    if (error) redirect("/admin/review?error=not-authorized");
    redirect("/admin/review?updated=1");
  }

  const { data: items, error: itemsError } = await supabase.from("photo_story_items").select("id, media_id, position").eq("story_id", story.id).order("position");
  if (itemsError || !items?.length) redirect("/admin/review?error=no-media");
  const { data: assets, error: assetsError } = await supabase.from("media_assets").select("id, bucket_id, storage_path, mime_type").in("id", items.map((item) => item.media_id));
  if (assetsError || !assets?.length) redirect("/admin/review?error=no-media");
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
  const publishedCopies: PublishedCopy[] = [];

  try {
    for (const item of items) {
      const asset = assetsById.get(item.media_id);
      if (!asset) throw new Error("Photo metadata is missing");
      if (asset.bucket_id === "published-media") continue;
      if (asset.bucket_id !== "editorial-media") throw new Error("Unexpected source bucket");

      const { data: source, error: downloadError } = await supabase.storage.from("editorial-media").download(asset.storage_path);
      if (downloadError || !source) throw new Error(downloadError?.message || "Photo download failed");
      const extension = asset.storage_path.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "img";
      const newPath = `${claims.claims.sub}/published/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("published-media").upload(newPath, source, {
        contentType: asset.mime_type,
        cacheControl: "31536000",
        upsert: false,
      });
      if (uploadError) throw new Error(uploadError.message);
      publishedCopies.push({ id: asset.id, oldPath: asset.storage_path, newPath, mimeType: asset.mime_type });
      const { error: updateError } = await supabase.from("media_assets").update({ bucket_id: "published-media", storage_path: newPath }).eq("id", asset.id);
      if (updateError) throw new Error(updateError.message);
    }

    const { error: publishError } = await supabase.from("photo_stories").update({ status: "published", published_at: new Date().toISOString() }).eq("id", story.id);
    if (publishError) throw new Error(publishError.message);
  } catch (cause) {
    await Promise.all(publishedCopies.map(async (copy) => {
      await supabase.from("media_assets").update({ bucket_id: "editorial-media", storage_path: copy.oldPath }).eq("id", copy.id);
      await supabase.storage.from("published-media").remove([copy.newPath]);
    }));
    console.error("Unable to publish photo story:", cause);
    redirect("/admin/review?error=media-publish-failed");
  }

  await Promise.all(publishedCopies.map((copy) => supabase.storage.from("editorial-media").remove([copy.oldPath])));
  revalidatePath("/");
  revalidatePath("/photos");
  revalidatePath(`/photos/${story.slug}`);
  redirect("/admin/review?updated=1");
}
