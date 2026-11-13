import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { saveSiteSettings } from "./actions";

export const dynamic = "force-dynamic";
export default async function SettingsAdminPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", claims.claims.sub).maybeSingle();
  if (!profile || profile.role === "reporter") redirect("/admin");
  const { data: rows } = await supabase.from("site_settings").select("key,value");
  const values = Object.fromEntries((rows ?? []).map((row) => [row.key, row.value]));
  const text = (key: string) => typeof values[key] === "string" ? values[key] as string : "";
  return <section className="admin-page"><div className="admin-page-heading"><div><span className="eyebrow">TSARIN SITE</span><h1>Saitunan site</h1><p>Sarrafa sunan kafar, ticker na breaking news, da adireshin live stream.</p></div></div>
    {params.error && <p className="form-error">Ba a adana saitunan ba. Duba adireshin live stream.</p>}{params.saved && <p className="success-message">An adana saitunan kuma za su bayyana a website.</p>}
    <form action={saveSiteSettings} className="editor-form admin-panel admin-settings-form"><label>Sunan media<input name="site_name" defaultValue={text("site_name") || "K-TECH MEDIA NETWORK"} required maxLength={80} /></label><label>Adireshin live stream<input name="live_stream_url" type="url" defaultValue={text("live_stream_url")} placeholder="https://www.youtube.com/embed/..." /></label><small>A saka adireshin embed mai aminci (HTTPS), misali YouTube Live embed URL.</small><label>Rubutun ticker<textarea name="ticker_text" rows={3} defaultValue={text("ticker_text")} maxLength={240} placeholder="Rubutun da zai bayyana a saman shafin" /></label><div className="settings-divider"><h2>Bayanan tuntuɓa</h2><p>Waɗannan bayanan za su bayyana a footer da shafukan tuntuɓa.</p></div><label>Adireshin ofis<input name="office_address" defaultValue={text("office_address")} maxLength={240} placeholder="Birni, Najeriya" /></label><div className="form-inline-fields"><label>Lambar waya<input name="phone" defaultValue={text("phone")} maxLength={40} placeholder="+234 ..." /></label><label>Email na newsroom<input name="contact_email" type="email" defaultValue={text("contact_email")} placeholder="news@example.com" /></label></div><label>Email na tallace-tallace<input name="advertising_email" type="email" defaultValue={text("advertising_email")} placeholder="advertise@example.com" /></label><div className="settings-divider"><h2>Social media</h2><p>Ka saka link ɗin official profile; waɗanda ba su da link ba za su bayyana ba.</p></div><div className="form-inline-fields"><label>Facebook<input name="facebook_url" type="url" defaultValue={text("facebook_url")} /></label><label>X / Twitter<input name="x_url" type="url" defaultValue={text("x_url")} /></label><label>YouTube<input name="youtube_url" type="url" defaultValue={text("youtube_url")} /></label><label>Instagram<input name="instagram_url" type="url" defaultValue={text("instagram_url")} /></label><label>WhatsApp<input name="whatsapp_url" type="url" defaultValue={text("whatsapp_url")} /></label><label>Telegram<input name="telegram_url" type="url" defaultValue={text("telegram_url")} /></label></div><button type="submit" className="btn-waraka-primary">Ajiye saituna</button></form>
  </section>;
}
