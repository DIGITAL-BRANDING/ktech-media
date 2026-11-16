"use server";

import { createHmac } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { escapeHtml, sendEmailBatch } from "@/lib/email";
import { sendNotification, setVapidDetails, type PushSubscription } from "web-push";

async function requireEditor() {
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (typeof userId !== "string") redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role,is_active").eq("id", userId).maybeSingle();
  if (!profile?.is_active || profile.role === "reporter") redirect("/admin");
  return { supabase, userId };
}

function safeHttps(value: string) {
  try { const url = new URL(value); return url.protocol === "https:"; } catch { return false; }
}

export async function createNewsletterCampaign(formData: FormData) {
  const input = z.object({ subject: z.string().trim().min(3).max(180), preheader: z.string().trim().max(200).optional().default(""), body: z.string().trim().min(20).max(12000), language: z.enum(["en", "ha"]) }).safeParse(Object.fromEntries(formData));
  if (!input.success) redirect("/admin/marketing?error=campaign");
  const { supabase, userId } = await requireEditor();
  const { error } = await supabase.from("newsletter_campaigns").insert({ subject: input.data.subject, preheader: input.data.preheader || null, body: input.data.body, language_code: input.data.language, created_by: userId });
  if (error) redirect("/admin/marketing?error=campaign");
  revalidatePath("/admin/marketing"); redirect("/admin/marketing?saved=campaign");
}

export async function sendNewsletterCampaign(formData: FormData) {
  const campaignId = z.string().uuid().safeParse(formData.get("campaignId"));
  if (!campaignId.success) redirect("/admin/marketing?error=campaign");
  const { supabase } = await requireEditor();
  const { data: campaign } = await supabase.from("newsletter_campaigns").select("id,subject,preheader,body,language_code,status").eq("id", campaignId.data).eq("status", "draft").maybeSingle();
  if (!campaign) redirect("/admin/marketing?error=campaign");
  const { data: claimed, error: claimError } = await supabase.from("newsletter_campaigns").update({ status: "sending" }).eq("id", campaign.id).eq("status", "draft").select("id").maybeSingle();
  if (claimError || !claimed) redirect("/admin/marketing?error=campaign");
  const { data: subscribers, error } = await supabase.from("newsletter_subscribers").select("id,email").eq("status", "active").eq("language_code", campaign.language_code).limit(5000);
  if (error) { await supabase.from("newsletter_campaigns").update({ status: "draft" }).eq("id", campaign.id).eq("status", "sending"); redirect("/admin/marketing?error=recipients"); }
  const tokenSecret = process.env.NEWSLETTER_TOKEN_SECRET;
  if (!tokenSecret || tokenSecret.length < 32) { await supabase.from("newsletter_campaigns").update({ status: "draft" }).eq("id", campaign.id).eq("status", "sending"); redirect("/admin/marketing?error=email-config"); }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://media.k-tech.com.ng";
  const recipients = subscribers || [];
  try {
    for (let offset = 0; offset < recipients.length; offset += 100) {
      const batch = recipients.slice(offset, offset + 100).map((subscriber) => {
        const token = createHmac("sha256", tokenSecret).update(`unsubscribe:${subscriber.id}`).digest("base64url");
        const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}&language=${campaign.language_code}`;
        const body = campaign.body.split(/\r?\n/).filter(Boolean).map((line) => `<p>${escapeHtml(line)}</p>`).join("");
        return { to: subscriber.email, subject: campaign.subject, html: `${campaign.preheader ? `<p><small>${escapeHtml(campaign.preheader)}</small></p>` : ""}${body}<hr><p><small><a href="${unsubscribeUrl}">Unsubscribe from K-TECH MEDIA NETWORK emails</a></small></p>` };
      });
      if (batch.length) await sendEmailBatch(batch);
    }
    const { error: updateError } = await supabase.from("newsletter_campaigns").update({ status: "sent", recipient_count: recipients.length, sent_at: new Date().toISOString() }).eq("id", campaign.id).eq("status", "sending");
    if (updateError) throw new Error("Could not record the newsletter delivery status.");
  } catch (deliveryError) {
    console.error("Newsletter campaign delivery failed:", deliveryError instanceof Error ? deliveryError.message : "Unknown error");
    await supabase.from("newsletter_campaigns").update({ status: "failed" }).eq("id", campaign.id).eq("status", "sending");
    redirect("/admin/marketing?error=delivery");
  }
  revalidatePath("/admin/marketing"); redirect(`/admin/marketing?sent=${recipients.length}`);
}

export async function createAdCampaign(formData: FormData) {
  const input = z.object({ advertiser: z.string().trim().min(2).max(160), title: z.string().trim().min(3).max(180), description: z.string().trim().max(400).optional().default(""), imageUrl: z.string().url(), destinationUrl: z.string().url(), slot: z.enum(["homepage_top", "homepage_sidebar", "article_inline", "podcast_sidebar"]), startsAt: z.string().optional().default(""), endsAt: z.string().optional().default(""), sponsoredArticleId: z.union([z.literal(""), z.string().uuid()]).optional().default("") }).safeParse(Object.fromEntries(formData));
  if (!input.success || !safeHttps(input.data.imageUrl) || !safeHttps(input.data.destinationUrl)) redirect("/admin/marketing?error=ad");
  const startDate = input.data.startsAt ? new Date(`${input.data.startsAt}:00+01:00`) : null;
  const endDate = input.data.endsAt ? new Date(`${input.data.endsAt}:00+01:00`) : null;
  if ((startDate && Number.isNaN(startDate.getTime())) || (endDate && Number.isNaN(endDate.getTime()))) redirect("/admin/marketing?error=ad");
  const startsAt = startDate?.toISOString() || null;
  const endsAt = endDate?.toISOString() || null;
  if (startsAt && endsAt && endsAt <= startsAt) redirect("/admin/marketing?error=ad");
  const { supabase, userId } = await requireEditor();
  const status = startsAt && new Date(startsAt) > new Date() ? "scheduled" : "active";
  const { data, error } = await supabase.from("ad_campaigns").insert({ advertiser: input.data.advertiser, title: input.data.title, description: input.data.description || null, image_url: input.data.imageUrl, destination_url: input.data.destinationUrl, slot: input.data.slot, status, starts_at: startsAt, ends_at: endsAt, sponsored_article_id: input.data.sponsoredArticleId || null, created_by: userId }).select("id").single();
  if (error || !data) redirect("/admin/marketing?error=ad");
  if (input.data.sponsoredArticleId) {
    const { error: sponsorError } = await supabase.from("articles").update({ is_sponsored: true, sponsor_name: input.data.advertiser }).eq("id", input.data.sponsoredArticleId);
    if (sponsorError) redirect("/admin/marketing?error=sponsor");
  }
  revalidatePath("/"); revalidatePath("/news"); revalidatePath("/admin/marketing"); redirect("/admin/marketing?saved=ad");
}

export async function changeAdStatus(formData: FormData) {
  const input = z.object({ id: z.string().uuid(), status: z.enum(["active", "paused", "ended"]) }).safeParse(Object.fromEntries(formData));
  if (!input.success) redirect("/admin/marketing?error=ad");
  const { supabase } = await requireEditor();
  const { error } = await supabase.from("ad_campaigns").update({ status: input.data.status }).eq("id", input.data.id);
  if (error) redirect("/admin/marketing?error=ad");
  revalidatePath("/"); revalidatePath("/news"); revalidatePath("/admin/marketing"); redirect("/admin/marketing?saved=status");
}

export async function sendPushBroadcast(formData: FormData) {
  const input = z.object({ title: z.string().trim().min(3).max(90), body: z.string().trim().min(5).max(240), url: z.string().trim().startsWith("/").max(300) }).safeParse(Object.fromEntries(formData));
  if (!input.success || input.data.url.startsWith("//")) redirect("/admin/marketing?error=push");
  const { supabase } = await requireEditor();
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) redirect("/admin/marketing?error=push-config");
  setVapidDetails(subject, publicKey, privateKey);
  const { data: subscriptions, error } = await supabase.from("web_push_subscriptions").select("id,endpoint,subscription").limit(5000);
  if (error) redirect("/admin/marketing?error=push");
  const payload = JSON.stringify({ title: input.data.title, body: input.data.body, url: input.data.url });
  let sent = 0;
  for (let offset = 0; offset < (subscriptions || []).length; offset += 10) {
    const batch = (subscriptions || []).slice(offset, offset + 10);
    const results = await Promise.allSettled(batch.map(async (row) => {
      try { await sendNotification(row.subscription as unknown as PushSubscription, payload, { TTL: 3600, urgency: "high" }); return { id: row.id, ok: true }; }
      catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) await supabase.from("web_push_subscriptions").delete().eq("id", row.id);
        return { id: row.id, ok: false };
      }
    }));
    sent += results.filter((result) => result.status === "fulfilled" && result.value.ok).length;
  }
  revalidatePath("/admin/marketing"); redirect(`/admin/marketing?pushSent=${sent}`);
}
