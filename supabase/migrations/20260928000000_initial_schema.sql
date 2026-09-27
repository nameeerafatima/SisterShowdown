create table public.app_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.daily_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  day_checked_in boolean not null default false,
  workout_minutes integer not null default 0 check (workout_minutes >= 0),
  steps integer not null default 0 check (steps >= 0),
  fruit text not null default '',
  vegetable text not null default '',
  dessert text not null default '',
  junk_food text not null default '',
  water_ml integer not null default 0 check (water_ml >= 0),
  sleep_minutes smallint not null default 0 check (sleep_minutes >= 0),
  dine_out boolean not null default false,
  delivery boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  challenge_type text not null check (challenge_type in ('steps', 'workout', 'no_delivery', 'no_dessert')),
  start_date date not null,
  end_date date not null,
  target_value integer not null default 0 check (target_value >= 0),
  required_days smallint not null default 7 check (required_days > 0),
  bonus_points numeric(6, 1) not null default 10,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint challenge_dates_check check (end_date >= start_date)
);

alter table public.daily_logs enable row level security;
alter table public.app_members enable row level security;
alter table public.challenges enable row level security;

create policy "Authenticated users can read app members"
on public.app_members for select
to authenticated
using (true);

create policy "Users can create their own member record"
on public.app_members for insert
with check (user_id = (select auth.uid()));

create policy "Users can update their own member record"
on public.app_members for update
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Authenticated users can read challenges"
on public.challenges for select
to authenticated
using (true);

create policy "Users can create challenges"
on public.challenges for insert
with check (created_by = (select auth.uid()));

create policy "Creators can update challenges"
on public.challenges for update
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy "Creators can delete challenges"
on public.challenges for delete
using (created_by = (select auth.uid()));

create policy "Users can read their own logs"
on public.daily_logs for select
using (user_id = (select auth.uid()));

create policy "Users can create their own logs"
on public.daily_logs for insert
with check (user_id = (select auth.uid()));

create policy "Users can update their own logs"
on public.daily_logs for update
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can delete their own logs"
on public.daily_logs for delete
using (user_id = (select auth.uid()));

create index daily_logs_log_date_idx on public.daily_logs (log_date);
create index challenges_dates_idx on public.challenges (start_date, end_date);
