alter table public.app_members
add column if not exists is_admin boolean not null default false;

create table if not exists public.competitions (
  id uuid primary key,
  name text not null,
  start_date date not null,
  end_date date not null,
  updated_at timestamptz not null default now(),
  constraint competitions_date_order check (end_date >= start_date)
);

insert into public.competitions (id, name, start_date, end_date)
values ('decbeef0-0000-4000-8000-000000000001', 'December Wedding War', date '2026-09-28', date '2027-01-01')
on conflict (id) do nothing;

alter table public.competitions enable row level security;

grant select on public.competitions to authenticated;
grant update (name, start_date, end_date, updated_at) on public.competitions to authenticated;

revoke update on public.app_members from authenticated;
grant update (display_name, weight_kg) on public.app_members to authenticated;

drop policy if exists "Authenticated users can read competitions" on public.competitions;
create policy "Authenticated users can read competitions"
on public.competitions for select
to authenticated
using (true);

drop policy if exists "Admins can update competitions" on public.competitions;
create policy "Admins can update competitions"
on public.competitions for update
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
