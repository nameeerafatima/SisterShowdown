drop policy if exists "Users can create challenges" on public.challenges;
drop policy if exists "Creators can update challenges" on public.challenges;
drop policy if exists "Creators can delete challenges" on public.challenges;

create policy "Admins can create challenges"
on public.challenges for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.app_members
    where user_id = (select auth.uid()) and is_admin
  )
);

create policy "Admins can update challenges"
on public.challenges for update
to authenticated
using (
  exists (
    select 1 from public.app_members
    where user_id = (select auth.uid()) and is_admin
  )
)
with check (
  exists (
    select 1 from public.app_members
    where user_id = (select auth.uid()) and is_admin
  )
);

create policy "Admins can delete challenges"
on public.challenges for delete
to authenticated
using (
  exists (
    select 1 from public.app_members
    where user_id = (select auth.uid()) and is_admin
  )
);