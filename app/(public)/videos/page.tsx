import type { Metadata } from "next";
import { site } from "@/lib/site";
import { getPublicVideos } from "@/lib/content";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = { title: "Bidiyo", description: `Bidiyo da shirye-shirye daga ${site.name}.` };
export const revalidate = 60;

export default async function VideosPage() {
  const videos = await getPublicVideos();
  return <section className="section"><div className="container"><h1 className="section-title">Bidiyo</h1>{videos.length ? <div className="row g-4">{videos.map((video) => <div className="col-md-6 col-lg-4" key={video.id}><Link href={video.source_url || "/videos"} className="video-card" target={video.source_url ? "_blank" : undefined} rel={video.source_url ? "noopener noreferrer" : undefined}><div className="video-thumb">{video.thumbnail_url && <Image src={video.thumbnail_url} alt="" fill sizes="(min-width: 992px) 33vw, 100vw" />}<span className="video-play-btn"><span className="video-play-icon"><i className="bi bi-play-fill" aria-hidden="true" /></span></span></div><div className="video-card-body"><h2>{video.title}</h2><p>{video.category?.name || "Bidiyo"}</p></div></Link></div>)}</div> : <div className="empty-state"><i className="bi bi-camera-video" aria-hidden="true" /><h2>Gidan bidiyo</h2><p>Bidiyoyin da newsroom ta wallafa za su bayyana nan.</p></div>}</div></section>;
}
