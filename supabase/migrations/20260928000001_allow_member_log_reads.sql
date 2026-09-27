drop policy if exists "Users can read their own logs" on public.daily_logs;

create policy "App members can read daily logs"
on public.daily_logs for select
to authenticated
using (
  exists (
    select 1
    from public.app_members
    where user_id = (select auth.uid())
  )
);
