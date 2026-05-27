-- ── Nutrition & Habitudes ────────────────────────────────────────────────────
-- nutrition_programmes : programme nutritionnel rédigé par le coach (texte libre)
-- nutrition_logs       : repas journaliers saisis par le client
-- habits               : habitudes définies par le coach pour chaque client
-- habit_logs           : cochages quotidiens du client

-- Programme nutritionnel (coach → client)
CREATE TABLE IF NOT EXISTS nutrition_programmes (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id   UUID         NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title       TEXT         NOT NULL DEFAULT 'Programme nutritionnel',
  content     TEXT         NOT NULL DEFAULT '',
  active      BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Journal alimentaire (client)
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id   UUID         NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date        DATE         NOT NULL,
  meal_type   TEXT         NOT NULL CHECK (meal_type IN ('matin','midi','soir','collation')),
  item_name   TEXT         NOT NULL,
  calories    INTEGER,
  notes       TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Habitudes définies par le coach
CREATE TABLE IF NOT EXISTS habits (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id   UUID         NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name        TEXT         NOT NULL,
  emoji       TEXT         NOT NULL DEFAULT '✅',
  active      BOOLEAN      NOT NULL DEFAULT true,
  position    INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Cochages quotidiens du client
CREATE TABLE IF NOT EXISTS habit_logs (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id    UUID         NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  client_id   UUID         NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date        DATE         NOT NULL,
  completed   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (habit_id, date)
);

-- RLS policies
ALTER TABLE nutrition_programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits               ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs           ENABLE ROW LEVEL SECURITY;

-- Coaches can manage nutrition programmes for their clients
CREATE POLICY "coach_manage_nutrition_programmes" ON nutrition_programmes
  USING (client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid()));

-- Coaches can manage habits for their clients
CREATE POLICY "coach_manage_habits" ON habits
  USING (client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid()));

-- Coaches can view nutrition logs and habit logs for their clients
CREATE POLICY "coach_view_nutrition_logs" ON nutrition_logs
  USING (client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid()));

CREATE POLICY "coach_view_habit_logs" ON habit_logs
  USING (client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid()));

-- Service role bypass (used by API routes)
-- No additional policy needed — service role bypasses RLS
