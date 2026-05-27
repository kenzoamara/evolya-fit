-- Migration : table bilans
-- À exécuter dans Supabase SQL Editor

create table if not exists bilans (
  id             uuid        default gen_random_uuid() primary key,
  coach_id       uuid        not null references profiles(id) on delete cascade,
  client_id      uuid        not null references clients(id) on delete cascade,
  content_snapshot jsonb     not null,
  generated_at   timestamptz not null default now(),
  sent_at        timestamptz,
  is_auto        boolean     not null default false,
  created_at     timestamptz not null default now()
);

-- Index pour les requêtes fréquentes
create index if not exists bilans_client_id_sent_at on bilans(client_id, sent_at desc);
create index if not exists bilans_coach_id on bilans(coach_id);

-- Row Level Security
alter table bilans enable row level security;

-- Le coach peut tout faire sur ses bilans
create policy "coach_all_bilans"
  on bilans for all
  using (coach_id = auth.uid());

-- Lecture publique via admin client (pas de policy client direct car magic token)
-- Les lectures client sont faites via createAdminClient() dans les server components
