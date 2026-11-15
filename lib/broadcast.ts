import "server-only";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";

export type LiveStream = {
  id: string;
  title: string;
  embed_url: string | null;
  hls_url: string | null;
  status: "live" | "offline" | "scheduled";
  scheduled_at: string | null;
  program: { title: string } | null;
};

export type ScheduleEntry = {
  id: string;
  day_of_week: number;
  starts_at: string;
  ends_at: string;
  timezone: string;
  program: { title: string; host: string | null; slug: string } | null;
};

export type PublicProgram = {
  id: string;
  title: string;
  slug: string;
  host: string | null;
  description: string | null;
  poster_url: string | null;
  schedule: { day_of_week: number; starts_at: string; ends_at: string }[];
};

export async function getPublicPrograms(): Promise<PublicProgram[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("programs")
    .select("id,title,slug,host,description,poster_url,schedule:program_schedule(day_of_week,starts_at,ends_at)")
    .eq("is_active", true).order("title").limit(100);
  if (error) {
    console.error("Unable to load broadcast programmes:", error.message);
    return [];
  }
  return (data || []) as unknown as PublicProgram[];
}

export async function getCurrentLiveStream(): Promise<LiveStream | null> {
  if (!isSupabaseConfigured()) {
    return site.liveStreamUrl ? { id: "environment-stream", title: `${site.name} Live`, embed_url: site.liveStreamUrl, hls_url: null, status: "live", scheduled_at: null, program: null } : null;
  }
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("live_streams")
    .select("id,title,embed_url,hls_url,status,scheduled_at,program:programs(title)")
    .in("status", ["live", "scheduled"]).order("status", { ascending: true })
    .order("scheduled_at", { ascending: true }).limit(5);
  if (error) {
    console.error("Unable to load public live stream:", error.message);
    return site.liveStreamUrl ? { id: "environment-stream", title: `${site.name} Live`, embed_url: site.liveStreamUrl, hls_url: null, status: "live", scheduled_at: null, program: null } : null;
  }
  const streams = (data || []) as unknown as LiveStream[];
  const live = streams.find((stream) => stream.status === "live");
  if (live) return live;
  const now = Date.now();
  const upcoming = streams.filter((stream) => stream.status === "scheduled" && stream.scheduled_at && new Date(stream.scheduled_at).getTime() >= now)
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())[0];
  return upcoming || (site.liveStreamUrl ? { id: "environment-stream", title: `${site.name} Live`, embed_url: site.liveStreamUrl, hls_url: null, status: "live", scheduled_at: null, program: null } : null);
}

export async function getProgramSchedule(): Promise<{ current: ScheduleEntry | null; next: ScheduleEntry | null; today: ScheduleEntry[] }> {
  if (!isSupabaseConfigured()) return { current: null, next: null, today: [] };
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("program_schedule")
    .select("id,day_of_week,starts_at,ends_at,timezone,program:programs(title,host,slug)")
    .eq("is_active", true).order("starts_at", { ascending: true }).limit(100);
  if (error) {
    console.error("Unable to load program guide:", error.message);
    return { current: null, next: null, today: [] };
  }
  const entries = (data || []) as unknown as ScheduleEntry[];
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Lagos", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const day = weekdayNames.indexOf(parts.find((part) => part.type === "weekday")?.value || "Sun");
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
  const nowMinutes = hour * 60 + minute;
  const minutesOf = (time: string) => { const [h, m] = time.split(":").map(Number); return h * 60 + m; };
  const today = entries.filter((entry) => entry.day_of_week === day);
  const current = today.find((entry) => {
    const start = minutesOf(entry.starts_at); const end = minutesOf(entry.ends_at);
    return start < end ? nowMinutes >= start && nowMinutes < end : nowMinutes >= start || nowMinutes < end;
  }) || entries.find((entry) => entry.day_of_week === (day + 6) % 7 && minutesOf(entry.starts_at) > minutesOf(entry.ends_at) && nowMinutes < minutesOf(entry.ends_at)) || null;
  const next = entries.map((entry) => {
    const dayOffset = (entry.day_of_week - day + 7) % 7;
    const start = minutesOf(entry.starts_at);
    const delta = dayOffset * 1440 + start - nowMinutes;
    return { entry, delta: delta <= 0 ? delta + 7 * 1440 : delta };
  }).filter(({ entry }) => entry.id !== current?.id).sort((a, b) => a.delta - b.delta)[0]?.entry || null;
  return { current, next, today };
}
