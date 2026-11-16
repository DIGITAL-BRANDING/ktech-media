import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdSlot = "homepage_top" | "homepage_sidebar" | "article_inline" | "podcast_sidebar";
export async function getActiveAd(slot: AdSlot) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  const now = Date.now();
  const { data, error } = await supabase.from("ad_campaigns").select("id,advertiser,title,description,image_url,destination_url,slot,starts_at,ends_at").in("status", ["active", "scheduled"]).eq("slot", slot).order("created_at", { ascending: false }).limit(20);
  if (error) { console.error("Unable to load sponsored placement:", error.message); return null; }
  return (data || []).find((ad) => (!ad.starts_at || new Date(ad.starts_at).getTime() <= now) && (!ad.ends_at || new Date(ad.ends_at).getTime() > now)) || null;
}
