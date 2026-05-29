-- Push subscriptions pour les coaches (Web Push API navigateur)
CREATE TABLE IF NOT EXISTS coach_push_subscriptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint    TEXT        NOT NULL,
  p256dh      TEXT        NOT NULL,
  auth        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coach_id, endpoint)
);

-- Index pour récupérer rapidement les subscriptions d'un coach
CREATE INDEX IF NOT EXISTS coach_push_subscriptions_coach_idx
  ON coach_push_subscriptions (coach_id);
