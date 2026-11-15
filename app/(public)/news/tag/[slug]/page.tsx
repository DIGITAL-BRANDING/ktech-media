import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsArchive } from "@/components/news-archive";
import { getPublicTagBySlug } from "@/lib/content";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string; q?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getPublicTagBySlug(slug);
  return tag ? { title: `${tag.name} News`, description: `Latest news tagged ${tag.name}.` } : { title: "Tag not found" };
}

export default async function NewsTagPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const tag = await getPublicTagBySlug(slug);
  if (!tag) notFound();
  return <NewsArchive title={`Stories tagged “${tag.name}”`} tagSlug={slug} page={Math.max(1, Number(query.page) || 1)} search={query.q} basePath={`/news/tag/${slug}`} />;
}
