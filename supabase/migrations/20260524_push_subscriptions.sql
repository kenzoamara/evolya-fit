-- Push subscriptions — Web Push API (PWA)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  endpoint    TEXT        NOT NULL,
  p256dh      TEXT        NOT NULL,
  auth        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, endpoint)
);

-- Index pour récupérer rapidement les subscriptions d'un athlète
CREATE INDEX IF NOT EXISTS push_subscriptions_client_idx
  ON push_subscriptions (client_id);
