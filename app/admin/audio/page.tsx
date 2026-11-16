import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";
import { createPodcastEpisode, createPodcastShow, saveRadioStream } from "@/app/admin/audio/actions";

export const metadata = { title: "Radio & Podcasts" };
export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ error?: string; saved?: string }> };

export default async function AudioAdminPage({ searchParams }: Props) {
  if (!isSupabaseConfigured()) return <SupabaseSetupNotice title="Connect Supabase to manage radio and podcasts" />;
  const query = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role,is_active").eq("id", userId).maybeSingle();
  if (!profile?.is_active || profile.role === "reporter") redirect("/admin");
  const [{ data: radios }, { data: shows }, { data: episodes }] = await Promise.all([
    supabase.from("radio_streams").select("id,title,stream_url,status,description").order("updated_at", { ascending: false }),
    supabase.from("podcast_shows").select("id,title,slug,language_code,is_active").order("created_at", { ascending: false }),
    supabase.from("podcast_episodes").select("id,title,status,published_at,show:podcast_shows(title)").order("created_at", { ascending: false }).limit(25),
  ]);
  const radio = radios?.[0];
  return <section className="admin-page"><div className="admin-page-heading"><div><span className="eyebrow">AUDIO / CONTROL ROOM</span><h1>Radio & Podcasts</h1><p>Manage live radio, shows, episodes and publication language.</p></div></div>
    {query.saved && <p role="status" className="success-message">Saved successfully.</p>}{query.error && <p role="alert" className="form-error">Could not save. Check secure HTTPS links and required fields.</p>}
    <div className="audio-admin-grid"><form action={saveRadioStream} className="editor-form admin-panel admin-settings-form"><h2 className="section-title">Radio stream</h2>{radio && <input type="hidden" name="id" value={radio.id} />}<label>Station title<input name="title" required defaultValue={radio?.title || "K-TECH Radio"} /></label><label>Secure stream URL<input name="streamUrl" type="url" required defaultValue={radio?.stream_url || ""} placeholder="https://radio.example.com/stream" /></label><label>Description<textarea name="description" rows={3} defaultValue={radio?.description || ""} /></label><label>Station status<select name="status" defaultValue={radio?.status || "offline"}><option value="offline">Off air</option><option value="live">On air</option></select></label><button className="btn-waraka-primary">Save radio settings</button></form>
      <form action={createPodcastShow} className="editor-form admin-panel admin-settings-form"><h2 className="section-title">Create podcast show</h2><label>Show title<input name="title" required maxLength={180} /></label><label>Description<textarea name="description" rows={3} /></label><label>Artwork URL<input name="artworkUrl" type="url" placeholder="https://…" /></label><label>Presenter / publisher<input name="author" defaultValue="K-TECH MEDIA NETWORK" /></label><label>Category<input name="category" defaultValue="News" /></label><label>Language<select name="language" defaultValue="en"><option value="en">English</option><option value="ha">Hausa</option></select></label><button className="btn-waraka-primary">Create show</button></form></div>
    <form action={createPodcastEpisode} className="editor-form admin-panel admin-settings-form mt-4"><h2 className="section-title">Add podcast episode</h2><div className="audio-episode-fields"><label>Show<select name="showId" required defaultValue=""><option value="" disabled>Select a show</option>{shows?.map((show) => <option value={show.id} key={show.id}>{show.title} ({show.language_code.toUpperCase()})</option>)}</select></label><label>Episode title<input name="title" required maxLength={180} /></label><label>Audio URL<input type="url" name="audioUrl" required placeholder="https://…/episode.mp3" /></label><label>Episode number<input type="number" name="episodeNumber" min="1" /></label><label>Language<select name="language" defaultValue="en"><option value="en">English</option><option value="ha">Hausa</option></select></label><label>Publish<select name="status"><option value="draft">Save as draft</option><option value="published">Publish now</option></select></label></div><label>Summary<textarea name="summary" rows={3} /></label><button className="btn-waraka-primary" disabled={!shows?.length}>Save episode</button></form>
    <section className="admin-panel mt-4"><h2 className="section-title">Recent episodes</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Episode</th><th>Show</th><th>Status</th><th>Published</th></tr></thead><tbody>{episodes?.map((episode) => <tr key={episode.id}><td>{episode.title}</td><td>{(episode.show as { title?: string } | null)?.title || "—"}</td><td>{episode.status}</td><td>{episode.published_at ? new Date(episode.published_at).toLocaleDateString("en-NG") : "—"}</td></tr>)}</tbody></table></div></section>
  </section>;
}
