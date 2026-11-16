import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Locale } from "@/lib/i18n";

export type PodcastShow = { id: string; title: string; slug: string; description: string | null; artwork_url: string | null; language_code: string; author_name: string; category: string };
export type PodcastEpisode = { id: string; show_id: string; title: string; slug: string; summary: string | null; audio_url: string; episode_number: number | null; duration_seconds: number | null; language_code: string; published_at: string | null };

export async function getLiveRadio() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("radio_streams").select("id,title,stream_url,status,description").eq("status", "live").limit(1).maybeSingle();
  if (error) { console.error("Unable to load live radio:", error.message); return null; }
  return data;
}

export async function getPodcastShows(locale?: Locale) {
  if (!isSupabaseConfigured()) return [] as PodcastShow[];
  const supabase = await createServerSupabaseClient();
  let query = supabase.from("podcast_shows").select("id,title,slug,description,artwork_url,language_code,author_name,category").eq("is_active", true).order("created_at", { ascending: false });
  if (locale) query = query.eq("language_code", locale);
  const { data, error } = await query;
  if (error) { console.error("Unable to load podcast shows:", error.message); return []; }
  return (data || []) as PodcastShow[];
}

export async function getPodcastShow(slug: string, locale?: Locale) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  let showQuery = supabase.from("podcast_shows").select("id,title,slug,description,artwork_url,language_code,author_name,category").eq("slug", slug).eq("is_active", true);
  if (locale) showQuery = showQuery.eq("language_code", locale);
  const { data, error } = await showQuery.maybeSingle();
  if (error || !data) return null;
  const { data: episodes, error: episodesError } = await supabase.from("podcast_episodes").select("id,show_id,title,slug,summary,audio_url,episode_number,duration_seconds,language_code,published_at").eq("show_id", data.id).eq("status", "published").lte("published_at", new Date().toISOString()).order("published_at", { ascending: false });
  if (episodesError) console.error("Unable to load podcast episodes:", episodesError.message);
  return { ...(data as PodcastShow), episodes: (episodes || []) as PodcastEpisode[] };
}
