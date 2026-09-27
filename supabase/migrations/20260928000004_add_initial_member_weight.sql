alter table public.app_members
add column if not exists initial_weight_kg numeric(5, 2)
check (initial_weight_kg > 0 and initial_weight_kg < 500);

update public.app_members
set initial_weight_kg = weight_kg
where initial_weight_kg is null
  and weight_kg is not null;
