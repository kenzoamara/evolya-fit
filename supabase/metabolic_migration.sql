-- ── Progrès Métabolique ─────────────────────────────────────────────────────
-- metabolic_config : paramètres définis par le coach (objectif cal, jour de pesée)
-- weight_entries   : poids saisi 1x/semaine par le client
-- calorie_entries  : calories saisies chaque jour par le client (arrondi 100)
-- body_measurements: tours de membres saisis 1x/mois par le client

CREATE TABLE IF NOT EXISTS metabolic_config (
  client_id      UUID         PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  calorie_goal   INTEGER      NOT NULL DEFAULT 2000,
  weigh_in_day   INTEGER      NOT NULL DEFAULT 1, -- 0=Dim 1=Lun 2=Mar 3=Mer 4=Jeu 5=Ven 6=Sam
  starting_weight DECIMAL(5,1),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weight_entries (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id   UUID         NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date        DATE         NOT NULL,
  weight_kg   DECIMAL(5,1) NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, date)
);

CREATE TABLE IF NOT EXISTS calorie_entries (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id   UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date        DATE        NOT NULL,
  calories    INTEGER     NOT NULL CHECK (calories >= 0 AND calories <= 10000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, date)
);

CREATE TABLE IF NOT EXISTS body_measurements (
  id             UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id      UUID         NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date           DATE         NOT NULL,
  neck_cm        DECIMAL(4,1),
  shoulders_cm   DECIMAL(4,1),
  chest_cm       DECIMAL(4,1),
  l_bicep_cm     DECIMAL(4,1),
  r_bicep_cm     DECIMAL(4,1),
  l_forearm_cm   DECIMAL(4,1),
  r_forearm_cm   DECIMAL(4,1),
  waist_cm       DECIMAL(4,1),
  hips_cm        DECIMAL(4,1),
  l_thigh_cm     DECIMAL(4,1),
  r_thigh_cm     DECIMAL(4,1),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, date)
);

-- Accès admin via service role (API routes) — pas de RLS nécessaire avec le pattern actuel
-- On active quand même pour suivre les bonnes pratiques
ALTER TABLE metabolic_config    ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE calorie_entries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements   ENABLE ROW LEVEL SECURITY;

-- Service role bypasse RLS → les routes API fonctionnent sans policies
-- Policies lecture publique : non requises, tout passe par API + verifyAccess
