-- Radio, podcast, audience communication, advertising and bilingual content foundation.

create table public.radio_streams (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 160),
  stream_url text not null check (stream_url ~ '^https://'),
  status text not null default 'offline' check (status in ('live', 'offline')),
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index radio_one_live_station on public.radio_streams ((status)) where status = 'live';
create trigger radio_streams_set_updated_at before update on public.radio_streams for each row execute function public.set_updated_at();

create table public.podcast_shows (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  artwork_url text,
  language_code text not null default 'en' check (language_code in ('en', 'ha')),
  author_name text not null default 'K-TECH MEDIA NETWORK',
  category text not null default 'News',
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger podcast_shows_set_updated_at before update on public.podcast_shows for each row execute function public.set_updated_at();

create table public.podcast_episodes (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.podcast_shows(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 180),
  slug text not null,
  summary text,
  audio_url text not null check (audio_url ~ '^https://'),
  episode_number integer check (episode_number is null or episode_number > 0),
  duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
  language_code text not null default 'en' check (language_code in ('en', 'ha')),
  status public.article_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (show_id, slug)
);
create index podcast_episodes_public_idx on public.podcast_episodes(show_id, published_at desc) where status = 'published';
create trigger podcast_episodes_set_updated_at before update on public.podcast_episodes for each row execute function public.set_updated_at();

alter table public.programs add column if not exists language_code text not null default 'en' check (language_code in ('en', 'ha'));
alter table public.videos add column if not exists language_code text not null default 'en' check (language_code in ('en', 'ha'));
alter table public.photo_stories add column if not exists language_code text not null default 'en' check (language_code in ('en', 'ha'));
alter table public.categories add column if not exists name_en text;
alter table public.categories add column if not exists name_ha text;
alter table public.categories add column if not exists description_en text;
alter table public.categories add column if not exists description_ha text;
update public.categories set name_en = coalesce(name_en, name), name_ha = coalesce(name_ha, name), description_en = coalesce(description_en, description), description_ha = coalesce(description_ha, description);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  language_code text not null default 'en' check (language_code in ('en', 'ha')),
  status text not null default 'pending' check (status in ('pending', 'active', 'unsubscribed')),
  confirmation_token_hash text unique,
  unsubscribe_token_hash text not null unique,
  consented_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index newsletter_subscribers_email_unique on public.newsletter_subscribers(lower(email));
create trigger newsletter_subscribers_set_updated_at before update on public.newsletter_subscribers for each row execute function public.set_updated_at();

create table public.newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null check (char_length(trim(subject)) between 3 and 180),
  preheader text,
  body text not null,
  language_code text not null default 'en' check (language_code in ('en', 'ha')),
  status text not null default 'draft' check (status in ('draft', 'sending', 'sent', 'failed')),
  recipient_count integer not null default 0,
  sent_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger newsletter_campaigns_set_updated_at before update on public.newsletter_campaigns for each row execute function public.set_updated_at();

create table public.web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  subscription jsonb not null check (jsonb_typeof(subscription) = 'object'),
  language_code text not null default 'en' check (language_code in ('en', 'ha')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger web_push_subscriptions_set_updated_at before update on public.web_push_subscriptions for each row execute function public.set_updated_at();

alter table public.articles add column if not exists is_sponsored boolean not null default false;
alter table public.articles add column if not exists sponsor_name text;
alter table public.articles alter column language_code set default 'en';

create table public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser text not null check (char_length(trim(advertiser)) between 2 and 160),
  title text not null check (char_length(trim(title)) between 3 and 180),
  description text,
  image_url text not null check (image_url ~ '^https://'),
  destination_url text not null check (destination_url ~ '^https://'),
  slot text not null check (slot in ('homepage_top', 'homepage_sidebar', 'article_inline', 'podcast_sidebar')),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'active', 'paused', 'ended')),
  starts_at timestamptz,
  ends_at timestamptz,
  sponsored_article_id uuid references public.articles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ad_campaign_window check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create index ad_campaigns_public_idx on public.ad_campaigns(slot, starts_at, ends_at) where status in ('active', 'scheduled');
create trigger ad_campaigns_set_updated_at before update on public.ad_campaigns for each row execute function public.set_updated_at();

-- Newsletter confirmation never exposes subscriber records. These narrow RPCs only
-- change a subscription whose email token has already been delivered to its owner.
create or replace function public.confirm_newsletter_subscription(p_token_hash text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
  update public.newsletter_subscribers set status = 'active', confirmed_at = now(), confirmation_token_hash = null
  where confirmation_token_hash = p_token_hash and status = 'pending';
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;

create or replace function public.unsubscribe_newsletter(p_token_hash text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
  update public.newsletter_subscribers set status = 'unsubscribed', unsubscribed_at = now()
  where unsubscribe_token_hash = p_token_hash and status <> 'unsubscribed';
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;

create or replace function public.save_web_push_subscription(p_endpoint text, p_subscription jsonb, p_language text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare saved_id uuid;
begin
  if p_endpoint !~ '^https://' or jsonb_typeof(p_subscription) <> 'object' or p_language not in ('en', 'ha') then
    raise exception 'Invalid subscription';
  end if;
  insert into public.web_push_subscriptions(endpoint, subscription, language_code)
  values (p_endpoint, p_subscription, p_language)
  on conflict(endpoint) do update set subscription = excluded.subscription, language_code = excluded.language_code, updated_at = now()
  returning id into saved_id;
  return saved_id;
end;
$$;

create or replace function public.remove_web_push_subscription(p_endpoint text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
  delete from public.web_push_subscriptions where endpoint = p_endpoint;
  get diagnostics changed = row_count;
  return changed > 0;
end;
$$;

revoke all on function public.confirm_newsletter_subscription(text) from public;
revoke all on function public.unsubscribe_newsletter(text) from public;
revoke all on function public.save_web_push_subscription(text, jsonb, text) from public;
revoke all on function public.remove_web_push_subscription(text) from public;
grant execute on function public.confirm_newsletter_subscription(text) to anon, authenticated;
grant execute on function public.unsubscribe_newsletter(text) to anon, authenticated;
grant execute on function public.save_web_push_subscription(text, jsonb, text) to service_role;
grant execute on function public.remove_web_push_subscription(text) to service_role;

alter table public.radio_streams enable row level security;
alter table public.podcast_shows enable row level security;
alter table public.podcast_episodes enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.newsletter_campaigns enable row level security;
alter table public.web_push_subscriptions enable row level security;
alter table public.ad_campaigns enable row level security;

create policy "radio_public_read_live" on public.radio_streams for select to anon, authenticated using (status = 'live' or (select public.is_newsroom_editor()));
create policy "radio_editors_manage" on public.radio_streams for all to authenticated using ((select public.is_newsroom_editor())) with check ((select public.is_newsroom_editor()));
create policy "podcast_shows_public_read_active" on public.podcast_shows for select to anon, authenticated using (is_active or (select public.is_newsroom_editor()));
create policy "podcast_shows_editors_manage" on public.podcast_shows for all to authenticated using ((select public.is_newsroom_editor())) with check ((select public.is_newsroom_editor()));
create policy "podcast_episodes_public_read_published" on public.podcast_episodes for select to anon, authenticated using ((status = 'published' and published_at <= now()) or (select public.is_newsroom_editor()));
create policy "podcast_episodes_editors_manage" on public.podcast_episodes for all to authenticated using ((select public.is_newsroom_editor())) with check ((select public.is_newsroom_editor()));
create policy "newsletter_subscribers_editor_read" on public.newsletter_subscribers for select to authenticated using ((select public.is_newsroom_editor()));
create policy "newsletter_subscribers_editor_manage" on public.newsletter_subscribers for all to authenticated using ((select public.is_newsroom_editor())) with check ((select public.is_newsroom_editor()));
create policy "newsletter_campaigns_editor_manage" on public.newsletter_campaigns for all to authenticated using ((select public.is_newsroom_editor())) with check ((select public.is_newsroom_editor()));
create policy "web_push_subscriptions_editor_manage" on public.web_push_subscriptions for all to authenticated using ((select public.is_newsroom_editor())) with check ((select public.is_newsroom_editor()));
create policy "ad_campaigns_public_read_active" on public.ad_campaigns for select to anon, authenticated using (status in ('active', 'scheduled') and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()) or (select public.is_newsroom_editor()));
create policy "ad_campaigns_editors_manage" on public.ad_campaigns for all to authenticated using ((select public.is_newsroom_editor())) with check ((select public.is_newsroom_editor()));

grant select on public.radio_streams, public.podcast_shows, public.podcast_episodes, public.ad_campaigns to anon, authenticated;
grant insert, update, delete on public.radio_streams, public.podcast_shows, public.podcast_episodes, public.newsletter_subscribers, public.newsletter_campaigns, public.web_push_subscriptions, public.ad_campaigns to authenticated;
revoke all on public.newsletter_subscribers from anon;
grant all on public.radio_streams, public.podcast_shows, public.podcast_episodes, public.newsletter_subscribers, public.newsletter_campaigns, public.web_push_subscriptions, public.ad_campaigns to service_role;
