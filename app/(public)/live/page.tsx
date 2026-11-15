import type { Metadata } from "next";
import Link from "next/link";
import { LiveStreamPlayer } from "@/components/live-stream-player";
import { getCurrentLiveStream, getProgramSchedule } from "@/lib/broadcast";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Watch Live", description: `Watch ${site.name} live and see the programme schedule.` };
export const revalidate = 60;

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function formatTime(value: string) {
  const [hour = "0", minute = "00"] = value.split(":");
  return new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Africa/Lagos" }).format(new Date(`2000-01-01T${hour}:${minute}:00+01:00`));
}

export default async function LivePage() {
  const [stream, guide] = await Promise.all([getCurrentLiveStream(), getProgramSchedule()]);
  return <section className="section live-section"><div className="container">
    <div className="live-page-heading"><div><span className="eyebrow">{site.name} / BROADCAST</span><h1 className="section-title">Watch live</h1></div><span className={`live-status-pill ${stream?.status === "live" ? "is-live" : "is-offline"}`}><i className="bi bi-broadcast" aria-hidden="true" /> {stream?.status === "live" ? "LIVE NOW" : stream?.status === "scheduled" ? "UP NEXT" : "OFFLINE"}</span></div>
    {stream?.status === "scheduled" && stream.scheduled_at && <p className="live-scheduled-note">{stream.title} is scheduled for {new Intl.DateTimeFormat("en-NG", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(stream.scheduled_at))} WAT.</p>}
    <div className="live-player-wrapper">{stream?.status === "live" ? <LiveStreamPlayer title={stream.title} embedUrl={stream.embed_url} hlsUrl={stream.hls_url} /> : <div className="stream-placeholder"><i className="bi bi-broadcast-pin" aria-hidden="true" /><h2>{stream?.title || "The channel is currently offline"}</h2><p>{stream?.status === "scheduled" ? "The broadcast will begin at the scheduled time." : "Check the programme guide below for the next broadcast."}</p></div>}{stream?.status === "live" && <span className="live-badge"><span className="live-dot" /> LIVE</span>}</div>
    {stream?.program && <p className="live-program-caption">On air now: <strong>{stream.program.title}</strong></p>}
    <section className="program-guide" aria-labelledby="program-guide-title"><div className="section-header"><div><span className="eyebrow">AFRICA/LAGOS · WAT</span><h2 className="section-title" id="program-guide-title">Programme guide</h2></div><Link className="section-link" href="/programs">All programmes <i className="bi bi-arrow-right" /></Link></div>
      <div className="program-guide-highlights">{guide.current && <article className="program-guide-card is-current"><span><i className="bi bi-broadcast" /> ON NOW</span><h3>{guide.current.program?.title || "Live programme"}</h3><p>{guide.current.program?.host ? `Hosted by ${guide.current.program.host}` : "K-TECH MEDIA NETWORK"}</p><time>{formatTime(guide.current.starts_at)} – {formatTime(guide.current.ends_at)}</time></article>}{guide.next && <article className="program-guide-card"><span>NEXT</span><h3>{guide.next.program?.title || "Upcoming programme"}</h3><p>{weekdays[guide.next.day_of_week]} · {guide.next.program?.host || ""}</p><time>{formatTime(guide.next.starts_at)} – {formatTime(guide.next.ends_at)}</time></article>}{!guide.current && !guide.next && <p className="program-guide-empty">No schedule has been published yet. Visit the programmes page for video shows.</p>}</div>
      {guide.today.length > 0 && <div className="program-guide-list"><h3>Today’s schedule</h3>{guide.today.map((entry) => <div key={entry.id}><time>{formatTime(entry.starts_at)}–{formatTime(entry.ends_at)}</time><span><strong>{entry.program?.title || "Programme"}</strong>{entry.program?.host && <small>{entry.program.host}</small>}</span></div>)}</div>}
    </section>
  </div></section>;
}
