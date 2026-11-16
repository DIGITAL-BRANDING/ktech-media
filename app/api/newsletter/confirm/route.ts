import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const ha = url.searchParams.get("language") === "ha";
  if (!token || !/^[A-Za-z0-9_-]{40,150}$/.test(token)) return NextResponse.redirect(new URL("/newsletter/confirmed?status=invalid", request.url));
  return new Response(`<!doctype html><html lang="${ha ? "ha" : "en"}"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${ha ? "Tabbatar da rajistar imel" : "Confirm newsletter"}</title><body style="font:16px system-ui;max-width:580px;margin:12vh auto;padding:24px"><h1>${ha ? "Tabbatar da rajistar newsletter" : "Confirm your newsletter subscription"}</h1><p>${ha ? "Tabbatar cewa kana son samun sabbin labarai ta imel daga K-TECH MEDIA NETWORK." : "Confirm that you want to receive email updates from K-TECH MEDIA NETWORK."}</p><form method="post"><input type="hidden" name="token" value="${token}"><button style="padding:12px 18px;background:#e8001d;color:white;border:0;border-radius:6px" type="submit">${ha ? "Tabbatar da rajista" : "Confirm subscription"}</button></form></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const token = form?.get("token");
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{40,150}$/.test(token)) return NextResponse.redirect(new URL("/newsletter/confirmed?status=invalid", request.url));
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("confirm_newsletter_subscription", { p_token_hash: tokenHash });
  const status = !error && data ? "success" : "invalid";
  return NextResponse.redirect(new URL(`/newsletter/confirmed?status=${status}`, request.url));
}
