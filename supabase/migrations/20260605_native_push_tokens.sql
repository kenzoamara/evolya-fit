-- Tokens push natifs (APNs iOS / FCM Android) par coach.
-- Utilisé par les apps mobiles Capacitor pour recevoir des notifications natives.

CREATE TABLE IF NOT EXISTS native_push_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token       text NOT NULL UNIQUE,
  platform    text NOT NULL DEFAULT 'unknown',  -- 'ios' | 'android' | 'unknown'
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS native_push_tokens_user_id_idx ON native_push_tokens(user_id);

ALTER TABLE native_push_tokens ENABLE ROW LEVEL SECURITY;

-- Un coach ne voit/gère que ses propres tokens (l'écriture passe par le service role).
DROP POLICY IF EXISTS "own tokens select" ON native_push_tokens;
CREATE POLICY "own tokens select" ON native_push_tokens
  FOR SELECT USING (auth.uid() = user_id);
