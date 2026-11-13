import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublicPhotoStoryBySlug } from "@/lib/content";
import { site } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const story = await getPublicPhotoStoryBySlug(slug);
  if (!story) return { title: "Ba a samu photo story ba" };
  return { title: story.title, description: story.description || site.description, openGraph: { type: "article", title: story.title, description: story.description || site.description, images: story.images[0]?.url ? [story.images[0].url] : undefined } };
}

export default async function PhotoStoryPage({ params }: Props) {
  const { slug } = await params;
  const story = await getPublicPhotoStoryBySlug(slug);
  if (!story) notFound();
  return <article className="section photo-story-page"><div className="container"><span className="eyebrow">{story.category?.name || "Hotuna"}</span><h1>{story.title}</h1>{story.description && <p className="article-standfirst">{story.description}</p>}<div className="photo-story-gallery">{story.images.map((image, index) => <figure key={image.id}><Image src={image.url} alt={image.alt} width={1440} height={960} priority={index === 0} />{(image.caption || image.credit) && <figcaption>{image.caption}{image.credit && <span> • {image.credit}</span>}</figcaption>}</figure>)}</div></div></article>;
}
