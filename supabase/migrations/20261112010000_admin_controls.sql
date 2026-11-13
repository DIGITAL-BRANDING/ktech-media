-- Admin-only controls for staff permissions and public site settings.
create table public.site_settings (
  key text primary key check (key ~ '^[a-z][a-z0-9_]{1,63}$'),
  value jsonb not null default '""'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
create policy "site_settings_editor_read" on public.site_settings for select to authenticated
  using ((select public.is_newsroom_editor()));
create policy "site_settings_editor_update" on public.site_settings for all to authenticated
  using ((select public.is_newsroom_editor())) with check ((select public.is_newsroom_editor()));
create policy "site_settings_public_safe_values" on public.site_settings for select to anon, authenticated
  using (key in ('site_name', 'live_stream_url', 'ticker_text', 'office_address', 'phone', 'contact_email', 'advertising_email', 'facebook_url', 'x_url', 'youtube_url', 'instagram_url', 'whatsapp_url', 'telegram_url'));
revoke all on public.site_settings from anon;
grant select on public.site_settings to anon;
grant select, insert, update, delete on public.site_settings to authenticated;

insert into public.site_settings (key, value)
values ('site_name', '"K-TECH MEDIA NETWORK"'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

create or replace function public.admin_update_staff_profile(
  target_id uuid,
  new_display_name text,
  new_role public.newsroom_role,
  new_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.current_newsroom_role() is distinct from 'admin'::public.newsroom_role then
    raise exception 'Only newsroom admins can manage staff';
  end if;
  if char_length(trim(new_display_name)) not between 2 and 120 then
    raise exception 'Display name must be between 2 and 120 characters';
  end if;
  if target_id = (select auth.uid()) and (new_role <> 'admin' or not new_is_active) then
    raise exception 'You cannot remove your own admin access';
  end if;
  update public.profiles
    set display_name = trim(new_display_name), role = new_role, is_active = new_is_active, updated_at = now()
    where id = target_id;
  if not found then raise exception 'Staff profile was not found'; end if;
end;
$$;
revoke all on function public.admin_update_staff_profile(uuid, text, public.newsroom_role, boolean) from public;
grant execute on function public.admin_update_staff_profile(uuid, text, public.newsroom_role, boolean) to authenticated;
