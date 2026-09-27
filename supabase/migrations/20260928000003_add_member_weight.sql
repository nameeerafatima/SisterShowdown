alter table public.app_members
add column if not exists weight_kg numeric(5, 2) check (weight_kg > 0 and weight_kg < 500);
