-- Live channel, program catalogue and weekly electronic program guide.
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  host text,
  description text,
  poster_url text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.program_schedule (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  timezone text not null default 'Africa/Lagos',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint program_schedule_time_order check (starts_at <> ends_at),
  unique (program_id, day_of_week, starts_at)
);

create table public.live_streams (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 180),
  embed_url text,
  hls_url text,
  status text not null default 'offline' check (status in ('live', 'offline', 'scheduled')),
  scheduled_at timestamptz,
  program_id uuid references public.programs(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint live_stream_has_player check (embed_url is not null or hls_url is not null or status = 'offline'),
  constraint live_stream_embed_https check (embed_url is null or embed_url ~ '^https://'),
  constraint live_stream_hls_https check (hls_url is null or hls_url ~ '^https://')
);

create unique index one_active_live_stream on public.live_streams ((status)) where status = 'live';
create index program_schedule_day_time_idx on public.program_schedule(day_of_week, starts_at) where is_active;
create index live_streams_public_idx on public.live_streams(status, scheduled_at desc);

create trigger programs_set_updated_at before update on public.programs for each row execute function public.set_updated_at();
create trigger live_streams_set_updated_at before update on public.live_streams for each row execute function public.set_updated_at();

alter table public.programs enable row level security;
alter table public.program_schedule enable row level security;
alter table public.live_streams enable row level security;

create policy "programs_public_read_active" on public.programs for select to anon, authenticated using (is_active or (select public.is_newsroom_editor()));
create policy "programs_editor_manage" on public.programs for all to authenticated using ((select public.is_newsroom_editor())) with check ((select public.is_newsroom_editor()));
create policy "program_schedule_public_read_active" on public.program_schedule for select to anon, authenticated using (
  is_active and exists (select 1 from public.programs p where p.id = program_id and p.is_active)
  or (select public.is_newsroom_editor())
);
create policy "program_schedule_editor_manage" on public.program_schedule for all to authenticated using ((select public.is_newsroom_editor())) with check ((select public.is_newsroom_editor()));
create policy "live_streams_public_read" on public.live_streams for select to anon, authenticated using (status in ('live', 'scheduled') or (select public.is_newsroom_editor()));
create policy "live_streams_editor_manage" on public.live_streams for all to authenticated using ((select public.is_newsroom_editor())) with check ((select public.is_newsroom_editor()));

grant select on public.programs, public.program_schedule, public.live_streams to anon, authenticated;
grant insert, update, delete on public.programs, public.program_schedule, public.live_streams to authenticated;
