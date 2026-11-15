"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  id: z.union([z.literal(""), z.string().uuid()]).optional(),
  title: z.string().trim().min(3).max(180),
  embedUrl: z.string().trim().optional().default(""),
  hlsUrl: z.string().trim().optional().default(""),
  status: z.enum(["live", "offline", "scheduled"]),
  scheduledAt: z.string().optional().default(""),
  programId: z.union([z.literal(""), z.string().uuid()]).optional().default(""),
});

function httpsUrl(value: string) {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === "https:" ? url.toString() : null; } catch { return null; }
}

function trustedEmbed(value: string) {
  const url = httpsUrl(value);
  if (!url) return null;
  const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  const allowed = ["youtube.com", "youtube-nocookie.com", "youtu.be", "vimeo.com", "player.vimeo.com", "facebook.com", "fb.watch", "cloudflarestream.com"];
  return allowed.some((domain) => host === domain || host.endsWith(`.${domain}`)) ? url : null;
}

export async function saveLiveStream(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/broadcast?error=fields");
  const embedUrl = trustedEmbed(parsed.data.embedUrl);
  const hlsUrl = httpsUrl(parsed.data.hlsUrl);
  if ((parsed.data.embedUrl && !embedUrl) || (parsed.data.hlsUrl && !hlsUrl) || (parsed.data.status !== "offline" && !embedUrl && !hlsUrl)) {
    redirect("/admin/broadcast?error=url");
  }
  let scheduledAt: string | null = null;
  if (parsed.data.scheduledAt) {
    const raw = parsed.data.scheduledAt;
    const date = new Date(raw.length === 16 ? `${raw}:00+01:00` : raw);
    if (Number.isNaN(date.getTime())) redirect("/admin/broadcast?error=fields");
    scheduledAt = date.toISOString();
  }
  if (parsed.data.status === "scheduled" && !scheduledAt) redirect("/admin/broadcast?error=fields");

  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (typeof userId !== "string") redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role,is_active").eq("id", userId).maybeSingle();
  if (!profile?.is_active || profile.role === "reporter") redirect("/admin");

  if (parsed.data.status === "live") {
    let activeQuery = supabase.from("live_streams").update({ status: "offline" }).eq("status", "live");
    if (parsed.data.id) activeQuery = activeQuery.neq("id", parsed.data.id);
    const { error } = await activeQuery;
    if (error) redirect("/admin/broadcast?error=save");
  }

  const payload = {
    ...(parsed.data.id ? { id: parsed.data.id } : {}),
    title: parsed.data.title,
    embed_url: embedUrl,
    hls_url: hlsUrl,
    status: parsed.data.status,
    scheduled_at: scheduledAt,
    program_id: parsed.data.programId || null,
    created_by: userId,
  };
  const { error } = await supabase.from("live_streams").upsert(payload);
  if (error) {
    console.error("Unable to save live stream:", error.message);
    redirect("/admin/broadcast?error=save");
  }
  revalidatePath("/"); revalidatePath("/live"); revalidatePath("/programs");
  redirect("/admin/broadcast?saved=1");
}

async function requireBroadcastEditor() {
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (typeof userId !== "string") redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role,is_active").eq("id", userId).maybeSingle();
  if (!profile?.is_active || profile.role === "reporter") redirect("/admin");
  return { supabase, userId };
}

function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 160);
}

export async function createProgram(formData: FormData) {
  const parsed = z.object({ title: z.string().trim().min(3).max(160), host: z.string().trim().max(120).optional().default(""), description: z.string().trim().max(1200).optional().default(""), posterUrl: z.string().trim().optional().default("") }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/broadcast?error=program");
  const posterUrl = parsed.data.posterUrl ? httpsUrl(parsed.data.posterUrl) : null;
  if (parsed.data.posterUrl && !posterUrl) redirect("/admin/broadcast?error=program");
  const { supabase, userId } = await requireBroadcastEditor();
  const slug = `${slugify(parsed.data.title) || "programme"}-${crypto.randomUUID().slice(0, 6)}`;
  const { error } = await supabase.from("programs").insert({ title: parsed.data.title, slug, host: parsed.data.host || null, description: parsed.data.description || null, poster_url: posterUrl, created_by: userId });
  if (error) {
    console.error("Unable to create broadcast programme:", error.message);
    redirect("/admin/broadcast?error=program");
  }
  revalidatePath("/programs"); revalidatePath("/live");
  redirect("/admin/broadcast?program=created");
}

export async function addProgramSchedule(formData: FormData) {
  const parsed = z.object({ programId: z.string().uuid(), day: z.coerce.number().int().min(0).max(6), startsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), endsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success || parsed.data.startsAt === parsed.data.endsAt) redirect("/admin/broadcast?error=schedule");
  const { supabase } = await requireBroadcastEditor();
  const { error } = await supabase.from("program_schedule").insert({ program_id: parsed.data.programId, day_of_week: parsed.data.day, starts_at: `${parsed.data.startsAt}:00`, ends_at: `${parsed.data.endsAt}:00`, timezone: "Africa/Lagos" });
  if (error) {
    console.error("Unable to add programme schedule:", error.message);
    redirect("/admin/broadcast?error=schedule");
  }
  revalidatePath("/live");
  redirect("/admin/broadcast?schedule=added");
}

export async function removeProgramSchedule(formData: FormData) {
  const parsed = z.object({ scheduleId: z.string().uuid() }).safeParse({ scheduleId: formData.get("scheduleId") });
  if (!parsed.success) redirect("/admin/broadcast?error=schedule");
  const { supabase } = await requireBroadcastEditor();
  const { error } = await supabase.from("program_schedule").delete().eq("id", parsed.data.scheduleId);
  if (error) redirect("/admin/broadcast?error=schedule");
  revalidatePath("/live");
  redirect("/admin/broadcast?schedule=removed");
}
