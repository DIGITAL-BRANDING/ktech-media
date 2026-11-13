"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_TOTAL_SIZE = 100 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

type Props = { categories: Array<{ id: string; name: string }> };

export function PhotoStoryForm({ categories }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    const description = String(form.get("description") || "").trim();
    const categoryId = String(form.get("categoryId") || "") || null;
    const files = Array.from((form.get("images") as FileList | null) || []);

    if (title.length < 5 || title.length > 255 || files.length < 1 || files.length > 12) {
      setError("Saka kanun labari mai haruffa 5–255 da hotuna 1 zuwa 12.");
      setPending(false);
      return;
    }
    for (const file of files) {
      if (!IMAGE_TYPES[file.type] || file.size > MAX_FILE_SIZE) {
        setError("Ana karɓar JPEG, PNG, WebP, AVIF ko GIF, har zuwa 50 MB ga kowane hoto.");
        setPending(false);
        return;
      }
    }
    if (files.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_SIZE) {
      setError("Jimillar hotunan da za ka tura ba za ta wuce 100 MB ba.");
      setPending(false);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setError("Ka sake shiga newsroom kafin ka ajiye photo story.");
      setPending(false);
      return;
    }

    const uploaded: Array<{ id: string; path: string; position: number }> = [];
    const uploadedPaths: string[] = [];
    let createdStoryId: string | null = null;
    try {
      for (const [position, file] of files.entries()) {
        const path = `${user.id}/${crypto.randomUUID()}.${IMAGE_TYPES[file.type]}`;
        const { error: storageError } = await supabase.storage.from("editorial-media").upload(path, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });
        if (storageError) throw new Error(storageError.message);
        uploadedPaths.push(path);

        const dimensions = await readImageDimensions(file);
        const { data: asset, error: assetError } = await supabase.from("media_assets").insert({
          uploaded_by: user.id,
          bucket_id: "editorial-media",
          storage_path: path,
          kind: "image",
          mime_type: file.type,
          file_size_bytes: file.size,
          width: dimensions.width,
          height: dimensions.height,
          alt_text: file.name.replace(/\.[^.]+$/, ""),
        }).select("id").single();
        if (assetError) {
          await supabase.storage.from("editorial-media").remove([path]);
          throw new Error(assetError.message);
        }
        uploaded.push({ id: asset.id, path, position });
      }

      const slugBase = slugify(title) || "photo-story";
      const slug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;
      const { data: story, error: storyError } = await supabase.from("photo_stories").insert({
        author_id: user.id,
        category_id: categoryId,
        cover_media_id: uploaded[0].id,
        title,
        slug,
        description: description || null,
        status: "in_review",
      }).select("id").single();
      if (storyError) throw new Error(storyError.message);
      createdStoryId = story.id;

      const { error: itemsError } = await supabase.from("photo_story_items").insert(
        uploaded.map(({ id, position }) => ({ story_id: story.id, media_id: id, position })),
      );
      if (itemsError) {
        throw new Error(itemsError.message);
      }

      router.push("/admin/review?media=photo");
      router.refresh();
    } catch (cause) {
      if (createdStoryId) await supabase.from("photo_stories").update({ status: "draft", cover_media_id: null }).eq("id", createdStoryId);
      await supabase.from("media_assets").delete().in("id", uploaded.map((asset) => asset.id));
      await supabase.storage.from("editorial-media").remove(uploadedPaths);
      console.error("Unable to create photo story:", cause);
      setError("Ba a iya ajiye photo story ba. Duba izinin asusu, sannan ka sake gwadawa.");
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={submit} className="editor-form">
    <label>Kanun photo story<input name="title" required minLength={5} maxLength={255} /></label>
    <label>Bayani<textarea name="description" rows={3} maxLength={1200} /></label>
    <label>Rukunin labari<select name="categoryId" defaultValue=""><option value="">Zaɓi rukunin labari</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
    <label>Hotuna (1–12)<input name="images" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" multiple required /></label>
    <p className="form-hint">Za a adana hotuna a Supabase Storage. Mafi girman hoto 50 MB, jimillar hotuna 100 MB.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="btn-waraka-primary" type="submit" disabled={pending}>{pending ? "Ana tura hotuna…" : "Aika wa edita"}</button>
  </form>;
}

function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 180);
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read image dimensions"));
    };
    image.src = objectUrl;
  });
}
