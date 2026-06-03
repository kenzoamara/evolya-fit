-- Track coach follow-ups (relances) to inactive clients
-- Replaces localStorage tracking with persistent, auditable database records

CREATE TABLE IF NOT EXISTS relances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient lookup: "has this coach sent a relance to this client this week?"
CREATE INDEX IF NOT EXISTS idx_relances_coach_client_sent
  ON relances(coach_id, client_id, sent_at DESC);

-- Index for listing all relances sent by a coach
CREATE INDEX IF NOT EXISTS idx_relances_coach_sent
  ON relances(coach_id, sent_at DESC);

-- Trigger to update updated_at on any modification
CREATE OR REPLACE FUNCTION update_relances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS relances_updated_at_trigger ON relances;
CREATE TRIGGER relances_updated_at_trigger
  BEFORE UPDATE ON relances
  FOR EACH ROW
  EXECUTE FUNCTION update_relances_updated_at();

-- Enable RLS
ALTER TABLE relances ENABLE ROW LEVEL SECURITY;

-- Coaches can only see relances they sent
CREATE POLICY relances_coach_select ON relances
  FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY relances_coach_insert ON relances
  FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY relances_coach_update ON relances
  FOR UPDATE
  USING (coach_id = auth.uid());

CREATE POLICY relances_coach_delete ON relances
  FOR DELETE
  USING (coach_id = auth.uid());
