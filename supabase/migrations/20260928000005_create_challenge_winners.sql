create table public.challenge_winners (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_name text not null,
  awarded_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

alter table public.challenge_winners enable row level security;

grant select on table public.challenge_winners to authenticated;

grant usage on schema public to authenticated;

create policy "Authenticated users can read challenge winners"
on public.challenge_winners for select
to authenticated
using (true);
