import type { Metadata } from "next";
import { site } from "@/lib/site";
import { getPublicPhotoStories } from "@/lib/content";
import Image from "next/image";
import Link from "next/link";
import { getLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Hotuna", description: `Hotunan labarai daga ${site.name}.` };
export const revalidate = 60;

export default async function PhotosPage() {
  const locale = await getLocale();
  const ha = locale === "ha";
  const stories = await getPublicPhotoStories(locale);
  return <section className="section"><div className="container"><h1 className="section-title">{ha ? "Hotuna" : "Photos"}</h1>{stories.length ? <div className="row g-4">{stories.map((story) => <div className="col-md-6 col-lg-4" key={story.id}><Link href={`/photos/${story.slug}`} className="news-card photo-card"><div className="news-card-img">{story.cover_url && <Image src={story.cover_url} alt={story.title} fill sizes="(min-width: 992px) 33vw, (min-width: 768px) 50vw, 100vw" />}</div><div className="news-card-body"><h2 className="news-card-title">{story.title}</h2><p className="news-card-excerpt">{story.category?.name || (ha ? "Hotuna" : "Photos")} • {story.description}</p></div></Link></div>)}</div> : <div className="empty-state"><i className="bi bi-images" aria-hidden="true" /><h2>{ha ? "Gidan hotuna" : "Photo stories"}</h2><p>{ha ? "Photo stories da galleries za su bayyana nan." : "Photo stories and galleries from our newsroom will appear here."}</p></div>}</div></section>;
}
