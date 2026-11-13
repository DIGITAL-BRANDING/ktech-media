import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";

type Props = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

export default async function PhotoStoryPreviewPage({ params }: Props) {
  if (!isSupabaseConfigured()) return <SupabaseSetupNotice title="Haɗa Supabase domin duba photo story" />;
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/admin/login");
  const { data: story } = await supabase.from("photo_stories").select("id, title, description, status").eq("id", id).maybeSingle();
  if (!story) notFound();

  const { data: items } = await supabase.from("photo_story_items").select("id, media_id, position, caption").eq("story_id", id).order("position");
  const { data: assets } = items?.length
    ? await supabase.from("media_assets").select("id, bucket_id, storage_path, alt_text, credit").in("id", items.map((item) => item.media_id))
    : { data: [] };
  const assetById = new Map((assets ?? []).map((asset) => [asset.id, asset]));
  const gallery = await Promise.all((items ?? []).map(async (item) => {
    const asset = assetById.get(item.media_id);
    if (!asset) return null;
    const { data } = await supabase.storage.from(asset.bucket_id).createSignedUrl(asset.storage_path, 1800);
    return data ? { id: item.id, url: data.signedUrl, alt: asset.alt_text || story.title, caption: item.caption, credit: asset.credit } : null;
  }));

  return <article className="section"><div className="container admin-gate"><span className="status-badge status-draft">PREVIEW • {story.status}</span><h1>{story.title}</h1><p className="article-standfirst">{story.description}</p><div className="photo-story-gallery">{gallery.flatMap((image) => image ? [<figure key={image.id}><Image src={image.url} alt={image.alt} width={1280} height={900} />{(image.caption || image.credit) && <figcaption>{image.caption}{image.credit ? ` • ${image.credit}` : ""}</figcaption>}</figure>] : [])}</div></div></article>;
}
