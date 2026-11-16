"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function requireEditor() {
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (typeof userId !== "string") redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role,is_active").eq("id", userId).maybeSingle();
  if (!profile?.is_active || profile.role === "reporter") redirect("/admin");
  return { supabase, userId };
}

function slugify(value: string) { return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120); }

export async function saveRadioStream(formData: FormData) {
  const input = z.object({ id: z.union([z.literal(""), z.string().uuid()]).default(""), title: z.string().trim().min(3).max(160), streamUrl: z.string().url(), description: z.string().trim().max(500).optional().default(""), status: z.enum(["live", "offline"]) }).safeParse(Object.fromEntries(formData));
  if (!input.success || new URL(input.data.streamUrl).protocol !== "https:") redirect("/admin/audio?error=radio");
  const { supabase, userId } = await requireEditor();
  if (input.data.status === "live") {
    const { error } = await supabase.from("radio_streams").update({ status: "offline" }).eq("status", "live").neq("id", input.data.id || "00000000-0000-0000-0000-000000000000");
    if (error) redirect("/admin/audio?error=radio");
  }
  const payload = { ...(input.data.id ? { id: input.data.id } : {}), title: input.data.title, stream_url: input.data.streamUrl, description: input.data.description || null, status: input.data.status, created_by: userId };
  const { error } = await supabase.from("radio_streams").upsert(payload);
  if (error) redirect("/admin/audio?error=radio");
  revalidatePath("/radio"); revalidatePath("/");
  redirect("/admin/audio?saved=radio");
}

export async function createPodcastShow(formData: FormData) {
  const input = z.object({ title: z.string().trim().min(3).max(180), description: z.string().trim().max(1500).optional().default(""), artworkUrl: z.string().url().optional().or(z.literal("")), language: z.enum(["en", "ha"]), author: z.string().trim().max(120).optional().default(""), category: z.string().trim().max(80).optional().default("") }).safeParse(Object.fromEntries(formData));
  if (!input.success || (input.data.artworkUrl && new URL(input.data.artworkUrl).protocol !== "https:")) redirect("/admin/audio?error=show");
  const { supabase, userId } = await requireEditor();
  const slug = `${slugify(input.data.title) || "podcast"}-${crypto.randomUUID().slice(0, 6)}`;
  const { error } = await supabase.from("podcast_shows").insert({ title: input.data.title, slug, description: input.data.description || null, artwork_url: input.data.artworkUrl || null, language_code: input.data.language, author_name: input.data.author || "K-TECH MEDIA NETWORK", category: input.data.category || "News", created_by: userId });
  if (error) redirect("/admin/audio?error=show");
  revalidatePath("/podcasts"); redirect("/admin/audio?saved=show");
}

export async function createPodcastEpisode(formData: FormData) {
  const input = z.object({ showId: z.string().uuid(), title: z.string().trim().min(3).max(180), summary: z.string().trim().max(1200).optional().default(""), audioUrl: z.string().url(), episodeNumber: z.union([z.literal(""), z.coerce.number().int().positive()]).optional(), language: z.enum(["en", "ha"]), status: z.enum(["draft", "published"]) }).safeParse(Object.fromEntries(formData));
  if (!input.success || new URL(input.data.audioUrl).protocol !== "https:") redirect("/admin/audio?error=episode");
  const { supabase, userId } = await requireEditor();
  const slug = `${slugify(input.data.title) || "episode"}-${crypto.randomUUID().slice(0, 6)}`;
  const { error } = await supabase.from("podcast_episodes").insert({ show_id: input.data.showId, title: input.data.title, slug, summary: input.data.summary || null, audio_url: input.data.audioUrl, episode_number: input.data.episodeNumber === "" ? null : input.data.episodeNumber, language_code: input.data.language, status: input.data.status, published_at: input.data.status === "published" ? new Date().toISOString() : null, created_by: userId });
  if (error) redirect("/admin/audio?error=episode");
  revalidatePath("/podcasts"); redirect("/admin/audio?saved=episode");
}
