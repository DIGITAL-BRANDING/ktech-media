import "server-only";

import { demoStories } from "@/lib/demo-content";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type NewsArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  language_code?: string;
  body: unknown;
  featured_image_url: string | null;
  image_caption: string | null;
  status: string;
  is_featured: boolean;
  is_breaking: boolean;
  published_at: string | null;
  created_at: string;
  view_count?: number;
  category: { name: string; slug: string } | null;
  author: { display_name: string } | null;
};

const relationSelection = `
  id, title, slug, excerpt, body, language_code, featured_image_url, image_caption,
  status, is_featured, is_breaking, published_at, created_at, view_count,
  category:categories(name, slug), author:profiles!articles_author_id_fkey(display_name)
`;

export async function getHomepageArticles(): Promise<NewsArticle[]> {
  if (!isSupabaseConfigured()) return demoStories;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("articles")
    .select(relationSelection)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(10)
    .returns<NewsArticle[]>();

  if (error) {
    console.error("Unable to load homepage articles:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getPublicNewsPage(options: { page?: number; search?: string; categorySlug?: string; tagSlug?: string } = {}) {
  const page = Math.max(1, Math.floor(options.page || 1));
  const pageSize = 10;
  const search = (options.search || "").normalize("NFKC").replace(/[,%()_*]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  if (!isSupabaseConfigured()) {
    const rows = demoStories.filter((article) => (!search || `${article.title} ${article.excerpt || ""}`.toLowerCase().includes(search.toLowerCase())) && (!options.categorySlug || article.category?.slug === options.categorySlug));
    return { articles: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length, page, pageSize };
  }
  const supabase = await createServerSupabaseClient();
  let taggedIds: string[] | null = null;
  if (options.tagSlug) {
    const { data: tagRows, error: tagError } = await supabase.from("article_tags").select("article_id,tag:tags!inner(slug)").eq("tag.slug", options.tagSlug);
    if (tagError) {
      console.error("Unable to filter tagged articles:", tagError.message);
      return { articles: [], total: 0, page, pageSize };
    }
    taggedIds = (tagRows || []).map((row) => row.article_id);
    if (!taggedIds.length) return { articles: [], total: 0, page, pageSize };
  }
  let query = supabase.from("articles").select(relationSelection, { count: "exact" })
    .eq("status", "published").lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });
  if (options.categorySlug) query = query.eq("category.slug", options.categorySlug);
  if (taggedIds) query = query.in("id", taggedIds);
  if (search) query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
  const { data, count, error } = await query.range((page - 1) * pageSize, page * pageSize - 1).returns<NewsArticle[]>();
  if (error) {
    console.error("Unable to load public news page:", error.message);
    return { articles: [], total: 0, page, pageSize };
  }
  return { articles: data || [], total: count || 0, page, pageSize };
}

export async function getPublicCategoryBySlug(slug: string) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("categories").select("id,name,slug,description,color").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (error) return null;
  return data;
}

export async function getPublicTagBySlug(slug: string) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("tags").select("id,name,slug").eq("slug", slug).maybeSingle();
  if (error) return null;
  return data;
}

export async function getArticleBySlug(slug: string): Promise<NewsArticle | null> {
  if (!isSupabaseConfigured()) return demoStories.find((article) => article.slug === slug) ?? null;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("articles")
    .select(relationSelection)
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .returns<NewsArticle>()
    .maybeSingle();

  if (error) {
    console.error("Unable to load article:", error.message);
    return null;
  }

  return data;
}

export async function getPublicArticleSlugs(): Promise<Array<{ slug: string; published_at: string | null }>> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("articles")
    .select("slug, published_at")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(1000)
    .returns<Array<{ slug: string; published_at: string | null }>>();
  if (error) {
    console.error("Unable to load sitemap article slugs:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getPublicVideos() {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data: videos, error } = await supabase
    .from("videos")
    .select("id, title, slug, description, provider, source_url, thumbnail_url, published_at, category:categories(name, slug)")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(24);
  if (error) {
    console.error("Unable to load published videos:", error.message);
    return [];
  }
  return videos ?? [];
}

export async function getPublicVideoBySlug(slug: string) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("videos")
    .select("id,title,slug,description,provider,source_url,thumbnail_url,published_at,category:categories(name,slug)")
    .eq("slug", slug).eq("status", "published").lte("published_at", new Date().toISOString()).maybeSingle();
  if (error) {
    console.error("Unable to load published video:", error.message);
    return null;
  }
  return data;
}

export async function getPublicSiteSettings() {
  if (!isSupabaseConfigured()) return {} as Record<string, string>;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("site_settings").select("key,value").in("key", ["site_name", "live_stream_url", "ticker_text", "office_address", "phone", "contact_email", "advertising_email", "facebook_url", "x_url", "youtube_url", "instagram_url", "whatsapp_url", "telegram_url"]);
  if (error) {
    console.error("Unable to load public site settings:", error.message);
    return {} as Record<string, string>;
  }
  return Object.fromEntries((data ?? []).flatMap(({ key, value }) => typeof value === "string" ? [[key, value]] : [])) as Record<string, string>;
}

export async function getPublicPhotoStories() {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data: stories, error } = await supabase
    .from("photo_stories")
    .select("id, title, slug, description, cover_media_id, published_at, category:categories(name, slug)")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(24);
  if (error) {
    console.error("Unable to load published photo stories:", error.message);
    return [];
  }

  const ids = (stories ?? []).flatMap((story) => story.cover_media_id ? [story.cover_media_id] : []);
  if (!ids.length) return (stories ?? []).map((story) => ({ ...story, cover_url: null }));
  const { data: assets } = await supabase.from("media_assets").select("id, bucket_id, storage_path").in("id", ids);
  const mediaById = new Map((assets ?? []).map((asset) => [asset.id, asset]));
  return (stories ?? []).map((story) => {
    const asset = story.cover_media_id ? mediaById.get(story.cover_media_id) : undefined;
    const coverUrl = asset
      ? supabase.storage.from(asset.bucket_id).getPublicUrl(asset.storage_path).data.publicUrl
      : null;
    return { ...story, cover_url: coverUrl };
  });
}

export async function getPublicPhotoStoryBySlug(slug: string) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  const { data: story, error } = await supabase
    .from("photo_stories")
    .select("id, title, slug, description, cover_media_id, published_at, category:categories(name, slug)")
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  if (error || !story) return null;

  const { data: items } = await supabase.from("photo_story_items").select("id, media_id, position, caption").eq("story_id", story.id).order("position");
  const ids = (items ?? []).map((item) => item.media_id);
  const { data: assets } = ids.length
    ? await supabase.from("media_assets").select("id, bucket_id, storage_path, alt_text, caption, credit").in("id", ids)
    : { data: [] };
  const assetsById = new Map((assets ?? []).map((asset) => [asset.id, asset]));
  const images = (items ?? []).flatMap((item) => {
    const asset = assetsById.get(item.media_id);
    if (!asset) return [];
    const url = supabase.storage.from(asset.bucket_id).getPublicUrl(asset.storage_path).data.publicUrl;
    return [{ id: item.id, url, caption: item.caption || asset.caption, alt: asset.alt_text || story.title, credit: asset.credit }];
  });
  return { ...story, images };
}
