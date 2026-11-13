-- Initial editorial foundation for the Waraka media platform.
-- Apply with `supabase db push` after linking a Supabase project.

create extension if not exists pgcrypto with schema extensions;

create type public.newsroom_role as enum ('reporter', 'editor', 'admin');
create type public.article_status as enum ('draft', 'in_review', 'published', 'archived');
create type public.video_status as enum ('draft', 'in_review', 'published', 'archived');
create type public.media_kind as enum ('image', 'video', 'audio', 'document');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role public.newsroom_role not null default 'reporter',
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(display_name) between 2 and 120)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  color text not null default '#E8001D' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_length check (char_length(name) between 1 and 80),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  bucket_id text not null default 'editorial-media',
  storage_path text not null unique,
  kind public.media_kind not null,
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0),
  width integer,
  height integer,
  duration_seconds integer,
  alt_text text,
  caption text,
  credit text,
  created_at timestamptz not null default now(),
  constraint media_dimensions_positive check ((width is null or width > 0) and (height is null or height > 0))
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete restrict,
  editor_id uuid references public.profiles(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  featured_media_id uuid references public.media_assets(id) on delete set null,
  title text not null,
  slug text not null unique,
  excerpt text,
  body jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  featured_image_url text,
  image_caption text,
  status public.article_status not null default 'draft',
  language_code text not null default 'ha',
  is_featured boolean not null default false,
  is_breaking boolean not null default false,
  seo_title text,
  seo_description text,
  scheduled_at timestamptz,
  published_at timestamptz,
  view_count bigint not null default 0 check (view_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_title_length check (char_length(title) between 5 and 255),
  constraint articles_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint articles_seo_description_length check (seo_description is null or char_length(seo_description) <= 320)
);

create table public.article_media (
  article_id uuid not null references public.articles(id) on delete cascade,
  media_id uuid not null references public.media_assets(id) on delete restrict,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (article_id, media_id)
);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete restrict,
  category_id uuid references public.categories(id) on delete set null,
  media_id uuid references public.media_assets(id) on delete set null,
  title text not null,
  slug text not null unique,
  description text,
  provider text not null default 'youtube' check (provider in ('youtube', 'facebook', 'vimeo', 'upload')),
  source_url text,
  thumbnail_url text,
  status public.video_status not null default 'draft',
  is_featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint videos_title_length check (char_length(title) between 5 and 255),
  constraint videos_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table public.photo_stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete restrict,
  category_id uuid references public.categories(id) on delete set null,
  cover_media_id uuid references public.media_assets(id) on delete set null,
  title text not null,
  slug text not null unique,
  description text,
  status public.article_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint photo_stories_title_length check (char_length(title) between 5 and 255),
  constraint photo_stories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table public.photo_story_items (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.photo_stories(id) on delete cascade,
  media_id uuid not null references public.media_assets(id) on delete restrict,
  position integer not null default 0,
  caption text,
  created_at timestamptz not null default now(),
  unique (story_id, media_id),
  unique (story_id, position)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now(),
  constraint tags_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table public.article_tags (
  article_id uuid not null references public.articles(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

create index articles_public_feed_idx on public.articles (published_at desc) where status = 'published';
create index articles_author_status_idx on public.articles (author_id, status, updated_at desc);
create index articles_category_feed_idx on public.articles (category_id, published_at desc) where status = 'published';
create index articles_breaking_idx on public.articles (published_at desc) where is_breaking and status = 'published';
create index videos_public_feed_idx on public.videos (published_at desc) where status = 'published';
create index photo_stories_public_feed_idx on public.photo_stories (published_at desc) where status = 'published';
create index media_assets_uploader_idx on public.media_assets (uploaded_by, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger articles_set_updated_at before update on public.articles for each row execute function public.set_updated_at();
create trigger videos_set_updated_at before update on public.videos for each row execute function public.set_updated_at();
create trigger photo_stories_set_updated_at before update on public.photo_stories for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen_name text;
begin
  chosen_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1));
  insert into public.profiles (id, display_name, role)
  values (new.id, left(chosen_name, 120), 'reporter')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_newsroom_role()
returns public.newsroom_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid()) and p.is_active = true
$$;

create or replace function public.is_newsroom_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_newsroom_role() in ('editor'::public.newsroom_role, 'admin'::public.newsroom_role), false)
$$;

create or replace function public.is_newsroom_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_newsroom_role() is not null
$$;

revoke all on function public.current_newsroom_role() from public;
revoke all on function public.is_newsroom_editor() from public;
revoke all on function public.is_newsroom_staff() from public;
grant execute on function public.current_newsroom_role() to anon, authenticated;
grant execute on function public.is_newsroom_editor() to anon, authenticated;
grant execute on function public.is_newsroom_staff() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.media_assets enable row level security;
alter table public.articles enable row level security;
alter table public.article_media enable row level security;
alter table public.videos enable row level security;
alter table public.photo_stories enable row level security;
alter table public.photo_story_items enable row level security;
alter table public.tags enable row level security;
alter table public.article_tags enable row level security;

create policy "profiles_read_self_or_editor" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_newsroom_editor()));
create policy "profiles_update_self_name" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "profiles_editor_manage" on public.profiles for all to authenticated
  using ((select public.is_newsroom_editor())) with check ((select public.is_newsroom_editor()));
-- A user's JWT must never grant them the ability to promote their own newsroom role.
revoke all on public.profiles from anon;
revoke update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;
grant select on public.profiles to anon;
create policy "profiles_public_read_published_authors" on public.profiles for select to anon, authenticated
  using (exists (
    select 1 from public.articles a
    where a.author_id = profiles.id and a.status = 'published' and a.published_at <= now()
  ));

create policy "categories_public_read_active" on public.categories for select to anon, authenticated
  using (is_active or (select public.is_newsroom_staff()));
create policy "categories_editor_manage" on public.categories for all to authenticated
  using ((select public.is_newsroom_editor())) with check ((select public.is_newsroom_editor()));

create policy "media_assets_read_staff_or_uploader" on public.media_assets for select to authenticated
  using (uploaded_by = (select auth.uid()) or (select public.is_newsroom_editor()));
create policy "media_assets_read_used_in_public_content" on public.media_assets for select to anon, authenticated
  using (
    exists (select 1 from public.articles a where a.featured_media_id = media_assets.id and a.status = 'published' and a.published_at <= now())
    or exists (select 1 from public.article_media am join public.articles a on a.id = am.article_id where am.media_id = media_assets.id and a.status = 'published' and a.published_at <= now())
    or exists (select 1 from public.videos v where v.media_id = media_assets.id and v.status = 'published' and v.published_at <= now())
    or exists (select 1 from public.photo_stories ps where ps.cover_media_id = media_assets.id and ps.status = 'published' and ps.published_at <= now())
    or exists (select 1 from public.photo_story_items psi join public.photo_stories ps on ps.id = psi.story_id where psi.media_id = media_assets.id and ps.status = 'published' and ps.published_at <= now())
  );
create policy "media_assets_upload_staff" on public.media_assets for insert to authenticated
  with check (uploaded_by = (select auth.uid()) and (select public.is_newsroom_staff()));
create policy "media_assets_update_owner_or_editor" on public.media_assets for update to authenticated
  using (uploaded_by = (select auth.uid()) or (select public.is_newsroom_editor()))
  with check (uploaded_by = (select auth.uid()) or (select public.is_newsroom_editor()));
create policy "media_assets_delete_editor" on public.media_assets for delete to authenticated
  using ((select public.is_newsroom_editor()));
create policy "media_assets_uploader_cleanup_unlinked" on public.media_assets for delete to authenticated
  using (uploaded_by = (select auth.uid()));

create policy "articles_public_read_published" on public.articles for select to anon, authenticated
  using ((status = 'published' and published_at <= now())
    or author_id = (select auth.uid())
    or (select public.is_newsroom_editor()));
create policy "articles_reporter_create_own" on public.articles for insert to authenticated
  with check (author_id = (select auth.uid()) and status in ('draft', 'in_review') and (select public.is_newsroom_staff()));
create policy "articles_reporter_edit_own_unpublished" on public.articles for update to authenticated
  using (author_id = (select auth.uid()) and status in ('draft', 'in_review'))
  with check (author_id = (select auth.uid()) and status in ('draft', 'in_review'));
create policy "articles_editor_manage" on public.articles for all to authenticated
  using ((select public.is_newsroom_editor())) with check ((select public.is_newsroom_editor()));

create policy "article_media_read_accessible_article" on public.article_media for select to anon, authenticated
  using (exists (select 1 from public.articles a where a.id = article_id));
create policy "article_media_reporter_manage_own" on public.article_media for all to authenticated
  using (exists (select 1 from public.articles a where a.id = article_id and a.author_id = (select auth.uid()) and a.status in ('draft', 'in_review')))
  with check (exists (select 1 from public.articles a where a.id = article_id and a.author_id = (select auth.uid()) and a.status in ('draft', 'in_review')));
create policy "article_media_editor_manage" on public.article_media for all to authenticated
  using ((select public.is_newsroom_editor())) with check ((select public.is_newsroom_editor()));

create policy "videos_public_read_published" on public.videos for select to anon, authenticated
  using ((status = 'published' and published_at <= now()) or author_id = (select auth.uid()) or (select public.is_newsroom_editor()));
create policy "videos_reporter_create_own" on public.videos for insert to authenticated
  with check (author_id = (select auth.uid()) and status in ('draft', 'in_review') and (select public.is_newsroom_staff()));
create policy "videos_reporter_edit_own_unpublished" on public.videos for update to authenticated
  using (author_id = (select auth.uid()) and status in ('draft', 'in_review'))
  with check (author_id = (select auth.uid()) and status in ('draft', 'in_review'));
create policy "videos_editor_manage" on public.videos for all to authenticated
  using ((select public.is_newsroom_editor())) with check ((select public.is_newsroom_editor()));

create policy "photo_stories_public_read_published" on public.photo_stories for select to anon, authenticated
  using ((status = 'published' and published_at <= now()) or author_id = (select auth.uid()) or (select public.is_newsroom_editor()));
create policy "photo_stories_reporter_create_own" on public.photo_stories for insert to authenticated
  with check (author_id = (select auth.uid()) and status in ('draft', 'in_review') and (select public.is_newsroom_staff()));
create policy "photo_stories_reporter_edit_own_unpublished" on public.photo_stories for update to authenticated
  using (author_id = (select auth.uid()) and status in ('draft', 'in_review'))
  with check (author_id = (select auth.uid()) and status in ('draft', 'in_review'));
create policy "photo_stories_editor_manage" on public.photo_stories for all to authenticated
  using ((select public.is_newsroom_editor())) with check ((select public.is_newsroom_editor()));

create policy "photo_items_read_accessible_story" on public.photo_story_items for select to anon, authenticated
  using (exists (select 1 from public.photo_stories s where s.id = story_id));
create policy "photo_items_reporter_manage_own" on public.photo_story_items for all to authenticated
  using (exists (select 1 from public.photo_stories s where s.id = story_id and s.author_id = (select auth.uid()) and s.status in ('draft', 'in_review')))
  with check (exists (select 1 from public.photo_stories s where s.id = story_id and s.author_id = (select auth.uid()) and s.status in ('draft', 'in_review')));
create policy "photo_items_editor_manage" on public.photo_story_items for all to authenticated
  using ((select public.is_newsroom_editor())) with check ((select public.is_newsroom_editor()));

create policy "tags_public_read" on public.tags for select to anon, authenticated using (true);
create policy "tags_editor_manage" on public.tags for all to authenticated
  using ((select public.is_newsroom_editor())) with check ((select public.is_newsroom_editor()));
create policy "article_tags_read_visible_article" on public.article_tags for select to anon, authenticated
  using (exists (select 1 from public.articles a where a.id = article_id));
create policy "article_tags_editor_manage" on public.article_tags for all to authenticated
  using ((select public.is_newsroom_editor())) with check ((select public.is_newsroom_editor()));

-- SQL grants define which operations reach RLS; row policies above decide which rows are allowed.
grant select on public.categories, public.articles, public.article_media, public.videos,
  public.photo_stories, public.photo_story_items, public.media_assets, public.tags, public.article_tags to anon;
grant select, insert, update, delete on public.categories, public.media_assets,
  public.articles, public.article_media, public.videos, public.photo_stories,
  public.photo_story_items, public.tags, public.article_tags to authenticated;
grant select on public.profiles to anon;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

-- Draft uploads live in a private bucket. Editors copy approved assets into the public bucket on publication.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'editorial-media', 'editorial-media', false, 52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'published-media', 'published-media', true, 52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "editorial_media_staff_read_own_folder" on storage.objects for select to authenticated
  using (
    bucket_id = 'editorial-media'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_newsroom_editor()))
  );
create policy "editorial_media_staff_upload_own_folder" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'editorial-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_newsroom_staff())
  );
create policy "editorial_media_staff_update_own_folder" on storage.objects for update to authenticated
  using (
    bucket_id = 'editorial-media'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_newsroom_editor()))
  ) with check (
    bucket_id = 'editorial-media'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_newsroom_editor()))
  );
create policy "editorial_media_editor_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'editorial-media' and (select public.is_newsroom_editor()));
create policy "editorial_media_uploader_cleanup_own_folder" on storage.objects for delete to authenticated
  using (bucket_id = 'editorial-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "published_media_public_read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'published-media');
create policy "published_media_editor_upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'published-media' and (select public.is_newsroom_editor()));
create policy "published_media_editor_update" on storage.objects for update to authenticated
  using (bucket_id = 'published-media' and (select public.is_newsroom_editor()))
  with check (bucket_id = 'published-media' and (select public.is_newsroom_editor()));
create policy "published_media_editor_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'published-media' and (select public.is_newsroom_editor()));

insert into public.categories (name, slug, color, sort_order) values
  ('Siyasa', 'politics', '#E8001D', 1),
  ('Kasuwanci', 'business', '#C9961A', 2),
  ('Wasanni', 'sports', '#22C55E', 3),
  ('Nishaɗi', 'entertainment', '#8B5CF6', 4),
  ('Ilimi', 'education', '#EC4899', 5),
  ('Kiwon Lafiya', 'health', '#14B8A6', 6),
  ('Fasaha', 'technology', '#3B82F6', 7),
  ('Duniya', 'international', '#F97316', 8)
on conflict (slug) do nothing;
