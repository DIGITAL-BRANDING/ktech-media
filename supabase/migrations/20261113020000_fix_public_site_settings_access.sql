-- The previous settings migration revoked the anonymous SELECT grant after granting it.
-- Restore read access; row-level security still exposes only the safe public setting keys.
revoke insert, update, delete on public.site_settings from anon;
grant select on public.site_settings to anon;
