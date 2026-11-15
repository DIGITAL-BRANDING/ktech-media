import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsArchive } from "@/components/news-archive";
import { getPublicCategoryBySlug } from "@/lib/content";
import { newsCategories } from "@/lib/site";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string; q?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getPublicCategoryBySlug(slug);
  const fallback = newsCategories.find((item) => item.slug === slug);
  if (!category && !fallback) return { title: "Category not found" };
  return { title: `${category?.name || fallback?.name} News`, description: category?.description || `Latest ${category?.name || fallback?.name} stories.` };
}

export default async function NewsCategoryPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const category = await getPublicCategoryBySlug(slug);
  const fallback = newsCategories.find((item) => item.slug === slug);
  if (!category && !fallback) notFound();
  return <NewsArchive title={`${category?.name || fallback?.name} News`} categorySlug={slug} page={Math.max(1, Number(query.page) || 1)} search={query.q} basePath={`/news/category/${slug}`} />;
}
