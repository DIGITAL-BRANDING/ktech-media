-- Anonymous, pseudonymous engagement counters plus moderated public comments.
create table public.article_views (
  article_id uuid not null references public.articles(id) on delete cascade,
  viewer_key uuid not null,
  created_at timestamptz not null default now(),
  primary key (article_id, viewer_key)
);

create table public.article_likes (
  article_id uuid not null references public.articles(id) on delete cascade,
  viewer_key uuid not null,
  created_at timestamptz not null default now(),
  primary key (article_id, viewer_key)
);

create table public.article_comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  viewer_key uuid not null,
  commenter_name text not null check (char_length(trim(commenter_name)) between 2 and 80),
  body text not null check (char_length(trim(body)) between 5 and 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  moderated_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index article_comments_moderation_idx on public.article_comments(status, created_at desc);
create index article_comments_public_idx on public.article_comments(article_id, approved_at desc) where status = 'approved';

alter table public.article_views enable row level security;
alter table public.article_likes enable row level security;
alter table public.article_comments enable row level security;

create policy "article_views_editor_read" on public.article_views for select to authenticated
  using ((select public.is_newsroom_editor()));
create policy "article_likes_editor_read" on public.article_likes for select to authenticated
  using ((select public.is_newsroom_editor()));
create policy "article_comments_public_read_approved" on public.article_comments for select to anon, authenticated
  using (status = 'approved' and exists (
    select 1 from public.articles a where a.id = article_id and a.status = 'published' and a.published_at <= now()
  ));
create policy "article_comments_editor_read_all" on public.article_comments for select to authenticated
  using ((select public.is_newsroom_editor()));
create policy "article_comments_editor_moderate" on public.article_comments for update to authenticated
  using ((select public.is_newsroom_editor())) with check ((select public.is_newsroom_editor()));

revoke all on public.article_views, public.article_likes from anon, authenticated;
grant select on public.article_views, public.article_likes to authenticated;
grant select on public.article_comments to anon, authenticated;
grant update (status, moderated_by, approved_at) on public.article_comments to authenticated;

create or replace function public.record_article_view(p_article_id uuid, p_viewer_key uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.articles a
    where a.id = p_article_id and a.status = 'published' and a.published_at <= now()
  ) then return; end if;

  insert into public.article_views (article_id, viewer_key)
  values (p_article_id, p_viewer_key)
  on conflict do nothing;

  if found then
    update public.articles set view_count = view_count + 1 where id = target_article_id;
  end if;
end;
$$;

create or replace function public.toggle_article_like(p_article_id uuid, p_viewer_key uuid)
returns table (liked boolean, like_count bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare already_liked boolean;
begin
  if not exists (
    select 1 from public.articles a
    where a.id = p_article_id and a.status = 'published' and a.published_at <= now()
  ) then
    return query select false, 0::bigint;
    return;
  end if;

  select exists(select 1 from public.article_likes l where l.article_id = p_article_id and l.viewer_key = p_viewer_key)
    into already_liked;
  if already_liked then
    delete from public.article_likes l where l.article_id = p_article_id and l.viewer_key = p_viewer_key;
  else
    insert into public.article_likes (article_id, viewer_key) values (p_article_id, p_viewer_key) on conflict do nothing;
  end if;
  return query
    select exists(select 1 from public.article_likes l where l.article_id = p_article_id and l.viewer_key = p_viewer_key),
      count(*) from public.article_likes l where l.article_id = p_article_id;
end;
$$;

create or replace function public.get_public_article_engagement(p_article_id uuid)
returns table (views bigint, likes bigint, comments bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select a.view_count,
    (select count(*) from public.article_likes l where l.article_id = a.id),
    (select count(*) from public.article_comments c where c.article_id = a.id and c.status = 'approved')
  from public.articles a
  where a.id = p_article_id and a.status = 'published' and a.published_at <= now()
$$;

create or replace function public.submit_article_comment(
  p_article_id uuid,
  p_viewer_key uuid,
  p_commenter_name text,
  p_comment_body text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare new_comment_id uuid;
begin
  if char_length(trim(p_commenter_name)) not between 2 and 80 then raise exception 'Name must be 2 to 80 characters'; end if;
  if char_length(trim(p_comment_body)) not between 5 and 2000 then raise exception 'Comment must be 5 to 2000 characters'; end if;
  if not exists (
    select 1 from public.articles a
    where a.id = p_article_id and a.status = 'published' and a.published_at <= now()
  ) then raise exception 'Article is unavailable for comments'; end if;
  if (select count(*) from public.article_comments c
      where c.viewer_key = p_viewer_key and c.created_at > now() - interval '24 hours') >= 5 then
    raise exception 'Comment limit reached';
  end if;

  insert into public.article_comments (article_id, viewer_key, commenter_name, body)
  values (p_article_id, p_viewer_key, trim(p_commenter_name), trim(p_comment_body))
  returning id into new_comment_id;
  return new_comment_id;
end;
$$;

create or replace function public.admin_article_engagement()
returns table (article_id uuid, views bigint, likes bigint, pending_comments bigint, approved_comments bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_newsroom_editor() then raise exception 'Editor access required'; end if;
  return query
    select a.id, a.view_count,
      (select count(*) from public.article_likes l where l.article_id = a.id),
      (select count(*) from public.article_comments c where c.article_id = a.id and c.status = 'pending'),
      (select count(*) from public.article_comments c where c.article_id = a.id and c.status = 'approved')
    from public.articles a;
end;
$$;

revoke all on function public.record_article_view(uuid, uuid) from public;
revoke all on function public.toggle_article_like(uuid, uuid) from public;
revoke all on function public.get_public_article_engagement(uuid) from public;
revoke all on function public.submit_article_comment(uuid, uuid, text, text) from public;
revoke all on function public.admin_article_engagement() from public;
grant execute on function public.record_article_view(uuid, uuid) to anon, authenticated;
grant execute on function public.toggle_article_like(uuid, uuid) to anon, authenticated;
grant execute on function public.get_public_article_engagement(uuid) to anon, authenticated;
grant execute on function public.submit_article_comment(uuid, uuid, text, text) to anon, authenticated;
grant execute on function public.admin_article_engagement() to authenticated;
