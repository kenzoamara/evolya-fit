-- ============================================================
-- PROGRAMMES V2 MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Main programmes table
CREATE TABLE IF NOT EXISTS programmes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('sportif', 'nutritionnel', 'habitudes')),
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  start_date    DATE,
  duration_days INTEGER,
  end_date      DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Junction table: one programme → many clients
CREATE TABLE IF NOT EXISTS programme_clients (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  client_id    UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(programme_id, client_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS programmes_coach_id_idx ON programmes(coach_id);
CREATE INDEX IF NOT EXISTS programme_clients_programme_id_idx ON programme_clients(programme_id);
CREATE INDEX IF NOT EXISTS programme_clients_client_id_idx ON programme_clients(client_id);

-- 4. RLS
ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coaches_manage_own_programmes" ON programmes;
CREATE POLICY "coaches_manage_own_programmes" ON programmes
  FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

ALTER TABLE programme_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coaches_manage_programme_clients" ON programme_clients;
CREATE POLICY "coaches_manage_programme_clients" ON programme_clients
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM programmes WHERE id = programme_id AND coach_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM programmes WHERE id = programme_id AND coach_id = auth.uid())
  );
