import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createClient } from "@supabase/supabase-js";

const schema = z.object({ subscription: z.object({ endpoint: z.string().url().startsWith("https://"), keys: z.object({ p256dh: z.string().min(20).max(300), auth: z.string().min(10).max(100) }) }), language: z.enum(["en", "ha"]).default("en") });
const endpointSchema = z.object({ endpoint: z.string().url().startsWith("https://") });
const limits = new Map<string, { count: number; resetAt: number }>();
function limited(request: Request) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const entry = limits.get(ip);
  if (entry && entry.resetAt > now && entry.count >= 20) return true;
  limits.set(ip, entry && entry.resetAt > now ? { ...entry, count: entry.count + 1 } : { count: 1, resetAt: now + 60 * 60 * 1000 });
  return false;
}

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return NextResponse.json({ error: "Push notifications are not configured." }, { status: 503 });
  return NextResponse.json({ publicKey }, { headers: { "Cache-Control": "public, max-age=3600" } });
}

export async function POST(request: Request) {
  if (limited(request)) return NextResponse.json({ error: "Please wait before trying again." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Push storage is not configured." }, { status: 503 });
  const { NEXT_PUBLIC_SUPABASE_URL } = getSupabasePublicEnv();
  const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await supabase.from("web_push_subscriptions").upsert({ endpoint: parsed.data.subscription.endpoint, subscription: parsed.data.subscription, language_code: parsed.data.language }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ error: "Could not save the subscription." }, { status: 503 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const parsed = endpointSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid endpoint." }, { status: 400 });
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Push storage is not configured." }, { status: 503 });
  const { NEXT_PUBLIC_SUPABASE_URL } = getSupabasePublicEnv();
  const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await supabase.from("web_push_subscriptions").delete().eq("endpoint", parsed.data.endpoint);
  if (error) return NextResponse.json({ error: "Could not remove subscription." }, { status: 503 });
  return NextResponse.json({ ok: true });
}
