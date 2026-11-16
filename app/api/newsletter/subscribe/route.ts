import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sendTransactionalEmail, escapeHtml } from "@/lib/email";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createClient } from "@supabase/supabase-js";

const inputSchema = z.object({ email: z.string().trim().email().max(254), language: z.enum(["en", "ha"]).default("en"), consent: z.literal("yes"), company: z.string().max(200).optional().default("") });
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const requestLog = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ message: "Invalid request." }, { status: 400 }); }
  const address = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const previous = requestLog.get(address);
  if (previous && previous.resetAt > now && previous.count >= 5) return NextResponse.json({ message: "Please wait before trying again." }, { status: 429 });
  requestLog.set(address, previous && previous.resetAt > now ? { count: previous.count + 1, resetAt: previous.resetAt } : { count: 1, resetAt: now + 60 * 60 * 1000 });
  const parsed = inputSchema.safeParse({ email: form.get("email"), language: form.get("language") || "en", consent: form.get("consent"), company: form.get("company") || "" });
  if (!parsed.success) return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  if (parsed.data.company) return NextResponse.json({ message: "Check your email to confirm your subscription." });

  const token = randomBytes(32).toString("base64url");
  let id = randomUUID();
  const tokenSecret = process.env.NEWSLETTER_TOKEN_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!tokenSecret || tokenSecret.length < 32 || !serviceKey) return NextResponse.json({ message: "Newsletter signup is not configured yet." }, { status: 503 });
  const { NEXT_PUBLIC_SUPABASE_URL } = getSupabasePublicEnv();
  const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const email = parsed.data.email.toLowerCase();
  const { data: existing } = await supabase.from("newsletter_subscribers").select("id,status").eq("email", email).maybeSingle();
  if (existing?.status === "active") return NextResponse.json({ message: parsed.data.language === "ha" ? "Idan rajistar ta yiwu, za ka samu imel domin tabbatarwa." : "If the address can be subscribed, a confirmation email will arrive shortly." });
  if (existing) id = existing.id;
  const finalUnsubscribeToken = createHmac("sha256", tokenSecret).update(`unsubscribe:${id}`).digest("base64url");
  const payload = { id, email, language_code: parsed.data.language, status: "pending" as const, confirmation_token_hash: hash(token), unsubscribe_token_hash: hash(finalUnsubscribeToken), consented_at: new Date().toISOString(), confirmed_at: null, unsubscribed_at: null };
  const { error } = existing
    ? await supabase.from("newsletter_subscribers").update(payload).eq("id", existing.id)
    : await supabase.from("newsletter_subscribers").insert(payload);
  // Keep the response generic to avoid revealing whether an address is already subscribed.
  if (error?.code === "23505") return NextResponse.json({ message: parsed.data.language === "ha" ? "Idan rajistar ta yiwu, za ka samu imel domin tabbatarwa." : "If the address can be subscribed, a confirmation email will arrive shortly." });
  if (error) {
    console.error("Newsletter subscription could not be stored:", error.message);
    return NextResponse.json({ message: "Newsletter signup is temporarily unavailable." }, { status: 503 });
  }
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || new URL(request.url).origin;
  const confirmUrl = `${origin}/api/newsletter/confirm?token=${encodeURIComponent(token)}&language=${parsed.data.language}`;
  const unsubscribeUrl = `${origin}/api/newsletter/unsubscribe?token=${encodeURIComponent(finalUnsubscribeToken)}&language=${parsed.data.language}`;
  try {
    const content = parsed.data.language === "ha" ? "Danna hanyar da ke ƙasa domin tabbatar da rajistar imel ɗinka." : "Confirm your email subscription by using the link below.";
    await sendTransactionalEmail({ to: parsed.data.email, subject: parsed.data.language === "ha" ? "Tabbatar da rajistar labarai" : "Confirm your newsletter subscription", html: `<p>${escapeHtml(content)}</p><p><a href="${confirmUrl}">${parsed.data.language === "ha" ? "Tabbatar da rajista" : "Confirm subscription"}</a></p><p>If this was not you, ignore this email. <a href="${unsubscribeUrl}">Unsubscribe</a></p>` });
  } catch (emailError) {
    console.error("Newsletter confirmation email could not be sent:", emailError instanceof Error ? emailError.message : "Unknown error");
    return NextResponse.json({ message: "Email delivery is not configured yet. Please try again later." }, { status: 503 });
  }
  return NextResponse.json({ message: parsed.data.language === "ha" ? "Duba imel ɗinka domin tabbatarwa." : "Check your email to confirm your subscription." });
}
