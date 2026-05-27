-- workout_difficulty_ratings
create table if not exists public.workout_difficulty_ratings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  date date not null,
  score integer not null check (score between 1 and 10),
  comment text,
  created_at timestamptz not null default now(),
  unique (client_id, date)
);

alter table public.workout_difficulty_ratings enable row level security;

-- service role bypasses RLS (used by API routes)
create policy "service role full access" on public.workout_difficulty_ratings
  for all using (true) with check (true);
