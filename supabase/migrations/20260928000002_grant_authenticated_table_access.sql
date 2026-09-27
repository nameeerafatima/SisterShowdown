grant usage on schema public to authenticated;

grant select, insert, update on table public.app_members to authenticated;
grant select, insert, update, delete on table public.daily_logs to authenticated;
grant select, insert, update, delete on table public.challenges to authenticated;
