"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const optionalUrl = z.union([z.literal(""), z.string().url().max(500)]);
const optionalEmail = z.union([z.literal(""), z.string().email().max(254)]);
const schema = z.object({
  site_name: z.string().trim().min(2).max(80),
  live_stream_url: optionalUrl,
  ticker_text: z.string().trim().max(240),
  office_address: z.string().trim().max(240),
  phone: z.string().trim().max(40),
  contact_email: optionalEmail,
  advertising_email: optionalEmail,
  facebook_url: optionalUrl,
  x_url: optionalUrl,
  youtube_url: optionalUrl,
  instagram_url: optionalUrl,
  whatsapp_url: optionalUrl,
  telegram_url: optionalUrl,
});
export async function saveSiteSettings(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/settings?error=invalid");
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/admin/login");
  for (const [key, value] of Object.entries(parsed.data)) {
    const { error } = await supabase.from("site_settings").upsert({ key, value, updated_by: claims.claims.sub }, { onConflict: "key" });
    if (error) redirect("/admin/settings?error=save-failed");
  }
  revalidatePath("/"); revalidatePath("/live"); redirect("/admin/settings?saved=1");
}
