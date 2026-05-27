-- Programmes table
CREATE TABLE IF NOT EXISTS programmes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id    UUID REFERENCES clients(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('sportif', 'nutritionnel', 'habitudes')),
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS programmes_coach_id_idx ON programmes(coach_id);
CREATE INDEX IF NOT EXISTS programmes_client_id_idx ON programmes(client_id);

-- RLS
ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaches_manage_own_programmes" ON programmes
  FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());
