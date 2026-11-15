import { redirect } from "next/navigation";
import { addProgramSchedule, createProgram, removeProgramSchedule, saveLiveStream } from "@/app/admin/broadcast/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";

export const metadata = { title: "Broadcast control" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string; saved?: string; program?: string; schedule?: string }> };

export default async function BroadcastAdminPage({ searchParams }: Props) {
  if (!isSupabaseConfigured()) return <SupabaseSetupNotice title="Connect Supabase to manage the live channel" />;
  const query = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role,is_active").eq("id", userId).maybeSingle();
  if (!profile?.is_active || profile.role === "reporter") redirect("/admin");
  const [{ data: streams, error: streamError }, { data: programs }, { data: scheduleRows }] = await Promise.all([
    supabase.from("live_streams").select("id,title,embed_url,hls_url,status,scheduled_at,program_id,updated_at").order("updated_at", { ascending: false }).limit(20),
    supabase.from("programs").select("id,title").eq("is_active", true).order("title"),
    supabase.from("program_schedule").select("id,day_of_week,starts_at,ends_at,program:programs(title)").order("day_of_week").order("starts_at"),
  ]);
  const stream = streams?.find((item) => item.status === "live") || streams?.find((item) => item.status === "scheduled") || streams?.[0];
  const errorMessage = query.error === "url" ? "Use HTTPS URLs and supported embed providers (YouTube, Vimeo, Facebook or Cloudflare Stream)." : query.error ? "Could not save the broadcast settings. Confirm the broadcasting migration is applied." : "";
  return <section className="admin-page">
    <div className="admin-page-heading"><div><span className="eyebrow">BROADCAST / CONTROL ROOM</span><h1>Live channel</h1><p>Set the on-air player, its status and the next scheduled broadcast.</p></div></div>
    {query.saved && <p className="success-message" role="status">Broadcast settings saved.</p>}
    {query.program && <p className="success-message" role="status">Programme saved.</p>}
    {query.schedule && <p className="success-message" role="status">Schedule updated.</p>}
    {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
    {streamError && <p className="form-error" role="alert">The broadcasting tables are not available yet. Apply the broadcasting foundation migration first.</p>}
    <form action={saveLiveStream} className="editor-form admin-panel admin-settings-form broadcast-form">
      {stream?.id && <input type="hidden" name="id" value={stream.id} />}
      <label>Stream title<input name="title" required minLength={3} maxLength={180} defaultValue={stream?.title || "K-TECH MEDIA NETWORK Live"} /></label>
      <label>Embed player URL<input type="url" name="embedUrl" placeholder="https://www.youtube.com/embed/..." defaultValue={stream?.embed_url || ""} /></label>
      <p className="form-hint">Use a provider’s HTTPS embed URL for reliable browser support. Approved providers: YouTube, Vimeo, Facebook and Cloudflare Stream.</p>
      <label>HLS playlist URL<input type="url" name="hlsUrl" placeholder="https://stream.example.com/live/index.m3u8" defaultValue={stream?.hls_url || ""} /></label>
      <p className="form-hint">Native HLS playback is available on compatible browsers; use the provider embed above for broader support.</p>
      <div className="broadcast-form-row"><label>Broadcast status<select name="status" defaultValue={stream?.status || "offline"}><option value="offline">Offline</option><option value="scheduled">Scheduled</option><option value="live">Live now</option></select></label><label>Scheduled start (WAT)<input type="datetime-local" name="scheduledAt" defaultValue={stream?.scheduled_at ? new Date(new Date(stream.scheduled_at).getTime() + 60 * 60 * 1000).toISOString().slice(0, 16) : ""} /></label></div>
      <label>Linked programme<select name="programId" defaultValue={stream?.program_id || ""}><option value="">No programme linked</option>{programs?.map((program) => <option key={program.id} value={program.id}>{program.title}</option>)}</select></label>
      <button className="btn-waraka-primary" type="submit">Save broadcast settings</button>
    </form>
    <aside className="admin-note"><strong>Stream provider:</strong> Railway hosts this website; it does not ingest or transcode video. Paste your YouTube Live/provider embed or HLS playback URL here. Keep streaming credentials and ingest keys private.</aside>
    <section className="broadcast-management-grid">
      <form action={createProgram} className="editor-form admin-panel admin-settings-form broadcast-form"><div><span className="eyebrow">PROGRAMME CATALOGUE</span><h2 className="section-title">Add a programme</h2></div><label>Programme title<input name="title" minLength={3} maxLength={160} required /></label><label>Host / presenter<input name="host" maxLength={120} /></label><label>Description<textarea name="description" rows={3} maxLength={1200} /></label><label>Poster image URL<input name="posterUrl" type="url" placeholder="https://…" /></label><button className="btn-waraka-primary" type="submit">Add programme</button></form>
      <form action={addProgramSchedule} className="editor-form admin-panel admin-settings-form broadcast-form"><div><span className="eyebrow">WEEKLY EPG</span><h2 className="section-title">Add a schedule slot</h2></div><label>Programme<select name="programId" defaultValue="" required><option value="">Select a programme</option>{programs?.map((program) => <option key={program.id} value={program.id}>{program.title}</option>)}</select></label><label>Day<select name="day" defaultValue="1">{["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label><div className="broadcast-form-row"><label>Start time (WAT)<input name="startsAt" type="time" required /></label><label>End time (WAT)<input name="endsAt" type="time" required /></label></div><button className="btn-waraka-primary" type="submit" disabled={!programs?.length}>Add schedule slot</button></form>
    </section>
    {!!scheduleRows?.length && <section className="admin-panel broadcast-schedule-admin"><h2 className="section-title">Weekly schedule</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Day</th><th>Time (WAT)</th><th>Programme</th><th>Action</th></tr></thead><tbody>{scheduleRows.map((slot) => { const program = slot.program as { title?: string } | null; return <tr key={slot.id}><td>{["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][slot.day_of_week]}</td><td>{slot.starts_at.slice(0, 5)}–{slot.ends_at.slice(0, 5)}</td><td>{program?.title || "Programme"}</td><td><form action={removeProgramSchedule}><input type="hidden" name="scheduleId" value={slot.id} /><button type="submit" className="table-action">Remove</button></form></td></tr>; })}</tbody></table></div></section>}
  </section>;
}
